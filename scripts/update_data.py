#!/usr/bin/env python3
"""
從 football-data.org v4 API 抓 2026 FIFA World Cup 賽果,輸出 public/data.json。

前端(src/App.jsx)只讀這個 data.json,格式:
  {
    "results":  { "<teamEn>": {"group","w","d","l","reached","out"} },
    "knockout": [ {"round","a","b","winner"} ],
    "matches":  [ {"time","a","b"} ],   # 接下來 12 場,time 為台灣時間 "MM-DD HH:mm"
    "updatedAt": "<ISO-8601 UTC>"
  }

Token:讀環境變數 FOOTBALL_DATA_TOKEN(GitHub Actions 由 secrets 傳入)。
       ★ 絕不寫進檔案。

★ CANONICAL:隊名對照表(TLA_TO_EN / NAME_FIX)在本檔。若 API 改隊名造成對不上,
   改這兩張表即可。輸出的隊名 100% 必須落在前端 TEAMS.en 清單內。
"""

import json
import os
import sys
import urllib.request
import urllib.error
from datetime import datetime, timezone, timedelta

# 讓 stdout 在 Windows 主控台(cp950)也能印出 ✓ 與中文
try:
    sys.stdout.reconfigure(encoding="utf-8")
except Exception:  # noqa: BLE001
    pass

API_BASE = "https://api.football-data.org/v4"
COMPETITION = "WC"  # FIFA World Cup (id 2000)

# ── 正規化主鍵:API 的三碼 tla → 前端 TEAMS.en ──────────────────
# 48 隊全覆蓋。tla 是 API 最穩定的識別子,優先用它對應。
TLA_TO_EN = {
    "AUS": "Australia", "IRN": "Iran", "JPN": "Japan", "JOR": "Jordan",
    "KOR": "South Korea", "QAT": "Qatar", "KSA": "Saudi Arabia",
    "UZB": "Uzbekistan", "IRQ": "Iraq",
    "ALG": "Algeria", "CPV": "Cabo Verde", "CIV": "Cote d'Ivoire",
    "EGY": "Egypt", "GHA": "Ghana", "MAR": "Morocco", "SEN": "Senegal",
    "RSA": "South Africa", "TUN": "Tunisia", "COD": "DR Congo",
    "USA": "United States", "CAN": "Canada", "MEX": "Mexico",
    "CUW": "Curacao", "HAI": "Haiti", "PAN": "Panama",
    "ARG": "Argentina", "BRA": "Brazil", "COL": "Colombia",
    "ECU": "Ecuador", "PAR": "Paraguay", "URY": "Uruguay",
    "NZL": "New Zealand",
    "ENG": "England", "FRA": "France", "CRO": "Croatia", "NOR": "Norway",
    "POR": "Portugal", "GER": "Germany", "NED": "Netherlands",
    "AUT": "Austria", "BEL": "Belgium", "SCO": "Scotland", "ESP": "Spain",
    "SUI": "Switzerland", "SWE": "Sweden", "TUR": "Turkiye",
    "BIH": "Bosnia and Herzegovina", "CZE": "Czechia",
}

# ── 名稱後備對照(只有在 tla 缺失時才用)──────────────────────
# 處理 API 名稱與前端 en 的差異;含已知別名。
NAME_FIX = {
    "Turkey": "Turkiye", "Türkiye": "Turkiye",
    "Ivory Coast": "Cote d'Ivoire", "Côte d'Ivoire": "Cote d'Ivoire",
    "Cape Verde Islands": "Cabo Verde", "Cape Verde": "Cabo Verde",
    "Congo DR": "DR Congo", "DR Congo": "DR Congo",
    "Bosnia-Herzegovina": "Bosnia and Herzegovina",
    "Bosnia and Herzegovina": "Bosnia and Herzegovina",
    "Curaçao": "Curacao", "Curacao": "Curacao",
    "Korea Republic": "South Korea", "South Korea": "South Korea",
}

# 前端 TEAMS.en 的完整集合(48),用來最終驗證輸出。
VALID_EN = set(TLA_TO_EN.values())

