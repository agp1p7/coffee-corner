// coffee-onboarding.js
// 新手教學與使用說明（4 步互動導覽 + 快捷前往按鈕）
(function () {
  'use strict';
  if (typeof document === 'undefined' || document.getElementById('coffeeOnboardingDialog')) return;

  const STORAGE_KEY = 'yiyu-coffee-onboarding-seen-v1';
  const isEn = () => document.documentElement.lang === 'en';
  const L = (zh, en) => (isEn() ? en : zh);
  const esc = s => String(s ?? '').replace(/[&<>"']/g, ch => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]
  ));

  const STEPS = [
    {
      num: '01',
      tagZh: '沖煮台一條龍',
      tagEn: 'One-Stop Brew Deck',
      titleZh: '從「沖煮台」直接選配方、調粉量水溫、換磨豆機',
      titleEn: 'Pick recipes, tweak dose/temp & switch grinders in one place',
      descZh: '所有沖煮準備都在「沖煮台」完成！不用切去別的分頁，點粉量或水溫數字、換豆／換器材按鈕就能直接調整這杯。',
      descEn: 'Everything before pouring lives right on the Brew tab—tap DOSE or TEMP tiles, swap beans/gear, or load 43 champion recipes.',
      bulletsZh: [
        '點「🏆 專家配方」挑選 43 支手沖／愛樂壓／浸泡配方，或點粉量「15g／17g／20g／縮放」與水溫格立即調整。',
        '點右側「換豆／換器材／拍豆袋」快速配好豆單與濾杯、磨豆機，曲線圖旁可切換 13 款磨豆機換算刻度。',
        '只有在需要修改分段注水秒數與水流步驟時，才需要點右上角「編輯配方」。'
      ],
      bulletsEn: [
        'Tap "🏆 Champions" to browse 43 pour-over/AeroPress recipes, or tap DOSE / TEMP tiles to adjust weights and temperature inline.',
        'Use "Beans / Gear / Scan" right on the deck and switch among 13 mainstream grinders for instant dial + micron settings.',
        'Tap "Edit" only when you want to customize pour steps or create a saved recipe.'
      ],
      actionZh: '🏆 開啟名家／冠軍配方庫 →',
      actionEn: '🏆 Open Champion Recipes →',
      runAction: () => {
        const btn = document.getElementById('openChampionLibraryStudio') || document.getElementById('cvStudioChampBtn');
        if (btn) btn.click();
      }
    },
    {
      num: '02',
      tagZh: '豆庫與常見器材',
      tagEn: 'Beans & Common Gear',
      titleZh: '建好咖啡豆庫，31 款常見器材一鍵加入',
      titleEn: 'Catalog your beans & quick-add 31 common drippers/grinders',
      descZh: '在「我的咖啡」建檔常喝豆子與器材，選好後之後沖煮都能直接帶入、也不用重複輸入刻度單位。',
      descEn: 'Save your beans and equipment once under My Coffee—every brew automatically tracks them and matches your grinder.',
      bulletsZh: [
        '在「我的咖啡 → 咖啡豆」可手動新增，或登入 Google 後用「📷 拍豆袋辨識」AI 自動填入豆名、焙度與風味。',
        '在「我的器材」內建 18 款常見濾杯與 13 款主流磨豆機，點一下即可「⚡ 一鍵快速加入」。',
        '配方只要指定了你的磨豆機，推薦刻度會自動切換成該機型的刻度與參考微米。'
      ],
      bulletsEn: [
        'In "My coffee → Coffee beans", add manually or use "📷 Snap bag" AI label scanning (Google sign-in required).',
        'Under "Equipment", 1-tap quick-add from 18 common drippers and 13 mainstream grinders.',
        'Selecting your grinder in any recipe automatically converts recommended grind dials.'
      ],
      actionZh: '☕ 前往我的咖啡（豆庫／器材）→',
      actionEn: '☕ Go to My Coffee (Beans & Gear) →',
      runAction: () => {
        const tab = document.querySelector('nav button[data-tab="history"]');
        if (tab) tab.click();
      }
    },
    {
      num: '03',
      tagZh: '開始沖煮與紀錄',
      tagEn: 'Brew & Journal',
      titleZh: '按下「開始沖煮」專注計時，寫下「下次只改一件事」',
      titleEn: 'Tap Start Brewing for focused timer & tasting notes',
      descZh: '準備好粉水後直接點右側「開始沖煮」，App 會進入全螢幕引導計時；喝完立刻記下口感與調整方向。',
      descEn: 'Hit Start Brewing on the Brew tab for step-by-step countdowns and audio cues, then save flavor + one next tweak.',
      bulletsZh: [
        '計時畫面有大字倒數、提示音與手動確認（Bypass／加冰），右上角也能點返回回到沖煮台。',
        '沖煮中可記「實際斷水」時點，結束後評分酸甜苦厚並寫下一句「下次只改一件事」。',
        '在「我的咖啡 → 沖煮紀錄」勾選兩杯點「比較兩杯」，可看五角雷達圖與參數對照；也可隨時「＋補記紀錄」。'
      ],
      bulletsEn: [
        'Audio-cued pours with manual pauses for bypass/ice, plus a quick Back to Brew button anytime.',
        'Log actual pouring pauses and record flavor scores plus one tweak for next time.',
        'Select any 2 brews in "Brew journal" to compare side-by-side with a 5-axis flavor radar.'
      ],
      actionZh: '☕ 回到沖煮台開始 →',
      actionEn: '☕ Go to Brew Deck →',
      runAction: () => {
        const tab = document.querySelector('nav button[data-tab="brew"]');
        if (tab) tab.click();
      }
    },
    {
      num: '04',
      tagZh: '分享與雲端同步',
      tagEn: 'Share & Cloud Sync',
      titleZh: '一鍵分享配方與圖卡，跨裝置雲端同步',
      titleEn: 'Share recipes, brew cards, and sync across devices',
      descZh: '想把順口的配方傳給朋友、發限動打卡，或是在手機／平板／電腦間無縫接軌使用，都在這裡搞定。',
      descEn: 'Send recipes by link or JSON, export square/story tasting cards, and keep all devices synced via Google.',
      bulletsZh: [
        '分享配方：在工作室展開「編輯配方」（或編輯器下方）點「分享配方」，可複製精簡連結或匯出單一配方 JSON 檔（含或不含豆單與備註自選）。',
        '產生分享圖卡：在沖煮紀錄點「產生分享卡」，可輸出方形貼文或直式限時動態 PNG 圖片。',
        '跨裝置同步：點「設定」登入 Google 即自動雙向同步；支援離線打開 App 查看配方與計時，也能隨時手動匯出 JSON 備份。'
      ],
      bulletsEn: [
        'Share a recipe: open Recipe Editor and tap "Share recipe" for a compact URL or single-recipe JSON file.',
        'Brew Cards: tap "Share card" on any journal entry to export a square post or portrait story PNG.',
        'Cross-device sync: sign in with Google in Settings for two-way sync; offline viewing and timing also work automatically.'
      ],
      actionZh: '☁️ 前往設定（雲端同步／備份）→',
      actionEn: '☁️ Go to Settings (Sync & Backup) →',
      runAction: () => {
        const tab = document.querySelector('nav button[data-tab="settings"]');
        if (tab) tab.click();
        const box = document.getElementById('cloudSyncBox');
        if (box) setTimeout(() => box.scrollIntoView({ behavior: 'smooth', block: 'center' }), 80);
      }
    }
  ];

  if (!document.getElementById('coffeeOnboardingStyle')) {
    const style = document.createElement('style');
    style.id = 'coffeeOnboardingStyle';
    style.textContent = String.raw`
      #coffeeOnboardingDialog {
        box-sizing: border-box;
        width: min(640px, calc(100vw - 24px)) !important;
        max-width: calc(100vw - 24px) !important;
        max-height: 90vh;
        overflow: auto;
        padding: 20px !important;
        border-radius: 8px !important;
        background: var(--bg, #171512) !important;
        color: var(--ink, #ECE8E0) !important;
        border: 1px solid var(--rule-strong, rgba(236, 232, 224, 0.22)) !important;
        box-shadow: 0 24px 64px rgba(0, 0, 0, 0.65);
      }
      #coffeeOnboardingDialog::backdrop {
        background: rgba(10, 9, 8, 0.72);
        backdrop-filter: blur(4px);
      }
      .onb-head {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 10px;
        padding-bottom: 12px;
        border-bottom: 1px solid var(--rule, rgba(236, 232, 224, 0.12));
      }
      .onb-step-tabs {
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
        align-items: center;
      }
      .onb-step-pill {
        margin: 0 !important;
        min-height: 30px !important;
        padding: 3px 10px !important;
        font-size: 12px !important;
        border-radius: 4px !important;
        background: var(--surface, #211E1A) !important;
        color: var(--ink-2, #A8A095) !important;
        border: 1px solid var(--rule, rgba(236, 232, 224, 0.14)) !important;
        font-family: 'JetBrains Mono', 'Noto Sans TC', monospace;
      }
      .onb-step-pill[aria-current="step"] {
        background: var(--accent, #D98A4E) !important;
        color: var(--accent-ink, #140E09) !important;
        border-color: var(--accent, #D98A4E) !important;
        font-weight: 700 !important;
      }
      .onb-skip-btn {
        margin: 0 !important;
        min-height: 32px !important;
        padding: 4px 10px !important;
        font-size: 12.5px !important;
        border-radius: 4px !important;
        background: transparent !important;
        color: var(--ink-2, #A8A095) !important;
        border: 1px solid var(--rule, rgba(236, 232, 224, 0.16)) !important;
        white-space: nowrap;
      }
      .onb-body {
        padding: 16px 0 12px;
        display: grid;
        gap: 12px;
      }
      .onb-kicker {
        font-family: 'JetBrains Mono', 'Noto Sans TC', monospace;
        font-size: 11.5px;
        letter-spacing: 0.12em;
        text-transform: uppercase;
        color: var(--accent, #D98A4E);
      }
      .onb-title {
        margin: 0;
        font-size: 1.28rem;
        line-height: 1.35;
        color: var(--ink, #ECE8E0);
      }
      .onb-desc {
        margin: 0;
        font-size: 14px;
        line-height: 1.65;
        color: var(--ink-2, #A8A095);
      }
      .onb-bullets {
        margin: 0;
        padding: 12px 14px 12px 30px;
        border-radius: 6px;
        background: var(--surface, #211E1A);
        border: 1px solid var(--rule, rgba(236, 232, 224, 0.12));
        display: grid;
        gap: 8px;
        font-size: 13.5px;
        line-height: 1.6;
        color: var(--ink, #ECE8E0);
      }
      .onb-quick-wrap {
        display: flex;
        justify-content: flex-start;
      }
      .onb-quick-btn {
        margin: 0 !important;
        min-height: 38px !important;
        padding: 6px 14px !important;
        font-size: 13.5px !important;
        font-weight: 600 !important;
        border-radius: 4px !important;
        background: var(--accent-soft, rgba(217, 138, 78, 0.14)) !important;
        border: 1px solid var(--accent-border, rgba(217, 138, 78, 0.45)) !important;
        color: var(--accent, #D98A4E) !important;
      }
      .onb-quick-btn:hover {
        background: var(--accent, #D98A4E) !important;
        color: var(--accent-ink, #140E09) !important;
      }
      .onb-foot {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 10px;
        padding-top: 12px;
        border-top: 1px solid var(--rule, rgba(236, 232, 224, 0.12));
      }
      .onb-foot button {
        margin: 0 !important;
        min-height: 40px !important;
        padding: 7px 16px !important;
        font-size: 14px !important;
        border-radius: 4px !important;
      }
      .onb-next-btn {
        background: var(--accent, #D98A4E) !important;
        color: var(--accent-ink, #140E09) !important;
        border-color: var(--accent, #D98A4E) !important;
        font-weight: 700 !important;
      }
      html body button#cvGuideHelpBtn {
        min-height: 32px !important;
        min-width: 32px !important;
        padding: 4px 9px !important;
        border-radius: 4px !important;
        background: var(--surface, #211E1A) !important;
        border: 1px solid var(--rule-strong, rgba(236, 232, 224, 0.2)) !important;
        color: var(--ink-2, #A8A095) !important;
        font-family: 'JetBrains Mono', sans-serif !important;
        font-size: 12.5px !important;
        font-weight: 600 !important;
        margin: 0 !important;
      }
      html body button#cvGuideHelpBtn:hover {
        border-color: var(--accent, #D98A4E) !important;
        color: var(--accent, #D98A4E) !important;
      }
      #openOnboardingGuide {
        margin: 8px 0 4px !important;
        font-size: 14px !important;
        font-weight: 600 !important;
      }
      @media (max-width: 599px) {
        #coffeeOnboardingDialog {
          padding: 15px !important;
        }
        .onb-title {
          font-size: 1.12rem;
        }
        .onb-step-pill {
          padding: 3px 8px !important;
          font-size: 11px !important;
        }
      }
    `;
    document.head.append(style);
  }

  let stepIdx = 0;
  const dialog = document.createElement('dialog');
  dialog.id = 'coffeeOnboardingDialog';
  dialog.setAttribute('data-coffee-user-text', 'true');
  document.body.append(dialog);

  function markSeen() {
    try {
      localStorage.setItem(STORAGE_KEY, '1');
    } catch (e) {}
  }

  dialog.addEventListener('cancel', () => markSeen());

  function renderDialog() {
    const en = isEn();
    const s = STEPS[stepIdx] || STEPS[0];
    const isFirst = stepIdx === 0;
    const isLast = stepIdx === STEPS.length - 1;

    dialog.replaceChildren();

    const head = document.createElement('div');
    head.className = 'onb-head';
    const tabs = document.createElement('div');
    tabs.className = 'onb-step-tabs';
    STEPS.forEach((item, i) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'onb-step-pill';
      if (i === stepIdx) b.setAttribute('aria-current', 'step');
      b.textContent = `${item.num} ${en ? item.tagEn : item.tagZh}`;
      b.onclick = () => {
        stepIdx = i;
        renderDialog();
      };
      tabs.append(b);
    });
    const skipBtn = document.createElement('button');
    skipBtn.type = 'button';
    skipBtn.className = 'onb-skip-btn';
    skipBtn.textContent = en ? 'Skip ✕' : '略過 ✕';
    skipBtn.onclick = () => {
      markSeen();
      dialog.close();
    };
    head.append(tabs, skipBtn);

    const body = document.createElement('div');
    body.className = 'onb-body';
    const bullets = en ? s.bulletsEn : s.bulletsZh;
    body.innerHTML = `
      <div class="onb-kicker">STEP ${s.num} / 0${STEPS.length} · ${esc(en ? s.tagEn : s.tagZh)}</div>
      <h2 class="onb-title">${esc(en ? s.titleEn : s.titleZh)}</h2>
      <p class="onb-desc">${esc(en ? s.descEn : s.descZh)}</p>
      <ul class="onb-bullets">${bullets.map(line => `<li>${esc(line)}</li>`).join('')}</ul>
    `;

    const quickWrap = document.createElement('div');
    quickWrap.className = 'onb-quick-wrap';
    const quickBtn = document.createElement('button');
    quickBtn.type = 'button';
    quickBtn.className = 'onb-quick-btn';
    quickBtn.textContent = en ? s.actionEn : s.actionZh;
    quickBtn.onclick = () => {
      markSeen();
      dialog.close();
      if (typeof s.runAction === 'function') s.runAction();
    };
    quickWrap.append(quickBtn);
    body.append(quickWrap);

    const foot = document.createElement('div');
    foot.className = 'onb-foot';
    const prevBtn = document.createElement('button');
    prevBtn.type = 'button';
    prevBtn.textContent = en ? '← Previous' : '← 上一步';
    prevBtn.disabled = isFirst;
    prevBtn.onclick = () => {
      if (stepIdx > 0) {
        stepIdx--;
        renderDialog();
      }
    };

    const nextBtn = document.createElement('button');
    nextBtn.type = 'button';
    nextBtn.className = 'onb-next-btn';
    nextBtn.textContent = isLast
      ? (en ? 'Start brewing ✓' : '開始使用 ✓')
      : (en ? 'Next step →' : '下一步 →');
    nextBtn.onclick = () => {
      if (isLast) {
        markSeen();
        dialog.close();
      } else {
        stepIdx++;
        renderDialog();
      }
    };
    foot.append(prevBtn, nextBtn);

    dialog.append(head, body, foot);
  }

  function openGuide(startStep = 0) {
    stepIdx = Math.max(0, Math.min(STEPS.length - 1, startStep));
    renderDialog();
    if (!dialog.open) dialog.showModal();
    dialog.scrollTop = 0;
  }

  function mountTriggers() {
    const actions = document.querySelector('#cvHeaderBar .cv-header-actions');
    if (actions && !document.getElementById('cvGuideHelpBtn')) {
      const helpBtn = document.createElement('button');
      helpBtn.type = 'button';
      helpBtn.id = 'cvGuideHelpBtn';
      helpBtn.setAttribute('data-coffee-user-text', 'true');
      helpBtn.textContent = '?';
      helpBtn.title = L('新手教學與使用說明', 'Quick start & usage guide');
      helpBtn.setAttribute('aria-label', L('新手教學與使用說明', 'Quick start & usage guide'));
      helpBtn.onclick = () => openGuide(0);
      const langSwitch = document.getElementById('coffeeLanguageSwitch');
      if (langSwitch && langSwitch.parentElement === actions) langSwitch.before(helpBtn);
      else actions.append(helpBtn);
    }

    const settings = document.getElementById('settings');
    if (settings && !document.getElementById('openOnboardingGuide')) {
      const sBtn = document.createElement('button');
      sBtn.type = 'button';
      sBtn.id = 'openOnboardingGuide';
      sBtn.className = 'champ-trigger-btn';
      sBtn.setAttribute('data-coffee-user-text', 'true');
      sBtn.textContent = L('📖 開啟新手教學（4 步使用指南）', '📖 Open Quick Start Guide (4 steps)');
      sBtn.onclick = () => openGuide(0);
      const usageDetails = settings.querySelector('details');
      if (usageDetails) usageDetails.before(sBtn);
      else settings.append(sBtn);
    }
  }

  function refreshTriggerLabels() {
    const helpBtn = document.getElementById('cvGuideHelpBtn');
    if (helpBtn) {
      helpBtn.title = L('新手教學與使用說明', 'Quick start & usage guide');
      helpBtn.setAttribute('aria-label', L('新手教學與使用說明', 'Quick start & usage guide'));
    }
    const sBtn = document.getElementById('openOnboardingGuide');
    if (sBtn) {
      sBtn.textContent = L('📖 開啟新手教學（4 步使用指南）', '📖 Open Quick Start Guide (4 steps)');
    }
  }

  function hasExistingUserData() {
    try {
      if (typeof db !== 'undefined' && db) {
        if (Array.isArray(db.cups) && db.cups.length > 0) return true;
        if (Array.isArray(db.recipes) && db.recipes.length > 2) return true;
        if (db.beanCatalog && Array.isArray(db.beanCatalog.items) && db.beanCatalog.items.length > 0) return true;
        if (db.equipment && Array.isArray(db.equipment.items) && db.equipment.items.length > 0) return true;
      }
    } catch (e) {}
    return false;
  }

  function maybeAutoOpen() {
    mountTriggers();
    let seen = false;
    try {
      seen = localStorage.getItem(STORAGE_KEY) === '1';
    } catch (e) {}
    if (seen) return;

    if (hasExistingUserData()) {
      markSeen();
      return;
    }

    if (location.hash && /^#(share|recipe)=/i.test(location.hash)) {
      markSeen();
      return;
    }

    openGuide(0);
  }

  function init() {
    mountTriggers();
    setTimeout(maybeAutoOpen, 420);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }

  let lastLang = document.documentElement.lang;
  new MutationObserver(() => {
    const next = document.documentElement.lang;
    if (next === lastLang) return;
    lastLang = next;
    refreshTriggerLabels();
    if (dialog.open) renderDialog();
  }).observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });

  if (typeof window !== 'undefined') {
    window.CoffeeOnboarding = { open: openGuide };
  }
})();
