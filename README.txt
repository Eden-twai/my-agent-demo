AFS MyAgent Demo

使用方式：
1. 直接開啟 index.html。
2. 若瀏覽器對本機檔案限制較嚴格，可在資料夾內啟動簡單 HTTP Server，例如：
   python3 -m http.server 8080
   然後開啟 http://localhost:8080

主要 Demo 流程：
- 開場 Preparing Environment loading
- Agent Home / New Session
- 資料分析 Chat + Canvas Dashboard
- Cron 建立排程，可勾選 Deliver result to channel
- Channels：LINE / Telegram 設定、測試、儲存、啟用
- Skills / Models 為次要互動頁面

技術：HTML + Bootstrap 5 + CSS + Vanilla JS
外部 CDN：Bootstrap、Font Awesome
沒有後端、沒有 API、沒有 Token，所有互動都是前端 Demo。
