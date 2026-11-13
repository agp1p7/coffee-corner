// coffee-visual-ui.js
// 一隅・咖啡角｜方案 C：OLED 沉浸式吧台風 ＋ 視覺圖表化與三層字體系統 (v2)
// 100% 非破壞式視覺升級模組：不修改任何本機/雲端資料結構與驗算邏輯

(function () {
  'use strict';
  if (typeof document === 'undefined' || document.getElementById('coffeeVisualUILoaded')) return;

  const marker = document.createElement('meta');
  marker.id = 'coffeeVisualUILoaded';
  document.head.append(marker);

  const isEn = () => document.documentElement.lang === 'en';
  const L = (zh, en) => (isEn() ? en : zh);
  const esc = s => String(s ?? '').replace(/[&<>"']/g, ch => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]
  ));

  // =========================================================================
  // 1. 載入三層字體 (Iansui + Noto Sans TC + JetBrains Mono) 與方案 C OLED 樣式
  // =========================================================================
  if (!document.querySelector('link[href*="JetBrains+Mono"]')) {
    const fontLink = document.createElement('link');
    fontLink.rel = 'stylesheet';
    fontLink.href = 'https://fonts.googleapis.com/css2?family=Iansui&family=JetBrains+Mono:wght@400;500;600;700&family=Noto+Sans+TC:wght@400;500;600;700&display=swap';
    document.head.append(fontLink);
  }

  const style = document.createElement('style');
  style.id = 'coffeeSchemeCOledStyle';
  style.textContent = String.raw`
    :root {
      color-scheme: dark;
      --font-brand: 'Iansui', '芫荽', serif;
      --font-ui: 'Noto Sans TC', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      --font-mono: 'JetBrains Mono', ui-monospace, 'SF Mono', Consolas, monospace;
      --oled-bg: #000000;
      --oled-card: #111111;
      --oled-subcard: #181818;
      --oled-input: #1d1d1d;
      --oled-border: rgba(255, 255, 255, 0.14);
      --oled-border-subtle: rgba(255, 255, 255, 0.08);
    }

    body {
      background-color: var(--oled-bg) !important;
      color: #f4f4f5 !important;
      font-family: var(--font-ui) !important;
      font-size: 16.5px !important;
      line-height: 1.65;
      max-width: 1240px !important;
      padding: 16px 20px 60px !important;
    }

    /* 第一層：品牌與人文標題、風味筆記維持芫荽 (Iansui) */
    h1, h2, h3, #taste, #notes, .font-brand, #flowPrepare h3:nth-of-type(2), #coffeeGuideRecipe {
      font-family: var(--font-brand) !important;
      letter-spacing: 0.03em;
    }

    /* 第三層：精密儀表數據與輸入數字採 JetBrains Mono 等寬對齊 */
    #timer, #flowTarget, #flowRemaining, #stats, #ey, #count, #actual,
    input[type="number"], .cv-mono {
      font-family: var(--font-mono), var(--font-ui) !important;
      font-variant-numeric: tabular-nums !important;
    }

    /* 修正 checkbox 在全域 input 樣式下被拉寬/過度留白的問題 */
    input[type="checkbox"] {
      width: 22px !important;
      height: 22px !important;
      min-height: 22px !important;
      padding: 0 !important;
      border-radius: 6px !important;
      accent-color: #ffffff;
      cursor: pointer;
      flex-shrink: 0;
      vertical-align: middle;
    }

    /* 頂部品牌標題列升級 */
    .cv-header-bar {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: space-between;
      gap: 12px 16px;
      padding-bottom: 16px;
      margin-bottom: 12px;
      border-bottom: 1px solid var(--oled-border);
    }
    .cv-brand-group {
      display: flex;
      align-items: center;
      gap: 14px;
      min-width: 0;
    }
    .cv-brand-logo {
      width: 46px;
      height: 46px;
      border-radius: 14px;
      background: #141414;
      border: 1px solid rgba(255, 255, 255, 0.22);
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      box-shadow: 0 4px 16px rgba(255, 255, 255, 0.04);
    }
    .cv-brand-logo svg {
      width: 26px;
      height: 26px;
      stroke: #ffffff;
    }
    .cv-brand-title {
      min-width: 0;
    }
    .cv-brand-title h1 {
      margin: 0 !important;
      font-size: clamp(1.5rem, 4vw, 2.05rem) !important;
      line-height: 1.2;
      color: #ffffff;
    }
    .cv-brand-meta {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 4px 10px;
      margin-top: 3px;
    }
    .cv-brand-meta small,
    .cv-brand-meta #coffeeLayoutStatus {
      display: inline !important;
      margin: 0 !important;
      font-size: 13px !important;
      color: #a1a1aa !important;
      line-height: 1.4 !important;
    }
    .cv-header-actions {
      display: flex;
      align-items: center;
      gap: 10px;
      flex-wrap: wrap;
      margin-left: auto;
    }

    html body button.cv-sync-pill {
      display: inline-flex;
      align-items: center;
      gap: 7px;
      padding: 6px 14px !important;
      border-radius: 999px !important;
      background: #141414 !important;
      border: 1px solid var(--oled-border) !important;
      font-size: 13px !important;
      color: #e4e4e7 !important;
      cursor: pointer;
      min-height: 38px !important;
      margin: 0 !important;
      white-space: nowrap;
    }
    html body button.cv-sync-pill:hover {
      border-color: rgba(255, 255, 255, 0.45) !important;
      background: #1e1e1e !important;
    }
    .cv-sync-dot {
      width: 7px;
      height: 7px;
      border-radius: 50%;
      background: #71717a;
      flex-shrink: 0;
    }
    .cv-sync-dot.online {
      background: #ffffff;
      box-shadow: 0 0 8px rgba(255, 255, 255, 0.85);
    }
    .cv-sync-dot.warn {
      background: #fbbf24;
      box-shadow: 0 0 8px rgba(251, 191, 36, 0.6);
    }

    /* 徹底消除 coffee-header.css ::before 雙重矩形殘留與錯位 */
    html #coffeeAppHeader #coffeeLanguageSwitch button::before,
    #coffeeLanguageSwitch button::before {
      content: none !important;
      display: none !important;
    }
    html body #coffeeLanguageSwitch {
      display: inline-flex !important;
      align-items: center;
      gap: 4px !important;
      padding: 3px;
      border-radius: 999px;
      background: #121212;
      border: 1px solid var(--oled-border);
      margin: 0 !important;
    }
    html body #coffeeLanguageSwitch button {
      min-height: 32px !important;
      height: auto !important;
      min-width: 0 !important;
      padding: 4px 12px !important;
      font-size: 13px !important;
      border-radius: 999px !important;
      border: 1px solid transparent !important;
      background: transparent !important;
      color: #a1a1aa !important;
      margin: 0 !important;
      white-space: nowrap;
    }
    html body #coffeeLanguageSwitch button:hover:not([aria-pressed="true"]) {
      background: rgba(255, 255, 255, 0.08) !important;
      color: #ffffff !important;
    }

    /* 懸浮毛玻璃膠囊導覽列 (OLED Pill Nav) + 高權重防覆寫 */
    nav {
      background: rgba(16, 16, 16, 0.9) !important;
      backdrop-filter: blur(16px);
      -webkit-backdrop-filter: blur(16px);
      border: 1px solid rgba(255, 255, 255, 0.14) !important;
      border-radius: 18px !important;
      padding: 6px !important;
      margin: 8px 0 22px !important;
      gap: 6px !important;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.65);
    }
    html body nav button {
      border: 1px solid transparent !important;
      background: transparent !important;
      color: #a1a1aa !important;
      border-radius: 13px !important;
      font-weight: 500;
      font-size: 15px !important;
      padding: 10px 12px !important;
      min-height: 44px !important;
      margin: 0 !important;
      transition: background 0.16s ease, color 0.16s ease, border-color 0.16s ease;
    }
    html body nav button:hover:not(.coffee-current-tab):not([aria-current="page"]) {
      color: #ffffff !important;
      background: rgba(255, 255, 255, 0.08) !important;
      border-color: rgba(255, 255, 255, 0.16) !important;
    }
    html body nav button.coffee-current-tab,
    html body nav button.coffee-current-tab:hover,
    html body nav button.coffee-current-tab:focus-visible,
    html body nav button[aria-current="page"],
    html body nav button[aria-current="page"]:hover {
      background: #ffffff !important;
      color: #000000 !important;
      border-color: #ffffff !important;
      font-weight: 600 !important;
      box-shadow: 0 2px 14px rgba(255, 255, 255, 0.22) !important;
    }
    nav button::before {
      content: "";
      display: inline-block;
      width: 16px;
      height: 16px;
      margin-right: 7px;
      vertical-align: -3px;
      background-color: currentColor;
      -webkit-mask-size: contain;
      mask-size: contain;
      -webkit-mask-repeat: no-repeat;
      mask-repeat: no-repeat;
      -webkit-mask-position: center;
      mask-position: center;
    }
    nav button[data-tab="history"]::before {
      -webkit-mask-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='black' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M17 8h1a4 4 0 1 1 0 8h-1'/%3E%3Cpath d='M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4Z'/%3E%3Cline x1='6' y1='2' x2='6' y2='4'/%3E%3Cline x1='10' y1='2' x2='10' y2='4'/%3E%3Cline x1='14' y1='2' x2='14' y2='4'/%3E%3C/svg%3E");
      mask-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='black' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M17 8h1a4 4 0 1 1 0 8h-1'/%3E%3Cpath d='M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4Z'/%3E%3Cline x1='6' y1='2' x2='6' y2='4'/%3E%3Cline x1='10' y1='2' x2='10' y2='4'/%3E%3Cline x1='14' y1='2' x2='14' y2='4'/%3E%3C/svg%3E");
    }
    nav button[data-tab="brew"]::before {
      -webkit-mask-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='black' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M5 4h14l-4.5 9h-5L5 4z'/%3E%3Cpath d='M8 17h8'/%3E%3Cpath d='M12 13v7'/%3E%3C/svg%3E");
      mask-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='black' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M5 4h14l-4.5 9h-5L5 4z'/%3E%3Cpath d='M8 17h8'/%3E%3Cpath d='M12 13v7'/%3E%3C/svg%3E");
    }
    nav button[data-tab="guide"]::before {
      -webkit-mask-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='black' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Ccircle cx='12' cy='13' r='8'/%3E%3Cpath d='M12 9v4l2.5 2.5'/%3E%3Cpath d='M9 2h6'/%3E%3C/svg%3E");
      mask-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='black' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Ccircle cx='12' cy='13' r='8'/%3E%3Cpath d='M12 9v4l2.5 2.5'/%3E%3Cpath d='M9 2h6'/%3E%3C/svg%3E");
    }
    nav button[data-tab="settings"]::before {
      -webkit-mask-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='black' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z'/%3E%3C/svg%3E");
      mask-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='black' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z'/%3E%3C/svg%3E");
    }

    @media (max-width: 599px) {
      body {
        padding: 12px 14px 48px !important;
      }
      .cv-header-actions {
        width: 100%;
        justify-content: space-between;
      }
      html:not(.coffee-installed) nav {
        grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
        gap: 6px !important;
      }
      html:not(.coffee-installed) nav .workspace-settings {
        grid-column: auto !important;
        min-height: 44px !important;
        font-size: 14.5px !important;
      }
      html:not(.coffee-installed) nav button {
        font-size: 14.5px !important;
        padding: 9px 10px !important;
        min-height: 44px !important;
      }
    }

    /* OLED 卡片與次級容器階層 */
    .card, .flow-timeline, dialog {
      background: var(--oled-card) !important;
      border: 1px solid var(--oled-border) !important;
      border-radius: 22px !important;
      padding: 22px !important;
      color: #f4f4f5 !important;
      box-shadow: 0 12px 36px rgba(0, 0, 0, 0.55);
    }
    dialog::backdrop {
      background: rgba(0, 0, 0, 0.82) !important;
      backdrop-filter: blur(8px);
      -webkit-backdrop-filter: blur(8px);
    }
    .box, .flow-step {
      background: var(--oled-subcard) !important;
      border: 1px solid var(--oled-border-subtle) !important;
      border-radius: 16px !important;
      padding: 16px !important;
    }
    .flow-step {
      grid-template-columns: 24px minmax(0, 1fr) auto !important;
      align-items: center;
    }
    .flow-step.current, .live {
      background: #1f1f1f !important;
      border: 1.5px solid #ffffff !important;
      box-shadow: 0 0 24px rgba(255, 255, 255, 0.08);
    }
    .cv-step-badge {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 28px;
      height: 28px;
      border-radius: 9px;
      background: rgba(255, 255, 255, 0.06);
      border: 1px solid rgba(255, 255, 255, 0.1);
      color: #d4d4d8;
      flex-shrink: 0;
    }

    /* 表單輸入減噪與高觸控圓角 */
    input:not([type="checkbox"]), select, textarea {
      background: var(--oled-input) !important;
      border: 1px solid rgba(255, 255, 255, 0.16) !important;
      border-radius: 12px !important;
      padding: 10px 13px !important;
      color: #ffffff !important;
      transition: border-color 0.15s, box-shadow 0.15s;
    }
    input:not([type="checkbox"]):focus, select:focus, textarea:focus {
      border-color: #ffffff !important;
      box-shadow: 0 0 0 3px rgba(255, 255, 255, 0.14);
      outline: none !important;
    }
    label {
      color: #a1a1aa !important;
      font-size: 14px !important;
      font-weight: 500;
    }

    /* 一般按鈕質感升級 */
    button {
      background: #1a1a1a !important;
      border: 1px solid rgba(255, 255, 255, 0.18) !important;
      border-radius: 13px !important;
      color: #f4f4f5 !important;
      font-weight: 500;
      transition: transform 0.1s ease, background 0.15s ease, border-color 0.15s ease;
    }
    button:hover:not(:disabled) {
      background: #262626 !important;
      border-color: rgba(255, 255, 255, 0.38) !important;
    }
    button:active:not(:disabled) {
      transform: scale(0.985);
    }

    /* 主白色 CTA 按鈕與選中狀態（高權重鎖定白底黑字，Hover 絕不黑化） */
    html body #coffeeEnterGuide,
    html body #flowBegin,
    html body .flow-primary,
    html body #saveRecipe,
    html body #saveCup,
    html body #btnGoogleLogin,
    html body .workspace-tabs button[aria-pressed="true"],
    html body #coffeeLanguageSwitch button[aria-pressed="true"] {
      background: #ffffff !important;
      color: #000000 !important;
      border-color: #ffffff !important;
      font-weight: 600 !important;
    }
    html body #coffeeEnterGuide:hover:not(:disabled),
    html body #flowBegin:hover:not(:disabled),
    html body .flow-primary:hover:not(:disabled),
    html body #saveRecipe:hover:not(:disabled),
    html body #saveCup:hover:not(:disabled),
    html body #btnGoogleLogin:hover:not(:disabled),
    html body .workspace-tabs button[aria-pressed="true"]:hover:not(:disabled),
    html body #coffeeLanguageSwitch button[aria-pressed="true"]:hover:not(:disabled) {
      background: #e4e4e7 !important;
      color: #000000 !important;
      border-color: #ffffff !important;
    }

    /* Toast 與復原鈕高對比 */
    #toast {
      background: #ffffff !important;
      color: #000000 !important;
      border: 1px solid rgba(255, 255, 255, 0.25);
      border-radius: 14px !important;
      padding: 12px 16px !important;
      font-weight: 500;
      box-shadow: 0 12px 36px rgba(0, 0, 0, 0.85);
    }
    html body #toast button {
      background: #111111 !important;
      color: #ffffff !important;
      border-color: #111111 !important;
      padding: 6px 12px !important;
      min-height: 36px !important;
      margin: 0 0 0 10px !important;
    }

    /* 折疊區塊 Details 視覺化 */
    details {
      background: rgba(255, 255, 255, 0.02);
      border: 1px solid var(--oled-border-subtle);
      border-radius: 16px;
      padding: 6px 16px;
      margin: 14px 0;
    }
    details[open] {
      padding-bottom: 16px;
      background: rgba(255, 255, 255, 0.03);
    }
    summary {
      font-family: var(--font-brand) !important;
      font-size: 19px !important;
      margin: 8px 0 !important;
      color: #ffffff;
    }

    footer#storageStatus {
      margin-top: 28px;
      padding-top: 16px;
      border-top: 1px solid var(--oled-border-subtle);
      color: #71717a;
      font-size: 13px;
      text-align: center;
    }

    /* ================= 視覺化元件專用樣式 ================= */
    .cv-chart-card {
      background: #151515;
      border: 1px solid rgba(255, 255, 255, 0.12);
      border-radius: 18px;
      padding: 18px;
      margin: 16px 0;
    }
    .cv-chart-header {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
      margin-bottom: 12px;
    }
    .cv-chart-title {
      font-family: var(--font-brand);
      font-size: 17px;
      color: #ffffff;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .cv-badges-row {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin-top: 10px;
    }
    .cv-chip {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 5px 11px;
      border-radius: 999px;
      background: #222222;
      border: 1px solid rgba(255, 255, 255, 0.12);
      font-size: 12.5px;
      color: #e4e4e7;
    }
    .cv-roast-dots {
      display: inline-flex;
      gap: 3px;
      align-items: center;
    }
    .cv-roast-dot {
      width: 7px;
      height: 7px;
      border-radius: 50%;
      border: 1px solid #ffffff;
    }
    .cv-roast-dot.filled {
      background: #ffffff;
    }

    /* 2. 引導沖煮：雙軌圓環儀表與分段比例進度條 */
    .cv-brew-visual {
      margin: 10px 0 16px;
      padding: 16px;
      background: #151515;
      border: 1px solid rgba(255, 255, 255, 0.14);
      border-radius: 20px;
    }
    .cv-prop-bar {
      display: flex;
      gap: 5px;
      height: 10px;
      padding: 2px;
      background: #09090b;
      border-radius: 999px;
      margin-bottom: 16px;
      overflow: hidden;
    }
    .cv-prop-seg {
      height: 100%;
      border-radius: 999px;
      background: #27272a;
      transition: background 0.25s ease;
    }
    .cv-prop-seg.manual {
      background: repeating-linear-gradient(45deg, #27272a, #27272a 4px, #3f3f46 4px, #3f3f46 8px);
    }
    .cv-prop-seg.done {
      background: #ffffff;
    }
    .cv-prop-seg.active {
      background: #ffffff;
      animation: cvPulse 1.4s infinite ease-in-out;
    }
    @keyframes cvPulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.45; }
    }
    .cv-gauge-wrap {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      position: relative;
      width: 210px;
      height: 210px;
      margin: 4px auto 14px;
    }
    .cv-gauge-svg {
      width: 100%;
      height: 100%;
      transform: rotate(-90deg);
    }
    .cv-gauge-center {
      position: absolute;
      inset: 0;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      pointer-events: none;
      padding: 16px;
    }
    .cv-telemetry-grid {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 10px;
      margin-top: 8px;
    }
    .cv-telemetry-cell {
      background: #1f1f1f;
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 14px;
      padding: 10px 8px;
      text-align: center;
    }
    .cv-telemetry-cell.highlight {
      border-color: rgba(255, 255, 255, 0.5);
      background: #242424;
    }
    .cv-telemetry-label {
      font-size: 12px;
      color: #a1a1aa;
    }
    .cv-telemetry-val {
      font-family: var(--font-mono);
      font-size: clamp(1.1rem, 3vw, 1.45rem);
      font-weight: 700;
      color: #ffffff;
      margin-top: 2px;
    }

    /* 3. 五角風味雷達圖與五格量尺 */
    .cv-radar-box {
      display: grid;
      grid-template-columns: 150px minmax(0, 1fr);
      gap: 16px;
      align-items: center;
      background: #121212;
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 14px;
      padding: 12px 14px;
      margin: 12px 0;
    }
    @media (max-width: 480px) {
      .cv-radar-box {
        grid-template-columns: 1fr;
        justify-items: center;
      }
    }
    .cv-bars-list {
      width: 100%;
      display: grid;
      gap: 7px;
      font-size: 13px;
    }
    .cv-bar-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
    }
    .cv-bar-segments {
      display: flex;
      gap: 4px;
    }
    .cv-bar-seg {
      width: 18px;
      height: 6px;
      border-radius: 3px;
      background: #27272a;
    }
    .cv-bar-seg.on {
      background: #ffffff;
    }
    .cv-radar-note {
      font-size: 11.5px;
      color: #71717a;
      margin-top: 4px;
    }
  `;
  document.head.append(style);

  // =========================================================================
  // 2. 動作與器材 SVG 圖示庫（涵蓋全部 12 種動作）
  // =========================================================================
  function getActionSvg(typeStr) {
    const t = String(typeStr || '');
    if (t.includes('悶蒸')) {
      return `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/></svg>`;
    }
    if (t.includes('繞圈')) {
      return `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 12m-1 0a1 1 0 1 0 2 0a3 3 0 1 0-6 0a5 5 0 1 0 10 0a7 7 0 1 0-14 0"/></svg>`;
    }
    if (t.includes('中心')) {
      return `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="4"/><circle cx="12" cy="12" r="1"/></svg>`;
    }
    if (t.includes('注水') || t.includes('加水')) {
      return `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 16.3c2.2 0 4-1.83 4-4.05 0-1.16-.57-2.26-1.71-3.19S7.29 6.75 7 5.3c-.29 1.45-1.14 2.84-2.29 3.76S3 11.1 3 12.25c0 2.22 1.8 4.05 4 4.05z"/><path d="M12.56 6.6A10.97 10.97 0 0 0 14 3.02c.5 2.5 2 4.9 4 6.5s3 3.5 3 5.5a6.98 6.98 0 0 1-11.91 4.97"/></svg>`;
    }
    if (t.includes('等待') && !t.includes('滴濾')) {
      return `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M5 22h14"/><path d="M5 2h14"/><path d="M17 22v-4.172a2 2 0 0 0-.586-1.414L12 12l-4.414 4.414A2 2 0 0 0 7 17.828V22"/><path d="M7 2v4.172a2 2 0 0 0 .586 1.414L12 12l4.414-4.414A2 2 0 0 0 17 6.172V2"/></svg>`;
    }
    if (t.includes('攪拌')) {
      return `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 1 1-6.219-8.56"/><polyline points="22 2 22 8 16 8"/></svg>`;
    }
    if (t.includes('下壓')) {
      return `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 4h10"/><path d="M12 4v11"/><path d="m8 11 4 4 4-4"/><path d="M6 19h12"/></svg>`;
    }
    if (t.includes('閥門')) {
      return `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"/><path d="M3 12h5"/><path d="M16 12h5"/><path d="M12 3v5"/></svg>`;
    }
    if (t.includes('滴濾')) {
      return `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 4h14l-5 8h-4L5 4z"/><path d="M12 16v2"/><circle cx="12" cy="20.5" r="1"/></svg>`;
    }
    if (t.includes('冰')) {
      return `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="3"/><path d="M3 9h18"/><path d="M9 21V9"/></svg>`;
    }
    return `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v14"/><path d="m7 12 5 5 5-5"/><path d="M5 21h14"/></svg>`;
  }

  function roastDotsCount(roastStr) {
    const map = { '淺焙': 1, '中淺焙': 2, '中焙': 3, '中深焙': 4, '深焙': 5 };
    return map[roastStr] || 0;
  }

  // =========================================================================
  // 3. 頂部品牌標題列重構與防搶位守護（相容延遲載入的 coffee-recipe-share.js）
  // =========================================================================
  function ensureHeaderLayout() {
    const h1 = document.querySelector('h1');
    const small = document.querySelector('body > small') || document.querySelector('.cv-brand-meta > small');
    const langSwitch = document.getElementById('coffeeLanguageSwitch');
    const layoutBadge = document.getElementById('coffeeLayoutStatus');
    if (!h1) return;

    let header = document.getElementById('cvHeaderBar');
    let titleWrap, metaWrap, actions;

    if (!header) {
      header = document.createElement('header');
      header.id = 'cvHeaderBar';
      header.className = 'cv-header-bar';

      const brandGroup = document.createElement('div');
      brandGroup.className = 'cv-brand-group';

      const logo = document.createElement('div');
      logo.className = 'cv-brand-logo';
      logo.setAttribute('aria-hidden', 'true');
      logo.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M5 4h14l-4.5 7h-5L5 4z"/><path d="M19 5.5h2a1.5 1.5 0 0 1 0 3h-3.2"/><path d="M8 11h8"/><path d="M7.5 13h9l1.5 6a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2l1.5-6z"/><path d="M12 15.5c0 1.2-1 2.2-1 2.8a1 1 0 0 0 2 0c0-.6-1-1.6-1-2.8z"/></svg>`;

      titleWrap = document.createElement('div');
      titleWrap.className = 'cv-brand-title';
      metaWrap = document.createElement('div');
      metaWrap.className = 'cv-brand-meta';
      titleWrap.append(metaWrap);
      brandGroup.append(logo, titleWrap);

      actions = document.createElement('div');
      actions.className = 'cv-header-actions';

      const syncPill = document.createElement('button');
      syncPill.type = 'button';
      syncPill.id = 'cvHeaderSyncPill';
      syncPill.className = 'cv-sync-pill';
      syncPill.setAttribute('data-coffee-user-text', 'true');
      syncPill.innerHTML = `<span class="cv-sync-dot" id="cvSyncDot"></span><span id="cvSyncLabel"></span>`;
      syncPill.onclick = () => {
        const settingsBtn = document.querySelector('nav button[data-tab="settings"]');
        if (settingsBtn) settingsBtn.click();
        const box = document.getElementById('cloudSyncBox');
        if (box) setTimeout(() => box.scrollIntoView({ behavior: 'smooth', block: 'center' }), 60);
      };
      actions.append(syncPill);
      header.append(brandGroup, actions);

      const navEl = document.querySelector('nav');
      if (navEl) navEl.before(header);
      else document.body.prepend(header);
    } else {
      titleWrap = header.querySelector('.cv-brand-title');
      metaWrap = header.querySelector('.cv-brand-meta');
      actions = header.querySelector('.cv-header-actions');
    }

    // 確保 h1 與 meta、語言切換器未被 #coffeeAppHeader 搶走
    if (titleWrap && h1.parentElement !== titleWrap) {
      titleWrap.prepend(h1);
    }
    if (metaWrap) {
      if (small && small.parentElement !== metaWrap) metaWrap.append(small);
      if (layoutBadge && layoutBadge.parentElement !== metaWrap) metaWrap.append(layoutBadge);
    }
    if (actions && langSwitch && langSwitch.parentElement !== actions) {
      actions.append(langSwitch);
    }

    const rogueHeader = document.getElementById('coffeeAppHeader');
    if (rogueHeader && rogueHeader !== header) {
      while (rogueHeader.firstChild) {
        header.append(rogueHeader.firstChild);
      }
      rogueHeader.remove();
    }
    updateSyncPill();
  }

  function updateSyncPill() {
    const desc = document.getElementById('syncStatusDesc');
    const dot = document.getElementById('cvSyncDot');
    const label = document.getElementById('cvSyncLabel');
    if (!dot || !label) return;

    const state = desc ? desc.getAttribute('data-sync-state') : '';
    const txt = desc ? (desc.textContent || '') : '';

    let nextDotClass = 'cv-sync-dot';
    let nextLabel = '';
    if (state === 'synced' || txt.includes('已同步') || txt.includes('已連結') || txt.includes('Synced')) {
      nextDotClass = 'cv-sync-dot online';
      nextLabel = L('☁️ 雲端已同步', '☁️ Cloud Synced');
    } else if (state === 'syncing' || txt.includes('正在同步') || txt.includes('Syncing')) {
      nextDotClass = 'cv-sync-dot online';
      nextLabel = L('🔄 同步中...', '🔄 Syncing...');
    } else if (state === 'offline' || state === 'error') {
      nextDotClass = 'cv-sync-dot warn';
      nextLabel = L('☁️ 離線待同步', '☁️ Offline');
    } else {
      nextLabel = L('☁️ 登入雲端同步', '☁️ Cloud Sync');
    }
    if (dot.className !== nextDotClass) dot.className = nextDotClass;
    if (label.textContent !== nextLabel) label.textContent = nextLabel;
  }

  // =========================================================================
  // 4. 配方工作室：SVG 注水階梯曲線圖 (Water Staircase Curve) ＋ 步驟圖示
  // =========================================================================
  let chartContainer = null;
  let lastChartKey = '';

  function enhanceRecipeStepIcons() {
    const stepsContainer = document.getElementById('steps');
    if (!stepsContainer) return;
    Array.from(stepsContainer.children).forEach((box, i) => {
      const sel = document.getElementById('st' + i);
      const headerRow = box.firstElementChild;
      if (!sel || !headerRow) return;
      let badge = headerRow.querySelector('.cv-step-badge');
      if (!badge) {
        badge = document.createElement('span');
        badge.className = 'cv-step-badge';
        badge.setAttribute('aria-hidden', 'true');
        badge.setAttribute('data-coffee-user-text', 'true');
        badge.style.margin = '0 6px';
        badge.style.verticalAlign = 'middle';
        const numSpan = headerRow.querySelector('span');
        if (numSpan) numSpan.after(badge);
        else headerRow.prepend(badge);
      }
      if (badge.dataset.stepType !== sel.value) {
        badge.dataset.stepType = sel.value;
        badge.innerHTML = getActionSvg(sel.value);
      }
    });
  }

  function renderRecipeWaterChart() {
    if (typeof read !== 'function' || typeof m !== 'function') return;
    const stepsContainer = document.getElementById('steps');
    if (!stepsContainer) return;

    enhanceRecipeStepIcons();

    if (!chartContainer) {
      chartContainer = document.createElement('div');
      chartContainer.id = 'cvRecipeChartCard';
      chartContainer.className = 'cv-chart-card';
      chartContainer.setAttribute('data-coffee-user-text', 'true');
      stepsContainer.before(chartContainer);
    }

    let r;
    try { r = read(); } catch (e) { return; }
    if (!r || !Array.isArray(r.steps)) return;

    const summary = m(r);
    const key = JSON.stringify([r.dose, r.temp, r.roast, r.dripper, r.method, r.cold, r.ice, r.steps, document.documentElement.lang]);
    if (key === lastChartKey) return;
    lastChartKey = key;

    const points = [[0, 0]];
    let t = 0;
    let w = 0;
    const stepMarkers = [];
    for (const s of r.steps) {
      const isMan = typeof manual === 'function' ? manual(s) : ['後加水（bypass）', '後加冰塊'].includes(s.type);
      const isPourStep = typeof pour === 'function' ? pour(s) : ['悶蒸注水', '注水', '繞圈注水', '中心注水'].includes(s.type);
      if (isMan) continue;
      const sec = Math.max(0, Number(s.sec) || 0);
      const addW = isPourStep ? Math.max(0, Number(s.water) || 0) : 0;
      t += sec;
      w += addW;
      points.push([t, w]);
      if (isPourStep) stepMarkers.push([t, w, addW, sec]);
    }

    const maxT = Math.max(t, 60);
    const maxW = Math.max(w, 100);
    const padL = 44, padR = 28, padT = 26, padB = 26;
    const W = 440, H = 165;
    const plotW = W - padL - padR;
    const plotH = H - padT - padB;

    const toX = sec => padL + (sec / maxT) * plotW;
    const toY = water => padT + plotH - (water / maxW) * plotH;

    const polyPoints = points.map(([px, py]) => `${toX(px).toFixed(1)},${toY(py).toFixed(1)}`).join(' ');
    const areaPoints = `${toX(0).toFixed(1)},${toY(0).toFixed(1)} ${polyPoints} ${toX(t).toFixed(1)},${toY(0).toFixed(1)}`;

    // 智慧錯開/過濾過於擁擠的標籤文字，避免互相重疊或裁切
    let lastLabelX = -999;
    const dots = stepMarkers.map(([px, py], idx) => {
      const x = toX(px);
      const y = toY(py);
      const isLast = idx === stepMarkers.length - 1;
      const showLabel = isLast || (x - lastLabelX >= 36);
      if (showLabel) lastLabelX = x;
      const labelHtml = showLabel
        ? `<text x="${x.toFixed(1)}" y="${(y - 8).toFixed(1)}" fill="#e4e4e7" font-size="9.5" text-anchor="middle" font-family="monospace">${Math.round(py * 10) / 10}g</text>`
        : '';
      return `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="3.5" fill="#ffffff"/>${labelHtml}`;
    }).join('');

    const roastCount = roastDotsCount(r.roast);
    let roastDotsHtml = '';
    if (roastCount > 0) {
      for (let i = 1; i <= 5; i++) {
        roastDotsHtml += `<span class="cv-roast-dot ${i <= roastCount ? 'filled' : ''}"></span>`;
      }
    }

    const ratioStr = r.dose > 0 ? `1:${(summary.water / r.dose).toFixed(1)}` : '—';
    const postBadges = [];
    if (summary.postWater > 0) {
      postBadges.push(`<span class="cv-chip cv-mono">+${summary.postWater}g ${L('後加水', 'Bypass')}</span>`);
    }
    if (summary.postIce > 0) {
      postBadges.push(`<span class="cv-chip cv-mono">+${summary.postIce}g ${L('冰', 'Ice')}</span>`);
    }

    chartContainer.innerHTML = `
      <div class="cv-chart-header">
        <div class="cv-chart-title">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
          <span>${L('分段注水階梯曲線圖', 'Pouring Staircase Curve')}</span>
        </div>
        <span class="cv-mono" style="font-size:12.5px;color:#a1a1aa">${summary.water}g / ${t}s · ${ratioStr}</span>
      </div>
      <svg viewBox="0 0 ${W} ${H}" style="width:100%;height:auto;display:block;background:#101010;border-radius:12px;padding:2px">
        <line x1="${padL}" y1="${padT}" x2="${W - padR}" y2="${padT}" stroke="#27272a" stroke-dasharray="3 3"/>
        <line x1="${padL}" y1="${(padT + plotH / 2).toFixed(1)}" x2="${W - padR}" y2="${(padT + plotH / 2).toFixed(1)}" stroke="#27272a" stroke-dasharray="3 3"/>
        <line x1="${padL}" y1="${padT + plotH}" x2="${W - padR}" y2="${padT + plotH}" stroke="#52525b"/>
        <text x="${padL - 6}" y="${padT + 4}" fill="#888" font-size="9.5" text-anchor="end" font-family="monospace">${Math.round(maxW)}g</text>
        <text x="${padL - 6}" y="${(padT + plotH / 2 + 3).toFixed(1)}" fill="#888" font-size="9.5" text-anchor="end" font-family="monospace">${Math.round(maxW / 2)}g</text>
        <text x="${padL - 6}" y="${padT + plotH + 3}" fill="#888" font-size="9.5" text-anchor="end" font-family="monospace">0g</text>
        <polygon points="${areaPoints}" fill="rgba(255,255,255,0.08)"/>
        <polyline points="${polyPoints}" fill="none" stroke="#ffffff" stroke-width="2.4" stroke-linejoin="round" stroke-linecap="round"/>
        ${dots}
        <text x="${padL}" y="${H - 6}" fill="#888" font-size="9.5" text-anchor="start" font-family="monospace">0:00</text>
        <text x="${(padL + plotW / 2).toFixed(1)}" y="${H - 6}" fill="#888" font-size="9.5" text-anchor="middle" font-family="monospace">${fmt(maxT * 500)}</text>
        <text x="${W - padR}" y="${H - 6}" fill="#888" font-size="9.5" text-anchor="end" font-family="monospace">${fmt(maxT * 1000)}</text>
      </svg>
      <div class="cv-badges-row">
        <span class="cv-chip">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 4h14l-4.5 9h-5L5 4z"/></svg>
          <span>${esc(r.dripper || r.method || '—')}</span>
        </span>
        <span class="cv-chip cv-mono">${esc(r.dose)}g : ${summary.water}g (${ratioStr})</span>
        <span class="cv-chip cv-mono">${esc(r.temp)}°C</span>
        ${roastCount > 0 ? `<span class="cv-chip"><span class="cv-roast-dots">${roastDotsHtml}</span><span>${esc(r.roast)}</span></span>` : ''}
        ${postBadges.join('')}
      </div>
    `;
  }

  // =========================================================================
  // 5. 引導沖煮：雙軌圓環儀表 (SVG Circular Brew Gauge) ＋ 零重繪高效能更新
  // =========================================================================
  let brewVisualBox = null;
  let lastGaugeKey = '';
  let gaugeRefs = null;

  function enhanceTimelineIcons() {
    const timeline = document.querySelector('#flowBrewing .flow-timeline [role="list"]');
    if (!timeline) return;
    const activeRecipe = (typeof run !== 'undefined' && run) ? run : null;
    if (!activeRecipe || !Array.isArray(activeRecipe.steps)) return;
    Array.from(timeline.children).forEach((row, idx) => {
      const s = activeRecipe.steps[idx];
      if (!s) return;
      let icon = row.querySelector('.cv-step-badge');
      if (!icon) {
        icon = document.createElement('span');
        icon.className = 'cv-step-badge';
        icon.setAttribute('aria-hidden', 'true');
        icon.setAttribute('data-coffee-user-text', 'true');
        row.append(icon);
      }
      if (icon.dataset.stepType !== s.type) {
        icon.dataset.stepType = s.type;
        icon.innerHTML = getActionSvg(s.type);
      }
    });
  }

  function resolveBrewStepState(activeRecipe, elapsedMs) {
    const stepsList = activeRecipe.steps || [];
    const cursor = activeRecipe.guideCursor;
    if (cursor && Number.isInteger(cursor.i) && cursor.i >= 0 && cursor.i < stepsList.length) {
      return {
        stepIdx: cursor.i,
        stepStartMs: Number.isFinite(cursor.start) ? cursor.start : 0
      };
    }
    // 備援換算：依據累計秒數推算目前步驟
    let accMs = 0;
    for (let i = 0; i < stepsList.length; i++) {
      const dur = (['後加水（bypass）', '後加冰塊'].includes(stepsList[i].type) ? 0 : (Number(stepsList[i].sec) || 0)) * 1000;
      if (elapsedMs < accMs + dur || i === stepsList.length - 1) {
        return { stepIdx: i, stepStartMs: accMs };
      }
      accMs += dur;
    }
    return { stepIdx: 0, stepStartMs: 0 };
  }

  function renderActiveBrewGauge() {
    const flowBrewing = document.getElementById('flowBrewing');
    if (!flowBrewing || flowBrewing.hidden) return;
    const focus = flowBrewing.querySelector('.flow-focus');
    if (!focus) return;

    if (!brewVisualBox) {
      brewVisualBox = document.createElement('div');
      brewVisualBox.id = 'cvBrewVisualBox';
      brewVisualBox.className = 'cv-brew-visual';
      brewVisualBox.setAttribute('data-coffee-user-text', 'true');
      // 放在「步驟動作 (h3)」與「注水至 (#flowTarget 的標籤)」之間，絕不拆散標籤與數值
      const actionHeading = focus.querySelector('h3');
      if (actionHeading) actionHeading.after(brewVisualBox);
      else focus.prepend(brewVisualBox);
    }

    enhanceTimelineIcons();

    const activeRecipe = (typeof run !== 'undefined' && run) ? run : (typeof read === 'function' ? read() : null);
    if (!activeRecipe || !Array.isArray(activeRecipe.steps) || !activeRecipe.steps.length) return;

    const elapsedMs = (typeof running !== 'undefined' && running)
      ? Math.max(0, Date.now() - startAt)
      : (typeof ms !== 'undefined' ? Math.max(0, ms) : 0);

    const isPostFn = s => (typeof manual === 'function' ? manual(s) : ['後加水（bypass）', '後加冰塊'].includes(s.type));
    const isPourFn = s => (typeof pour === 'function' ? pour(s) : ['悶蒸注水', '注水', '繞圈注水', '中心注水'].includes(s.type));

    const totalSec = Math.max(1, activeRecipe.steps.reduce((acc, s) => acc + (isPostFn(s) ? 0 : (Number(s.sec) || 0)), 0));
    const { stepIdx, stepStartMs } = resolveBrewStepState(activeRecipe, elapsedMs);
    const curStep = activeRecipe.steps[stepIdx] || { type: '注水', sec: 20, water: 0 };
    const isManStep = isPostFn(curStep);
    const stepSec = Math.max(1, Number(curStep.sec) || 1);
    const stepElapsedSec = Math.max(0, (elapsedMs - stepStartMs) / 1000);
    const stepRatio = isManStep ? 1 : Math.min(1, stepElapsedSec / stepSec);
    const totalRatio = Math.min(1, (elapsedMs / 1000) / totalSec);

    let cumWater = 0;
    for (let i = 0; i <= stepIdx; i++) {
      const st = activeRecipe.steps[i];
      if (st && isPourFn(st)) cumWater += Number(st.water) || 0;
    }
    const isPourStep = isPourFn(curStep);
    const flowRate = isPourStep && curStep.sec > 0 ? (curStep.water / curStep.sec).toFixed(1) : '—';

    const outerCirc = 339.29; // 2 * pi * 54
    const innerCirc = 276.46; // 2 * pi * 44
    const outerOffset = (outerCirc * (1 - totalRatio)).toFixed(1);
    const innerOffset = (innerCirc * (1 - stepRatio)).toFixed(1);

    const leftSec = Math.ceil(stepSec - stepElapsedSec);
    const centerTimeText = isManStep
      ? L('手動', 'Manual')
      : leftSec >= 0
        ? fmt(leftSec * 1000)
        : '+' + fmt(Math.abs(leftSec) * 1000);
    const centerSubText = isManStep
      ? `+${curStep.water || 0}g`
      : leftSec >= 0
        ? L('本段剩餘', 'Step left')
        : L('已超時', 'Overrun');

    const segKey = JSON.stringify([activeRecipe.steps, stepIdx, document.documentElement.lang, isManStep]);
    if (segKey !== lastGaugeKey || !gaugeRefs) {
      lastGaugeKey = segKey;
      const segsHtml = activeRecipe.steps.map((s, idx) => {
        const man = isPostFn(s);
        const wPct = man ? 8 : Math.max(6, Math.round(((Number(s.sec) || 15) / totalSec) * 100));
        const cls = [man ? 'manual' : '', idx < stepIdx ? 'done' : idx === stepIdx ? 'active' : ''].filter(Boolean).join(' ');
        return `<div class="cv-prop-seg ${cls}" style="flex:${wPct}"></div>`;
      }).join('');

      brewVisualBox.innerHTML = `
        <div class="cv-prop-bar">${segsHtml}</div>
        <div class="cv-gauge-wrap">
          <svg class="cv-gauge-svg" viewBox="0 0 120 120">
            <circle cx="60" cy="60" r="54" fill="none" stroke="#262626" stroke-width="5"/>
            <circle id="cvOuterArc" cx="60" cy="60" r="54" fill="none" stroke="#ffffff" stroke-width="5" stroke-dasharray="${outerCirc}" stroke-dashoffset="${outerOffset}" stroke-linecap="round"/>
            <circle cx="60" cy="60" r="44" fill="none" stroke="#1f1f1f" stroke-width="3" stroke-dasharray="4 3"/>
            <circle id="cvInnerArc" cx="60" cy="60" r="44" fill="none" stroke="${isManStep ? '#ffffff' : '#a1a1aa'}" stroke-width="3" stroke-dasharray="${isManStep ? '6 4' : innerCirc}" stroke-dashoffset="${isManStep ? '0' : innerOffset}" stroke-linecap="round"/>
          </svg>
          <div class="cv-gauge-center">
            <div style="color:#d4d4d8;margin-bottom:2px">${getActionSvg(curStep.type)}</div>
            <div id="cvGaugeTime" class="cv-mono" style="font-size:${isManStep ? '24px' : '32px'};font-weight:700;color:#fff;line-height:1.15">${centerTimeText}</div>
            <div id="cvGaugeSub" class="cv-mono" style="font-size:11.5px;color:#a1a1aa;margin-top:3px">${centerSubText}</div>
          </div>
        </div>
        <div class="cv-telemetry-grid">
          <div class="cv-telemetry-cell">
            <div class="cv-telemetry-label">${L('本段目標', 'Step Add')}</div>
            <div class="cv-telemetry-val">${curStep.water ? `+${curStep.water}` : '0'}<span style="font-size:12px;font-weight:400;color:#a1a1aa">g</span></div>
          </div>
          <div class="cv-telemetry-cell highlight">
            <div class="cv-telemetry-label">${L('累計萃取水', 'Brew Total')}</div>
            <div class="cv-telemetry-val">${cumWater}<span style="font-size:12px;font-weight:400;color:#d4d4d8">g</span></div>
          </div>
          <div class="cv-telemetry-cell">
            <div class="cv-telemetry-label">${L('目標流速', 'Flow Rate')}</div>
            <div class="cv-telemetry-val">${flowRate}<span style="font-size:12px;font-weight:400;color:#a1a1aa">${flowRate === '—' ? '' : 'g/s'}</span></div>
          </div>
        </div>
      `;
      gaugeRefs = {
        outerArc: brewVisualBox.querySelector('#cvOuterArc'),
        innerArc: brewVisualBox.querySelector('#cvInnerArc'),
        timeEl: brewVisualBox.querySelector('#cvGaugeTime'),
        subEl: brewVisualBox.querySelector('#cvGaugeSub')
      };
    } else if (gaugeRefs) {
      if (gaugeRefs.outerArc.getAttribute('stroke-dashoffset') !== outerOffset) {
        gaugeRefs.outerArc.setAttribute('stroke-dashoffset', outerOffset);
      }
      if (!isManStep && gaugeRefs.innerArc.getAttribute('stroke-dashoffset') !== innerOffset) {
        gaugeRefs.innerArc.setAttribute('stroke-dashoffset', innerOffset);
      }
      if (gaugeRefs.timeEl.textContent !== centerTimeText) {
        gaugeRefs.timeEl.textContent = centerTimeText;
      }
      if (gaugeRefs.subEl.textContent !== centerSubText) {
        gaugeRefs.subEl.textContent = centerSubText;
      }
    }
  }

  // =========================================================================
  // 6. 五角風味雷達圖 (如實映射未填項目為 0) ＋ 豆庫焙度點陣
  // =========================================================================
  function buildRadarSvg(cupA, cupB = null, size = 146) {
    const cx = 75, cy = 78, maxR = 52;
    const axes = [
      { key: 'acidity', label: L('酸', 'Acid') },
      { key: 'sweetness', label: L('甜', 'Sweet') },
      { key: 'bitterness', label: L('苦', 'Bitter') },
      { key: 'body', label: L('醇', 'Body') },
      { key: 'rating', label: L('喜好', 'Like') }
    ];

    const getVal = (c, k) => {
      const raw = c && c[k];
      if (raw === null || raw === undefined || raw === '') return 0;
      const v = Number(raw);
      return Number.isFinite(v) && v >= 1 && v <= 5 ? v : 0;
    };

    const pt = (idx, val) => {
      const angle = -Math.PI / 2 + (idx * 2 * Math.PI) / 5;
      const r = (val / 5) * maxR;
      return `${(cx + r * Math.cos(angle)).toFixed(1)},${(cy + r * Math.sin(angle)).toFixed(1)}`;
    };

    const rings = [1, 3, 5].map(level => {
      const pts = axes.map((_, i) => pt(i, level)).join(' ');
      return `<polygon points="${pts}" fill="none" stroke="${level === 5 ? '#3f3f46' : '#27272a'}" stroke-width="1"/>`;
    }).join('');

    const spokes = axes.map((a, i) => {
      const end = pt(i, 5);
      const labelPos = pt(i, 6.35).split(',');
      return `<line x1="${cx}" y1="${cy}" x2="${end.split(',')[0]}" y2="${end.split(',')[1]}" stroke="#27272a" stroke-width="1"/>
              <text x="${labelPos[0]}" y="${Number(labelPos[1]) + 3.5}" fill="#d4d4d8" font-size="10" text-anchor="middle">${a.label}</text>`;
    }).join('');

    const polyA = axes.map((a, i) => pt(i, getVal(cupA, a.key))).join(' ');
    const dotsA = axes.map((a, i) => {
      const val = getVal(cupA, a.key);
      if (val <= 0) return '';
      const [px, py] = pt(i, val).split(',');
      return `<circle cx="${px}" cy="${py}" r="2.8" fill="#ffffff"/>`;
    }).join('');

    let polyBHtml = '';
    if (cupB) {
      const polyB = axes.map((a, i) => pt(i, getVal(cupB, a.key))).join(' ');
      polyBHtml = `<polygon points="${polyB}" fill="rgba(255,255,255,0.05)" stroke="#a1a1aa" stroke-width="1.6" stroke-dasharray="4 3"/>`;
    }

    return `<svg width="${size}" height="${size}" viewBox="0 0 150 150" style="display:block;margin:0 auto">
      ${rings}${spokes}${polyBHtml}
      <polygon points="${polyA}" fill="rgba(255,255,255,0.18)" stroke="#ffffff" stroke-width="2"/>
      ${dotsA}
    </svg>`;
  }

  function buildFlavorBarsHtml(cup) {
    const items = [
      [L('酸感', 'Acidity'), cup.acidity],
      [L('甜感', 'Sweetness'), cup.sweetness],
      [L('苦感', 'Bitterness'), cup.bitterness],
      [L('厚實度', 'Body'), cup.body],
      [L('喜歡程度', 'Enjoyment'), cup.rating]
    ];
    const has4Axis = ['acidity', 'sweetness', 'bitterness', 'body'].some(k => Number.isFinite(Number(cup[k])) && Number(cup[k]) >= 1);
    const barsHtml = items.map(([label, val]) => {
      const num = val !== null && val !== undefined && val !== '' && Number.isFinite(Number(val)) && Number(val) > 0
        ? Math.min(5, Math.round(Number(val)))
        : 0;
      let segs = '';
      for (let i = 1; i <= 5; i++) {
        segs += `<span class="cv-bar-seg ${i <= num ? 'on' : ''}"></span>`;
      }
      return `<div class="cv-bar-row"><span>${label}</span><div class="cv-bar-segments" title="${num || '—'} / 5">${segs}</div></div>`;
    }).join('');

    const unratedNote = has4Axis
      ? ''
      : `<div class="cv-radar-note">${L('四維風味尚未評分（可按編輯紀錄補充）', '4 flavor axes unrated (tap Edit entry to score)')}</div>`;
    return `<div class="cv-bars-list">${barsHtml}${unratedNote}</div>`;
  }

  function enhanceJournalEntries() {
    if (typeof db === 'undefined' || !Array.isArray(db.cups)) return;
    const entriesRoot = document.getElementById('entries');
    if (!entriesRoot) return;
    const searchInput = document.getElementById('search');
    const q = (searchInput ? searchInput.value : '').trim().toLowerCase();
    const list = db.cups.filter(c => JSON.stringify(c).toLowerCase().includes(q));

    Array.from(entriesRoot.children).forEach((card, idx) => {
      const cup = list[idx];
      if (!cup) return;
      let radarBox = card.querySelector('.cv-radar-box');
      if (radarBox) {
        if (radarBox.dataset.lang === document.documentElement.lang) return;
        radarBox.remove();
      }
      radarBox = document.createElement('div');
      radarBox.className = 'cv-radar-box';
      radarBox.dataset.lang = document.documentElement.lang;
      radarBox.setAttribute('data-coffee-user-text', 'true');
      radarBox.innerHTML = buildRadarSvg(cup) + buildFlavorBarsHtml(cup);

      const detailsEl = card.querySelector('details');
      if (detailsEl) detailsEl.before(radarBox);
      else card.append(radarBox);
    });
  }

  function enhanceBeanCatalogDots() {
    const ws = document.getElementById('coffeeWorkspace');
    if (!ws || typeof db === 'undefined' || !db.beanCatalog || !Array.isArray(db.beanCatalog.items)) return;
    const beanPanel = ws.querySelector(':scope > div:nth-of-type(2)');
    if (!beanPanel) return;
    const beanBoxes = Array.from(beanPanel.querySelectorAll(':scope > article.box'));
    const beans = db.beanCatalog.items;
    beanBoxes.forEach((box, idx) => {
      const b = beans[idx];
      if (!b || box.querySelector('.cv-bean-roast-row')) return;
      const dots = roastDotsCount(b.roast);
      if (dots <= 0) return;
      let dotsHtml = '';
      for (let i = 1; i <= 5; i++) dotsHtml += `<span class="cv-roast-dot ${i <= dots ? 'filled' : ''}"></span>`;
      const row = document.createElement('div');
      row.className = 'cv-bean-roast-row cv-badges-row';
      row.setAttribute('data-coffee-user-text', 'true');
      row.innerHTML = `<span class="cv-chip"><span class="cv-roast-dots">${dotsHtml}</span><span>${esc(b.roast)}</span></span>`;
      const metaP = box.querySelector('p');
      if (metaP) metaP.after(row);
    });
  }

  function enhanceComparisonRadar() {
    const comp = document.getElementById('comparison');
    if (!comp || !comp.querySelector('table')) return;
    const oldWrap = comp.querySelector('.cv-compare-radar');
    if (oldWrap) oldWrap.remove();
    if (typeof chosen === 'undefined' || chosen.size !== 2 || typeof db === 'undefined') return;
    const cups = [...chosen].map(id => db.cups.find(c => c.id === id)).filter(Boolean);
    if (cups.length !== 2) return;

    const wrap = document.createElement('div');
    wrap.className = 'cv-chart-card cv-compare-radar';
    wrap.setAttribute('data-coffee-user-text', 'true');
    wrap.style.textAlign = 'center';
    wrap.innerHTML = `
      <div class="cv-chart-title" style="justify-content:center;margin-bottom:8px">
        <span>${L('雙杯五維風味疊圖比較', 'Dual-Cup Flavor Radar Comparison')}</span>
      </div>
      ${buildRadarSvg(cups[0], cups[1], 190)}
      <div style="display:flex;flex-wrap:wrap;justify-content:center;gap:12px 18px;font-size:12.5px;color:#d4d4d8;margin-top:8px">
        <span>━━ ${L('第一杯：', 'Cup 1: ')}${esc(cups[0].recipe.name)}</span>
        <span>┅┅ ${L('第二杯：', 'Cup 2: ')}${esc(cups[1].recipe.name)}</span>
      </div>
    `;
    comp.prepend(wrap);
  }

  // =========================================================================
  // 7. 掛載與生命週期綁定
  // =========================================================================
  function initVisualUI() {
    ensureHeaderLayout();
    updateSyncPill();
    renderRecipeWaterChart();
    renderActiveBrewGauge();
    enhanceJournalEntries();
    enhanceBeanCatalogDots();

    // 攔截 logs() 以自動加上五角風味雷達圖
    if (typeof window.logs === 'function' && !window.logs._cvWrapped) {
      const origLogs = window.logs;
      const wrappedLogs = function (...args) {
        const res = origLogs.apply(this, args);
        enhanceJournalEntries();
        enhanceBeanCatalogDots();
        return res;
      };
      wrappedLogs._cvWrapped = true;
      window.logs = wrappedLogs;
    }

    // 攔截比較按鈕
    const compareBtn = document.getElementById('compare');
    if (compareBtn && !compareBtn._cvWrapped) {
      const origCompare = compareBtn.onclick;
      compareBtn.onclick = function (e) {
        if (origCompare) origCompare.call(this, e);
        enhanceComparisonRadar();
      };
      compareBtn._cvWrapped = true;
    }

    // 監聽延遲載入的外掛是否動態插入 #coffeeAppHeader、更改豆庫或更改語系
    let repairingHeader = false;
    const headerBar = document.getElementById('cvHeaderBar');
    if (headerBar) {
      new MutationObserver(() => {
        if (repairingHeader) return;
        const broken = document.getElementById('coffeeAppHeader') ||
          !headerBar.contains(document.querySelector('h1')) ||
          (document.getElementById('coffeeLanguageSwitch') && !headerBar.querySelector('#coffeeLanguageSwitch'));
        if (broken) {
          repairingHeader = true;
          try {
            ensureHeaderLayout();
          } finally {
            queueMicrotask(() => { repairingHeader = false; });
          }
        }
      }).observe(headerBar, { childList: true, subtree: true });
    }

    const wsBeanPanel = document.querySelector('#coffeeWorkspace > div:nth-of-type(2)');
    if (wsBeanPanel) {
      new MutationObserver(() => enhanceBeanCatalogDots()).observe(wsBeanPanel, { childList: true });
    }

    let lastLang = document.documentElement.lang;
    new MutationObserver(() => {
      if (document.documentElement.lang !== lastLang) {
        lastLang = document.documentElement.lang;
        updateSyncPill();
        renderRecipeWaterChart();
        renderActiveBrewGauge();
        enhanceJournalEntries();
        if (document.querySelector('#comparison .cv-compare-radar')) enhanceComparisonRadar();
      }
    }).observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });

    // 高效定期同步圖表與雲端燈號（非沖煮狀態下完全不重建 DOM）
    setInterval(() => {
      updateSyncPill();
      renderRecipeWaterChart();
      renderActiveBrewGauge();
    }, 250);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initVisualUI);
  } else {
    initVisualUI();
  }
})();