KO_STAGE_TO_ROUND = {
    "LAST_32": "r32",
    "LAST_16": "r16",
    "QUARTER_FINALS": "qf",
    "SEMI_FINALS": "sf",
    "FINAL": "final",
}
ROUND_RANK = {"group": 0, "r32": 1, "r16": 2, "qf": 3, "sf": 4, "final": 5, "champion": 6}

TAIPEI = timezone(timedelta(hours=8))

# 對不上的名稱會收集到這裡,結尾印出來。
UNMATCHED = []


def api_get(path):
    token = os.environ.get("FOOTBALL_DATA_TOKEN")
    if not token:
        sys.exit("ERROR: 環境變數 FOOTBALL_DATA_TOKEN 未設定。請用環境變數提供 token,勿寫進檔案。")
    req = urllib.request.Request(
        f"{API_BASE}{path}",
        headers={"X-Auth-Token": token},
    )
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            return json.load(resp)
    except urllib.error.HTTPError as e:
        body = e.read().decode("utf-8", "replace")
        sys.exit(f"ERROR: API {path} 回應 {e.code}: {body}")
    except Exception as e:  # noqa: BLE001
        sys.exit(f"ERROR: 呼叫 API {path} 失敗: {e}")


def resolve(team):
    """team dict(含 tla / name)→ 前端 en,或 None(並記入 UNMATCHED)。"""
    if not team:
        return None
    tla = team.get("tla")
    if tla and tla in TLA_TO_EN:
        return TLA_TO_EN[tla]
    name = team.get("name")
    if name and name in NAME_FIX:
        return NAME_FIX[name]
    if name and name in VALID_EN:
        return name
    # 兩者皆空 = 未定的對戰名額(placeholder),非真正對不上,靜默略過
    if not tla and not name:
        return None
    # 有識別子卻對不上:記錄(去重),結尾提醒補對照表
    key = f"{tla or '?'} / {name or '?'}"
    if key not in UNMATCHED:
        UNMATCHED.append(key)
    return None


def build_results(standings):
    results = {}
    for block in standings.get("standings", []):
        if block.get("type") != "TOTAL":
            continue
        group_label = block.get("group") or ""  # e.g. "Group A"
        letter = group_label.split()[-1] if group_label else ""
        for row in block.get("table", []):
            en = resolve(row.get("team", {}))
            if not en:
                continue
            results[en] = {
                "group": letter,
                "w": row.get("won", 0) or 0,
                "d": row.get("draw", 0) or 0,
                "l": row.get("lost", 0) or 0,
                "reached": "group",
                "out": False,
            }
    return results


def build_knockout_and_progress(matches, results):
    knockout = []
    ko_appearances = set()        # en 出現在任何 KO 對戰(兩隊都 resolve)
    r32_bracket_ready = False     # 是否已有成形的 32 強對戰
    lost_ko = set()               # 在已結束 KO 場輸球的 en
    reached = {}                  # en -> 最遠輪次(rank)

    def bump(en, round_key):
        rank = ROUND_RANK[round_key]
        if rank > reached.get(en, 0):
            reached[en] = rank

    # 依 utcDate 排序,維持括號順序
    ko_matches = [
        m for m in matches.get("matches", [])
        if m.get("stage") in KO_STAGE_TO_ROUND
    ]
    ko_matches.sort(key=lambda m: (m.get("utcDate") or "", m.get("id") or 0))

    for m in ko_matches:
        round_key = KO_STAGE_TO_ROUND[m["stage"]]
        a = resolve(m.get("homeTeam", {}))
        b = resolve(m.get("awayTeam", {}))
        if not a or not b:
            continue  # placeholder 對戰(對手未定)— 略過
        if round_key == "r32":
            r32_bracket_ready = True
        ko_appearances.add(a)
        ko_appearances.add(b)
        bump(a, round_key)
        bump(b, round_key)

        winner_code = (m.get("score", {}) or {}).get("winner")
        winner = ""
        if winner_code == "HOME_TEAM":
            winner = a
        elif winner_code == "AWAY_TEAM":
            winner = b

        if m.get("status") == "FINISHED" and winner:
            loser = b if winner == a else a
            lost_ko.add(loser)
            if round_key == "final":
                bump(winner, "champion")

        knockout.append({"round": round_key, "a": a, "b": b, "winner": winner})

    # 把 reached / out 寫回 results
    rank_to_round = {v: k for k, v in ROUND_RANK.items()}
    for en, rec in results.items():
        if en in reached:
            rec["reached"] = rank_to_round[reached[en]]
        out = en in lost_ko
        if r32_bracket_ready and en not in ko_appearances:
            out = True  # 小組賽出局(未進 32 強)
        rec["out"] = out

    return knockout


