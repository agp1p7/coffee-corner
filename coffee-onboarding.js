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
      tagZh: '配方與磨豆機',
      tagEn: 'Recipes & Grinders',
      titleZh: '挑選 43 支冠軍配方，切換你的磨豆機',
      titleEn: 'Pick from 43 champion recipes & match your grinder',
      descZh: '從世界冠軍或名家靈感開始最快！不需要自己從頭猜比例與時間，點一下就能一鍵換算成適合你磨豆機的參考刻度。',
      descEn: 'Start cleanly with WBrC / WAC winning recipes and scale coffee weight or switch grinders with instant micron conversion.',
      bulletsZh: [
        '在「配方工作室」點「🏆 專家配方」，可依手沖、愛樂壓、浸泡、冰沖與濾杯類型篩選（共 43 支）。',
        '點開配方可自由調整目標粉量（12g / 15g / 18g / 20g / 25g 或自訂），注水量會等比例縮放。',
        '在配方庫上方或工作室曲線旁切換你的磨豆機（13 款主流手搖／電磨），即顯示專屬刻度與參考微米。'
      ],
      bulletsEn: [
        'Tap "🏆 Champions" in Studio to filter 43 pour-over, AeroPress, Switch, and iced recipes by brewer or keyword.',
        'Scale any recipe to your preferred dose (12g–25g or custom) with automatic water and note updates.',
        'Switch among 13 mainstream grinders in the library or Studio curve header to see dial settings + micron range.'
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
      tagZh: '豆庫與我的器材',
      tagEn: 'Beans & Equipment',
      titleZh: '建立自己的咖啡豆庫與濾杯、磨豆機',
      titleEn: 'Manage your coffee beans, drippers, and grinders',
      descZh: '把常喝的咖啡豆與手邊器材建檔後，沖煮時只要點選指定，推薦研磨度與器材資訊會自動帶出並記錄在每一杯裡。',
      descEn: 'Catalog your beans and gear once so every recipe and tasting log tracks them cleanly—and auto-converts grind dials.',
      bulletsZh: [
        '前往「我的咖啡 → 咖啡豆」，支援手動新增或登入 Google 後用「📷 拍豆袋辨識」AI 自動填入豆名、焙度、處理法與風味。',
        '在「我的器材」新增你的濾杯與磨豆機；只要配方裡選了對應磨豆機，推薦刻度就會自動以該機型計算。',
        '喝完或不再使用的豆子與器材可先「封存／停用」，過去的沖煮紀錄會完整保留不受影響。'
      ],
      bulletsEn: [
        'Open "My coffee → Coffee beans" to add beans manually or use "📷 Snap bag" AI label scanning (Google sign-in required).',
        'Add drippers and grinders under "Equipment". When a recipe uses your grinder, grind guides auto-match that model.',
        'Archive finished beans or retired gear anytime—your past brew logs remain untouched.'
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
      tagZh: '引導沖煮與日記',
      tagEn: 'Brew & Journal',
      titleZh: '專注計時沖煮，寫下每杯「下次只改一件事」',
      titleEn: 'Brew with step-by-step timer & tasting notes',
      descZh: '沖煮時跟著大字倒數與提示音分段注水，喝完只需 10 秒記下風味與微調方向，下次沖煮就知道該往哪裡修。',
      descEn: 'Follow audio-cued pour steps, record actual pauses, and capture flavor + one focused tweak for your next cup.',
      bulletsZh: [
        '點「開始引導沖煮」進入全螢幕計時；遇到「後加水（Bypass）」或「後加冰塊」會停下等你手動確認完成。',
        '沖煮中可點「記一次實際斷水」留存實戰時間點，右上方也能開關提示音與螢幕保持亮屏。',
        '儲存後可在「我的咖啡 → 沖煮紀錄」勾選任意兩杯點「比較兩杯」，用雷達圖與表格並列對照參數差異。'
      ],
      bulletsEn: [
        'Start Guided Brewing for a focused countdown timer; manual bypass or ice additions pause cleanly until you confirm.',
        'Log actual pouring pauses during a brew and toggle audio cues or screen wake-lock anytime.',
        'In "Brew journal", select any two cups and tap "Compare" for side-by-side parameters and flavor radar.'
      ],
      actionZh: '⏱️ 前往引導沖煮 →',
      actionEn: '⏱️ Go to Guided Brewing →',
      runAction: () => {
        const tab = document.querySelector('nav button[data-tab="guide"]');
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
