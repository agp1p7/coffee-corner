// coffee-visual-ui.js
// 一隅・咖啡角｜雙主題器物手札系統：Sumi Dark (深夜吧台) × Washi Light (和紙手札)
// 非破壞式結構升級：對齊美術樣張排版骨架，100% 保留既有資料模型、雲端同步、測試與核心邏輯

(function () {
  'use strict';
  if (typeof document === 'undefined' || document.getElementById('coffeeVisualUILoaded')) return;

  const marker = document.createElement('meta');
  marker.id = 'coffeeVisualUILoaded';
  document.head.append(marker);

  const THEME_KEY = 'yiyu-coffee-theme';
  const isEn = () => document.documentElement.lang === 'en';
  const L = (zh, en) => (isEn() ? en : zh);
  const esc = s => String(s ?? '').replace(/[&<>"']/g, ch => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]
  ));

  function readSavedTheme() {
    try {
      const v = localStorage.getItem(THEME_KEY);
      return v === 'washi' || v === 'sumi' ? v : 'sumi';
    } catch (e) {
      return 'sumi';
    }
  }

  let currentTheme = readSavedTheme();

  function applyTheme(theme, persist = true) {
    currentTheme = theme === 'washi' ? 'washi' : 'sumi';
    const root = document.documentElement;
    root.dataset.theme = currentTheme;
    root.style.colorScheme = currentTheme === 'washi' ? 'light' : 'dark';

    const themeMeta = document.querySelector('meta[name="theme-color"]');
    if (themeMeta) {
      themeMeta.content = currentTheme === 'washi' ? '#F3EEE4' : '#11100F';
    }
    if (persist) {
      try { localStorage.setItem(THEME_KEY, currentTheme); } catch (e) {}
    }
    updateThemeButton();
  }

  // =========================================================================
  // 1. 字體與雙主題設計系統 CSS Tokens ＋ 樣張同款骨架排版
  // =========================================================================
  if (!document.querySelector('link[href*="Noto+Serif+TC"]')) {
    const fontLink = document.createElement('link');
    fontLink.rel = 'stylesheet';
    fontLink.href = 'https://fonts.googleapis.com/css2?family=Iansui&family=JetBrains+Mono:wght@400;500;600;700&family=Noto+Sans+TC:wght@400;500;600;700&family=Noto+Serif+TC:wght@500;600&display=swap';
    document.head.append(fontLink);
  }

  const style = document.createElement('style');
  style.id = 'coffeeSchemeCOledStyle';
  style.textContent = String.raw`
    :root,
    html[data-theme="sumi"] {
      color-scheme: dark;
      --font-brand: 'Iansui', '芫荽', serif;
      --font-serif: 'Noto Serif TC', 'Iansui', Georgia, serif;
      --font-ui: 'Noto Sans TC', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      --font-mono: 'JetBrains Mono', ui-monospace, 'SF Mono', Consolas, monospace;

      --bg: #11100F;
      --surface: #171513;
      --surface-2: #1F1C19;
      --input-bg: #141210;
      --ink: #EFEAE1;
      --ink-2: #A79E92;
      --ink-3: #756C61;
      --accent: #C88A4B;
      --accent-hover: #D69B5E;
      --accent-ink: #11100F;
      --accent-soft: rgba(200, 138, 75, 0.11);
      --accent-border: rgba(200, 138, 75, 0.42);
      --rule: rgba(239, 234, 225, 0.11);
      --rule-strong: rgba(239, 234, 225, 0.24);
      --danger: #D16B62;
      --danger-soft: rgba(209, 107, 98, 0.11);
      --danger-border: rgba(209, 107, 98, 0.42);
      --success: #67A87D;
      --cup-b: #6FA3BF;
      --backdrop: rgba(8, 7, 6, 0.80);
      --grain-op: 0.032;
    }

    html[data-theme="washi"] {
      color-scheme: light;
      --bg: #F3EEE4;
      --surface: #EBE4D6;
      --surface-2: #E2DAC9;
      --input-bg: #FAF7F1;
      --ink: #1D1A17;
      --ink-2: #5D554B;
      --ink-3: #877D70;
      --accent: #A6542B;
      --accent-hover: #8D431E;
      --accent-ink: #FAF6EE;
      --accent-soft: rgba(166, 84, 43, 0.09);
      --accent-border: rgba(166, 84, 43, 0.38);
      --rule: rgba(29, 26, 23, 0.13);
      --rule-strong: rgba(29, 26, 23, 0.26);
      --danger: #B0453E;
      --danger-soft: rgba(176, 69, 62, 0.09);
      --danger-border: rgba(176, 69, 62, 0.36);
      --success: #3E7B54;
      --cup-b: #3F6F8A;
      --backdrop: rgba(29, 26, 23, 0.56);
      --grain-op: 0.038;
    }

    html {
      background-color: var(--bg);
      overflow-x: clip;
    }

    body {
      position: relative;
      background-color: var(--bg) !important;
      background-image: none !important;
      color: var(--ink) !important;
      font-family: var(--font-ui) !important;
      font-size: 15.5px !important;
      line-height: 1.55;
      max-width: 1360px !important;
      padding: 16px 24px 56px !important;
      -webkit-font-smoothing: antialiased;
      overflow-x: clip;
      transition: background-color 0.2s ease, color 0.2s ease;
    }

    body::before {
      content: "";
      position: fixed;
      inset: 0;
      pointer-events: none;
      z-index: 0;
      opacity: var(--grain-op);
      background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.82' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
    }
    body > * {
      position: relative;
      z-index: 1;
    }

    main, section, .grid, .fields, .card, .box {
      min-width: 0;
    }

    h1, .font-brand {
      font-family: var(--font-brand) !important;
      letter-spacing: 0.03em;
    }
    h2, h3, summary, .flow-prepare-summary h4, #entries .box h3,
    #flowPrepare h3:nth-of-type(2), #coffeeGuideRecipe, #taste, #notes,
    .cv-serif {
      font-family: var(--font-serif) !important;
      letter-spacing: 0.02em;
    }
    h2 {
      color: var(--ink) !important;
      font-weight: 600 !important;
      font-size: 1.25rem !important;
      margin: 4px 0 12px !important;
    }
    h3 {
      color: var(--ink) !important;
      font-weight: 600 !important;
    }

    #timer, #flowTarget, #flowRemaining, #stats, #ey, #count, #actual,
    input[type="number"], .cv-mono {
      font-family: var(--font-mono), var(--font-ui) !important;
      font-variant-numeric: tabular-nums !important;
    }

    input[type="checkbox"] {
      width: 20px !important;
      height: 20px !important;
      min-height: 20px !important;
      padding: 0 !important;
      border-radius: 4px !important;
      accent-color: var(--accent);
      cursor: pointer;
      flex-shrink: 0;
      vertical-align: middle;
    }

    .cv-kicker {
      font-size: 10px;
      letter-spacing: 0.10em;
      text-transform: uppercase;
      color: var(--ink-3);
      font-family: var(--font-mono);
    }

    /* ================= 頂部品牌列 ================= */
    .cv-header-bar {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: space-between;
      gap: 10px 16px;
      padding-bottom: 12px;
      margin-bottom: 4px;
      border-bottom: 1px solid var(--rule);
    }
    .cv-brand-group {
      display: flex;
      align-items: center;
      gap: 10px;
      min-width: 0;
    }
    .cv-brand-logo {
      width: 34px;
      height: 34px;
      border-radius: 4px;
      background: var(--surface);
      border: 1px solid var(--rule-strong);
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
    .cv-brand-logo svg {
      width: 22px;
      height: 22px;
      display: block;
    }
    .cv-brand-title h1 {
      margin: 0 !important;
      font-size: clamp(1.28rem, 3.2vw, 1.7rem) !important;
      line-height: 1.2;
      color: var(--ink) !important;
    }
    .cv-brand-meta,
    body > small,
    #coffeeLayoutStatus {
      display: none !important;
    }
    .cv-header-actions {
      display: flex;
      align-items: center;
      gap: 8px;
      flex-wrap: wrap;
      margin-left: auto;
    }

    html body button.cv-sync-pill,
    html body button.cv-theme-toggle {
      display: inline-flex !important;
      align-items: center;
      justify-content: center;
      gap: 6px;
      padding: 5px 10px !important;
      border-radius: 4px !important;
      background: transparent !important;
      border: 1px solid var(--rule-strong) !important;
      font-size: 12px !important;
      color: var(--ink-2) !important;
      cursor: pointer;
      min-height: 34px !important;
      margin: 0 !important;
      white-space: nowrap;
      box-shadow: none !important;
    }
    html body button.cv-sync-pill:hover,
    html body button.cv-theme-toggle:hover {
      border-color: var(--accent) !important;
      color: var(--ink) !important;
      background: var(--surface) !important;
    }
    .cv-sync-dot {
      width: 7px;
      height: 7px;
      border-radius: 50%;
      background: var(--ink-3);
      flex-shrink: 0;
    }
    .cv-sync-dot.online { background: var(--success); }
    .cv-sync-dot.warn { background: var(--accent); }

    html #coffeeAppHeader #coffeeLanguageSwitch button::before,
    #coffeeLanguageSwitch button::before {
      content: none !important;
      display: none !important;
    }
    html body #coffeeLanguageSwitch {
      display: inline-flex !important;
      align-items: center;
      gap: 0 !important;
      padding: 0 !important;
      border-radius: 4px !important;
      background: transparent !important;
      border: 1px solid var(--rule-strong) !important;
      overflow: hidden;
      margin: 0 !important;
    }
    html body #coffeeLanguageSwitch button {
      min-height: 32px !important;
      height: auto !important;
      min-width: 0 !important;
      padding: 4px 10px !important;
      font-size: 12px !important;
      border-radius: 0 !important;
      border: 0 !important;
      border-right: 1px solid var(--rule) !important;
      background: transparent !important;
      color: var(--ink-2) !important;
      margin: 0 !important;
      white-space: nowrap;
      box-shadow: none !important;
    }
    html body #coffeeLanguageSwitch button:last-child { border-right: 0 !important; }
    html body #coffeeLanguageSwitch button[aria-pressed="true"] {
      background: var(--ink) !important;
      color: var(--bg) !important;
      font-weight: 600 !important;
    }

    /* ================= 髮線主導覽列 ================= */
    nav {
      display: flex !important;
      flex-wrap: nowrap;
      align-items: stretch;
      gap: 4px !important;
      background: transparent !important;
      backdrop-filter: none !important;
      -webkit-backdrop-filter: none !important;
      border: 0 !important;
      border-bottom: 1px solid var(--rule) !important;
      border-radius: 0 !important;
      padding: 0 !important;
      margin: 0 0 18px !important;
      box-shadow: none !important;
    }
    html body nav button {
      flex: 1 1 0;
      display: inline-flex !important;
      align-items: center;
      justify-content: center;
      gap: 7px;
      border: 0 !important;
      border-bottom: 2px solid transparent !important;
      background: transparent !important;
      color: var(--ink-3) !important;
      border-radius: 0 !important;
      font-weight: 500 !important;
      font-size: 14px !important;
      padding: 11px 10px !important;
      min-height: 44px !important;
      margin: 0 0 -1px !important;
      box-shadow: none !important;
    }
    html body nav button:hover:not(.coffee-current-tab):not([aria-current="page"]) {
      color: var(--ink) !important;
      background: var(--surface) !important;
      border-bottom-color: var(--rule-strong) !important;
    }
    html body nav button.coffee-current-tab,
    html body nav button.coffee-current-tab:hover,
    html body nav button[aria-current="page"],
    html body nav button[aria-current="page"]:hover {
      background: transparent !important;
      color: var(--ink) !important;
      border-bottom: 2px solid var(--accent) !important;
      font-weight: 700 !important;
      box-shadow: none !important;
    }
    html body nav button.coffee-current-tab::before,
    html body nav button[aria-current="page"]::before {
      color: var(--accent);
    }
    nav button::before {
      content: "";
      display: inline-block;
      width: 15px;
      height: 15px;
      margin-right: 0;
      flex-shrink: 0;
      background-color: currentColor;
      -webkit-mask-size: contain;
      mask-size: contain;
      -webkit-mask-repeat: no-repeat;
      mask-repeat: no-repeat;
      -webkit-mask-position: center;
      mask-position: center;
    }
    nav button[data-tab="history"]::before {
      -webkit-mask-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='black' stroke-width='1.8' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M17 8h1a4 4 0 1 1 0 8h-1'/%3E%3Cpath d='M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4Z'/%3E%3Cline x1='6' y1='2' x2='6' y2='4'/%3E%3Cline x1='10' y1='2' x2='10' y2='4'/%3E%3Cline x1='14' y1='2' x2='14' y2='4'/%3E%3C/svg%3E");
      mask-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='black' stroke-width='1.8' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M17 8h1a4 4 0 1 1 0 8h-1'/%3E%3Cpath d='M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4Z'/%3E%3Cline x1='6' y1='2' x2='6' y2='4'/%3E%3Cline x1='10' y1='2' x2='10' y2='4'/%3E%3Cline x1='14' y1='2' x2='14' y2='4'/%3E%3C/svg%3E");
    }
    nav button[data-tab="brew"]::before {
      -webkit-mask-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='black' stroke-width='1.8' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M5 4h14l-4.5 9h-5L5 4z'/%3E%3Cpath d='M8 17h8'/%3E%3Cpath d='M12 13v7'/%3E%3C/svg%3E");
      mask-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='black' stroke-width='1.8' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M5 4h14l-4.5 9h-5L5 4z'/%3E%3Cpath d='M8 17h8'/%3E%3Cpath d='M12 13v7'/%3E%3C/svg%3E");
    }
    nav button[data-tab="guide"]::before {
      -webkit-mask-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='black' stroke-width='1.8' stroke-linecap='round' stroke-linejoin='round'%3E%3Ccircle cx='12' cy='13' r='8'/%3E%3Cpath d='M12 9v4l2.5 2.5'/%3E%3Cpath d='M9 2h6'/%3E%3C/svg%3E");
      mask-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='black' stroke-width='1.8' stroke-linecap='round' stroke-linejoin='round'%3E%3Ccircle cx='12' cy='13' r='8'/%3E%3Cpath d='M12 9v4l2.5 2.5'/%3E%3Cpath d='M9 2h6'/%3E%3C/svg%3E");
    }
    nav button[data-tab="settings"]::before {
      -webkit-mask-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='black' stroke-width='1.8' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z'/%3E%3C/svg%3E");
      mask-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='black' stroke-width='1.8' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z'/%3E%3C/svg%3E");
    }

    /* ================= 樣張同款首頁：雙欄沖煮工作室 (#cvStudioView) ================= */
    #brew.cv-editor-collapsed > .grid {
      display: none !important;
    }
    #brew:not(.cv-editor-collapsed) > #cvStudioView {
      display: none !important;
    }

    .cv-studio-grid {
      display: grid;
      grid-template-columns: minmax(0, 1.38fr) minmax(290px, 0.85fr);
      border: 1px solid var(--rule);
      border-radius: 4px;
      overflow: hidden;
      background: var(--bg);
    }
    .cv-studio-left {
      padding: 22px 26px;
      display: flex;
      flex-direction: column;
      gap: 18px;
      min-width: 0;
    }
    .cv-studio-right {
      padding: 22px 24px;
      border-left: 1px solid var(--rule);
      background: var(--surface);
      display: flex;
      flex-direction: column;
      gap: 16px;
      min-width: 0;
    }

    @media (max-width: 899px) {
      .cv-studio-grid {
        grid-template-columns: 1fr;
      }
      .cv-studio-right {
        border-left: 0;
        border-top: 1px solid var(--rule);
      }
    }

    .cv-studio-head {
      display: flex;
      flex-wrap: wrap;
      justify-content: space-between;
      align-items: flex-start;
      gap: 12px;
      padding-bottom: 14px;
      border-bottom: 1px solid var(--rule);
    }
    .cv-studio-title {
      font-size: clamp(1.25rem, 2.4vw, 1.5rem);
      font-weight: 600;
      line-height: 1.3;
      color: var(--ink);
      margin-top: 3px;
    }
    .cv-studio-tools {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 6px;
    }
    html body #cvStudioRecipeSelect {
      width: auto !important;
      max-width: 190px;
      min-height: 34px !important;
      padding: 4px 10px !important;
      font-size: 12px !important;
      background: transparent !important;
      border: 1px solid var(--rule-strong) !important;
      border-radius: 4px !important;
      color: var(--ink) !important;
    }
    html body button.cv-hair-btn {
      display: inline-flex !important;
      align-items: center;
      justify-content: center;
      gap: 5px;
      min-height: 34px !important;
      padding: 5px 10px !important;
      margin: 0 !important;
      font-size: 12px !important;
      border-radius: 4px !important;
      background: transparent !important;
      border: 1px solid var(--rule-strong) !important;
      color: var(--ink) !important;
      white-space: nowrap;
    }
    html body button.cv-hair-btn:hover {
      border-color: var(--accent) !important;
      background: var(--surface) !important;
    }
    html body button.cv-hair-btn.accent {
      border-color: var(--accent) !important;
      color: var(--accent) !important;
      background: var(--accent-soft) !important;
    }

    /* Acaia 電子秤風格數據條 */
    .cv-acaia-strip {
      display: grid;
      grid-template-columns: repeat(4, minmax(0, 1fr));
      border-top: 1px solid var(--rule);
      border-bottom: 1px solid var(--rule);
    }
    .cv-acaia-cell {
      padding: 12px 12px;
      border-right: 1px solid var(--rule);
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .cv-acaia-cell:last-child { border-right: 0; }
    .cv-acaia-val {
      font-size: clamp(1.45rem, 2.8vw, 1.9rem);
      font-weight: 600;
      line-height: 1.05;
      color: var(--ink);
      letter-spacing: -0.02em;
    }
    .cv-acaia-unit {
      font-size: 13px;
      font-weight: 400;
      color: var(--ink-2);
      margin-left: 2px;
    }
    @media (max-width: 560px) {
      .cv-acaia-strip { grid-template-columns: repeat(2, minmax(0, 1fr)); }
      .cv-acaia-cell:nth-child(2) { border-right: 0; }
      .cv-acaia-cell:nth-child(1),
      .cv-acaia-cell:nth-child(2) { border-bottom: 1px solid var(--rule); }
    }

    /* 豆單與粉量快選橫條 */
    .cv-bean-strip {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: space-between;
      gap: 10px 14px;
      padding: 12px 14px;
      background: var(--surface);
      border: 1px solid var(--rule);
      border-radius: 4px;
    }
    .cv-dose-group {
      display: inline-flex;
      border: 1px solid var(--rule-strong);
      border-radius: 4px;
      overflow: hidden;
    }
    html body button.cv-dose-tab {
      min-height: 32px !important;
      padding: 4px 10px !important;
      margin: 0 !important;
      border: 0 !important;
      border-right: 1px solid var(--rule) !important;
      border-radius: 0 !important;
      background: transparent !important;
      color: var(--ink-2) !important;
      font-size: 12px !important;
      font-family: var(--font-mono) !important;
    }
    html body button.cv-dose-tab:last-child { border-right: 0 !important; }
    html body button.cv-dose-tab.active {
      background: var(--ink) !important;
      color: var(--bg) !important;
      font-weight: 600 !important;
    }

    /* 2x2 髮線步驟摘要格 */
    .cv-steps-grid {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 1px;
      background: var(--rule);
      border: 1px solid var(--rule);
      border-radius: 4px;
      overflow: hidden;
    }
    .cv-step-cell {
      background: var(--bg);
      padding: 12px 14px;
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .cv-step-cell.active {
      background: var(--accent-soft);
      box-shadow: inset 3px 0 0 var(--accent);
    }
    @media (max-width: 620px) {
      .cv-steps-grid { grid-template-columns: 1fr; }
    }

    .cv-grind-note {
      padding: 11px 13px;
      border: 1px solid var(--rule);
      border-radius: 4px;
      background: var(--bg);
      display: flex;
      flex-direction: column;
      gap: 3px;
    }

    html body button.cv-primary-cta {
      width: 100% !important;
      min-height: 48px !important;
      padding: 12px 16px !important;
      margin: 0 !important;
      background: var(--accent) !important;
      border: 1px solid var(--accent) !important;
      border-radius: 4px !important;
      color: var(--accent-ink) !important;
      font-size: 14.5px !important;
      font-weight: 700 !important;
      display: inline-flex !important;
      align-items: center;
      justify-content: center;
      gap: 8px;
      letter-spacing: 0.03em;
    }
    html body button.cv-primary-cta:hover {
      background: var(--accent-hover) !important;
      border-color: var(--accent-hover) !important;
    }

    .cv-editor-top-bar {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: space-between;
      gap: 10px;
      padding: 10px 14px;
      margin-bottom: 14px;
      background: var(--surface);
      border: 1px solid var(--rule);
      border-radius: 4px;
    }

    /* ================= 引導沖煮去重：計時中隱藏重複的舊版大字文字 ================= */
    #flowBrewing .flow-focus:has(#cvBrewVisualBox) #flowTarget,
    #flowBrewing .flow-focus:has(#cvBrewVisualBox) #flowRemaining {
      position: absolute !important;
      width: 1px !important;
      height: 1px !important;
      padding: 0 !important;
      margin: -1px !important;
      overflow: hidden !important;
      clip-path: inset(50%) !important;
      white-space: nowrap !important;
      border: 0 !important;
    }
    #flowBrewing .flow-focus > h3 {
      font-size: 1.35rem !important;
      margin: 4px 0 8px !important;
    }

    /* ================= 我的咖啡：印刷規格列 ＋ 雙欄手札 ================= */
    .cv-journal-header {
      display: flex;
      flex-direction: column;
      gap: 14px;
      margin-bottom: 18px;
    }
    .cv-spec-bar {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: space-between;
      gap: 8px 16px;
      padding: 10px 0;
      border-top: 1px solid var(--rule-strong);
      border-bottom: 1px solid var(--rule-strong);
      font-size: 11.5px;
      color: var(--ink-2);
    }
    .cv-spec-stat {
      display: inline-flex;
      flex-wrap: wrap;
      align-items: baseline;
      gap: 2px 5px;
      min-width: 0;
    }
    .cv-spec-stat strong {
      color: var(--ink);
      font-size: 15px;
      font-weight: 600;
      overflow-wrap: anywhere;
    }
    .cv-spec-sep {
      color: var(--ink-3);
    }
    @media (max-width: 640px) {
      .cv-spec-sep { display: none; }
      .cv-spec-bar {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 8px 12px;
      }
      .cv-spec-stat {
        flex-direction: column;
        align-items: flex-start;
        gap: 1px;
      }
    }

    /* 隱藏被 #cvJournalHeader 接管的重複標題 */
    #history.cv-journal-enhanced #coffeeWorkspace > h2:first-child,
    #history.cv-journal-enhanced > div:last-child > h2:first-child {
      display: none !important;
    }

    /* 總覽雙欄模式 (桌機 & 小米 Pad 橫向 >= 960px) */
    @media (min-width: 960px) {
      #history.cv-overview-active {
        display: grid;
        grid-template-columns: minmax(280px, 0.85fr) minmax(0, 1.35fr);
        gap: 14px 24px;
        align-items: start;
      }
      #history.cv-overview-active > #cvJournalHeader {
        grid-column: 1 / -1;
        margin-bottom: 4px;
      }
      #history.cv-overview-active > #coffeeWorkspace {
        display: contents;
      }
      #history.cv-overview-active #coffeeWorkspace > .workspace-tabs {
        grid-column: 1 / -1;
        margin: 0 0 4px !important;
      }
      #history.cv-overview-active #coffeeWorkspace > div:nth-of-type(2) {
        display: flex !important;
        flex-direction: column;
        gap: 10px;
        grid-column: 1;
      }
      #history.cv-overview-active > div:last-child {
        display: block !important;
        grid-column: 2;
      }
      #history.cv-overview-active #coffeeWorkspace > div:nth-of-type(3) {
        display: none !important;
      }
    }

    /* 豆庫上方動作按鈕精簡成單列小按鈕（取代滿版巨無霸長條） */
    #coffeeWorkspace > div:nth-of-type(2) > button {
      width: auto !important;
      display: inline-flex !important;
      margin: 0 8px 8px 0 !important;
      min-height: 36px !important;
      padding: 6px 12px !important;
      font-size: 12.5px !important;
    }
    @media (min-width: 720px) {
      #history:not(.cv-overview-active) #coffeeWorkspace > div:nth-of-type(2) {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 12px;
        align-items: start;
      }
      #history:not(.cv-overview-active) #coffeeWorkspace > div:nth-of-type(2) > .cv-bean-actions-wrap,
      #history:not(.cv-overview-active) #coffeeWorkspace > div:nth-of-type(2) > p {
        grid-column: 1 / -1;
      }
      #history:not(.cv-overview-active) #coffeeWorkspace > div:nth-of-type(2) > article.box {
        margin: 0 !important;
      }
    }

    @media (min-width: 900px) {
      #brew > .grid {
        grid-template-columns: minmax(0, 1.04fr) minmax(0, 0.96fr) !important;
        gap: 20px !important;
        align-items: start;
      }
      #coffeeBrewFlow .flow-brewing {
        grid-template-columns: minmax(0, 1.06fr) minmax(0, 0.94fr) !important;
        gap: 20px !important;
        align-items: start;
      }
      #coffeeBrewFlow .flow-timeline > h3,
      #coffeeBrewFlow .flow-timeline > p,
      #coffeeBrewFlow .flow-timeline > [role="list"] {
        display: block !important;
      }
      #coffeeBrewFlow .flow-timeline-toggle {
        display: none !important;
      }
      #history:not(.cv-overview-active) #entries {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 16px;
        align-items: start;
      }
      #history.cv-overview-active #entries {
        display: flex;
        flex-direction: column;
        gap: 12px;
      }
      #entries > .box {
        margin: 0 !important;
      }
    }

    @media (max-width: 899px) {
      body { padding: 14px 16px 52px !important; }
      #brew > .grid { grid-template-columns: 1fr !important; }
    }

    /* ================= 手機版面 (<= 599px) ================= */
    @media (max-width: 599px) {
      body { padding: 10px 12px 48px !important; }
      .cv-header-bar {
        padding-bottom: 10px;
        margin-bottom: 4px;
        gap: 8px 10px;
      }
      .cv-brand-logo { width: 32px; height: 32px; }
      .cv-header-actions {
        width: 100%;
        justify-content: space-between;
        gap: 6px;
      }
      html body button.cv-sync-pill,
      html body button.cv-theme-toggle {
        padding: 4px 8px !important;
        font-size: 11.5px !important;
        min-height: 32px !important;
      }
      nav,
      html:not(.coffee-installed) nav,
      html.coffee-installed nav {
        display: grid !important;
        grid-template-columns: repeat(4, minmax(0, 1fr)) !important;
        gap: 2px !important;
        margin: 0 0 14px !important;
      }
      html body nav button,
      html body nav .workspace-settings,
      html.coffee-installed nav .workspace-settings {
        grid-column: auto !important;
        flex-direction: column !important;
        width: 100% !important;
        font-size: 11.5px !important;
        padding: 8px 4px !important;
        min-height: 50px !important;
        gap: 4px !important;
        line-height: 1.2 !important;
      }
      html.coffee-installed nav .workspace-settings::after {
        content: none !important;
      }
      .cv-studio-left, .cv-studio-right {
        padding: 16px 14px;
      }
      .card, .flow-timeline {
        padding: 14px !important;
        border-radius: 6px !important;
      }
      dialog {
        padding: 16px !important;
        border-radius: 6px !important;
      }
      details {
        padding: 4px 12px !important;
        border-radius: 4px !important;
        margin: 10px 0 !important;
      }
      details[open] { padding-bottom: 12px !important; }
      .box, .flow-step, .cv-chart-card {
        padding: 12px !important;
        border-radius: 4px !important;
      }
      #coffeeRecipeSharing {
        display: grid !important;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 8px !important;
        margin: 10px 0 !important;
      }
      #coffeeRecipeSharing button { width: 100%; margin: 0 !important; }
      #coffeeRecipePanel > #add,
      #coffeeRecipePanel > #aero,
      #coffeeRecipePanel > #copy,
      #coffeeRecipePanel > #fav {
        width: calc(50% - 4px);
        margin: 4px 0 !important;
      }
      #coffeeRecipePanel > #add,
      #coffeeRecipePanel > #copy { margin-right: 8px !important; }
      #coffeeRecipePanel > #openChampionLibraryStudio {
        display: flex;
        width: 100%;
        margin: 8px 0 4px !important;
      }
      #steps > .box .fields {
        grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
        gap: 8px !important;
      }
      #steps > .box .fields > label:first-child,
      #steps > .box .fields > label:last-child {
        grid-column: 1 / -1;
      }
    }

    /* ================= 器物卡片、髮線框體與統一主題覆蓋 ================= */
    .card, .flow-timeline, dialog {
      background: var(--surface) !important;
      border: 1px solid var(--rule) !important;
      border-radius: 6px !important;
      padding: 20px !important;
      color: var(--ink) !important;
      box-shadow: none !important;
    }
    dialog {
      box-shadow: 0 24px 60px rgba(0, 0, 0, 0.45) !important;
    }
    dialog::backdrop {
      background: var(--backdrop) !important;
      backdrop-filter: blur(6px);
      -webkit-backdrop-filter: blur(6px);
    }
    .box, .flow-step {
      background: var(--bg) !important;
      border: 1px solid var(--rule) !important;
      border-radius: 4px !important;
      padding: 14px 16px !important;
      color: var(--ink) !important;
    }
    .flow-step {
      grid-template-columns: 24px minmax(0, 1fr) auto !important;
      align-items: center;
    }
    .flow-step.current, .live {
      background: var(--accent-soft) !important;
      border: 1px solid var(--accent-border) !important;
      box-shadow: inset 3px 0 0 var(--accent) !important;
    }

    article.box.cv-roaster-card {
      position: relative;
      padding-left: 17px !important;
      border-left: 3px solid var(--roast-stripe, var(--rule-strong)) !important;
      background: var(--surface) !important;
    }

    /* 準備沖煮區 4 格數據條 */
    .flow-metrics {
      display: grid !important;
      grid-template-columns: repeat(4, minmax(0, 1fr)) !important;
      gap: 0 !important;
      margin: 12px 0 !important;
      border-top: 1px solid var(--rule);
      border-bottom: 1px solid var(--rule);
      background: transparent !important;
    }
    .flow-metric {
      background: transparent !important;
      border: 0 !important;
      border-right: 1px solid var(--rule) !important;
      border-radius: 0 !important;
      padding: 12px 10px !important;
      text-align: left !important;
    }
    .flow-metric:last-child { border-right: 0 !important; }
    @media (max-width: 520px) {
      .flow-metrics { grid-template-columns: repeat(2, minmax(0, 1fr)) !important; }
      .flow-metric:nth-child(2) { border-right: 0 !important; }
      .flow-metric:nth-child(1),
      .flow-metric:nth-child(2) { border-bottom: 1px solid var(--rule) !important; }
    }
    .flow-metric span {
      display: flex !important;
      font-size: 11px !important;
      letter-spacing: 0.05em;
      color: var(--ink-3) !important;
    }
    .flow-metric strong {
      display: block !important;
      margin-top: 4px !important;
      font-size: clamp(1.3rem, 2.5vw, 1.7rem) !important;
      font-weight: 600 !important;
      line-height: 1.1;
      font-family: var(--font-mono) !important;
      color: var(--ink) !important;
    }
    .cv-step-badge {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 26px;
      height: 26px;
      border-radius: 4px;
      background: transparent;
      border: 1px solid var(--rule-strong);
      color: var(--accent);
      flex-shrink: 0;
    }

    input:not([type="checkbox"]), select, textarea {
      background: var(--input-bg) !important;
      border: 1px solid var(--rule-strong) !important;
      border-radius: 4px !important;
      padding: 9px 12px !important;
      color: var(--ink) !important;
    }
    input:not([type="checkbox"]):focus, select:focus, textarea:focus {
      border-color: var(--accent) !important;
      box-shadow: 0 0 0 2px var(--accent-soft) !important;
      outline: none !important;
    }
    label {
      color: var(--ink-2) !important;
      font-size: 13.5px !important;
      font-weight: 500;
    }
    .hint, small, #stats, #ey, #count, .flow-prepare-gear {
      color: var(--ink-2) !important;
    }

    button {
      background: var(--surface-2) !important;
      border: 1px solid var(--rule-strong) !important;
      border-radius: 4px !important;
      color: var(--ink) !important;
      font-weight: 500;
      box-shadow: none !important;
      transition: background 0.15s ease, border-color 0.15s ease, color 0.15s ease;
    }
    button:hover:not(:disabled) {
      background: var(--surface) !important;
      border-color: var(--ink-2) !important;
    }
    button:focus-visible, input:focus-visible, select:focus-visible, textarea:focus-visible {
      outline: 2px solid var(--accent) !important;
      outline-offset: 2px;
    }

    html body #addCupEntry,
    html body .bean-scan-btn,
    html body .ws-scale-prep-btn,
    html body .champ-trigger-btn {
      background: var(--accent-soft) !important;
      border-color: var(--accent-border) !important;
      color: var(--accent) !important;
      font-weight: 600 !important;
      border-radius: 4px !important;
    }
    html body #addCupEntry:hover:not(:disabled),
    html body .bean-scan-btn:hover:not(:disabled),
    html body .ws-scale-prep-btn:hover:not(:disabled),
    html body .champ-trigger-btn:hover:not(:disabled) {
      background: var(--accent) !important;
      color: var(--accent-ink) !important;
      border-color: var(--accent) !important;
    }

    html body #deleteRecipe {
      background: var(--danger-soft) !important;
      border-color: var(--danger-border) !important;
      color: var(--danger) !important;
    }
    html body #deleteRecipe:hover:not(:disabled) {
      background: var(--danger) !important;
      color: var(--accent-ink) !important;
      border-color: var(--danger) !important;
    }

    html body #coffeeEnterGuide,
    html body #flowBegin,
    html body .flow-primary,
    html body #saveRecipe,
    html body #saveCup,
    html body #btnGoogleLogin,
    html body .champ-btn-primary,
    html body .recipe-share-actions .recipe-share-primary {
      background: var(--accent) !important;
      color: var(--accent-ink) !important;
      border-color: var(--accent) !important;
      font-weight: 700 !important;
      border-radius: 4px !important;
      box-shadow: none !important;
    }
    html body #coffeeEnterGuide:hover:not(:disabled),
    html body #flowBegin:hover:not(:disabled),
    html body .flow-primary:hover:not(:disabled),
    html body #saveRecipe:hover:not(:disabled),
    html body #saveCup:hover:not(:disabled),
    html body #btnGoogleLogin:hover:not(:disabled),
    html body .champ-btn-primary:hover:not(:disabled),
    html body .recipe-share-actions .recipe-share-primary:hover:not(:disabled) {
      background: var(--accent-hover) !important;
      border-color: var(--accent-hover) !important;
      color: var(--accent-ink) !important;
    }

    html body .workspace-tabs {
      background: var(--bg) !important;
      border: 1px solid var(--rule-strong) !important;
      border-radius: 4px !important;
      padding: 2px !important;
      gap: 2px !important;
    }
    html body .workspace-tabs button {
      border: 0 !important;
      border-radius: 3px !important;
      background: transparent !important;
      color: var(--ink-2) !important;
      min-height: 38px !important;
    }
    html body .workspace-tabs button[aria-pressed="true"] {
      background: var(--ink) !important;
      color: var(--bg) !important;
      font-weight: 700 !important;
    }

    html body .flow-progress span {
      border-color: var(--rule) !important;
      border-radius: 4px !important;
      color: var(--ink-3) !important;
      background: transparent !important;
    }
    html body .flow-progress .active {
      background: var(--ink) !important;
      color: var(--bg) !important;
      border-color: var(--ink) !important;
      font-weight: 700;
    }
    html body .flow-prepare-summary h4,
    html body #entries .box h3,
    html body .prep-countdown-step,
    html body #flowPhase {
      color: var(--ink) !important;
    }
    html body #entries .box small { color: var(--ink-3) !important; }
    html body .prep-countdown-num {
      color: var(--accent) !important;
      text-shadow: none !important;
    }
    html body .bean-scan-box {
      border: 1px dashed var(--accent-border) !important;
      border-radius: 4px !important;
      background: var(--accent-soft) !important;
    }
    html body .bean-scan-status.is-ok { color: var(--success) !important; }
    html body .bean-scan-status.is-error { color: var(--danger) !important; }
    html body .equipment-confirm {
      border-color: var(--accent-border) !important;
      background: var(--accent-soft) !important;
      border-radius: 4px !important;
    }
    html body #coffeeChampionDialog {
      background: var(--bg) !important;
      color: var(--ink) !important;
      border-color: var(--rule-strong) !important;
      border-radius: 6px !important;
    }
    html body .champ-head,
    html body .champ-detail-nav {
      border-bottom-color: var(--rule) !important;
    }
    html body .champ-head h2,
    html body .champ-title,
    html body .champ-detail-step-head {
      color: var(--ink) !important;
    }
    html body .champ-barista,
    html body .champ-desc,
    html body .champ-46-label,
    html body .champ-detail-step-note,
    html body .champ-step-list,
    html body .champ-metric span {
      color: var(--ink-2) !important;
    }
    html body .champ-pill {
      border-radius: 4px !important;
      background: var(--surface) !important;
      border-color: var(--rule-strong) !important;
      color: var(--ink-2) !important;
    }
    html body .champ-pill[aria-pressed="true"] {
      background: var(--ink) !important;
      color: var(--bg) !important;
      border-color: var(--ink) !important;
      box-shadow: none !important;
    }
    html body .champ-dose-wrap,
    html body .champ-card,
    html body .champ-46-box,
    html body .champ-steps-details,
    html body .champ-detail-box,
    html body .champ-detail-step,
    html body .champ-metric {
      background: var(--surface) !important;
      border-color: var(--rule) !important;
      border-radius: 4px !important;
    }
    html body .champ-dose-wrap > span { color: var(--ink) !important; }
    html body .champ-card-clickable:hover,
    html body .champ-card-clickable:focus-visible {
      border-color: var(--accent) !important;
      background: var(--surface-2) !important;
    }
    html body .champ-badge {
      background: var(--accent) !important;
      color: var(--accent-ink) !important;
      border-radius: 3px !important;
    }
    html body .champ-chip {
      border-radius: 3px !important;
      background: var(--bg) !important;
      border-color: var(--rule) !important;
      color: var(--ink) !important;
    }
    html body .champ-chip.scaled {
      background: var(--accent-soft) !important;
      border-color: var(--accent-border) !important;
      color: var(--accent) !important;
    }
    html body .champ-card-cue,
    html body .champ-detail-box h4,
    html body .champ-detail-step-time,
    html body .champ-metric strong {
      color: var(--accent) !important;
    }
    html body .champ-search-input,
    html body .champ-grinder-select {
      background: var(--surface) !important;
      border: 1px solid var(--rule-strong) !important;
      color: var(--ink) !important;
      border-radius: 4px !important;
    }
    html body .champ-count-note,
    html body .champ-empty {
      color: var(--ink-2) !important;
      border-color: var(--rule-strong) !important;
    }
    html body .cv-grinder-select {
      font-family: 'JetBrains Mono', 'Noto Sans TC', monospace !important;
      font-size: 11px !important;
      min-height: 28px !important;
      padding: 2px 8px !important;
      border-radius: 3px !important;
      background: var(--surface) !important;
      border: 1px solid var(--rule-strong) !important;
      color: var(--ink) !important;
      width: auto !important;
      max-width: 195px;
    }

    td, th {
      border-bottom-color: var(--rule) !important;
      color: var(--ink);
    }

    #toast {
      z-index: 50 !important;
      background: var(--ink) !important;
      color: var(--bg) !important;
      border: 1px solid var(--rule-strong) !important;
      border-radius: 4px !important;
      padding: 10px 16px !important;
      font-weight: 600;
      box-shadow: 0 12px 32px rgba(0, 0, 0, 0.35) !important;
    }
    html body #toast button {
      background: var(--accent) !important;
      color: var(--accent-ink) !important;
      border-color: var(--accent) !important;
      padding: 5px 11px !important;
      min-height: 32px !important;
      margin: 0 0 0 10px !important;
    }

    details {
      background: transparent;
      border: 1px solid var(--rule);
      border-radius: 4px;
      padding: 6px 14px;
      margin: 12px 0;
    }
    details[open] {
      padding-bottom: 14px;
      background: var(--bg);
      border-color: var(--rule-strong);
    }
    summary {
      font-size: 16px !important;
      margin: 6px 0 !important;
      color: var(--ink) !important;
    }

    footer#storageStatus {
      margin-top: 28px;
      padding-top: 14px;
      border-top: 1px solid var(--rule);
      color: var(--ink-3);
      font-size: 12.5px;
      text-align: center;
    }

    /* ================= 圖表與手札元件 ================= */
    .cv-chart-card {
      background: var(--bg);
      border: 1px solid var(--rule);
      border-radius: 4px;
      padding: 16px;
      margin: 14px 0;
    }
    .cv-chart-header {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
      margin-bottom: 10px;
    }
    .cv-chart-title {
      font-family: var(--font-serif);
      font-size: 15px;
      font-weight: 600;
      color: var(--ink);
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .cv-chart-title svg { stroke: var(--accent); }
    .cv-specs-line {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 6px 12px;
      margin-top: 10px;
      padding-top: 10px;
      border-top: 1px solid var(--rule);
      font-size: 12px;
      color: var(--ink-2);
    }
    .cv-spec-item {
      display: inline-flex;
      align-items: center;
      gap: 5px;
    }
    .cv-roast-dots {
      display: inline-flex;
      gap: 3px;
      align-items: center;
    }
    .cv-roast-dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      border: 1px solid var(--accent);
    }
    .cv-roast-dot.filled { background: var(--accent); }

    .cv-brew-visual {
      margin: 6px 0 14px;
      padding: 16px;
      background: var(--bg);
      border: 1px solid var(--rule);
      border-radius: 4px;
    }
    .cv-prop-bar {
      display: flex;
      gap: 3px;
      height: 5px;
      margin-bottom: 14px;
      overflow: hidden;
    }
    .cv-prop-seg {
      height: 100%;
      border-radius: 1px;
      background: var(--rule);
      transition: background 0.25s ease;
    }
    .cv-prop-seg.manual {
      background: repeating-linear-gradient(45deg, var(--rule), var(--rule) 3px, var(--rule-strong) 3px, var(--rule-strong) 6px);
    }
    .cv-prop-seg.done { background: var(--ink-2); }
    .cv-prop-seg.active { background: var(--accent); }

    .cv-gauge-wrap {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      position: relative;
      width: 214px;
      height: 214px;
      margin: 2px auto 12px;
    }
    .cv-gauge-svg { width: 100%; height: 100%; }
    .cv-gauge-center {
      position: absolute;
      inset: 0;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      pointer-events: none;
      padding: 18px;
    }
    .cv-telemetry-grid {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 0;
      border-top: 1px solid var(--rule);
      border-bottom: 1px solid var(--rule);
      margin-top: 6px;
    }
    .cv-telemetry-cell {
      border-right: 1px solid var(--rule);
      padding: 10px 8px;
      text-align: center;
    }
    .cv-telemetry-cell:last-child { border-right: 0; }
    .cv-telemetry-label {
      font-size: 11px;
      letter-spacing: 0.04em;
      color: var(--ink-3);
    }
    .cv-telemetry-val {
      font-family: var(--font-mono);
      font-size: clamp(1.1rem, 2.8vw, 1.4rem);
      font-weight: 600;
      color: var(--ink);
      margin-top: 3px;
    }
    .cv-telemetry-cell.highlight .cv-telemetry-val { color: var(--accent); }

    .cv-radar-box {
      display: grid;
      grid-template-columns: 128px minmax(0, 1fr);
      gap: 14px;
      align-items: center;
      background: var(--surface);
      border: 1px solid var(--rule);
      border-radius: 4px;
      padding: 10px 14px;
      margin: 8px 0;
    }
    @media (max-width: 480px) {
      .cv-radar-box { grid-template-columns: 1fr; justify-items: center; }
    }
    .cv-bars-list {
      width: 100%;
      display: grid;
      gap: 5px;
      font-size: 12px;
      color: var(--ink-2);
    }
    .cv-bar-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
    }
    .cv-bar-segments { display: flex; gap: 3px; }
    .cv-bar-seg {
      width: 15px;
      height: 3px;
      border-radius: 1px;
      background: var(--rule);
    }
    .cv-bar-seg.on { background: var(--accent); }
    .cv-radar-note { font-size: 11px; color: var(--ink-3); margin-top: 2px; }

    .cv-btn-content {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      pointer-events: none;
    }
    .cv-btn-content svg,
    .cv-spec-item svg,
    .cv-metric-label svg,
    .cv-cup-inline-spec svg {
      width: 14px;
      height: 14px;
      flex-shrink: 0;
      stroke: currentColor;
    }
    .cv-icon-only {
      width: 36px !important;
      min-width: 36px !important;
      padding: 0 !important;
      display: inline-flex !important;
      align-items: center;
      justify-content: center;
    }
    .cv-icon-danger {
      background: var(--danger-soft) !important;
      border-color: var(--danger-border) !important;
      color: var(--danger) !important;
      margin-left: auto !important;
    }
    .cv-icon-danger:hover:not(:disabled) {
      background: var(--danger) !important;
      color: var(--accent-ink) !important;
      border-color: var(--danger) !important;
    }
    .cv-card-actions {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 6px;
      margin-top: 10px;
      padding-top: 10px;
      border-top: 1px solid var(--rule);
    }
    .cv-card-actions button {
      margin: 0 !important;
      min-height: 34px !important;
      padding: 4px 10px !important;
      font-size: 12px !important;
    }
    .cv-cup-chips {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 4px 10px;
      margin: 6px 0 10px;
      padding: 6px 0;
      border-top: 1px solid var(--rule);
      border-bottom: 1px solid var(--rule);
      font-size: 12px;
      color: var(--ink-2);
    }
    .cv-cup-inline-spec {
      display: inline-flex;
      align-items: center;
      gap: 4px;
    }
    .cv-cup-inline-spec.accent { color: var(--accent); font-weight: 600; }
    .cv-raw-hidden { display: none !important; }
    .cv-metric-label {
      display: inline-flex !important;
      align-items: center;
      justify-content: flex-start;
      gap: 4px;
    }
    .cv-metric-label svg { width: 12px; height: 12px; color: var(--accent); }
  `;
  document.head.append(style);

  // =========================================================================
  // 2. 細線 SVG 圖示庫
  // =========================================================================
  function getActionSvg(typeStr) {
    const t = String(typeStr || '');
    if (t.includes('悶蒸')) {
      return `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/></svg>`;
    }
    if (t.includes('繞圈')) {
      return `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M12 12m-1 0a1 1 0 1 0 2 0a3 3 0 1 0-6 0a5 5 0 1 0 10 0a7 7 0 1 0-14 0"/></svg>`;
    }
    if (t.includes('中心')) {
      return `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="4"/><circle cx="12" cy="12" r="1"/></svg>`;
    }
    if (t.includes('注水') || t.includes('加水')) {
      return `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M7 16.3c2.2 0 4-1.83 4-4.05 0-1.16-.57-2.26-1.71-3.19S7.29 6.75 7 5.3c-.29 1.45-1.14 2.84-2.29 3.76S3 11.1 3 12.25c0 2.22 1.8 4.05 4 4.05z"/><path d="M12.56 6.6A10.97 10.97 0 0 0 14 3.02c.5 2.5 2 4.9 4 6.5s3 3.5 3 5.5a6.98 6.98 0 0 1-11.91 4.97"/></svg>`;
    }
    if (t.includes('等待') && !t.includes('滴濾')) {
      return `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M5 22h14"/><path d="M5 2h14"/><path d="M17 22v-4.172a2 2 0 0 0-.586-1.414L12 12l-4.414 4.414A2 2 0 0 0 7 17.828V22"/><path d="M7 2v4.172a2 2 0 0 0 .586 1.414L12 12l4.414-4.414A2 2 0 0 0 17 6.172V2"/></svg>`;
    }
    if (t.includes('攪拌')) {
      return `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 1 1-6.219-8.56"/><polyline points="22 2 22 8 16 8"/></svg>`;
    }
    if (t.includes('下壓')) {
      return `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M7 4h10"/><path d="M12 4v11"/><path d="m8 11 4 4 4-4"/><path d="M6 19h12"/></svg>`;
    }
    if (t.includes('閥門')) {
      return `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"/><path d="M3 12h5"/><path d="M16 12h5"/><path d="M12 3v5"/></svg>`;
    }
    if (t.includes('滴濾')) {
      return `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M5 4h14l-5 8h-4L5 4z"/><path d="M12 16v2"/><circle cx="12" cy="20.5" r="1"/></svg>`;
    }
    if (t.includes('冰')) {
      return `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="3" width="18" height="18" rx="3"/><path d="M3 9h18"/><path d="M9 21V9"/></svg>`;
    }
    return `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v14"/><path d="m7 12 5 5 5-5"/><path d="M5 21h14"/></svg>`;
  }

  function roastDotsCount(roastStr) {
    const map = { '淺焙': 1, '中淺焙': 2, '中焙': 3, '中深焙': 4, '深焙': 5 };
    return map[roastStr] || 0;
  }

  function roastStripeColor(roastStr) {
    const map = {
      '淺焙': '#B85D43',
      '中淺焙': '#C88A4B',
      '中焙': '#9E6B3E',
      '中深焙': '#6B4C35',
      '深焙': '#4A3425'
    };
    return map[roastStr] || 'var(--rule-strong)';
  }

  const UI_ICONS = {
    plus: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14"/><path d="M5 12h14"/></svg>`,
    camera: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/></svg>`,
    edit: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 1 1 3 3L7 19l-4 1 1-4Z"/></svg>`,
    share: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="m8.59 13.51 6.83 3.98"/><path d="m15.41 6.51-6.82 3.98"/></svg>`,
    copy: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>`,
    star: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`,
    starFilled: `<svg viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`,
    trash: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>`,
    archive: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="5" x="2" y="3" rx="1"/><path d="M4 8v11a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8"/><path d="M10 12h4"/></svg>`,
    unarchive: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="5" x="2" y="3" rx="1"/><path d="M4 8v11a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8"/><path d="M12 17v-6"/><path d="m9 14 3-3 3 3"/></svg>`,
    bookmark: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z"/></svg>`,
    trophy: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/></svg>`,
    scale: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="m16 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z"/><path d="m2 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z"/><path d="M7 21h10"/><path d="M12 3v18"/><path d="M3 7h2c2 0 5-1 7-2 2 1 5 2 7 2h2"/></svg>`,
    sort: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="m3 16 4 4 4-4"/><path d="M7 20V4"/><path d="m21 8-4-4-4 4"/><path d="M17 4v16"/></svg>`,
    compare: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="M15 3h4a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2h-4"/><line x1="12" y1="2" x2="12" y2="22"/></svg>`,
    save: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>`,
    sliders: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><line x1="4" x2="4" y1="21" y2="14"/><line x1="4" x2="4" y1="10" y2="3"/><line x1="12" x2="12" y1="21" y2="12"/><line x1="12" x2="12" y1="8" y2="3"/><line x1="20" x2="20" y1="21" y2="16"/><line x1="20" x2="20" y1="12" y2="3"/><line x1="2" x2="6" y1="14" y2="14"/><line x1="10" x2="14" y1="8" y2="8"/><line x1="18" x2="22" y1="16" y2="16"/></svg>`,
    droplet: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/></svg>`,
    thermometer: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M14 4v10.54a4 4 0 1 1-4 0V4a2 2 0 0 1 4 0Z"/></svg>`,
    clock: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>`,
    bean: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><ellipse cx="12" cy="12" rx="7" ry="10" transform="rotate(30 12 12)"/><path d="M15.5 5.5c-2.5 3-1 6-3.5 9s-1 4.5-3.5 5"/></svg>`,
    dripper: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M5 4h14l-4.5 9h-5L5 4z"/><path d="M8 17h8"/><path d="M12 13v7"/></svg>`,
    cloud: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z"/></svg>`,
    refresh: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"/><path d="M16 16h5v5"/></svg>`,
    sun: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M4.93 4.93l1.41 1.41m11.32 11.32 1.41 1.41M2 12h2m16 0h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/></svg>`,
    moon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>`,
    play: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M7 5.5v13l11-6.5L7 5.5z"/></svg>`
  };

  function setBtnIcon(btn, iconKey, label, fullTitle, iconOnly = false) {
    if (!btn || !UI_ICONS[iconKey]) return;
    const key = [iconKey, label, fullTitle, iconOnly ? '1' : '0', document.documentElement.lang].join('|');
    const hasContent = iconOnly ? Boolean(btn.querySelector('svg')) : Boolean(btn.querySelector('.cv-btn-content'));
    if (btn.dataset.cvIconKey === key && hasContent) return;
    btn.dataset.cvIconKey = key;
    btn.setAttribute('data-coffee-user-text', 'true');
    btn.title = fullTitle;
    btn.setAttribute('aria-label', fullTitle);
    btn.classList.toggle('cv-icon-only', iconOnly);
    btn.innerHTML = iconOnly
      ? UI_ICONS[iconKey]
      : `<span class="cv-btn-content">${UI_ICONS[iconKey]}<span>${esc(label)}</span></span>`;
  }

  function updateThemeButton() {
    const btn = document.getElementById('cvThemeToggle');
    if (!btn) return;
    const en = isEn();
    const isWashi = currentTheme === 'washi';
    const iconKey = isWashi ? 'moon' : 'sun';
    const label = isWashi ? (en ? 'Sumi' : '深夜吧台') : (en ? 'Washi' : '和紙淺色');
    const title = isWashi ? (en ? 'Switch to Sumi Dark theme' : '切換為深夜吧台深色') : (en ? 'Switch to Washi Light theme' : '切換為和紙手札淺色');
    btn.setAttribute('aria-pressed', String(isWashi));
    setBtnIcon(btn, iconKey, label, title);
  }

  function buildChronometerTicksSvg() {
    let ticks = '';
    for (let i = 0; i < 60; i++) {
      const angle = (i * 6 - 90) * Math.PI / 180;
      const isMajor = i % 5 === 0;
      const r1 = isMajor ? 92 : 95;
      const r2 = 101;
      const x1 = (107 + r1 * Math.cos(angle)).toFixed(2);
      const y1 = (107 + r1 * Math.sin(angle)).toFixed(2);
      const x2 = (107 + r2 * Math.cos(angle)).toFixed(2);
      const y2 = (107 + r2 * Math.sin(angle)).toFixed(2);
      ticks += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="var(--ink)" stroke-opacity="${isMajor ? 0.42 : 0.16}" stroke-width="${isMajor ? 1.4 : 1}"/>`;
    }
    return ticks;
  }

  const CHRONO_TICKS_HTML = buildChronometerTicksSvg();

  function buildBlueprintCurveSvg(r, summary, W = 560, H = 128) {
    const stepsList = Array.isArray(r.steps) ? r.steps : [];
    const points = [[0, 0]];
    let t = 0;
    let w = 0;
    const stepMarkers = [];
    for (const s of stepsList) {
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
    const padL = 40, padR = 22, padT = 22, padB = 22;
    const plotW = W - padL - padR;
    const plotH = H - padT - padB;
    const toX = sec => padL + (sec / maxT) * plotW;
    const toY = water => padT + plotH - (water / maxW) * plotH;
    const polyPoints = points.map(([px, py]) => `${toX(px).toFixed(1)},${toY(py).toFixed(1)}`).join(' ');

    let lastLabelX = -999;
    const dots = stepMarkers.map(([px, py], idx) => {
      const x = toX(px);
      const y = toY(py);
      const isLast = idx === stepMarkers.length - 1;
      const showLabel = isLast || (x - lastLabelX >= 42);
      if (showLabel) lastLabelX = x;
      const labelHtml = showLabel
        ? `<text x="${x.toFixed(1)}" y="${(y - 7).toFixed(1)}" fill="var(--ink-2)" font-size="9.5" text-anchor="middle" font-family="JetBrains Mono, monospace">${Math.round(py * 10) / 10}g</text>`
        : '';
      return `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${isLast ? 3.5 : 3}" fill="${isLast ? 'var(--accent)' : 'var(--bg)'}" stroke="var(--accent)" stroke-width="1.8"/>${labelHtml}`;
    }).join('');

    const fmtFn = typeof fmt === 'function' ? fmt : msVal => `${Math.floor(msVal / 60000)}:${String(Math.floor((msVal % 60000) / 1000)).padStart(2, '0')}`;

    return `
      <svg viewBox="0 0 ${W} ${H}" style="width:100%;height:auto;display:block">
        <line x1="${padL}" y1="${padT}" x2="${W - padR}" y2="${padT}" stroke="var(--rule)" stroke-dasharray="3 4"/>
        <line x1="${padL}" y1="${(padT + plotH / 2).toFixed(1)}" x2="${W - padR}" y2="${(padT + plotH / 2).toFixed(1)}" stroke="var(--rule)" stroke-dasharray="3 4"/>
        <line x1="${padL}" y1="${padT + plotH}" x2="${W - padR}" y2="${padT + plotH}" stroke="var(--rule-strong)"/>
        <text x="${padL - 6}" y="${padT + 4}" fill="var(--ink-3)" font-size="9.5" text-anchor="end" font-family="JetBrains Mono, monospace">${Math.round(maxW)}g</text>
        <text x="${padL - 6}" y="${(padT + plotH / 2 + 3).toFixed(1)}" fill="var(--ink-3)" font-size="9.5" text-anchor="end" font-family="JetBrains Mono, monospace">${Math.round(maxW / 2)}g</text>
        <text x="${padL - 6}" y="${padT + plotH + 3}" fill="var(--ink-3)" font-size="9.5" text-anchor="end" font-family="JetBrains Mono, monospace">0g</text>
        <polyline points="${polyPoints}" fill="none" stroke="var(--accent)" stroke-width="2" stroke-linejoin="miter" stroke-linecap="square"/>
        ${dots}
        <text x="${padL}" y="${H - 4}" fill="var(--ink-3)" font-size="9.5" text-anchor="start" font-family="JetBrains Mono, monospace">0:00</text>
        <text x="${(padL + plotW / 2).toFixed(1)}" y="${H - 4}" fill="var(--ink-3)" font-size="9.5" text-anchor="middle" font-family="JetBrains Mono, monospace">${fmtFn(maxT * 500)}</text>
        <text x="${W - padR}" y="${H - 4}" fill="var(--ink-3)" font-size="9.5" text-anchor="end" font-family="JetBrains Mono, monospace">${fmtFn(maxT * 1000)}</text>
      </svg>
    `;
  }

  // =========================================================================
  // 3. 頂部品牌列 + 主題切換鈕
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
      logo.innerHTML = `<svg viewBox="0 0 24 24" fill="none"><path d="M3.2 8.2V3.2H8.2" stroke="var(--ink)" stroke-width="1.5" stroke-linecap="square"/><path d="M20.8 15.8V20.8H15.8" stroke="var(--ink)" stroke-width="1.5" stroke-linecap="square"/><path d="M6.8 6.5H17.2L13.5 13.5H10.5L6.8 6.5Z" stroke="var(--ink)" stroke-width="1.5" stroke-linejoin="round"/><path d="M9.4 6.7L11.2 13.3M14.6 6.7L12.8 13.3" stroke="var(--ink)" stroke-opacity="0.38" stroke-width="1"/><path d="M9.2 15H14.8" stroke="var(--ink)" stroke-width="1.4" stroke-linecap="round"/><path d="M12 16.5C12 16.5 14 18.4 14 19.6A2 2 0 1 1 10 19.6C10 18.4 12 16.5 12 16.5Z" fill="var(--accent)"/></svg>`;

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

      const themeBtn = document.createElement('button');
      themeBtn.type = 'button';
      themeBtn.id = 'cvThemeToggle';
      themeBtn.className = 'cv-theme-toggle';
      themeBtn.setAttribute('data-coffee-user-text', 'true');
      themeBtn.onclick = () => {
        applyTheme(currentTheme === 'sumi' ? 'washi' : 'sumi', true);
      };

      actions.append(syncPill, themeBtn);
      header.append(brandGroup, actions);

      const navEl = document.querySelector('nav');
      if (navEl) navEl.before(header);
      else document.body.prepend(header);
    } else {
      titleWrap = header.querySelector('.cv-brand-title');
      metaWrap = header.querySelector('.cv-brand-meta');
      actions = header.querySelector('.cv-header-actions');
    }

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
      while (rogueHeader.firstChild) header.append(rogueHeader.firstChild);
      rogueHeader.remove();
    }
    updateThemeButton();
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
    let iconKey = 'cloud';
    let nextText = '';
    if (state === 'synced' || txt.includes('已同步') || txt.includes('已連結') || txt.includes('Synced')) {
      nextDotClass = 'cv-sync-dot online';
      nextText = L('已同步', 'Synced');
    } else if (state === 'syncing' || txt.includes('正在同步') || txt.includes('Syncing')) {
      nextDotClass = 'cv-sync-dot online';
      iconKey = 'refresh';
      nextText = L('同步中', 'Syncing');
    } else if (state === 'offline' || state === 'error') {
      nextDotClass = 'cv-sync-dot warn';
      nextText = L('離線', 'Offline');
    } else {
      nextText = L('雲端登入', 'Cloud Sync');
    }
    const syncKey = `${nextDotClass}|${iconKey}|${nextText}`;
    if (dot.className !== nextDotClass) dot.className = nextDotClass;
    if (label.dataset.cvSyncKey !== syncKey) {
      label.dataset.cvSyncKey = syncKey;
      label.innerHTML = `<span class="cv-btn-content">${UI_ICONS[iconKey]}<span>${esc(nextText)}</span></span>`;
    }
  }

  // =========================================================================
  // 4. 樣張同款「雙欄沖煮工作室」(#cvStudioView) + 編輯切換
  // =========================================================================
  let lastStudioKey = '';

  function setStudioEditorExpanded(expanded) {
    const brewSection = document.getElementById('brew');
    if (!brewSection) return;
    brewSection.classList.toggle('cv-editor-collapsed', !expanded);
    if (expanded) {
      ensureBackToStudioBar();
    }
  }

  function ensureBackToStudioBar() {
    const brewGrid = document.querySelector('#brew > .grid');
    if (!brewGrid) return;
    let bar = document.getElementById('cvBackToStudioBar');
    if (!bar) {
      bar = document.createElement('div');
      bar.id = 'cvBackToStudioBar';
      bar.className = 'cv-editor-top-bar';
      bar.setAttribute('data-coffee-user-text', 'true');
      const left = document.createElement('span');
      left.id = 'cvEditorBarHint';
      left.style.fontSize = '13px';
      left.style.color = 'var(--ink-2)';
      const backBtn = document.createElement('button');
      backBtn.type = 'button';
      backBtn.id = 'cvBackToStudioBtn';
      backBtn.className = 'cv-hair-btn accent';
      backBtn.onclick = () => {
        setStudioEditorExpanded(false);
        renderStudioView(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      };
      bar.append(left, backBtn);
      brewGrid.prepend(bar);
      bar.style.gridColumn = '1 / -1';
    }
    const hintEl = document.getElementById('cvEditorBarHint');
    const btnEl = document.getElementById('cvBackToStudioBtn');
    if (hintEl) hintEl.textContent = L('正在編輯完整配方明細（修改後可於下方儲存）', 'Editing full recipe parameters (save below when ready)');
    if (btnEl) btnEl.textContent = L('← 返回沖煮工作室', '← Back to Brew Studio');
  }

  function findWorkspaceScanButton() {
    const fields = document.getElementById('fields');
    if (fields) {
      for (const b of fields.querySelectorAll('button')) {
        if (/拍豆袋|Scan coffee/i.test(b.textContent || b.dataset.cvOrigText || '')) return b;
      }
    }
    return null;
  }

  function renderStudioView(force = false) {
    const brewSection = document.getElementById('brew');
    if (!brewSection || typeof read !== 'function' || typeof m !== 'function') return;

    if (!brewSection.dataset.cvStudioInit) {
      brewSection.dataset.cvStudioInit = '1';
      brewSection.classList.add('cv-editor-collapsed');
    }

    let studio = document.getElementById('cvStudioView');
    if (!studio) {
      studio = document.createElement('section');
      studio.id = 'cvStudioView';
      studio.className = 'cv-studio-grid';
      studio.setAttribute('data-coffee-user-text', 'true');
      brewSection.prepend(studio);
    }

    let r;
    try { r = read(); } catch (e) { return; }
    if (!r || !Array.isArray(r.steps)) return;

    const summary = m(r);
    const soundEl = document.getElementById('sound');
    const soundOn = soundEl ? !!soundEl.checked : true;
    const syncLabelEl = document.getElementById('cvSyncLabel');
    const syncTxt = syncLabelEl ? syncLabelEl.textContent.trim() : L('本機模式', 'LOCAL');
    const recipeIds = (typeof db !== 'undefined' && Array.isArray(db.recipes))
      ? db.recipes.map(x => `${x.id}:${x.favorite ? 1 : 0}:${x.name}`)
      : [];
    const beanItems = (typeof db !== 'undefined' && db.beanCatalog && Array.isArray(db.beanCatalog.items))
      ? db.beanCatalog.items.filter(b => b.active)
      : [];
    const beanKey = beanItems.map(b => `${b.id}:${b.bean}`).join(',');

    const grinderApi = typeof window !== 'undefined' ? window.CoffeeGrinderGuide : null;
    const activeGrinderPref = grinderApi ? grinderApi.getPreferredGrinderId() : '';

    const key = JSON.stringify([
      r.id, r.name, r.method, r.dripper, r.shape, r.filter, r.grinder, r.grind,
      r.dose, r.temp, r.cold, r.ice, r.bean, r.roaster, r.roast, r.process, r.beanFlavor,
      r.steps, recipeIds, beanKey, soundOn, syncTxt, activeGrinderPref, document.documentElement.lang
    ]);
    if (!force && key === lastStudioKey) return;
    lastStudioKey = key;

    const en = isEn();
    const fmtFn = typeof fmt === 'function' ? fmt : msVal => `${Math.floor(msVal / 60000)}:${String(Math.floor((msVal % 60000) / 1000)).padStart(2, '0')}`;
    const totalTimeStr = fmtFn(summary.total * 1000);
    const ratioStr = r.dose > 0 ? `1 : ${(summary.water / r.dose).toFixed(1)}` : '—';
    const isPourFn = s => (typeof pour === 'function' ? pour(s) : ['悶蒸注水', '注水', '繞圈注水', '中心注水'].includes(s.type));
    const isManFn = s => (typeof manual === 'function' ? manual(s) : ['後加水（bypass）', '後加冰塊'].includes(s.type));

    const firstStep = r.steps[0] || { type: '悶蒸注水', sec: 30, water: 40, note: '' };
    const firstTimeStr = isManFn(firstStep) ? L('手動', 'Manual') : fmtFn((Number(firstStep.sec) || 30) * 1000);
    const firstArcRatio = 0.65;
    const outerCirc = 508.94;
    const innerCirc = 439.82;
    const outerOffset = (outerCirc * (1 - firstArcRatio)).toFixed(1);
    const innerOffset = (innerCirc * 0.84).toFixed(1);

    // 計算步驟累計水量與時間軸摘要
    let cumW = 0;
    let cumSec = 0;
    const stepsCardsHtml = r.steps.map((s, idx) => {
      const man = isManFn(s);
      const isP = isPourFn(s);
      const addW = Number(s.water) || 0;
      if (isP) cumW += addW;
      const startSec = cumSec;
      if (!man) cumSec += Number(s.sec) || 0;
      const numStr = String(idx + 1).padStart(2, '0');
      const deltaStr = isP
        ? `+${Math.round(addW * 10) / 10}g → ${Math.round(cumW * 10) / 10}g`
        : man
          ? `+${Math.round(addW * 10) / 10}g (${L('手動', 'Manual')})`
          : `${s.sec}s (${fmtFn(startSec * 1000)})`;
      const subText = s.note
        ? esc(s.note)
        : isP
          ? L(`於 ${fmtFn(startSec * 1000)} 注水 ${addW}g（${s.sec} 秒）`, `Pour ${addW}g at ${fmtFn(startSec * 1000)} (${s.sec}s)`)
          : man
            ? L('完成前序步驟後手動確認加入', 'Confirm manually after pouring')
            : L(`靜置／操作 ${s.sec} 秒`, `Hold / act for ${s.sec}s`);
      return `
        <div class="cv-step-cell ${idx === 0 ? 'active' : ''}">
          <div style="display:flex;justify-content:space-between;align-items:baseline;gap:8px;">
            <span style="font-size:12.5px;font-weight:700;color:${idx === 0 ? 'var(--accent)' : 'var(--ink)'};white-space:nowrap;">${numStr} · ${esc(s.type)}</span>
            <span class="cv-mono" style="font-size:11px;color:${idx === 0 ? 'var(--accent)' : 'var(--ink-2)'};font-weight:${idx === 0 ? 600 : 500};white-space:nowrap;">${esc(deltaStr)}</span>
          </div>
          <span style="font-size:12px;color:var(--ink-2);line-height:1.45;">${subText}</span>
        </div>
      `;
    }).join('');

    // 時間軸下方座標文字
    let axCumW = 0;
    let axCumSec = 0;
    const axisMarks = [];
    for (const s of r.steps) {
      if (isManFn(s)) continue;
      if (isPourFn(s)) axCumW += Number(s.water) || 0;
      const tLabel = fmtFn(axCumSec * 1000);
      if (isPourFn(s) && axisMarks.length < 4) {
        axisMarks.push(`${tLabel} · ${Math.round(axCumW)}g`);
      }
      axCumSec += Number(s.sec) || 0;
    }
    axisMarks.push(fmtFn(axCumSec * 1000));

    // 研磨推薦字串 + 磨豆機換算切換
    const noteMatch = String(r.notes || '').match(/【推薦研磨】([^。\n]+)/);
    const resolvedGrinderId = grinderApi ? grinderApi.resolveGrinderId(r) : 'timemore-c5-pro';
    const defaultGrind = r.grind
      ? `${r.grinder ? r.grinder + ' · ' : ''}${en ? 'Dial ' : '刻度 '}${r.grind}`
      : grinderApi
        ? grinderApi.formatGrindGuide(r, { lang: en ? 'en' : 'zh-Hant', grinderId: resolvedGrinderId })
        : (r.grindGuide || r.grindGuideEn)
          ? L(r.grindGuide || r.grindGuideEn, r.grindGuideEn || r.grindGuide)
          : noteMatch
            ? noteMatch[1]
            : r.method === '愛樂壓'
              ? L('Timemore C5 Pro · 建議刻度 10–12.2', 'Timemore C5 Pro · Dial 10–12.2')
              : r.shape === '平底'
                ? L('Timemore C5 Pro · 建議刻度 13.2–15', 'Timemore C5 Pro · Dial 13.2–15')
                : L('Timemore C5 Pro · 建議刻度 12.1–14.2', 'Timemore C5 Pro · Dial 12.1–14.2');
    const studioGrinderOptionsHtml = grinderApi
      ? grinderApi.GRINDERS.map(g => `<option value="${esc(g.id)}" ${g.id === resolvedGrinderId ? 'selected' : ''}>${esc(g.shortName)}</option>`).join('')
      : '';

    const sortedRecipes = (typeof db !== 'undefined' && Array.isArray(db.recipes))
      ? [...db.recipes].sort((a, b) => Number(!!b.favorite) - Number(!!a.favorite))
      : [r];
    const recipeOptionsHtml = sortedRecipes.map(x => {
      const sel = x.id === r.id ? 'selected' : '';
      return `<option value="${esc(x.id)}" ${sel}>${x.favorite ? '★ ' : ''}${esc(x.name)}</option>`;
    }).join('');

    const beanMetaLine = [r.roast && r.roast !== '未填' ? r.roast : '', r.process, r.roaster, r.beanFlavor].filter(Boolean).join(' · ')
      || L('點選右方「換豆／拍豆袋」或編輯配方設定豆單', 'Select a coffee bean or scan a coffee bag');

    const doses = [15, 17, 20];
    const doseTabsHtml = doses.map(d => {
      const isAct = Math.abs(Number(r.dose) - d) < 0.05;
      return `<button type="button" class="cv-dose-tab ${isAct ? 'active' : ''}" data-cv-dose="${d}">${d}g</button>`;
    }).join('') + `<button type="button" class="cv-dose-tab" data-cv-dose="custom">${L('縮放', 'Scale')}</button>`;

    const extraLineParts = [];
    if (r.filter) extraLineParts.push(r.filter);
    if (summary.postWater > 0) extraLineParts.push(`+${summary.postWater}g ${L('後加水', 'Bypass')}`);
    if (summary.postIce > 0) extraLineParts.push(`+${summary.postIce}g ${L('冰', 'Ice')}`);
    const calibrationSub = [r.dripper || r.method, ...extraLineParts].filter(Boolean).join(' · ');

    studio.innerHTML = `
      <div class="cv-studio-left">
        <div class="cv-studio-head">
          <div style="min-width:0;flex:1 1 220px;">
            <div class="cv-kicker">${esc(r.method || L('手沖', 'POUR-OVER'))} · ${esc(r.dripper || r.shape || '—')}</div>
            <div class="cv-studio-title cv-serif">${esc(r.name)}</div>
          </div>
          <div class="cv-studio-tools">
            <select id="cvStudioRecipeSelect" aria-label="${L('切換配方', 'Switch recipe')}">${recipeOptionsHtml}</select>
            <button type="button" class="cv-hair-btn accent" id="cvStudioChampBtn">${UI_ICONS.trophy}<span>${L('專家配方', 'Champions')}</span></button>
            <button type="button" class="cv-hair-btn" id="cvStudioEditBtn">${UI_ICONS.edit}<span>${L('編輯配方', 'Edit')}</span></button>
          </div>
        </div>

        <div class="cv-acaia-strip">
          <div class="cv-acaia-cell">
            <span class="cv-kicker">DOSE · ${L('粉量', 'DOSE')}</span>
            <div class="cv-acaia-val cv-mono">${esc(r.dose)}<span class="cv-acaia-unit">g</span></div>
          </div>
          <div class="cv-acaia-cell">
            <span class="cv-kicker">WATER · ${L('萃取水', 'WATER')}</span>
            <div class="cv-acaia-val cv-mono">${Math.round(summary.water * 10) / 10}<span class="cv-acaia-unit">g</span></div>
          </div>
          <div class="cv-acaia-cell">
            <span class="cv-kicker">TEMP · ${L('水溫', 'TEMP')}</span>
            <div class="cv-acaia-val cv-mono">${esc(r.temp)}<span class="cv-acaia-unit">°C</span></div>
          </div>
          <div class="cv-acaia-cell">
            <span class="cv-kicker">TIME · ${L('時間', 'TIME')}</span>
            <div class="cv-acaia-val cv-mono">${esc(totalTimeStr)}</div>
          </div>
        </div>

        <div class="cv-bean-strip">
          <div style="display:flex;flex-direction:column;gap:2px;min-width:0;flex:1 1 200px;">
            <span style="font-size:13.5px;font-weight:700;color:var(--ink);">${esc(r.bean || L('尚未指定咖啡豆', 'No coffee bean selected'))}</span>
            <span style="font-size:11.5px;color:var(--ink-2);overflow:hidden;text-overflow:ellipsis;">${esc(beanMetaLine)}</span>
          </div>
          <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">
            <div class="cv-dose-group">${doseTabsHtml}</div>
            <button type="button" class="cv-hair-btn" id="cvStudioBeanBtn" style="padding:4px 9px !important;">${UI_ICONS.bean}<span>${L('換豆', 'Beans')}</span></button>
            <button type="button" class="cv-hair-btn accent" id="cvStudioScanBtn" style="padding:4px 9px !important;">${UI_ICONS.camera}<span>${L('拍豆袋', 'Scan')}</span></button>
          </div>
        </div>

        <div style="display:flex;flex-direction:column;gap:6px;">
          <div style="display:flex;justify-content:space-between;align-items:center;gap:8px;flex-wrap:wrap;">
            <span class="cv-kicker">POUR PROFILE · ${esc(ratioStr)}</span>
            <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;min-width:0;">
              <span class="cv-mono" style="font-size:11px;color:var(--ink-2);">${esc(defaultGrind)}</span>
              ${studioGrinderOptionsHtml ? `<select id="cvStudioGrinderSelect" class="cv-grinder-select" aria-label="${L('切換磨豆機換算', 'Switch grinder calibration')}">${studioGrinderOptionsHtml}</select>` : ''}
            </div>
          </div>
          ${buildBlueprintCurveSvg(r, summary)}
          <div class="cv-mono" style="display:flex;justify-content:space-between;font-size:10.5px;color:var(--ink-3);gap:6px;">
            ${axisMarks.map(mTxt => `<span>${esc(mTxt)}</span>`).join('')}
          </div>
        </div>

        <div class="cv-steps-grid">${stepsCardsHtml}</div>
      </div>

      <aside class="cv-studio-right">
        <div style="display:flex;justify-content:space-between;align-items:center;gap:8px;">
          <span class="cv-kicker">CHRONOMETER</span>
          <span class="cv-mono" style="font-size:11px;color:var(--accent);white-space:nowrap;">STEP 01 / ${String(r.steps.length).padStart(2, '0')}</span>
        </div>

        <div style="display:flex;flex-direction:column;align-items:center;padding:8px 0 4px;gap:10px;">
          <div class="cv-gauge-wrap">
            <svg class="cv-gauge-svg" viewBox="0 0 214 214">
              ${CHRONO_TICKS_HTML}
              <circle cx="107" cy="107" r="81" fill="none" stroke="var(--rule)" stroke-width="1.5"/>
              <circle cx="107" cy="107" r="81" fill="none" stroke="var(--accent)" stroke-width="3" stroke-dasharray="${outerCirc}" stroke-dashoffset="${outerOffset}" stroke-linecap="butt" transform="rotate(-90 107 107)"/>
              <circle cx="107" cy="107" r="70" fill="none" stroke="var(--rule)" stroke-width="1" stroke-dasharray="3 3"/>
              <circle cx="107" cy="107" r="70" fill="none" stroke="var(--ink-2)" stroke-width="1.6" stroke-dasharray="${innerCirc}" stroke-dashoffset="${innerOffset}" stroke-linecap="butt" transform="rotate(-90 107 107)"/>
            </svg>
            <div class="cv-gauge-center">
              <div style="color:var(--accent);margin-bottom:3px">${getActionSvg(firstStep.type)}</div>
              <div class="cv-mono" style="font-size:36px;font-weight:600;color:var(--ink);line-height:1.05;letter-spacing:-0.03em">${esc(firstTimeStr)}</div>
              <div class="cv-mono" style="font-size:10px;letter-spacing:0.12em;color:var(--ink-2);margin-top:5px">READY · ${Math.round(summary.water)}g</div>
            </div>
          </div>
          <div style="font-size:12px;color:var(--ink-2);text-align:center;">
            ${esc(firstStep.type)}${firstStep.water > 0 ? ` +${firstStep.water}g` : ''}${firstStep.note ? ` · ${esc(firstStep.note)}` : ''}
          </div>
        </div>

        <div class="cv-grind-note">
          <span class="cv-kicker">CALIBRATION · ${L('校準', 'GRIND')}</span>
          <span style="font-size:13px;font-weight:700;color:var(--ink);">${esc(defaultGrind)}</span>
          <span style="font-size:11.5px;color:var(--ink-2);">${esc(calibrationSub)}</span>
        </div>

        <div style="margin-top:auto;display:flex;flex-direction:column;gap:10px;padding-top:8px;">
          <button type="button" class="cv-primary-cta" id="cvStudioStartBtn">
            <span class="cv-btn-content">${UI_ICONS.play}<span>${L('開始 10 秒預備沖煮', 'Start 10s Prep & Brew')}</span></span>
          </button>
          <div style="display:flex;justify-content:space-between;align-items:center;font-size:11px;color:var(--ink-3);">
            <button type="button" id="cvStudioSoundBtn" style="background:none !important;border:0 !important;padding:2px 0 !important;min-height:auto !important;color:var(--ink-2) !important;font-size:11px !important;">
              ${L('分段提示音：', 'Audio cue: ')}${soundOn ? L('開啟', 'ON') : L('關閉', 'OFF')}
            </button>
            <span class="cv-mono">${esc(syncTxt)}</span>
          </div>
        </div>
      </aside>
    `;

    // Bind Studio events
    const recSel = document.getElementById('cvStudioRecipeSelect');
    if (recSel) {
      recSel.onchange = () => {
        const realSel = document.getElementById('recipes');
        if (realSel) {
          realSel.value = recSel.value;
          realSel.dispatchEvent(new Event('change'));
        }
      };
    }
    const studioGrinderSel = document.getElementById('cvStudioGrinderSelect');
    if (studioGrinderSel && grinderApi) {
      studioGrinderSel.onchange = () => {
        grinderApi.setPreferredGrinderId(studioGrinderSel.value);
        renderStudioView(true);
      };
    }
    const champBtn = document.getElementById('cvStudioChampBtn');
    if (champBtn) {
      champBtn.onclick = () => {
        const realChamp = document.getElementById('openChampionLibraryStudio');
        if (realChamp) realChamp.click();
      };
    }
    const editBtn = document.getElementById('cvStudioEditBtn');
    if (editBtn) {
      editBtn.onclick = () => {
        setStudioEditorExpanded(true);
      };
    }
    const beanBtn = document.getElementById('cvStudioBeanBtn');
    if (beanBtn) {
      beanBtn.onclick = () => {
        setStudioEditorExpanded(true);
        const fields = document.getElementById('fields');
        const beanSel = fields && fields.querySelector('select');
        const allSelects = fields ? Array.from(fields.querySelectorAll('select')) : [];
        const defaultBeanSel = allSelects[allSelects.length - 1];
        if (defaultBeanSel) defaultBeanSel.focus();
      };
    }
    const scanBtn = document.getElementById('cvStudioScanBtn');
    if (scanBtn) {
      scanBtn.onclick = () => {
        const realScan = findWorkspaceScanButton();
        if (realScan) realScan.click();
      };
    }
    studio.querySelectorAll('[data-cv-dose]').forEach(btn => {
      btn.onclick = () => {
        const d = btn.dataset.cvDose;
        if (d === 'custom') {
          setStudioEditorExpanded(true);
          const scaleDet = document.getElementById('scale')?.closest('details');
          if (scaleDet) {
            scaleDet.open = true;
            scaleDet.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
          return;
        }
        const scaleDose = document.getElementById('scaleDose');
        const scaleBtn = document.getElementById('scale');
        if (scaleDose && scaleBtn) {
          scaleDose.value = d;
          scaleBtn.click();
          renderStudioView(true);
        }
      };
    });
    const startBtn = document.getElementById('cvStudioStartBtn');
    if (startBtn) {
      startBtn.onclick = () => {
        const enterGuide = document.getElementById('coffeeEnterGuide');
        if (enterGuide) enterGuide.click();
        setTimeout(() => {
          const begin = document.getElementById('flowBegin');
          if (begin) begin.click();
        }, 40);
      };
    }
    const soundBtn = document.getElementById('cvStudioSoundBtn');
    if (soundBtn && soundEl) {
      soundBtn.onclick = () => {
        soundEl.checked = !soundEl.checked;
        soundEl.dispatchEvent(new Event('change'));
        renderStudioView(true);
      };
    }
  }

  // =========================================================================
  // 5. 按鈕與圖表強化 (編輯模式下使用)
  // =========================================================================
  function enhanceCompactButtons() {
    const en = isEn();
    const byId = id => document.getElementById(id);

    setBtnIcon(byId('add'), 'plus', en ? 'Pour-over' : '手沖', en ? 'New pour-over' : '新手沖');
    setBtnIcon(byId('aero'), 'plus', en ? 'AeroPress' : '愛樂壓', en ? 'New AeroPress' : '新愛樂壓');
    setBtnIcon(byId('copy'), 'copy', en ? 'Copy' : '複製', en ? 'Copy recipe' : '複製配方');

    const favBtn = byId('fav');
    if (favBtn) {
      const rec = (typeof db !== 'undefined' && typeof selected !== 'undefined' && Array.isArray(db.recipes))
        ? db.recipes.find(x => x.id === selected)
        : null;
      const rawFav = favBtn.textContent || '';
      const isFav = rec ? !!rec.favorite : (rawFav.includes('★') || /Saved|已收藏/i.test(rawFav));
      setBtnIcon(favBtn, isFav ? 'starFilled' : 'star', isFav ? (en ? 'Saved' : '已收藏') : (en ? 'Save' : '收藏'), en ? 'Toggle favorite' : '收藏配方');
    }

    setBtnIcon(byId('openChampionLibraryStudio'), 'trophy', en ? 'Champions' : '專家配方', en ? 'Browse expert recipes' : '挑選名家與世界賽配方');
    setBtnIcon(byId('openChampionLibraryGuide'), 'trophy', en ? 'Champions' : '專家配方', en ? 'Browse expert recipes' : '挑選名家與世界賽配方');
    setBtnIcon(byId('saveRecipe'), 'save', en ? 'Save' : '儲存', en ? 'Save recipe' : '儲存配方');

    const delRec = byId('deleteRecipe');
    if (delRec) {
      delRec.classList.add('cv-icon-danger');
      setBtnIcon(delRec, 'trash', '', en ? 'Delete recipe' : '刪除配方', true);
    }

    setBtnIcon(byId('compare'), 'compare', en ? 'Compare' : '比較', en ? 'Compare two cups' : '比較兩杯');
    const sortBtn = byId('logSortToggle');
    if (sortBtn) {
      if (!sortBtn.querySelector('.cv-btn-content')) {
        const rawSort = sortBtn.textContent || '';
        sortBtn.dataset.cvSortAsc = /舊\s*→\s*新|Oldest/i.test(rawSort) ? '1' : '0';
      }
      const isAsc = sortBtn.dataset.cvSortAsc === '1';
      setBtnIcon(
        sortBtn,
        'sort',
        isAsc ? (en ? 'Oldest' : '舊→新') : (en ? 'Newest' : '新→舊'),
        isAsc ? (en ? 'Sort: Oldest first' : '時間：舊 → 新') : (en ? 'Sort: Newest first' : '時間：新 → 舊')
      );
    }
    setBtnIcon(byId('addCupEntry'), 'plus', en ? 'Log brew' : '補記', en ? 'Log past brew' : '補記沖煮紀錄');

    const flowPrep = byId('flowPrepare');
    if (flowPrep) {
      for (const b of flowPrep.querySelectorAll('button')) {
        if (b.id === 'flowBegin' || b.id === 'openChampionLibraryGuide') continue;
        if (b.classList.contains('ws-scale-prep-btn')) {
          setBtnIcon(b, 'scale', en ? 'Scale water' : '縮放水量', en ? 'Scale water to dose' : '依粉量等比例縮放水量');
          continue;
        }
        const txt = (b.dataset.cvOrigText || b.textContent || '').trim();
        if (!b.dataset.cvOrigText && txt) b.dataset.cvOrigText = txt;
        if (/拍豆袋|Scan coffee/i.test(txt)) setBtnIcon(b, 'camera', en ? 'Scan' : '拍豆袋', en ? 'Scan coffee bag' : '拍豆袋新增');
        else if (/新增咖啡豆|Add coffee/i.test(txt)) setBtnIcon(b, 'plus', en ? 'Add' : '新增豆', en ? 'Add coffee' : '新增咖啡豆');
        else if (/器材|equipment/i.test(txt)) setBtnIcon(b, 'sliders', en ? 'Gear' : '器材', en ? 'Manage / add equipment' : '管理／新增器材');
      }

      const metricIcons = ['scale', 'droplet', 'thermometer', 'clock'];
      flowPrep.querySelectorAll('.flow-metric').forEach((box, idx) => {
        const span = box.querySelector(':scope > span');
        const iconKey = metricIcons[idx];
        if (!span || !iconKey) return;
        const labelTxt = (span.dataset.cvOrigText || span.textContent || '').trim();
        if (!span.dataset.cvOrigText && labelTxt) span.dataset.cvOrigText = labelTxt;
        const mKey = `${iconKey}|${labelTxt}|${en ? 'en' : 'zh'}`;
        if (span.dataset.cvMetricKey === mKey && span.querySelector('svg')) return;
        span.dataset.cvMetricKey = mKey;
        span.classList.add('cv-metric-label');
        span.innerHTML = `${UI_ICONS[iconKey]}<span>${esc(labelTxt)}</span>`;
      });
    }

    const ws = byId('coffeeWorkspace');
    const beanPanel = ws && ws.querySelector(':scope > div:nth-of-type(2)');
    if (beanPanel) {
      for (const b of beanPanel.querySelectorAll('button')) {
        if (b.closest('.cv-card-actions')) continue;
        const txt = (b.dataset.cvOrigText || b.textContent || '').trim();
        if (!b.dataset.cvOrigText && txt) b.dataset.cvOrigText = txt;
        if (/拍豆袋|Scan coffee/i.test(txt)) setBtnIcon(b, 'camera', en ? 'Scan bag' : '拍豆袋新增', en ? 'Scan coffee bag' : '拍豆袋新增');
        else if (/新增咖啡豆|Add coffee/i.test(txt)) setBtnIcon(b, 'plus', en ? 'Add coffee' : '新增咖啡豆', en ? 'Add coffee' : '新增咖啡豆');
      }
    }
  }

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

    const roastCount = roastDotsCount(r.roast);
    let roastDotsHtml = '';
    if (roastCount > 0) {
      for (let i = 1; i <= 5; i++) {
        roastDotsHtml += `<span class="cv-roast-dot ${i <= roastCount ? 'filled' : ''}"></span>`;
      }
    }
    const ratioStr = r.dose > 0 ? `1:${(summary.water / r.dose).toFixed(1)}` : '—';
    const postParts = [];
    if (summary.postWater > 0) postParts.push(`<span class="cv-spec-item cv-mono">+${summary.postWater}g ${L('後加水', 'Bypass')}</span>`);
    if (summary.postIce > 0) postParts.push(`<span class="cv-spec-item cv-mono">+${summary.postIce}g ${L('冰', 'Ice')}</span>`);

    chartContainer.innerHTML = `
      <div class="cv-chart-header">
        <div class="cv-chart-title">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
          <span>${L('分段注水曲線', 'Pouring Profile')}</span>
        </div>
        <span class="cv-mono" style="font-size:12px;color:var(--ink-2)">${summary.water}g · ${summary.total}s · ${ratioStr}</span>
      </div>
      ${buildBlueprintCurveSvg(r, summary, 440, 148)}
      <div class="cv-specs-line">
        <span class="cv-spec-item">${UI_ICONS.dripper}<span>${esc(r.dripper || r.method || '—')}</span></span>
        <span class="cv-spec-item cv-mono">${esc(r.dose)}g : ${summary.water}g (${ratioStr})</span>
        <span class="cv-spec-item cv-mono">${esc(r.temp)}°C</span>
        ${roastCount > 0 ? `<span class="cv-spec-item"><span class="cv-roast-dots">${roastDotsHtml}</span><span>${esc(r.roast)}</span></span>` : ''}
        ${postParts.join('')}
      </div>
    `;
  }

  // =========================================================================
  // 6. 引導沖煮：60 格機械計時盤
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

    const outerCirc = 508.94;
    const innerCirc = 439.82;
    const outerOffset = (outerCirc * (1 - stepRatio)).toFixed(1);
    const innerOffset = (innerCirc * (1 - totalRatio)).toFixed(1);

    const leftSec = Math.ceil(stepSec - stepElapsedSec);
    const centerTimeText = isManStep
      ? L('手動', 'Manual')
      : leftSec >= 0
        ? fmt(leftSec * 1000)
        : '+' + fmt(Math.abs(leftSec) * 1000);
    const centerSubText = isManStep
      ? `+${curStep.water || 0}g`
      : leftSec >= 0
        ? 'REMAINING'
        : 'OVERRUN';

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
          <svg class="cv-gauge-svg" viewBox="0 0 214 214">
            ${CHRONO_TICKS_HTML}
            <circle cx="107" cy="107" r="81" fill="none" stroke="var(--rule)" stroke-width="1.5"/>
            <circle id="cvOuterArc" cx="107" cy="107" r="81" fill="none" stroke="var(--accent)" stroke-width="3" stroke-dasharray="${outerCirc}" stroke-dashoffset="${outerOffset}" stroke-linecap="butt" transform="rotate(-90 107 107)"/>
            <circle cx="107" cy="107" r="70" fill="none" stroke="var(--rule)" stroke-width="1" stroke-dasharray="3 3"/>
            <circle id="cvInnerArc" cx="107" cy="107" r="70" fill="none" stroke="var(--ink-2)" stroke-width="1.6" stroke-dasharray="${innerCirc}" stroke-dashoffset="${innerOffset}" stroke-linecap="butt" transform="rotate(-90 107 107)"/>
          </svg>
          <div class="cv-gauge-center">
            <div style="color:var(--accent);margin-bottom:3px">${getActionSvg(curStep.type)}</div>
            <div id="cvGaugeTime" class="cv-mono" style="font-size:${isManStep ? '24px' : '36px'};font-weight:600;color:var(--ink);line-height:1.05;letter-spacing:-0.03em">${centerTimeText}</div>
            <div id="cvGaugeSub" class="cv-mono" style="font-size:10px;letter-spacing:0.12em;color:var(--ink-2);margin-top:5px">${centerSubText}</div>
          </div>
        </div>
        <div class="cv-telemetry-grid">
          <div class="cv-telemetry-cell">
            <div class="cv-telemetry-label">${L('本段目標', 'Step Add')}</div>
            <div class="cv-telemetry-val">${curStep.water ? `+${curStep.water}` : '0'}<span style="font-size:12px;font-weight:400;color:var(--ink-2)">g</span></div>
          </div>
          <div class="cv-telemetry-cell highlight">
            <div class="cv-telemetry-label">${L('累計萃取水', 'Brew Total')}</div>
            <div class="cv-telemetry-val">${cumWater}<span style="font-size:12px;font-weight:400;color:var(--ink-2)">g</span></div>
          </div>
          <div class="cv-telemetry-cell">
            <div class="cv-telemetry-label">${L('目標流速', 'Flow Rate')}</div>
            <div class="cv-telemetry-val">${flowRate}<span style="font-size:12px;font-weight:400;color:var(--ink-2)">${flowRate === '—' ? '' : 'g/s'}</span></div>
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
      if (gaugeRefs.innerArc.getAttribute('stroke-dashoffset') !== innerOffset) {
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
  // 7. 手札與豆單總覽（印刷規格列 + 雙欄總覽切換）
  // =========================================================================
  let lastSpecKey = '';
  let overviewActive = window.innerWidth >= 960;

  function ensureJournalHeader() {
    const historySec = document.getElementById('history');
    if (!historySec) return;
    historySec.classList.add('cv-journal-enhanced');

    let headerBox = document.getElementById('cvJournalHeader');
    if (!headerBox) {
      headerBox = document.createElement('section');
      headerBox.id = 'cvJournalHeader';
      headerBox.className = 'cv-journal-header';
      headerBox.setAttribute('data-coffee-user-text', 'true');
      historySec.prepend(headerBox);
    }

    const cups = (typeof db !== 'undefined' && Array.isArray(db.cups)) ? db.cups : [];
    const beansList = (typeof db !== 'undefined' && db.beanCatalog && Array.isArray(db.beanCatalog.items))
      ? db.beanCatalog.items.filter(b => b.active)
      : [];

    const avgRating = cups.length
      ? (cups.reduce((acc, c) => acc + (Number(c.rating) || 0), 0) / cups.length).toFixed(1)
      : '—';
    const dripCounts = {};
    for (const c of cups) {
      const d = (c.recipe && (c.recipe.dripper || c.recipe.method)) || '';
      if (d) dripCounts[d] = (dripCounts[d] || 0) + 1;
    }
    const topDripper = Object.entries(dripCounts).sort((a, b) => b[1] - a[1])[0]?.[0]
      || ((typeof read === 'function' && read().dripper) || 'OREA V4');

    const key = JSON.stringify([cups.length, avgRating, beansList.length, topDripper, document.documentElement.lang]);
    if (key !== lastSpecKey) {
      lastSpecKey = key;
      headerBox.innerHTML = `
        <div style="display:flex;justify-content:space-between;align-items:flex-end;flex-wrap:wrap;gap:12px;">
          <div>
            <div class="cv-kicker">TASTING ARCHIVE &amp; ROASTERY LEDGER</div>
            <div class="cv-serif" style="font-size:clamp(1.28rem,2.4vw,1.5rem);font-weight:600;color:var(--ink);margin-top:3px;">${L('我的咖啡手札與豆單', 'My Coffee Journal & Beans')}</div>
          </div>
          <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">
            <button type="button" class="cv-hair-btn" id="cvJournalCompareBtn">${UI_ICONS.compare}<span>${L('雙杯比較', 'Compare')}</span></button>
            <button type="button" class="cv-hair-btn accent" id="cvJournalAddCupBtn">${UI_ICONS.plus}<span>${L('補記沖煮', 'Log brew')}</span></button>
          </div>
        </div>
        <div class="cv-spec-bar cv-mono">
          <span class="cv-spec-stat"><strong>${cups.length}</strong>${L('BREWS RECORDED', 'BREWS RECORDED')}</span>
          <span class="cv-spec-sep">/</span>
          <span class="cv-spec-stat"><strong>${esc(avgRating)}</strong>AVG RATING</span>
          <span class="cv-spec-sep">/</span>
          <span class="cv-spec-stat"><strong>${beansList.length}</strong>ACTIVE BEANS</span>
          <span class="cv-spec-sep">/</span>
          <span class="cv-spec-stat"><strong>${esc(topDripper)}</strong>FAVORITE DRIPPER</span>
        </div>
      `;
      const cmpBtn = document.getElementById('cvJournalCompareBtn');
      const addCupBtn = document.getElementById('cvJournalAddCupBtn');
      if (cmpBtn) cmpBtn.onclick = () => document.getElementById('compare')?.click();
      if (addCupBtn) addCupBtn.onclick = () => document.getElementById('addCupEntry')?.click();
    }

    // 在 #coffeeWorkspace .workspace-tabs 掛入「全部總覽」按鈕（桌機與平板橫向預設雙欄對照）
    const wsTabs = document.querySelector('#coffeeWorkspace .workspace-tabs');
    if (wsTabs) {
      let ovBtn = document.getElementById('cvWorkspaceOverviewTab');
      if (!ovBtn) {
        ovBtn = document.createElement('button');
        ovBtn.type = 'button';
        ovBtn.id = 'cvWorkspaceOverviewTab';
        ovBtn.setAttribute('data-coffee-user-text', 'true');
        wsTabs.prepend(ovBtn);
        ovBtn.onclick = () => {
          overviewActive = true;
          syncOverviewMode();
        };
        for (const subBtn of wsTabs.querySelectorAll('button:not(#cvWorkspaceOverviewTab)')) {
          subBtn.addEventListener('click', () => {
            overviewActive = false;
            syncOverviewMode();
          });
        }
      }
      ovBtn.textContent = L('雙欄總覽', 'Overview');
      ovBtn.hidden = window.innerWidth < 960;
      syncOverviewMode();
    }
  }

  function syncOverviewMode() {
    const historySec = document.getElementById('history');
    const ovBtn = document.getElementById('cvWorkspaceOverviewTab');
    const wsTabs = document.querySelector('#coffeeWorkspace .workspace-tabs');
    if (!historySec) return;
    const activeOverview = overviewActive && window.innerWidth >= 960;
    historySec.classList.toggle('cv-overview-active', activeOverview);
    if (ovBtn) {
      ovBtn.setAttribute('aria-pressed', String(activeOverview));
      if (wsTabs) {
        const subBtns = Array.from(wsTabs.querySelectorAll('button:not(#cvWorkspaceOverviewTab)'));
        if (activeOverview) {
          for (const b of subBtns) b.setAttribute('aria-pressed', 'false');
        } else if (subBtns.length && !subBtns.some(b => b.getAttribute('aria-pressed') === 'true')) {
          subBtns[0].click();
        }
      }
    }
  }

  // =========================================================================
  // 8. 五角風味雷達圖 ＋ 烘焙產地小卡 ＋ 手札紀錄列
  // =========================================================================
  function buildRadarSvg(cupA, cupB = null, size = 128) {
    const cx = 75, cy = 78, maxR = 50;
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
      return `<polygon points="${pts}" fill="none" stroke="${level === 5 ? 'var(--rule-strong)' : 'var(--rule)'}" stroke-width="1"/>`;
    }).join('');

    const spokes = axes.map((a, i) => {
      const end = pt(i, 5);
      const labelPos = pt(i, 6.45).split(',');
      return `<line x1="${cx}" y1="${cy}" x2="${end.split(',')[0]}" y2="${end.split(',')[1]}" stroke="var(--rule)" stroke-width="1"/>
              <text x="${labelPos[0]}" y="${Number(labelPos[1]) + 3.5}" fill="var(--ink-2)" font-size="10" text-anchor="middle">${a.label}</text>`;
    }).join('');

    const polyA = axes.map((a, i) => pt(i, getVal(cupA, a.key))).join(' ');
    const dotsA = axes.map((a, i) => {
      const val = getVal(cupA, a.key);
      if (val <= 0) return '';
      const [px, py] = pt(i, val).split(',');
      return `<circle cx="${px}" cy="${py}" r="2.5" fill="var(--accent)"/>`;
    }).join('');

    let polyBHtml = '';
    if (cupB) {
      const polyB = axes.map((a, i) => pt(i, getVal(cupB, a.key))).join(' ');
      polyBHtml = `<polygon points="${polyB}" fill="var(--cup-b)" fill-opacity="0.16" stroke="var(--cup-b)" stroke-width="1.6" stroke-dasharray="4 3"/>`;
    }

    return `<svg width="${size}" height="${size}" viewBox="0 0 150 150" style="display:block;margin:0 auto">
      ${rings}${spokes}${polyBHtml}
      <polygon points="${polyA}" fill="var(--accent)" fill-opacity="0.18" stroke="var(--accent)" stroke-width="1.8"/>
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
    ensureJournalHeader();
    if (typeof db === 'undefined' || !Array.isArray(db.cups)) return;
    const entriesRoot = document.getElementById('entries');
    if (!entriesRoot) return;
    const searchInput = document.getElementById('search');
    const q = (searchInput ? searchInput.value : '').trim().toLowerCase();
    const list = db.cups.filter(c => JSON.stringify(c).toLowerCase().includes(q));
    const en = isEn();
    const langKey = document.documentElement.lang;

    Array.from(entriesRoot.children).forEach((card, idx) => {
      const cup = card.dataset.cupId ? db.cups.find(c => c.id === card.dataset.cupId) : list[idx];
      if (!cup) return;

      let rawInfoP = card.querySelector('p.cv-raw-hidden');
      const smallEl = card.querySelector('small');
      if (!rawInfoP && smallEl && smallEl.nextElementSibling && smallEl.nextElementSibling.tagName === 'P' && !smallEl.nextElementSibling.hasAttribute('data-coffee-user-text')) {
        rawInfoP = smallEl.nextElementSibling;
        rawInfoP.classList.add('cv-raw-hidden');
      }
      let chipsRow = card.querySelector('.cv-cup-chips');
      if (!chipsRow || chipsRow.dataset.lang !== langKey) {
        if (chipsRow) chipsRow.remove();
        chipsRow = document.createElement('div');
        chipsRow.className = 'cv-cup-chips';
        chipsRow.dataset.lang = langKey;
        chipsRow.setAttribute('data-coffee-user-text', 'true');
        const r = cup.recipe || {};
        const sum = typeof m === 'function' ? m(r) : { water: 0 };
        const dur = typeof fmt === 'function' ? fmt((Number(cup.seconds) || 0) * 1000) : `${cup.seconds || 0}s`;
        const specs = [];
        if (r.bean) specs.push(`<span class="cv-cup-inline-spec">${UI_ICONS.bean}<span>${esc(r.bean)}</span></span>`);
        if (r.dripper || r.method) specs.push(`<span class="cv-cup-inline-spec">${UI_ICONS.dripper}<span>${esc(r.dripper || r.method)}</span></span>`);
        specs.push(`<span class="cv-cup-inline-spec cv-mono">${esc(r.dose)}g / ${esc(sum.water)}g</span>`);
        specs.push(`<span class="cv-cup-inline-spec cv-mono">${esc(r.temp)}°C · ${esc(dur)}</span>`);
        specs.push(`<span class="cv-cup-inline-spec accent cv-mono">${UI_ICONS.starFilled}<span>${esc(cup.rating)}/5 · ${esc(cup.strength)}</span></span>`);
        chipsRow.innerHTML = specs.join('<span style="opacity:0.4">·</span>');
        if (smallEl) smallEl.after(chipsRow);
        else card.prepend(chipsRow);
      }

      let radarBox = card.querySelector('.cv-radar-box');
      if (!radarBox || radarBox.dataset.lang !== langKey) {
        if (radarBox) radarBox.remove();
        radarBox = document.createElement('div');
        radarBox.className = 'cv-radar-box';
        radarBox.dataset.lang = langKey;
        radarBox.setAttribute('data-coffee-user-text', 'true');
        radarBox.innerHTML = buildRadarSvg(cup) + buildFlavorBarsHtml(cup);
        const detailsEl = card.querySelector('details');
        if (detailsEl) detailsEl.before(radarBox);
        else card.append(radarBox);
      }

      let actionRow = card.querySelector('.cv-card-actions');
      if (!actionRow || actionRow.dataset.lang !== langKey) {
        if (!actionRow) {
          actionRow = document.createElement('div');
          actionRow.className = 'cv-card-actions';
          actionRow.setAttribute('data-coffee-user-text', 'true');
        }
        actionRow.dataset.lang = langKey;
        const bar = card.querySelector('.ws-cup-bar');
        const directDel = Array.from(card.children).find(el => el.tagName === 'BUTTON');
        if (bar) {
          for (const b of Array.from(bar.querySelectorAll('button'))) {
            const orig = (b.dataset.cvOrigText || b.textContent || '').trim();
            if (!b.dataset.cvOrigText && orig) b.dataset.cvOrigText = orig;
            if (/編輯|Edit/i.test(orig)) setBtnIcon(b, 'edit', en ? 'Edit' : '編輯', en ? 'Edit entry' : '編輯紀錄');
            else if (/分享|Share/i.test(orig)) setBtnIcon(b, 'share', en ? 'Share' : '分享', en ? 'Share card' : '產生分享卡');
            else if (/另存|Save as/i.test(orig)) setBtnIcon(b, 'bookmark', en ? 'Save' : '另存', en ? 'Save as recipe' : '另存為配方');
            actionRow.append(b);
          }
          bar.remove();
        } else {
          for (const b of actionRow.querySelectorAll('button')) {
            const orig = (b.dataset.cvOrigText || '').trim();
            if (/編輯|Edit/i.test(orig)) setBtnIcon(b, 'edit', en ? 'Edit' : '編輯', en ? 'Edit entry' : '編輯紀錄');
            else if (/分享|Share/i.test(orig)) setBtnIcon(b, 'share', en ? 'Share' : '分享', en ? 'Share card' : '產生分享卡');
            else if (/另存|Save as/i.test(orig)) setBtnIcon(b, 'bookmark', en ? 'Save' : '另存', en ? 'Save as recipe' : '另存為配方');
            else if (b.classList.contains('cv-icon-danger')) setBtnIcon(b, 'trash', '', en ? 'Delete entry' : '刪除紀錄', true);
          }
        }
        if (directDel) {
          directDel.dataset.cvOrigText = directDel.textContent || '';
          directDel.classList.add('cv-icon-danger');
          setBtnIcon(directDel, 'trash', '', en ? 'Delete entry' : '刪除紀錄', true);
          actionRow.append(directDel);
        }
        card.append(actionRow);
      }
    });
  }

  function enhanceBeanCatalogDots() {
    ensureJournalHeader();
    const ws = document.getElementById('coffeeWorkspace');
    if (!ws || typeof db === 'undefined' || !db.beanCatalog || !Array.isArray(db.beanCatalog.items)) return;
    const beanPanel = ws.querySelector(':scope > div:nth-of-type(2)');
    if (!beanPanel) return;
    const en = isEn();
    const langKey = document.documentElement.lang;

    // 打包豆庫上方按鈕在同一列，不撐滿整個欄位寬度
    let btnWrap = beanPanel.querySelector(':scope > .cv-bean-actions-wrap');
    if (!btnWrap) {
      const topBtns = Array.from(beanPanel.querySelectorAll(':scope > button'));
      if (topBtns.length) {
        btnWrap = document.createElement('div');
        btnWrap.className = 'cv-bean-actions-wrap';
        btnWrap.style.cssText = 'display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px;margin-bottom:4px;';
        btnWrap.setAttribute('data-coffee-user-text', 'true');
        const kicker = document.createElement('span');
        kicker.className = 'cv-kicker';
        kicker.id = 'cvBeanPanelKicker';
        const btnGroup = document.createElement('div');
        btnGroup.style.cssText = 'display:flex;align-items:center;gap:6px;flex-wrap:wrap;';
        for (const b of topBtns) {
          b.style.width = 'auto';
          b.style.margin = '0';
          btnGroup.append(b);
        }
        btnWrap.append(kicker, btnGroup);
        beanPanel.prepend(btnWrap);
      }
    }
    const kickerEl = document.getElementById('cvBeanPanelKicker');
    if (kickerEl) kickerEl.textContent = L('ACTIVE ROASTS · 常駐豆單', 'ACTIVE ROASTS');

    const beanBoxes = Array.from(beanPanel.querySelectorAll(':scope > article.box'));
    const beans = db.beanCatalog.items;
    beanBoxes.forEach((box, idx) => {
      const b = beans[idx];
      if (!b) return;
      box.classList.add('cv-roaster-card');
      box.style.setProperty('--roast-stripe', roastStripeColor(b.roast));

      if (!box.querySelector('.cv-bean-roast-row')) {
        const dots = roastDotsCount(b.roast);
        if (dots > 0) {
          let dotsHtml = '';
          for (let i = 1; i <= 5; i++) dotsHtml += `<span class="cv-roast-dot ${i <= dots ? 'filled' : ''}"></span>`;
          const row = document.createElement('div');
          row.className = 'cv-bean-roast-row cv-specs-line';
          row.style.marginTop = '6px';
          row.style.paddingTop = '6px';
          row.setAttribute('data-coffee-user-text', 'true');
          row.innerHTML = `<span class="cv-spec-item"><span class="cv-roast-dots">${dotsHtml}</span><span>${esc(b.roast)}</span></span>`;
          const metaP = box.querySelector('p');
          if (metaP) metaP.after(row);
        }
      }
      let actionRow = box.querySelector('.cv-card-actions');
      if (!actionRow || actionRow.dataset.lang !== langKey) {
        if (!actionRow) {
          actionRow = document.createElement('div');
          actionRow.className = 'cv-card-actions';
          actionRow.setAttribute('data-coffee-user-text', 'true');
          for (const btn of Array.from(box.querySelectorAll(':scope > button'))) {
            btn.dataset.cvOrigText = (btn.textContent || '').trim();
            actionRow.append(btn);
          }
          box.append(actionRow);
        }
        actionRow.dataset.lang = langKey;
        for (const btn of actionRow.querySelectorAll('button')) {
          const orig = (btn.dataset.cvOrigText || btn.textContent || '').trim();
          if (/編輯|Edit/i.test(orig)) setBtnIcon(btn, 'edit', en ? 'Edit' : '編輯', en ? 'Edit coffee' : '編輯咖啡豆');
          else if (/啟用|Activate/i.test(orig)) setBtnIcon(btn, 'unarchive', '', en ? 'Activate' : '啟用咖啡豆', true);
          else if (/封存|Archive/i.test(orig)) setBtnIcon(btn, 'archive', '', en ? 'Archive' : '封存咖啡豆', true);
        }
      }
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
      <div style="display:flex;flex-wrap:wrap;justify-content:center;gap:12px 18px;font-size:12.5px;color:var(--ink-2);margin-top:8px">
        <span style="color:var(--accent)">━━ ${L('第一杯：', 'Cup 1: ')}${esc(cups[0].recipe.name)}</span>
        <span style="color:var(--cup-b)">┅┅ ${L('第二杯：', 'Cup 2: ')}${esc(cups[1].recipe.name)}</span>
      </div>
    `;
    comp.prepend(wrap);
  }

  // =========================================================================
  // 9. 掛載與生命週期綁定
  // =========================================================================
  function initVisualUI() {
    applyTheme(currentTheme, false);
    ensureHeaderLayout();
    updateSyncPill();
    enhanceCompactButtons();
    renderStudioView();
    renderRecipeWaterChart();
    renderActiveBrewGauge();
    enhanceJournalEntries();
    enhanceBeanCatalogDots();

    if (typeof window.logs === 'function' && !window.logs._cvWrapped) {
      const origLogs = window.logs;
      const wrappedLogs = function (...args) {
        const res = origLogs.apply(this, args);
        enhanceCompactButtons();
        enhanceJournalEntries();
        enhanceBeanCatalogDots();
        return res;
      };
      wrappedLogs._cvWrapped = true;
      window.logs = wrappedLogs;
    }

    const compareBtn = document.getElementById('compare');
    if (compareBtn && !compareBtn._cvWrapped) {
      const origCompare = compareBtn.onclick;
      compareBtn.onclick = function (e) {
        if (origCompare) origCompare.call(this, e);
        enhanceComparisonRadar();
      };
      compareBtn._cvWrapped = true;
    }

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
      new MutationObserver(() => {
        enhanceCompactButtons();
        enhanceBeanCatalogDots();
      }).observe(wsBeanPanel, { childList: true });
    }

    window.addEventListener('resize', () => {
      const ovBtn = document.getElementById('cvWorkspaceOverviewTab');
      if (ovBtn) ovBtn.hidden = window.innerWidth < 960;
      syncOverviewMode();
    });

    if (typeof window.addEventListener === 'function') {
      window.addEventListener('coffee-grinder-change', () => {
        renderStudioView(true);
      });
    }

    let lastLang = document.documentElement.lang;
    new MutationObserver(() => {
      if (document.documentElement.lang !== lastLang) {
        lastLang = document.documentElement.lang;
        updateThemeButton();
        updateSyncPill();
        enhanceCompactButtons();
        renderStudioView(true);
        renderRecipeWaterChart();
        renderActiveBrewGauge();
        enhanceJournalEntries();
        enhanceBeanCatalogDots();
        if (document.querySelector('#comparison .cv-compare-radar')) enhanceComparisonRadar();
      }
    }).observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });

    setInterval(() => {
      updateSyncPill();
      enhanceCompactButtons();
      renderStudioView();
      renderRecipeWaterChart();
      renderActiveBrewGauge();
    }, 250);

    document.documentElement.classList.remove('cv-booting');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initVisualUI);
  } else {
    initVisualUI();
  }
})();