def build_played(matches):
    """所有 FINISHED 比賽 → "MM-DD HH:mm|TeamA|scoreA|scoreB|TeamB"(台灣時間)。"""
    played = []
    finished = [
        m for m in matches.get("matches", [])
        if m.get("status") == "FINISHED"
    ]
    finished.sort(key=lambda m: (m.get("utcDate") or "", m.get("id") or 0))
    for m in finished:
        a = resolve(m.get("homeTeam", {}))
        b = resolve(m.get("awayTeam", {}))
        if not a or not b:
            continue
        utc = m.get("utcDate")
        if not utc:
            continue
        ft = (m.get("score", {}) or {}).get("fullTime", {}) or {}
        sa, sb = ft.get("home"), ft.get("away")
        if sa is None or sb is None:
            continue
        dt = datetime.fromisoformat(utc.replace("Z", "+00:00")).astimezone(TAIPEI)
        played.append(f"{dt.strftime('%m-%d %H:%M')}|{a}|{sa}|{sb}|{b}")
    return played


def build_upcoming(matches, limit=12):
    upcoming = []
    pending = [
        m for m in matches.get("matches", [])
        if m.get("status") in ("TIMED", "SCHEDULED")
    ]
    pending.sort(key=lambda m: (m.get("utcDate") or "", m.get("id") or 0))
    for m in pending:
        a = resolve(m.get("homeTeam", {}))
        b = resolve(m.get("awayTeam", {}))
        if not a or not b:
            continue  # 對手未定的未來 KO 場
        utc = m.get("utcDate")
        if not utc:
            continue
        dt = datetime.fromisoformat(utc.replace("Z", "+00:00")).astimezone(TAIPEI)
        upcoming.append({"time": dt.strftime("%m-%d %H:%M"), "a": a, "b": b})
        if len(upcoming) >= limit:
            break
    return upcoming


def main():
    standings = api_get(f"/competitions/{COMPETITION}/standings")
    matches = api_get(f"/competitions/{COMPETITION}/matches")

    results = build_results(standings)
    knockout = build_knockout_and_progress(matches, results)
    upcoming = build_upcoming(matches)
    played = build_played(matches)

    payload = {
        "results": results,
        "knockout": knockout,
        "matches": upcoming,
        "played": played,
        "updatedAt": datetime.now(timezone.utc).isoformat(),
    }

    out_path = os.path.join(os.path.dirname(__file__), "..", "public", "data.json")
    out_path = os.path.abspath(out_path)
    os.makedirs(os.path.dirname(out_path), exist_ok=True)
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(payload, f, ensure_ascii=False, indent=2)
        f.write("\n")

    # ── 統計 + 驗證輸出 ─────────────────────────────
    all_names = set(results.keys())
    for m in knockout:
        all_names.update([m["a"], m["b"]])
    for m in upcoming:
        all_names.update([m["a"], m["b"]])
    for row in played:
        parts = row.split("|")
        all_names.update([parts[1], parts[4]])
    bad = sorted(n for n in all_names if n not in VALID_EN)

    print(f"✓ 寫入 {out_path}")
    print(f"  results: {len(results)} 隊 | knockout: {len(knockout)} 場 | "
          f"matches: {len(upcoming)} 場 | played: {len(played)} 場")
    print(f"  updatedAt: {payload['updatedAt']}")
    if UNMATCHED:
        print("⚠ 以下 API 隊伍對不上對照表(已略過,請補進 TLA_TO_EN / NAME_FIX):")
        for u in UNMATCHED:
            print(f"    - {u}")
    if bad:
        print("✗ 輸出含不在前端 TEAMS.en 的隊名(必須修正):")
        for n in bad:
            print(f"    - {n}")
        sys.exit(1)
    print("✓ 所有輸出隊名都落在前端 TEAMS 清單內。")


if __name__ == "__main__":
    main()
