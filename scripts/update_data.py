#!/usr/bin/env python3
"""
從 football-data.org v4 API 抓 2026 FIFA World Cup 賽果,輸出 public/data.json。

前端(src/App.jsx)只讀這個 data.json,格式:
  {
    "results":  { "<teamEn>": {"group","w","d","l","reached","out"} },
    "knockout": [ {"round","a","b","winner","kickoff","score"} ],
                 # kickoff: 台灣時間 "MM-DD HH:mm";score: {"a","b"} 對齊 a/b,未比為 null
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

# 一場球(含延長賽+PK)牆鐘時長極少超過 ~2h45m。免費版 football-data 全場結束後
# 仍可能數小時持續回 IN_PLAY/PAUSED(快照延遲),導致該場永遠掛在賽程標「進行中」。
# 開賽超過此時數仍是 live,視為「過期 live」:有比分→當已完賽,無比分→標賽果待確認。
# 門檻設 3h(> 最長合理時長,仍要求有 fullTime 比分才收進已完賽,不會誤抓進行中的中途比分),
# 讓「積分已動但 /matches 仍卡 live」的場次更快脫離賽程、進入已完賽。
STALE_LIVE_HOURS = 3

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


def merge_knockout(fresh, old_knockout):
    """淘汰賽對戰單調聯集:已成形的對戰只增不減。某輪某場一旦寫進 data.json,
    之後即使某次 API 快照回不完整(該場暫時消失),仍保留不移除,避免 API 抽風
    時樹狀圖整欄塌掉。

    key=(round, a, b) 為對戰身分(不含 winner/score);新快照同場有更新
    (填上 winner / 比分 / 開賽時間)以新的為準。
    """
    def key(entry):
        return (entry.get("round"), entry.get("a"), entry.get("b"))

    merged = {}
    for e in (old_knockout or []):          # 先放舊的(保底,不讓任何已成形對戰掉)
        if isinstance(e, dict) and e.get("a") and e.get("b") and e.get("round"):
            merged[key(e)] = e
    for e in fresh:                         # 新快照覆蓋同場(winner/score/kickoff 以新的為準)
        merged[key(e)] = e
    # 依輪次序、再依該輪內既有順序輸出(維持括號順序)
    return sorted(merged.values(), key=lambda e: ROUND_RANK.get(e.get("round"), 99))


def build_knockout_and_progress(matches, results, old=None):
    knockout = []
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

        # 開賽時間(台灣時間,格式同賽程頁);源頭 match 物件本來就有 utcDate。
        utc = m.get("utcDate")
        kickoff = ""
        if utc:
            kickoff = datetime.fromisoformat(
                utc.replace("Z", "+00:00")
            ).astimezone(TAIPEI).strftime("%m-%d %H:%M")

        # 比分對齊 a/b = API home/away;未比為 null。延長賽/PK 已含在 fullTime。
        ft = (m.get("score", {}) or {}).get("fullTime", {}) or {}
        sa, sb = ft.get("home"), ft.get("away")
        score = {"a": sa, "b": sb} if sa is not None and sb is not None else None

        knockout.append({
            "round": round_key, "a": a, "b": b, "winner": winner,
            "kickoff": kickoff, "score": score,
        })

    # 已成形對戰單調聯集:本次快照 ∪ 舊 data.json 的 knockout(只增不減)。
    knockout = merge_knockout(knockout, (old or {}).get("knockout"))

    # reached 單調保護:比照已完賽「只增不減」。把舊 data.json 已記的 reached
    # 灌進 reached 起點,確保本次 API 回不完整快照時,既有晉級標籤不被覆蓋回 group。
    for en, rec in (old or {}).get("results", {}).items():
        prev = ROUND_RANK.get(rec.get("reached"), 0)
        if en in results and prev > reached.get(en, 0):
            reached[en] = prev

    # 把 reached / out 寫回 results。out 只認「在淘汰賽實際輸球」(lost_ko):
    # 不主動把「沒進 32 強」的隊打叉——否則 API 逐步填 r32 籤表、只成形一半時,
    # 會把已晉級但對戰還沒成形的隊誤標淘汰。晉級與否由 reached / 排名 / 樹狀圖呈現即可。
    rank_to_round = {v: k for k, v in ROUND_RANK.items()}
    for en, rec in results.items():
        if en in reached:
            rec["reached"] = rank_to_round[reached[en]]
        rec["out"] = en in lost_ko

    return knockout


LIVE_STATUS = ("IN_PLAY", "PAUSED")


def is_stale_live(m, now):
    """進行中(IN_PLAY/PAUSED)但開賽已超過 STALE_LIVE_HOURS。
    用來把上游 API 卡 live 不翻 FINISHED 的場次救出來,避免永遠標「進行中」。"""
    if m.get("status") not in LIVE_STATUS:
        return False
    utc = m.get("utcDate")
    if not utc:
        return False
    kickoff = datetime.fromisoformat(utc.replace("Z", "+00:00"))
    return now - kickoff > timedelta(hours=STALE_LIVE_HOURS)


def build_played(matches, now):
    """所有已分出結果的比賽 → "MM-DD HH:mm|TeamA|scoreA|scoreB|TeamB"(台灣時間)。
    FINISHED 與 AWARDED(判定賽果)算已完賽;另含「過期 live」且已有比分的場次
    (上游卡 live 不翻 FINISHED 的救援:沒比分的下方 None 檢查會擋掉,不會假裝有結果)。"""
    played = []
    finished = [
        m for m in matches.get("matches", [])
        if m.get("status") in ("FINISHED", "AWARDED") or is_stale_live(m, now)
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


def build_upcoming(matches, played=None, now=None, limit=12):
    """賽程:含未開打(TIMED/SCHEDULED)與進行中(IN_PLAY/PAUSED,標 live=True)。
    進行中的場次也留在這裡,避免比賽中那段時間從「賽程」「已完賽」都消失。
    「過期 live 但無比分」的場次不標 live(避免永遠喊進行中),改標 pending=True
    讓前端顯示灰字「賽果待確認」;有比分的過期 live 已被 build_played 收走、由下方去重移出。"""
    LIVE = ("IN_PLAY", "PAUSED")
    # 已在「已完賽」(黏著聯集)的場次,不重複出現在賽程
    #(處理 API 快照跳動造成的假 IN_PLAY:某場已記為完賽卻又被回成進行中)
    played_keys = set()
    for e in (played or []):
        p = e.split("|")
        if len(p) == 5:
            played_keys.add((p[0], p[1], p[4]))  # (time, a, b)

    upcoming = []
    pending = [
        m for m in matches.get("matches", [])
        if m.get("status") in ("TIMED", "SCHEDULED") or m.get("status") in LIVE
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
        time_str = dt.strftime("%m-%d %H:%M")
        if (time_str, a, b) in played_keys:
            continue
        entry = {"time": time_str, "a": a, "b": b}
        if m.get("status") in LIVE:
            if now is not None and is_stale_live(m, now):
                entry["pending"] = True  # 過期 live 且無比分 → 前端標「賽果待確認」
            else:
                entry["live"] = True  # 前端標「進行中」
        upcoming.append(entry)
        if len(upcoming) >= limit:
            break
    return upcoming


def merge_played(fresh, old_played):
    """已完賽單調聯集:只增不減。任一場一旦被記為已完賽寫進 data.json,
    之後即使某次 API 快照沒回傳它(快照跳動/不完整),仍保留不移除。

    key=(time, a, b) 為場次身分(不含比分);若新快照同場有更新比分,以新的為準。
    """
    def key(entry):
        p = entry.split("|")
        return (p[0], p[1], p[4])

    merged = {}
    for e in (old_played or []):           # 先放舊的(保底,不讓任何已完賽掉)
        if isinstance(e, str) and e.count("|") == 4:
            merged[key(e)] = e
    for e in fresh:                        # 新快照覆蓋同場(比分若更新以新的為準)
        merged[key(e)] = e
    return [merged[k] for k in sorted(merged)]  # 依 (time,a,b) 排序 = 時間序


def main():
    standings = api_get(f"/competitions/{COMPETITION}/standings")
    matches = api_get(f"/competitions/{COMPETITION}/matches")

    out_path = os.path.join(os.path.dirname(__file__), "..", "public", "data.json")
    out_path = os.path.abspath(out_path)
    os.makedirs(os.path.dirname(out_path), exist_ok=True)

    # 讀舊檔。除了下方的無變化比對,也供「已完賽」做單調聯集
    #(只增不減,避免 API 快照跳動把已完賽場次抽掉)。
    old = None
    if os.path.exists(out_path):
        try:
            with open(out_path, "r", encoding="utf-8") as f:
                old = json.load(f)
        except Exception:  # noqa: BLE001
            old = None

    now = datetime.now(timezone.utc)

    results = build_results(standings)
    # 傳入舊檔:knockout 已成形對戰 + reached 晉級標籤都做「只增不減」單調保護,
    # 避免 API 快照不完整時樹狀圖對戰塌掉、晉級標籤被覆蓋回 group。
    knockout = build_knockout_and_progress(matches, results, old)
    # 已完賽 = 本次快照 ∪ 舊 data.json 的 played(只增不減)
    played = merge_played(build_played(matches, now), (old or {}).get("played"))
    # 賽程排除已在已完賽的場次,避免跳動造成重複
    upcoming = build_upcoming(matches, played, now)

    # 內容(不含 updatedAt)。只有內容真的有變,才蓋新的更新時間。
    content = {
        "results": results,
        "knockout": knockout,
        "matches": upcoming,
        "played": played,
    }

    old_content = {k: old.get(k) for k in content} if old else None
    unchanged = old_content == content and old and old.get("updatedAt")

    if unchanged:
        # 內容沒變 → 保留上次更新時間,檔案維持不變(workflow 就不會 commit/重新部署)
        updated_at = old["updatedAt"]
    else:
        updated_at = datetime.now(timezone.utc).isoformat()

    payload = {**content, "updatedAt": updated_at}

    # sort_keys=True → 同樣的內容永遠產生同樣的位元組,避免 API 改變回傳順序時
    # 被誤判成「有變動」。輸出順序不影響前端(前端都是用 key 取值)。
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(payload, f, ensure_ascii=False, indent=2, sort_keys=True)
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
    if unchanged:
        print(f"  內容無變動 → 保留上次更新時間 {payload['updatedAt']}(不會 commit/重新部署)")
    else:
        print(f"  偵測到變動 → 更新時間為 {payload['updatedAt']}")
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
