import { useState, useEffect, useCallback, useRef } from "react";

// ───────────────────────── 48 隊名單 ─────────────────────────
const TEAMS = [
  // AFC
  { en: "Australia", zh: "澳洲", flag: "🇦🇺", conf: "亞足聯 AFC" },
  { en: "Iran", zh: "伊朗", flag: "🇮🇷", conf: "亞足聯 AFC" },
  { en: "Japan", zh: "日本", flag: "🇯🇵", conf: "亞足聯 AFC" },
  { en: "Jordan", zh: "約旦", flag: "🇯🇴", conf: "亞足聯 AFC" },
  { en: "South Korea", zh: "南韓", flag: "🇰🇷", conf: "亞足聯 AFC" },
  { en: "Qatar", zh: "卡達", flag: "🇶🇦", conf: "亞足聯 AFC" },
  { en: "Saudi Arabia", zh: "沙烏地阿拉伯", flag: "🇸🇦", conf: "亞足聯 AFC" },
  { en: "Uzbekistan", zh: "烏茲別克", flag: "🇺🇿", conf: "亞足聯 AFC" },
  { en: "Iraq", zh: "伊拉克", flag: "🇮🇶", conf: "亞足聯 AFC" },
  // CAF
  { en: "Algeria", zh: "阿爾及利亞", flag: "🇩🇿", conf: "非足聯 CAF" },
  { en: "Cabo Verde", zh: "維德角", flag: "🇨🇻", conf: "非足聯 CAF" },
  { en: "Cote d'Ivoire", zh: "象牙海岸", flag: "🇨🇮", conf: "非足聯 CAF" },
  { en: "Egypt", zh: "埃及", flag: "🇪🇬", conf: "非足聯 CAF" },
  { en: "Ghana", zh: "迦納", flag: "🇬🇭", conf: "非足聯 CAF" },
  { en: "Morocco", zh: "摩洛哥", flag: "🇲🇦", conf: "非足聯 CAF" },
  { en: "Senegal", zh: "塞內加爾", flag: "🇸🇳", conf: "非足聯 CAF" },
  { en: "South Africa", zh: "南非", flag: "🇿🇦", conf: "非足聯 CAF" },
  { en: "Tunisia", zh: "突尼西亞", flag: "🇹🇳", conf: "非足聯 CAF" },
  { en: "DR Congo", zh: "民主剛果", flag: "🇨🇩", conf: "非足聯 CAF" },
  // CONCACAF
  { en: "United States", zh: "美國", flag: "🇺🇸", conf: "中北美 CONCACAF" },
  { en: "Canada", zh: "加拿大", flag: "🇨🇦", conf: "中北美 CONCACAF" },
  { en: "Mexico", zh: "墨西哥", flag: "🇲🇽", conf: "中北美 CONCACAF" },
  { en: "Curacao", zh: "古拉索", flag: "🇨🇼", conf: "中北美 CONCACAF" },
  { en: "Haiti", zh: "海地", flag: "🇭🇹", conf: "中北美 CONCACAF" },
  { en: "Panama", zh: "巴拿馬", flag: "🇵🇦", conf: "中北美 CONCACAF" },
  // CONMEBOL
  { en: "Argentina", zh: "阿根廷", flag: "🇦🇷", conf: "南美 CONMEBOL" },
  { en: "Brazil", zh: "巴西", flag: "🇧🇷", conf: "南美 CONMEBOL" },
  { en: "Colombia", zh: "哥倫比亞", flag: "🇨🇴", conf: "南美 CONMEBOL" },
  { en: "Ecuador", zh: "厄瓜多", flag: "🇪🇨", conf: "南美 CONMEBOL" },
  { en: "Paraguay", zh: "巴拉圭", flag: "🇵🇾", conf: "南美 CONMEBOL" },
  { en: "Uruguay", zh: "烏拉圭", flag: "🇺🇾", conf: "南美 CONMEBOL" },
  // OFC
  { en: "New Zealand", zh: "紐西蘭", flag: "🇳🇿", conf: "大洋洲 OFC" },
  // UEFA
  { en: "England", zh: "英格蘭", flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿", conf: "歐足聯 UEFA" },
  { en: "France", zh: "法國", flag: "🇫🇷", conf: "歐足聯 UEFA" },
  { en: "Croatia", zh: "克羅埃西亞", flag: "🇭🇷", conf: "歐足聯 UEFA" },
  { en: "Norway", zh: "挪威", flag: "🇳🇴", conf: "歐足聯 UEFA" },
  { en: "Portugal", zh: "葡萄牙", flag: "🇵🇹", conf: "歐足聯 UEFA" },
  { en: "Germany", zh: "德國", flag: "🇩🇪", conf: "歐足聯 UEFA" },
  { en: "Netherlands", zh: "荷蘭", flag: "🇳🇱", conf: "歐足聯 UEFA" },
  { en: "Austria", zh: "奧地利", flag: "🇦🇹", conf: "歐足聯 UEFA" },
  { en: "Belgium", zh: "比利時", flag: "🇧🇪", conf: "歐足聯 UEFA" },
  { en: "Scotland", zh: "蘇格蘭", flag: "🏴󠁧󠁢󠁳󠁣󠁴󠁿", conf: "歐足聯 UEFA" },
  { en: "Spain", zh: "西班牙", flag: "🇪🇸", conf: "歐足聯 UEFA" },
  { en: "Switzerland", zh: "瑞士", flag: "🇨🇭", conf: "歐足聯 UEFA" },
  { en: "Sweden", zh: "瑞典", flag: "🇸🇪", conf: "歐足聯 UEFA" },
  { en: "Turkiye", zh: "土耳其", flag: "🇹🇷", conf: "歐足聯 UEFA" },
  { en: "Bosnia and Herzegovina", zh: "波赫", flag: "🇧🇦", conf: "歐足聯 UEFA" },
  { en: "Czechia", zh: "捷克", flag: "🇨🇿", conf: "歐足聯 UEFA" },
];

const TEAM_BY_EN = Object.fromEntries(TEAMS.map((t) => [t.en, t]));

// ───────────── 抽籤結果(FIFA WORLD CUP 2026 x MIT) ─────────────
const DEFAULT_OWNERS = {
  "Switzerland": "ANN",
  "Egypt": "ANNALISE",
  "United States": "APPLE",
  "Australia": "BEN", "Sweden": "BEN",
  "Japan": "BECKY",
  "Ecuador": "CHRISSY",
  "Bosnia and Herzegovina": "CLAIR",
  "Spain": "EILEEN",
  "Netherlands": "EMILY",
  "Iran": "EVA", "Uruguay": "EVA",
  "Tunisia": "FARISA", "Cote d'Ivoire": "FARISA",
  "Canada": "FRED",
  "Paraguay": "GARY",
  "Belgium": "HEDY",
  "Colombia": "HOWARD",
  "Austria": "JILL",
  "England": "JOYCE",
  "South Korea": "JASON", "Mexico": "JASON",
  "Norway": "KRES",
  "Brazil": "LEO",
  "Morocco": "LEON",
  "France": "LILLIAN",
  "Senegal": "LUCAS",
  "Czechia": "MAEGAN",
  "Turkiye": "MAXINE",
  "Scotland": "MIKE",
  "Portugal": "PETERSON",
  "Argentina": "PHOEBE",
  "Croatia": "REED",
  "Ghana": "SARAH",
  "Germany": "SUSAN",
  "Algeria": "TIMOTHY",
};
const DEFAULT_COLLEAGUES = [
  "ANN", "ANNALISE", "APPLE", "BEN", "BECKY", "CHRISSY", "CLAIR", "EILEEN",
  "EMILY", "EVA", "FARISA", "FRED", "GARY", "HEDY", "HOWARD", "JILL",
  "JOYCE", "JASON", "KRES", "LEO", "LEON", "LILLIAN", "LUCAS", "MAEGAN",
  "MAXINE", "MIKE", "PETERSON", "PHOEBE", "REED", "SARAH", "SUSAN", "TIMOTHY",
];

// ───────────────────── 積分規則(累計制) ─────────────────────
// 小組賽:勝 +3 / 和 +1;晉級獎勵為「到達該輪」的累計總分
const STAGE_BONUS = {
  group: 0, r32: 3, r16: 6, qf: 10, sf: 15, final: 20, champion: 30, eliminated: 0,
};
// 被淘汰的隊伍保留淘汰前已到達輪次的獎勵 → 由 reachedBonus 處理
const STAGE_ORDER = ["group", "r32", "r16", "qf", "sf", "final", "champion"];
const STAGE_ZH = {
  group: "小組賽", r32: "32強", r16: "16強", qf: "8強",
  sf: "4強", final: "亞軍戰", champion: "冠軍", eliminated: "已淘汰",
};

const KEY_SETUP = "wc26-setup";
const KEY_RESULTS = "wc26-results";

// storage helpers(共享層;無 storage 時退回記憶體)
const mem = {};
async function sGet(key) {
  try {
    if (typeof window !== "undefined" && window.storage) {
      const r = await window.storage.get(key, true);
      return r ? JSON.parse(r.value) : null;
    }
  } catch (e) { /* key 不存在 */ }
  return mem[key] || null;
}
async function sSet(key, obj) {
  try {
    if (typeof window !== "undefined" && window.storage) {
      await window.storage.set(key, JSON.stringify(obj), true);
      return;
    }
  } catch (e) { console.error("storage set failed", e); }
  mem[key] = obj;
}

function teamPoints(rec) {
  if (!rec) return 0;
  const base = (rec.w || 0) * 3 + (rec.d || 0) * 1;
  const reached = rec.reached && STAGE_BONUS[rec.reached] != null ? rec.reached : "group";
  return base + STAGE_BONUS[reached];
}

// 最近一次「台灣時間 07:00」的 UTC 毫秒值
function lastSevenAMTaipei() {
  const now = Date.now();
  const tp = new Date(now + 8 * 3600e3); // 以 UTC 方法讀出台北牆鐘時間
  const sevenToday = Date.UTC(tp.getUTCFullYear(), tp.getUTCMonth(), tp.getUTCDate(), 7, 0, 0) - 8 * 3600e3;
  return sevenToday <= now ? sevenToday : sevenToday - 86400e3;
}

const ROUND_ZH = { r32: "32強", r16: "16強", qf: "8強", sf: "4強", final: "決賽" };
const ROUND_SEQ = ["r32", "r16", "qf", "sf", "final"];

export default function App() {
  const [tab, setTab] = useState("board");
  const [colleagues, setColleagues] = useState([]);
  const [owners, setOwners] = useState({}); // teamEn -> colleague
  const [results, setResults] = useState({}); // teamEn -> {group,w,d,l,reached,out}
  const [knockout, setKnockout] = useState([]); // [{round,a,b,winner}]
  const [matches, setMatches] = useState([]); // [{time,a,b}] 台灣時間
  const [updatedAt, setUpdatedAt] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [msg, setMsg] = useState("");
  const [newName, setNewName] = useState("");
  const refreshRef = useRef(null);
  const updatedAtRef = useRef(null);
  const busyRef = useRef(false);
  const loadingRef = useRef(true);

  useEffect(() => {
    (async () => {
      const setup = await sGet(KEY_SETUP);
      if (setup && (setup.colleagues || []).length > 0) {
        setColleagues(setup.colleagues || []);
        setOwners(setup.owners || {});
      } else {
        // 第一次載入:套用抽籤結果並寫入共享儲存
        setColleagues(DEFAULT_COLLEAGUES);
        setOwners(DEFAULT_OWNERS);
        await sSet(KEY_SETUP, { colleagues: DEFAULT_COLLEAGUES, owners: DEFAULT_OWNERS });
      }
      const res = await sGet(KEY_RESULTS);
      if (res) {
        setResults(res.teams || {});
        setKnockout(res.knockout || []);
        setMatches(res.matches || []);
        setUpdatedAt(res.updatedAt || null);
        updatedAtRef.current = res.updatedAt || null;
      }
      setLoading(false);
      loadingRef.current = false;
    })();
  }, []);

  const saveSetup = useCallback(async (cols, own) => {
    await sSet(KEY_SETUP, { colleagues: cols, owners: own });
  }, []);

  const addColleague = () => {
    const n = newName.trim();
    if (!n || colleagues.includes(n)) return;
    const next = [...colleagues, n];
    setColleagues(next);
    setNewName("");
    saveSetup(next, owners);
  };

  const removeColleague = (name) => {
    const next = colleagues.filter((c) => c !== name);
    const nextOwners = { ...owners };
    for (const k of Object.keys(nextOwners)) if (nextOwners[k] === name) delete nextOwners[k];
    setColleagues(next);
    setOwners(nextOwners);
    saveSetup(next, nextOwners);
  };

  const assign = (teamEn, who) => {
    const next = { ...owners };
    if (who) next[teamEn] = who; else delete next[teamEn];
    setOwners(next);
    saveSetup(colleagues, next);
  };

  // ───────── AI 更新戰績 ─────────
  const refresh = async () => {
    if (busyRef.current) return;
    busyRef.current = true;
    setRefreshing(true);
    setMsg("正在查詢最新賽果⋯(約 30–60 秒)");
    const names = TEAMS.map((t) => t.en).join(", ");
    const prompt =
      `Search the web for the latest 2026 FIFA World Cup group standings, knockout results, and upcoming match schedule as of today. ` +
      `Then output ONLY one JSON object, no prose, no markdown fences, in this exact compact form:\n` +
      `{"asOf":"YYYY-MM-DD",` +
      `"t":["TeamName|GroupLetter|W-D-L|stage|out",...],` +
      `"k":["round|TeamA|TeamB|Winner",...],` +
      `"m":["MM-DD HH:mm|TeamA|TeamB",...]}\n` +
      `Rules: every team name must EXACTLY match one of: ${names}. ` +
      `"t": GroupLetter A-L; W-D-L = group-stage win-draw-loss integers; ` +
      `stage = furthest round reached: group,r32,r16,qf,sf,final,champion (final = reached final, champion = won it); ` +
      `out = 1 if eliminated from the tournament else 0. ` +
      `Only include teams that played at least one match or whose status changed. ` +
      `"k": confirmed knockout-stage matches in official bracket order; round is one of r32,r16,qf,sf,final; ` +
      `Winner = exact team name, or empty string if not played yet. Empty array if knockout pairings not yet decided. ` +
      `"m": the next 12 scheduled matches in kickoff order, with kickoff converted to Taiwan time (UTC+8), 24-hour clock. ` +
      `Keep the whole JSON under 900 tokens; if space is tight, prioritize "t", then "k", then "m".`;
    try {
      const resp = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-6",
          max_tokens: 1000,
          messages: [{ role: "user", content: prompt }],
          tools: [{ type: "web_search_20250305", name: "web_search" }],
        }),
      });
      const data = await resp.json();
      const text = (data.content || [])
        .filter((b) => b.type === "text")
        .map((b) => b.text)
        .join("\n");
      const start = text.indexOf("{");
      const end = text.lastIndexOf("}");
      if (start < 0 || end < 0) throw new Error("回應中找不到 JSON");
      const parsed = JSON.parse(text.slice(start, end + 1));
      const nextResults = { ...results };
      let applied = 0;
      for (const row of parsed.t || []) {
        const [name, group, wdl, stage, out] = String(row).split("|");
        if (!TEAM_BY_EN[name]) continue;
        const [w, d, l] = (wdl || "0-0-0").split("-").map((x) => parseInt(x, 10) || 0);
        const reached = STAGE_ORDER.includes(stage) ? stage : "group";
        nextResults[name] = { group: group || "", w, d, l, reached, out: out === "1" };
        applied++;
      }
      if (applied === 0) throw new Error("沒有解析到任何隊伍資料");
      const nextKnockout = (parsed.k || [])
        .map((row) => {
          const [round, a, b, winner] = String(row).split("|");
          return { round, a, b, winner: winner || "" };
        })
        .filter((m) => ROUND_SEQ.includes(m.round) && TEAM_BY_EN[m.a] && TEAM_BY_EN[m.b]);
      const nextMatches = (parsed.m || [])
        .map((row) => {
          const [time, a, b] = String(row).split("|");
          return { time, a, b };
        })
        .filter((m) => m.time && TEAM_BY_EN[m.a] && TEAM_BY_EN[m.b]);
      const stamp = new Date().toISOString();
      setResults(nextResults);
      setKnockout(nextKnockout);
      setMatches(nextMatches);
      setUpdatedAt(stamp);
      updatedAtRef.current = stamp;
      await sSet(KEY_RESULTS, { teams: nextResults, knockout: nextKnockout, matches: nextMatches, updatedAt: stamp });
      setMsg(`已更新 ${applied} 隊戰績`);
    } catch (e) {
      console.error(e);
      setMsg(`更新失敗:${e.message}。再按一次重試即可。`);
    } finally {
      busyRef.current = false;
      setRefreshing(false);
    }
  };
  refreshRef.current = refresh;

  // ───────── 每日台灣時間 07:00 自動更新 ─────────
  // 限制:artifact 沒有伺服器端排程,只在頁面開著(或被打開)時生效——
  // 只要資料比「最近一次台北 07:00」舊,就自動補跑一次更新。
  useEffect(() => {
    const check = () => {
      if (loadingRef.current || busyRef.current) return;
      const ua = updatedAtRef.current ? Date.parse(updatedAtRef.current) : 0;
      if (ua < lastSevenAMTaipei()) refreshRef.current && refreshRef.current();
    };
    const boot = setTimeout(check, 4000); // 等初始載入完成後檢查一次
    const tick = setInterval(check, 10 * 60e3); // 頁面長開時每 10 分鐘檢查
    return () => { clearTimeout(boot); clearInterval(tick); };
  }, []);

  // ───────── 排行榜計算 ─────────
  const board = colleagues
    .map((c) => {
      const teams = TEAMS.filter((t) => owners[t.en] === c);
      const detail = teams.map((t) => ({ ...t, rec: results[t.en], pts: teamPoints(results[t.en]) }));
      return { name: c, teams: detail, total: detail.reduce((s, x) => s + x.pts, 0) };
    })
    .sort((a, b) => b.total - a.total);

  const unassigned = TEAMS.filter((t) => !owners[t.en]);

  // 分組視圖:若已有分組資料就照 A–L,否則照洲別
  const hasGroups = Object.values(results).some((r) => r.group);
  const groupKeys = hasGroups
    ? [..."ABCDEFGHIJKL"].filter((g) => TEAMS.some((t) => results[t.en]?.group === g))
    : [...new Set(TEAMS.map((t) => t.conf))];

  const C = {
    pitch: "#0E4A33", deep: "#0A3527", line: "#1C5C42",
    chalk: "#F2EEDF", chalkDim: "rgba(242,238,223,0.55)",
    gold: "#E3B84F", red: "#E06A5A",
  };

  const medal = (i) => (i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : null);

  const StageBadge = ({ rec }) => {
    if (!rec) return <span style={{ color: C.chalkDim }} className="text-xs">未開賽</span>;
    const label = rec.out ? STAGE_ZH.eliminated : STAGE_ZH[rec.reached] || "小組賽";
    const color = rec.out ? C.red : rec.reached !== "group" ? C.gold : C.chalkDim;
    return (
      <span className="text-xs px-2 py-0.5 rounded-full border" style={{ color, borderColor: color }}>
        {label}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: C.pitch, color: C.chalk }}>
        <div className="text-lg" style={{ fontFamily: "'Noto Sans TC', sans-serif" }}>讀取中⋯</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-16" style={{
      background: `repeating-linear-gradient(180deg, ${C.pitch} 0px, ${C.pitch} 90px, ${C.deep} 90px, ${C.deep} 180px)`,
      color: C.chalk, fontFamily: "'Noto Sans TC', sans-serif",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Saira+Condensed:wght@600;800&family=Noto+Sans+TC:wght@400;500;700&display=swap');
        .display { font-family: 'Saira Condensed', 'Noto Sans TC', sans-serif; }
        .chalkline { border-bottom: 2px dashed rgba(242,238,223,0.25); }
        select, input { outline: none; }
        @media (prefers-reduced-motion: reduce) { * { transition: none !important; } }
      `}</style>

      {/* 中圈裝飾 + 標題 */}
      <header className="relative overflow-hidden">
        <div aria-hidden className="absolute left-1/2 -top-40 -translate-x-1/2 rounded-full"
          style={{ width: 420, height: 420, border: `3px solid rgba(242,238,223,0.12)` }} />
        <div className="max-w-3xl mx-auto px-4 pt-10 pb-6 relative">
          <div className="text-xs tracking-widest" style={{ color: C.gold }}>OFFICE SWEEPSTAKE · FIFA WORLD CUP 2026</div>
          <h1 className="display text-5xl font-extrabold leading-tight mt-1">公司世界盃<span style={{ color: C.gold }}>獎金戰</span></h1>
          <div className="flex flex-wrap items-center gap-3 mt-4">
            <button onClick={refresh} disabled={refreshing}
              className="display px-5 py-2 rounded font-bold text-lg tracking-wide transition-opacity"
              style={{ background: C.gold, color: "#1B1B12", opacity: refreshing ? 0.6 : 1 }}>
              {refreshing ? "更新中⋯" : "⟳ 更新戰績"}
            </button>
            <span className="text-sm" style={{ color: C.chalkDim }}>
              {updatedAt ? `上次更新:${new Date(updatedAt).toLocaleString("zh-TW")}` : "尚未抓取戰績"}
              <span className="block text-xs">每天台灣時間 07:00 後首次有人開啟頁面時自動更新</span>
            </span>
          </div>
          {msg && <div className="mt-2 text-sm" style={{ color: C.gold }}>{msg}</div>}
        </div>
      </header>

      {/* 分頁 */}
      <nav className="max-w-3xl mx-auto px-4 flex gap-1 chalkline">
        {[["board", "排行榜"], ["bracket", "樹狀圖"], ["schedule", "賽程"], ["teams", "各隊"], ["setup", "設定"]].map(([k, label]) => (
          <button key={k} onClick={() => setTab(k)}
            className="display px-4 py-2 text-lg font-bold tracking-wide"
            style={{
              color: tab === k ? C.gold : C.chalkDim,
              borderBottom: tab === k ? `3px solid ${C.gold}` : "3px solid transparent",
            }}>
            {label}
          </button>
        ))}
      </nav>

      <main className="max-w-3xl mx-auto px-4 pt-6">
        {/* ───── 排行榜 ───── */}
        {tab === "board" && (
          <div>
            {board.length === 0 && (
              <div className="text-center py-16" style={{ color: C.chalkDim }}>
                還沒有人認領球隊。到「認領設定」新增同事並指派隊伍。
              </div>
            )}
            {board.map((row, i) => (
              <div key={row.name} className="chalkline py-4">
                <div className="flex items-baseline gap-3">
                  <span className="display text-3xl font-extrabold w-10 text-right" style={{ color: i < 3 ? C.gold : C.chalkDim }}>
                    {i + 1}
                  </span>
                  <span className="display text-2xl font-bold flex-1">
                    {row.name} {medal(i) && <span className="ml-1">{medal(i)}</span>}
                  </span>
                  <span className="display text-3xl font-extrabold" style={{ color: i < 3 ? C.gold : C.chalk }}>
                    {row.total}<span className="text-base ml-1" style={{ color: C.chalkDim }}>分</span>
                  </span>
                </div>
                <div className="flex flex-wrap gap-2 mt-2 ml-13" style={{ marginLeft: 52 }}>
                  {row.teams.length === 0 && <span className="text-sm" style={{ color: C.chalkDim }}>未認領任何球隊</span>}
                  {row.teams.map((t) => (
                    <span key={t.en} className="text-sm px-2 py-1 rounded flex items-center gap-1.5"
                      style={{ background: "rgba(0,0,0,0.25)", textDecoration: t.rec?.out ? "line-through" : "none", opacity: t.rec?.out ? 0.6 : 1 }}>
                      {t.flag} {t.zh}
                      <b style={{ color: t.pts > 0 ? C.gold : C.chalkDim }}>{t.pts}</b>
                    </span>
                  ))}
                </div>
              </div>
            ))}
            {unassigned.length > 0 && board.length > 0 && (
              <div className="mt-4 text-xs" style={{ color: C.chalkDim }}>
                尚有 {unassigned.length} 隊無人認領
              </div>
            )}
          </div>
        )}

        {/* ───── 樹狀圖(淘汰賽)/ 32強前顯示小組一覽 ───── */}
        {tab === "bracket" && (
          <div>
            {knockout.length === 0 ? (
              !hasGroups ? (
                <div className="text-center py-16" style={{ color: C.chalkDim }}>
                  按「更新戰績」載入小組分組與積分。
                </div>
              ) : (
                <div>
                  <h2 className="display text-xl font-bold tracking-widest mb-1" style={{ color: C.gold }}>
                    小組一覽 <span className="text-sm font-normal" style={{ color: C.chalkDim }}>32 強對戰產生後自動切換成樹狀圖</span>
                  </h2>
                  <div className="text-xs mb-4" style={{ color: C.chalkDim }}>
                    虛線 = 前二直接晉級;各組第三另有 8 個最佳成績名額。
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {[..."ABCDEFGHIJKL"].filter((g) => TEAMS.some((t) => results[t.en]?.group === g)).map((g) => {
                      const rows = TEAMS.filter((t) => results[t.en]?.group === g).sort((a, b) => {
                        const ra = results[a.en], rb = results[b.en];
                        const pa = ra.w * 3 + ra.d, pb = rb.w * 3 + rb.d;
                        return pb - pa || rb.w - ra.w;
                      });
                      return (
                        <div key={g} className="rounded overflow-hidden" style={{ background: "rgba(0,0,0,0.3)", border: `1px solid ${C.line}` }}>
                          <div className="display text-sm font-bold tracking-widest px-3 py-1.5" style={{ color: C.gold, borderBottom: `1px solid ${C.line}` }}>
                            GROUP {g}
                          </div>
                          {rows.map((t, i) => {
                            const rec = results[t.en];
                            const pts = rec.w * 3 + rec.d;
                            return (
                              <div key={t.en} className="flex items-center gap-2 px-3 py-1.5"
                                style={{
                                  opacity: rec.out ? 0.45 : 1,
                                  borderBottom: i === 1 ? "2px dashed rgba(242,238,223,0.35)" : "none",
                                }}>
                                <span className="text-xs w-3 text-right" style={{ color: C.chalkDim }}>{i + 1}</span>
                                <span>{t.flag}</span>
                                <span className="text-sm font-medium" style={{ textDecoration: rec.out ? "line-through" : "none" }}>
                                  {t.zh}
                                </span>
                                <span className="text-xs flex-1 truncate" style={{ color: C.gold }}>
                                  {owners[t.en] || ""}
                                </span>
                                <span className="text-xs shrink-0" style={{ color: C.chalkDim }}>
                                  {rec.w}-{rec.d}-{rec.l}
                                </span>
                                <span className="display text-sm font-bold w-6 text-right shrink-0">{pts}</span>
                              </div>
                            );
                          })}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )
            ) : (
              <div className="overflow-x-auto pb-4">
                <div className="flex gap-4" style={{ minWidth: "max-content" }}>
                  {ROUND_SEQ.filter((r) => knockout.some((m) => m.round === r)).map((r) => (
                    <div key={r} className="flex flex-col justify-around" style={{ width: 210 }}>
                      <h3 className="display text-lg font-bold tracking-widest mb-2 text-center" style={{ color: C.gold }}>
                        {ROUND_ZH[r]}
                      </h3>
                      <div className="flex flex-col justify-around flex-1 gap-3">
                        {knockout.filter((m) => m.round === r).map((m, idx) => (
                          <div key={`${r}-${idx}`} className="rounded overflow-hidden"
                            style={{ background: "rgba(0,0,0,0.3)", border: `1px solid ${C.line}` }}>
                            {[m.a, m.b].map((teamEn) => {
                              const t = TEAM_BY_EN[teamEn];
                              const won = m.winner && m.winner === teamEn;
                              const lost = m.winner && m.winner !== teamEn;
                              return (
                                <div key={teamEn} className="flex items-center gap-2 px-3 py-2"
                                  style={{
                                    opacity: lost ? 0.45 : 1,
                                    background: won ? "rgba(227,184,79,0.12)" : "transparent",
                                    borderLeft: won ? `3px solid ${C.gold}` : "3px solid transparent",
                                  }}>
                                  <span>{t.flag}</span>
                                  <span className="text-sm font-medium flex-1" style={{ textDecoration: lost ? "line-through" : "none" }}>
                                    {t.zh}
                                  </span>
                                  {owners[teamEn] && (
                                    <span className="text-xs" style={{ color: won ? C.gold : C.chalkDim }}>
                                      {owners[teamEn]}
                                    </span>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {knockout.length > 0 && (
              <div className="text-xs mt-2" style={{ color: C.chalkDim }}>
                金色邊框 = 勝方;隊名旁顯示認領的同事。手機可左右滑動。
              </div>
            )}
          </div>
        )}

        {/* ───── 賽程(台灣時間) ───── */}
        {tab === "schedule" && (
          <div>
            <h2 className="display text-xl font-bold tracking-widest mb-3" style={{ color: C.gold }}>
              近期賽程 <span className="text-sm font-normal" style={{ color: C.chalkDim }}>台灣時間 UTC+8</span>
            </h2>
            {matches.length === 0 ? (
              <div className="text-center py-16" style={{ color: C.chalkDim }}>
                還沒有賽程資料,按「更新戰績」抓取接下來的比賽。
              </div>
            ) : (
              <div>
                {matches.map((m, idx) => {
                  const ta = TEAM_BY_EN[m.a], tb = TEAM_BY_EN[m.b];
                  const oa = owners[m.a], ob = owners[m.b];
                  return (
                    <div key={idx} className="chalkline py-3 flex items-center gap-3">
                      <div className="display text-lg font-bold w-24 shrink-0" style={{ color: C.gold }}>
                        {m.time}
                      </div>
                      <div className="flex-1 flex items-center justify-end gap-2 text-right min-w-0">
                        <div className="min-w-0">
                          <div className="text-sm font-medium truncate">{ta.zh}</div>
                          {oa && <div className="text-xs" style={{ color: C.chalkDim }}>{oa}</div>}
                        </div>
                        <span className="text-xl shrink-0">{ta.flag}</span>
                      </div>
                      <span className="display font-bold shrink-0" style={{ color: C.chalkDim }}>vs</span>
                      <div className="flex-1 flex items-center gap-2 min-w-0">
                        <span className="text-xl shrink-0">{tb.flag}</span>
                        <div className="min-w-0">
                          <div className="text-sm font-medium truncate">{tb.zh}</div>
                          {ob && <div className="text-xs" style={{ color: C.chalkDim }}>{ob}</div>}
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div className="text-xs mt-3" style={{ color: C.chalkDim }}>
                  每次更新抓接下來 12 場;隊名下方為認領同事。
                </div>
              </div>
            )}
          </div>
        )}

        {/* ───── 各隊戰績 ───── */}
        {tab === "teams" && (
          <div>
            {groupKeys.map((g) => (
              <section key={g} className="mb-6">
                <h2 className="display text-xl font-bold tracking-widest mb-2" style={{ color: C.gold }}>
                  {hasGroups ? `GROUP ${g}` : g}
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {TEAMS.filter((t) => (hasGroups ? results[t.en]?.group === g : t.conf === g)).map((t) => {
                    const rec = results[t.en];
                    return (
                      <div key={t.en} className="rounded p-3 flex items-center gap-3"
                        style={{ background: "rgba(0,0,0,0.25)", opacity: rec?.out ? 0.55 : 1 }}>
                        <span className="text-2xl">{t.flag}</span>
                        <div className="flex-1 min-w-0">
                          <div className="font-bold">{t.zh}<span className="text-xs ml-1" style={{ color: C.chalkDim }}>{t.en}</span></div>
                          <div className="text-xs mt-0.5" style={{ color: C.chalkDim }}>
                            {owners[t.en] ? `👤 ${owners[t.en]}` : "無人認領"}
                            {rec && ` · ${rec.w}勝 ${rec.d}和 ${rec.l}負`}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="display text-xl font-bold" style={{ color: teamPoints(rec) > 0 ? C.gold : C.chalkDim }}>
                            {teamPoints(rec)}
                          </div>
                          <StageBadge rec={rec} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            ))}
            {!hasGroups && (
              <div className="text-xs mt-2" style={{ color: C.chalkDim }}>
                按「更新戰績」後會自動依 A–L 分組顯示。
              </div>
            )}
          </div>
        )}

        {/* ───── 認領設定 ───── */}
        {tab === "setup" && (
          <div>
            <section className="mb-6">
              <h2 className="display text-xl font-bold tracking-widest mb-2" style={{ color: C.gold }}>同事名單</h2>
              <div className="flex gap-2 mb-3">
                <input value={newName} onChange={(e) => setNewName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addColleague()}
                  placeholder="輸入名字,例如 Reed"
                  className="flex-1 px-3 py-2 rounded"
                  style={{ background: "rgba(0,0,0,0.3)", color: C.chalk, border: `1px solid ${C.line}` }} />
                <button onClick={addColleague} className="px-4 py-2 rounded font-bold"
                  style={{ background: C.gold, color: "#1B1B12" }}>新增</button>
              </div>
              <div className="flex flex-wrap gap-2">
                {colleagues.map((c) => (
                  <span key={c} className="px-3 py-1 rounded-full text-sm flex items-center gap-2"
                    style={{ background: "rgba(0,0,0,0.3)", border: `1px solid ${C.line}` }}>
                    {c}
                    <button onClick={() => removeColleague(c)} aria-label={`移除 ${c}`}
                      style={{ color: C.red }}>✕</button>
                  </span>
                ))}
                {colleagues.length === 0 && <span className="text-sm" style={{ color: C.chalkDim }}>尚未新增任何人</span>}
              </div>
              <button
                onClick={async () => {
                  setColleagues(DEFAULT_COLLEAGUES);
                  setOwners(DEFAULT_OWNERS);
                  await saveSetup(DEFAULT_COLLEAGUES, DEFAULT_OWNERS);
                  setMsg("已還原為原始抽籤名單");
                }}
                className="mt-3 text-xs px-3 py-1.5 rounded border"
                style={{ color: C.chalkDim, borderColor: C.line }}>
                ↺ 還原為原始抽籤名單(32 人 / 36 隊)
              </button>
            </section>

            <section className="mb-6">
              <h2 className="display text-xl font-bold tracking-widest mb-2" style={{ color: C.gold }}>球隊認領</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {TEAMS.map((t) => (
                  <div key={t.en} className="flex items-center gap-2 rounded px-3 py-2"
                    style={{ background: "rgba(0,0,0,0.25)" }}>
                    <span className="text-xl">{t.flag}</span>
                    <span className="flex-1 text-sm font-medium">{t.zh}</span>
                    <select value={owners[t.en] || ""} onChange={(e) => assign(t.en, e.target.value)}
                      className="text-sm px-2 py-1 rounded"
                      style={{ background: C.deep, color: owners[t.en] ? C.gold : C.chalkDim, border: `1px solid ${C.line}` }}>
                      <option value="">— 未認領 —</option>
                      {colleagues.map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded p-4" style={{ background: "rgba(0,0,0,0.25)" }}>
              <h2 className="display text-xl font-bold tracking-widest mb-2" style={{ color: C.gold }}>計分規則</h2>
              <div className="text-sm leading-relaxed" style={{ color: C.chalkDim }}>
                小組賽每勝 +3、每和 +1;晉級獎勵採累計制:進 32 強 +3、16 強 +6、8 強 +10、4 強 +15、打進決賽 +20、奪冠 +30。
                被淘汰的隊伍保留已賺到的分數。同事總分 = 名下所有球隊分數加總。
                所有設定與戰績存在共享儲存層,開這個頁面的每個人看到並可修改同一份資料。
              </div>
            </section>
          </div>
        )}
      </main>
    </div>
  );
}
