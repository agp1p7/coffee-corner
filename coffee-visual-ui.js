// coffee-visual-ui.js
// 一隅・咖啡角｜方案 C：OLED 沉浸式吧台風 ＋ 視覺圖表化與三層字體系統
// 100% 非破壞式視覺升級模組：不修改任何本機/雲端資料結構與驗算邏輯

(function () {
  'use strict';
  if (typeof document === 'undefined' || document.getElementById('coffeeVisualUILoaded')) return;

  const marker = document.createElement('meta');
  marker.id = 'coffeeVisualUILoaded';
  document.head.append(marker);

  const isEn = () => document.documentElement.lang === 'en';
  const L = (zh, en) => (isEn() ? en : zh);

  // =========================================================================
  // 1. 載入三層字體 (Iansui + Noto Sans TC + JetBrains Mono) 與方案 C OLED 樣式
  // =========================================================================
  const fontLink = document.createElement('link');
  fontLink.rel = 'stylesheet';
  fontLink.href = 'https://fonts.googleapis.com/css2?family=Iansui&family=JetBrains+Mono:wght@400;500;600;700&family=Noto+Sans+TC:wght@400;500;600;700&display=swap';
  document.head.append(fontLink);

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
      --oled-border: rgba(255, 255, 255, 0.13);
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
    h1, h2, h3, #taste, #notes, .font-brand, #flowPrepare h3:nth-of-type(2) {
      font-family: var(--font-brand) !important;
      letter-spacing: 0.03em;
    }

    /* 第三層：精密儀表數據與輸入數字採 JetBrains Mono 等寬對齊 */
    #timer, #flowTarget, #flowRemaining, #stats, #ey, #count, #actual,
    input[type="number"], .cv-mono {
      font-family: var(--font-mono), var(--font-ui) !important;
      font-variant-numeric: tabular-nums !important;
    }

    /* 頂部品牌標題列升級 */
    .cv-header-bar {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      padding-bottom: 16px;
      margin-bottom: 12px;
      border-bottom: 1px solid var(--oled-border);
    }
    .cv-brand-group {
      display: flex;
      align-items: center;
      gap: 14px;
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
    .cv-brand-title h1 {
      margin: 0 !important;
      font-size: clamp(1.55rem, 4vw, 2.1rem) !important;
      line-height: 1.2;
      color: #ffffff;
    }
    .cv-brand-meta {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 8px;
      margin-top: 3px;
    }
    .cv-header-actions {
      display: flex;
      align-items: center;
      gap: 10px;
      flex-wrap: wrap;
    }
    .cv-sync-pill {
      display: inline-flex;
      align-items: center;
      gap: 7px;
      padding: 6px 13px;
      border-radius: 999px;
      background: #141414;
      border: 1px solid var(--oled-border);
      font-size: 13px;
      color: #d4d4d8;
      cursor: pointer;
      transition: border-color 0.15s, background 0.15s;
      min-height: 36px !important;
      margin: 0 !important;
    }
    .cv-sync-pill:hover {
      border-color: rgba(255, 255, 255, 0.4);
      background: #1c1c1c;
    }
    .cv-sync-dot {
      width: 7px;
      height: 7px;
      border-radius: 50%;
      background: #71717a;
    }
    .cv-sync-dot.online {
      background: #ffffff;
      box-shadow: 0 0 8px rgba(255, 255, 255, 0.8);
    }

    #coffeeLanguageSwitch {
      margin: 0 !important;
    }
    #coffeeLanguageSwitch button {
      min-height: 36px !important;
      padding: 5px 11px !important;
      font-size: 13px !important;
      border-radius: 999px !important;
    }

    /* 懸浮毛玻璃膠囊導覽列 (OLED Pill Nav) + 內嵌圖示 */
    nav {
      background: rgba(18, 18, 18, 0.88) !important;
      backdrop-filter: blur(16px);
      -webkit-backdrop-filter: blur(16px);
      border: 1px solid rgba(255, 255, 255, 0.14) !important;
      border-radius: 18px !important;
      padding: 6px !important;
      margin: 8px 0 22px !important;
      gap: 6px !important;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.65);
    }
    nav button {
      border: 1px solid transparent !important;
      background: transparent !important;
      color: #a1a1aa !important;
      border-radius: 13px !important;
      font-weight: 500;
      font-size: 15px !important;
      padding: 10px 14px !important;
      transition: all 0.16s ease;
    }
    nav button:hover {
      color: #ffffff !important;
      background: rgba(255, 255, 255, 0.06) !important;
    }
    nav button.coffee-current-tab {
      background: #ffffff !important;
      color: #000000 !important;
      font-weight: 600;
      box-shadow: 0 2px 12px rgba(255, 255, 255, 0.18);
    }
    nav button::before {
      content: "";
      display: inline-block;
      width: 17px;
      height: 17px;
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

    /* OLED 卡片與次級容器階層 */
    .card, .flow-timeline, dialog {
      background: var(--oled-card) !important;
      border: 1px solid var(--oled-border) !important;
      border-radius: 22px !important;
      padding: 22px !important;
      box-shadow: 0 12px 36px rgba(0, 0, 0, 0.55);
    }
    .box, .flow-step {
      background: var(--oled-subcard) !important;
      border: 1px solid var(--oled-border-subtle) !important;
      border-radius: 16px !important;
      padding: 16px !important;
    }
    .flow-step.current, .live {
      background: #1f1f1f !important;
      border: 1.5px solid #ffffff !important;
      box-shadow: 0 0 24px rgba(255, 255, 255, 0.08);
    }

    /* 表單輸入減噪與高觸控圓角 */
    input, select, textarea {
      background: var(--oled-input) !important;
      border: 1px solid rgba(255, 255, 255, 0.16) !important;
      border-radius: 12px !important;
      padding: 10px 13px !important;
      color: #ffffff !important;
      transition: border-color 0.15s, box-shadow 0.15s;
    }
    input:focus, select:focus, textarea:focus {
      border-color: #ffffff !important;
      box-shadow: 0 0 0 3px rgba(255, 255, 255, 0.14);
      outline: none !important;
    }
    label {
      color: #a1a1aa !important;
      font-size: 14px !important;
      font-weight: 500;
    }

    /* 按鈕質感升級 */
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
    #coffeeEnterGuide, .flow-primary, #saveRecipe, #saveCup, #btnGoogleLogin,
    .workspace-tabs [aria-pressed="true"], #coffeeLanguageSwitch button[aria-pressed="true"] {
      background: #ffffff !important;
      color: #000000 !important;
      border-color: #ffffff !important;
      font-weight: 600 !important;
    }
    #coffeeEnterGuide:hover, .flow-primary:hover, #saveRecipe:hover, #saveCup:hover {
      background: #e4e4e7 !important;
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

    /* ================= 視覺化元件專用樣式 ================= */
    /* 1. 配方工作室：注水階梯曲線與焙度視覺卡 */
    .cv-chart-card {
      background: #161616;
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
      margin: 12px 0 18px;
      padding: 16px;
      background: #161616;
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
    .cv-prop-seg.done {
      background: #ffffff;
    }
    .cv-prop-seg.active {
      background: #ffffff;
      animation: cvPulse 1.4s infinite ease-in-out;
    }
    @keyframes cvPulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.4; }
    }
    .cv-gauge-wrap {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      position: relative;
      width: 210px;
      height: 210px;
      margin: 6px auto 14px;
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
    }
    .cv-telemetry-grid {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 10px;
      margin-top: 10px;
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
      font-size: clamp(1.15rem, 3vw, 1.5rem);
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
  `;
  document.head.append(style);
  // =========================================================================
  // 2. 動作與器材 SVG 圖示庫
  // =========================================================================
  function getActionSvg(typeStr) {
    const t = String(typeStr || '');
    if (t.includes('悶蒸')) {
      return `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/></svg>`;
    }
    if (t.includes('繞圈')) {
      return `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 12m-1 0a1 1 0 1 0 2 0a3 3 0 1 0-6 0a5 5 0 1 0 10 0a7 7 0 1 0-14 0"/></svg>`;
    }
    if (t.includes('中心')) {
      return `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="4"/><circle cx="12" cy="12" r="1"/></svg>`;
    }
    if (t.includes('注水') || t.includes('加水')) {
      return `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M7 16.3c2.2 0 4-1.83 4-4.05 0-1.16-.57-2.26-1.71-3.19S7.29 6.75 7 5.3c-.29 1.45-1.14 2.84-2.29 3.76S3 11.1 3 12.25c0 2.22 1.8 4.05 4 4.05z"/><path d="M12.56 6.6A10.97 10.97 0 0 0 14 3.02c.5 2.5 2 4.9 4 6.5s3 3.5 3 5.5a6.98 6.98 0 0 1-11.91 4.97"/></svg>`;
    }
    if (t.includes('等待') || t.includes('斷水')) {
      return `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 22h14"/><path d="M5 2h14"/><path d="M17 22v-4.172a2 2 0 0 0-.586-1.414L12 12l-4.414 4.414A2 2 0 0 0 7 17.828V22"/><path d="M7 2v4.172a2 2 0 0 0 .586 1.414L12 12l4.414-4.414A2 2 0 0 0 17 6.172V2"/></svg>`;
    }
    if (t.includes('攪拌')) {
      return `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12a9 9 0 1 1-6.219-8.56"/><polyline points="22 2 22 8 16 8"/></svg>`;
    }
    if (t.includes('冰')) {
      return `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="3"/><path d="M3 9h18"/><path d="M9 21V9"/></svg>`;
    }
    return `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 3v14"/><path d="m7 12 5 5 5-5"/><path d="M5 21h14"/></svg>`;
  }

  function roastDotsCount(roastStr) {
    const map = { '淺焙': 1, '中淺焙': 2, '中焙': 3, '中深焙': 4, '深焙': 5 };
    return map[roastStr] || 0;
  }

  // =========================================================================
  // 3. 頂部品牌標題列與雲端狀態徽章重構
  // =========================================================================
  function setupHeader() {
    const h1 = document.querySelector('body > h1');
    const small = document.querySelector('body > small');
    const langSwitch = document.getElementById('coffeeLanguageSwitch');
    const layoutBadge = document.getElementById('coffeeLayoutStatus');
    if (!h1 || document.getElementById('cvHeaderBar')) return;

    const header = document.createElement('header');
    header.id = 'cvHeaderBar';
    header.className = 'cv-header-bar';
    header.setAttribute('data-coffee-user-text', 'true');

    const brandGroup = document.createElement('div');
    brandGroup.className = 'cv-brand-group';

    const logo = document.createElement('div');
    logo.className = 'cv-brand-logo';
    logo.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M5 4h14l-4.5 7h-5L5 4z"/><path d="M19 5.5h2a1.5 1.5 0 0 1 0 3h-3.2"/><path d="M8 11h8"/><path d="M7.5 13h9l1.5 6a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2l1.5-6z"/><path d="M12 15.5c0 1.2-1 2.2-1 2.8a1 1 0 0 0 2 0c0-.6-1-1.6-1-2.8z"/></svg>`;

    const titleWrap = document.createElement('div');
    titleWrap.className = 'cv-brand-title';
    const metaWrap = document.createElement('div');
    metaWrap.className = 'cv-brand-meta';

    h1.before(header);
    titleWrap.append(h1);
    if (small) metaWrap.append(small);
    if (layoutBadge) metaWrap.append(layoutBadge);
    titleWrap.append(metaWrap);
    brandGroup.append(logo, titleWrap);

    const actions = document.createElement('div');
    actions.className = 'cv-header-actions';

    const syncPill = document.createElement('button');
    syncPill.type = 'button';
    syncPill.id = 'cvHeaderSyncPill';
    syncPill.className = 'cv-sync-pill';
    syncPill.innerHTML = `<span class="cv-sync-dot" id="cvSyncDot"></span><span id="cvSyncLabel">本機模式</span>`;
    syncPill.onclick = () => {
      const settingsBtn = document.querySelector('nav button[data-tab="settings"]');
      if (settingsBtn) settingsBtn.click();
    };

    actions.append(syncPill);
    if (langSwitch) actions.append(langSwitch);
    header.append(brandGroup, actions);
  }

  // 同步狀態燈連動
  function updateSyncPill() {
    const desc = document.getElementById('syncStatusDesc');
    const dot = document.getElementById('cvSyncDot');
    const label = document.getElementById('cvSyncLabel');
    if (!desc || !dot || !label) return;
    const txt = desc.textContent || '';
    if (txt.includes('已同步') || txt.includes('已連結')) {
      dot.classList.add('online');
      label.textContent = L('☁️ 雲端已同步', '☁️ Cloud Synced');
    } else if (txt.includes('正在同步')) {
      dot.classList.add('online');
      label.textContent = L('🔄 同步中...', '🔄 Syncing...');
    } else {
      dot.classList.remove('online');
      label.textContent = L('☁️ 登入雲端同步', '☁️ Cloud Sync');
    }
  }

  // =========================================================================
  // 4. 配方工作室：SVG 注水階梯曲線圖 (Water Staircase Curve) ＋ 焙度點陣
  // =========================================================================
  let chartContainer = null;
  let lastChartKey = '';

  function renderRecipeWaterChart() {
    if (typeof read !== 'function' || typeof m !== 'function') return;
    const stepsContainer = document.getElementById('steps');
    if (!stepsContainer) return;

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
    const key = JSON.stringify([r.dose, r.temp, r.roast, r.dripper, r.method, r.steps, document.documentElement.lang]);
    if (key === lastChartKey) return;
    lastChartKey = key;

    // 計算階梯座標點 [(timeSec, cumWater)]
    const points = [[0, 0]];
    let t = 0;
    let w = 0;
    const stepMarkers = [];
    for (const s of r.steps) {
      const manual = typeof isPost === 'function' ? isPost(s) : ['後加水（bypass）', '後加冰塊'].includes(s.type);
      const isPourStep = typeof pour === 'function' ? pour(s) : ['悶蒸注水', '注水', '繞圈注水', '中心注水'].includes(s.type);
      if (manual) continue;
      const sec = Math.max(0, Number(s.sec) || 0);
      const addW = isPourStep ? Math.max(0, Number(s.water) || 0) : 0;
      t += sec;
      w += addW;
      points.push([t, w]);
      if (isPourStep) stepMarkers.push([t, w, addW, sec]);
    }

    const maxT = Math.max(t, 60);
    const maxW = Math.max(w, 100);
    const padL = 42, padR = 16, padT = 18, padB = 26;
    const W = 420, H = 155;
    const plotW = W - padL - padR;
    const plotH = H - padT - padB;

    const toX = sec => (padL + (sec / maxT) * plotW).toFixed(1);
    const toY = water => (padT + plotH - (water / maxW) * plotH).toFixed(1);

    const polyPoints = points.map(([px, py]) => `${toX(px)},${toY(py)}`).join(' ');
    const areaPoints = `${toX(0)},${toY(0)} ${polyPoints} ${toX(t)},${toY(0)}`;

    const dots = stepMarkers.map(([px, py, addW]) =>
      `<circle cx="${toX(px)}" cy="${toY(py)}" r="3.5" fill="#ffffff" /><text x="${toX(px)}" y="${Number(toY(py)) - 7}" fill="#d4d4d8" font-size="9.5" text-anchor="middle" font-family="monospace">${py}g</text>`
    ).join('');

    const roastCount = roastDotsCount(r.roast);
    let roastDotsHtml = '';
    if (roastCount > 0) {
      for (let i = 1; i <= 5; i++) {
        roastDotsHtml += `<span class="cv-roast-dot ${i <= roastCount ? 'filled' : ''}"></span>`;
      }
    }

    const ratioStr = r.dose > 0 ? `1:${(summary.water / r.dose).toFixed(1)}` : '—';

    chartContainer.innerHTML = `
      <div class="cv-chart-header">
        <div class="cv-chart-title">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
          <span>${L('分段注水階梯曲線圖', 'Pouring Staircase Curve')}</span>
        </div>
        <span class="cv-mono" style="font-size:12.5px;color:#a1a1aa">${summary.water}g / ${t}s · ${ratioStr}</span>
      </div>
      <svg viewBox="0 0 ${W} ${H}" style="width:100%;height:auto;display:block;background:#111;border-radius:12px;padding:4px">
        <line x1="${padL}" y1="${padT}" x2="${W - padR}" y2="${padT}" stroke="#27272a" stroke-dasharray="3 3"/>
        <line x1="${padL}" y1="${(padT + plotH / 2).toFixed(1)}" x2="${W - padR}" y2="${(padT + plotH / 2).toFixed(1)}" stroke="#27272a" stroke-dasharray="3 3"/>
        <line x1="${padL}" y1="${padT + plotH}" x2="${W - padR}" y2="${padT + plotH}" stroke="#52525b"/>
        <text x="${padL - 6}" y="${padT + 4}" fill="#888" font-size="9.5" text-anchor="end" font-family="monospace">${maxW}g</text>
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
          <span>${r.dripper || r.method || '—'}</span>
        </span>
        <span class="cv-chip cv-mono">${r.dose}g : ${summary.water}g (${ratioStr})</span>
        <span class="cv-chip cv-mono">${r.temp}°C</span>
        ${roastCount > 0 ? `<span class="cv-chip"><span class="cv-roast-dots">${roastDotsHtml}</span><span>${r.roast}</span></span>` : ''}
      </div>
    `;
  }
  // =========================================================================
  // 5. 引導沖煮：雙軌圓環儀表 (SVG Circular Brew Gauge) ＋ 分段比例條
  // =========================================================================
  let brewVisualBox = null;

  function renderActiveBrewGauge() {
    const focus = document.querySelector('#flowBrewing .flow-focus');
    if (!focus) return;

    if (!brewVisualBox) {
      brewVisualBox = document.createElement('div');
      brewVisualBox.id = 'cvBrewVisualBox';
      brewVisualBox.className = 'cv-brew-visual';
      brewVisualBox.setAttribute('data-coffee-user-text', 'true');
      const targetEl = document.getElementById('flowTarget');
      if (targetEl) targetEl.before(brewVisualBox);
      else focus.prepend(brewVisualBox);
    }

    const activeRecipe = (typeof run !== 'undefined' && run) ? run : (typeof read === 'function' ? read() : null);
    if (!activeRecipe || !Array.isArray(activeRecipe.steps)) return;

    const elapsedMs = (typeof running !== 'undefined' && running) ? Math.max(0, Date.now() - startAt) : (typeof ms !== 'undefined' ? ms : 0);
    const totalSec = Math.max(1, activeRecipe.steps.reduce((acc, s) => acc + (['後加水（bypass）', '後加冰塊'].includes(s.type) ? 0 : (Number(s.sec) || 0)), 0));
    const cursor = activeRecipe.guideCursor || { i: 0, start: 0 };
    const stepIdx = Math.min(activeRecipe.steps.length - 1, Math.max(0, cursor.i || 0));
    const curStep = activeRecipe.steps[stepIdx] || { type: '注水', sec: 20, water: 0 };
    const stepSec = Math.max(1, Number(curStep.sec) || 1);
    const stepElapsedSec = Math.max(0, (elapsedMs - (cursor.start || 0)) / 1000);
    const stepRatio = Math.min(1, stepElapsedSec / stepSec);
    const totalRatio = Math.min(1, (elapsedMs / 1000) / totalSec);

    // 計算累計目標水量與流速
    let cumWater = 0;
    for (let i = 0; i <= stepIdx; i++) {
      const st = activeRecipe.steps[i];
      if (st && ['悶蒸注水', '注水', '繞圈注水', '中心注水'].includes(st.type)) {
        cumWater += Number(st.water) || 0;
      }
    }
    const isPourStep = ['悶蒸注水', '注水', '繞圈注水', '中心注水'].includes(curStep.type);
    const flowRate = isPourStep && curStep.sec > 0 ? (curStep.water / curStep.sec).toFixed(1) : '0.0';

    // 比例進度條
    const segsHtml = activeRecipe.steps.map((s, idx) => {
      const wPct = Math.max(6, Math.round(((Number(s.sec) || 15) / totalSec) * 100));
      const cls = idx < stepIdx ? 'done' : idx === stepIdx ? 'active' : '';
      return `<div class="cv-prop-seg ${cls}" style="flex:${wPct}"></div>`;
    }).join('');

    const outerCirc = 339.29; // 2 * pi * 54
    const innerCirc = 276.46; // 2 * pi * 44
    const outerOffset = (outerCirc * (1 - totalRatio)).toFixed(1);
    const innerOffset = (innerCirc * (1 - stepRatio)).toFixed(1);
    const leftSec = Math.max(0, Math.ceil(stepSec - stepElapsedSec));

    brewVisualBox.innerHTML = `
      <div class="cv-prop-bar">${segsHtml}</div>
      <div class="cv-gauge-wrap">
        <svg class="cv-gauge-svg" viewBox="0 0 120 120">
          <circle cx="60" cy="60" r="54" fill="none" stroke="#262626" stroke-width="5"/>
          <circle cx="60" cy="60" r="54" fill="none" stroke="#ffffff" stroke-width="5" stroke-dasharray="${outerCirc}" stroke-dashoffset="${outerOffset}" stroke-linecap="round"/>
          <circle cx="60" cy="60" r="44" fill="none" stroke="#1f1f1f" stroke-width="3" stroke-dasharray="4 3"/>
          <circle cx="60" cy="60" r="44" fill="none" stroke="#a1a1aa" stroke-width="3" stroke-dasharray="${innerCirc}" stroke-dashoffset="${innerOffset}" stroke-linecap="round"/>
        </svg>
        <div class="cv-gauge-center">
          <div style="color:#d4d4d8;margin-bottom:2px">${getActionSvg(curStep.type)}</div>
          <div class="cv-mono" style="font-size:34px;font-weight:700;color:#fff;line-height:1.1">${fmt(elapsedMs)}</div>
          <div class="cv-mono" style="font-size:12px;color:#a1a1aa;margin-top:3px">${L('本段剩餘 ', 'Step left ')}${leftSec}s</div>
        </div>
      </div>
      <div class="cv-telemetry-grid">
        <div class="cv-telemetry-cell">
          <div class="cv-telemetry-label">${L('本段新增', 'Step Add')}</div>
          <div class="cv-telemetry-val">+${curStep.water || 0}<span style="font-size:12px;font-weight:400;color:#a1a1aa">g</span></div>
        </div>
        <div class="cv-telemetry-cell highlight">
          <div class="cv-telemetry-label">${L('目標累計水量', 'Target Total')}</div>
          <div class="cv-telemetry-val">${cumWater}<span style="font-size:12px;font-weight:400;color:#d4d4d8">g</span></div>
        </div>
        <div class="cv-telemetry-cell">
          <div class="cv-telemetry-label">${L('目標流速', 'Flow Rate')}</div>
          <div class="cv-telemetry-val">${flowRate}<span style="font-size:12px;font-weight:400;color:#a1a1aa">g/s</span></div>
        </div>
      </div>
    `;
  }
  // =========================================================================
  // 6. 五角風味雷達圖生成器 (SVG Pentagon Radar Chart) 與日記卡片注入
  // =========================================================================
  function buildRadarSvg(cupA, cupB = null, size = 146) {
    const cx = 75, cy = 78, maxR = 52;
    // 五個軸：酸感、甜感、苦感、厚實、喜好
    const axes = [
      { key: 'acidity', label: L('酸', 'Acid') },
      { key: 'sweetness', label: L('甜', 'Sweet') },
      { key: 'bitterness', label: L('苦', 'Bitter') },
      { key: 'body', label: L('醇', 'Body') },
      { key: 'rating', label: L('喜好', 'Like') }
    ];

    const getVal = (c, k) => {
      const v = Number(c && c[k]);
      return Number.isFinite(v) && v >= 1 && v <= 5 ? v : 3;
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
      const [px, py] = pt(i, getVal(cupA, a.key)).split(',');
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
    return `<div class="cv-bars-list">` + items.map(([label, val]) => {
      const num = Number.isFinite(Number(val)) && Number(val) > 0 ? Math.round(Number(val)) : 0;
      let segs = '';
      for (let i = 1; i <= 5; i++) {
        segs += `<span class="cv-bar-seg ${i <= num ? 'on' : ''}"></span>`;
      }
      return `<div class="cv-bar-row"><span>${label}</span><div class="cv-bar-segments" title="${num || '—'} / 5">${segs}</div></div>`;
    }).join('') + `</div>`;
  }

  function enhanceJournalEntries() {
    if (typeof db === 'undefined' || !Array.isArray(db.cups)) return;
    const entriesRoot = document.getElementById('entries');
    if (!entriesRoot) return;
    const searchInput = document.getElementById('search');
    const q = (searchInput ? searchInput.value : '').trim().toLowerCase();
    const list = db.cups.filter(c => JSON.stringify(c).toLowerCase().includes(q));

    Array.from(entriesRoot.children).forEach((card, idx) => {
      if (card.querySelector('.cv-radar-box')) return;
      const cup = list[idx];
      if (!cup) return;

      const radarBox = document.createElement('div');
      radarBox.className = 'cv-radar-box';
      radarBox.setAttribute('data-coffee-user-text', 'true');
      radarBox.innerHTML = buildRadarSvg(cup) + buildFlavorBarsHtml(cup);

      const detailsEl = card.querySelector('details');
      if (detailsEl) detailsEl.before(radarBox);
      else card.append(radarBox);
    });
  }

  // 雙杯比較疊圖雷達
  function enhanceComparisonRadar() {
    const comp = document.getElementById('comparison');
    if (!comp || !comp.querySelector('table') || comp.querySelector('.cv-compare-radar')) return;
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
      <div style="display:flex;justify-content:center;gap:18px;font-size:12.5px;color:#d4d4d8;margin-top:8px">
        <span>━━ ${L('第一杯：', 'Cup 1: ')}${cups[0].recipe.name}</span>
        <span>┅┅ ${L('第二杯：', 'Cup 2: ')}${cups[1].recipe.name}</span>
      </div>
    `;
    comp.prepend(wrap);
  }

  // =========================================================================
  // 7. 掛載與生命週期綁定
  // =========================================================================
  function initVisualUI() {
    setupHeader();
    updateSyncPill();
    renderRecipeWaterChart();
    renderActiveBrewGauge();
    enhanceJournalEntries();

    // 攔截 logs() 以自動加上五角風味雷達圖
    if (typeof window.logs === 'function' && !window.logs._cvWrapped) {
      const origLogs = window.logs;
      const wrappedLogs = function (...args) {
        const res = origLogs.apply(this, args);
        enhanceJournalEntries();
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

    // 定期同步圖表與雲端燈號
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
