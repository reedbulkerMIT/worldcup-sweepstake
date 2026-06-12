# 世界盃獎金戰 → GitHub Pages 部署指南

## 你要先自己做的事(Claude Code 做不了或不該做的)

1. **安裝並登入 GitHub CLI**(若 VPS / 本機還沒有):
   ```
   gh auth login
   ```
   照提示用瀏覽器完成授權。登入後 Claude Code 就能用 `gh` 建 repo、推 code、設定 Pages。

2. **註冊 football-data.org 免費 API key**(取代 LLM 抓分,賽果是結構化資料、準確度有保證):
   - 到 https://www.football-data.org/client/register 註冊,免費方案即可(World Cup 在免費層)。
   - 拿到 token 後,先放著,等 repo 建好再加進 GitHub Secrets(下面第 3 步)。

3. **repo 建好之後**,把 token 加進 Secrets(不要貼進任何檔案或對話):
   ```
   gh secret set FOOTBALL_DATA_TOKEN
   ```
   執行後貼上 token 按 Enter。Token 只活在 GitHub Secrets,不進 git 歷史。

4. 把 `worldcup-sweepstake.jsx` 放進你要工作的資料夾,讓 Claude Code 讀得到。

---

## 貼給 Claude Code 的 Prompt(整段複製)

```
我要把一個辦公室世界盃獎金戰網站部署到 GitHub Pages。起點是這個資料夾裡的
worldcup-sweepstake.jsx,它原本是 claude.ai 的 artifact,有兩個環境依賴必須移除:

1. window.storage(artifact 專屬共享儲存)→ 拿掉。同事認領表(DEFAULT_OWNERS /
   DEFAULT_COLLEAGUES)已經寫死在檔案裡,直接抽成 src/draw.js 靜態資料。
   「認領設定」分頁改成唯讀展示(顯示誰認領哪隊即可),移除新增/刪除/下拉選單。
2. 瀏覽器內呼叫 Anthropic API 更新戰績 → 拿掉。改成 GitHub Actions 排程跑後端
   腳本抓資料,前端只讀靜態 data.json。

目標架構:
- Vite + React 專案,public repo,名稱 worldcup-sweepstake,用 gh CLI 建立。
- GitHub Pages 部署:.github/workflows/deploy.yml,push to main 觸發,
  官方 actions/deploy-pages 流程。記得 vite.config 的 base 要設成 repo 名。
- 資料更新:.github/workflows/update-data.yml
  - schedule: cron "0 23 * * *"(= 台北時間 07:00),外加 workflow_dispatch
    讓我可以從 GitHub 網頁手動觸發。
  - 跑 scripts/update_data.py:用 football-data.org v4 API
    (token 在 secrets.FOOTBALL_DATA_TOKEN,經環境變數傳入,絕不寫進檔案)
    抓 2026 World Cup 的 standings、matches、淘汰賽對戰,輸出 public/data.json,
    格式沿用前端現有的 results / knockout / matches / updatedAt 結構:
    - results: { [teamEn]: { group, w, d, l, reached, out } }
    - knockout: [ { round: r32|r16|qf|sf|final, a, b, winner } ]
    - matches: 接下來 12 場,kickoff 轉台灣時間 (UTC+8) "MM-DD HH:mm"
    - 隊名必須正規化成前端 TEAMS 清單裡的英文名(寫一個對照表處理
      API 名稱差異,例如 Ivory Coast → Cote d'Ivoire、Türkiye → Turkiye)。
  - 腳本跑完 git commit data.json 並 push(用內建 GITHUB_TOKEN,
    記得 workflow 要 permissions: contents: write),push 會觸發 Pages 重新部署。
- 前端的「⟳ 更新戰績」按鈕改成重新 fetch data.json + 顯示 updatedAt,
  按鈕說明文字改成「資料每天台北時間 07:00 自動更新」。
- 計分邏輯(teamPoints、STAGE_BONUS 累計制)和視覺設計完全不動。

驗證要求(我是非工程師,請替我把關):
- 本地 npm run build 要過,把 update_data.py 先在本地用我的 token 跑一次
  (我會用環境變數提供,你不要把 token 寫進任何檔案),確認 data.json
  產出的隊名 100% 對得上 TEAMS 清單,有對不上的列出來給我看。
- 部署完成後給我 Pages 網址,並列出:哪些檔案是 canonical(draw.js、
  update_data.py 的隊名對照表),改抽籤名單時要動哪個檔案。
- 最後用 workflow_dispatch 手動觸發一次 update-data,確認整條鏈
  (抓資料 → commit → 重新部署)走得通。
```

---

## 部署後的維運備忘

- **改認領名單**:改 `src/draw.js`,commit push 即生效。有 git 紀錄,誰改的、改了什麼都可追。
- **手動補更新**:GitHub repo → Actions → update-data → Run workflow。手機瀏覽器也能按。
- **cron 精度**:GitHub Actions 排程在尖峰時段可能延遲幾分鐘到一小時,對日更場景無影響;若哪天沒跑,手動觸發即可。
- **同事存取**:Pages 網址公開、免登入,直接丟群組。注意:public repo + 公開網站,同事英文名字會公開在網路上——若在意,repo 可以維持 public 但名字改縮寫,或改用 private repo + 其他託管(private repo 的 Pages 需要付費方案)。
