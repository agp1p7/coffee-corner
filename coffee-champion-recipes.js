(function () {
  'use strict';

  const copy = x => JSON.parse(JSON.stringify(x));
  const round1 = v => Math.max(0.1, Math.round(Number(v) * 10) / 10);
  const newId = () => (typeof uid === 'function' ? uid() : Date.now().toString(36) + Math.random().toString(36).slice(2));
  const STEP_TYPES = (typeof CoffeeSteps !== 'undefined' && CoffeeSteps.TYPES)
    ? CoffeeSteps.TYPES
    : ['悶蒸注水', '注水', '等待／斷水', '攪拌／繞圈', '下壓', '開關閥門', '滴濾／等待完成', '繞圈注水', '中心注水', '攪拌', '後加水（bypass）', '後加冰塊'];
  const POUR_SET = new Set([STEP_TYPES[0], STEP_TYPES[1], STEP_TYPES[7], STEP_TYPES[8]]);
  const MANUAL_SET = new Set([STEP_TYPES[10], STEP_TYPES[11]]);

  function splitTotal(total, parts) {
    const raw = [];
    let acc = 0;
    for (let i = 0; i < parts - 1; i++) {
      const val = round1(total / parts);
      raw.push(val);
      acc = Math.round((acc + val) * 10) / 10;
    }
    raw.push(round1(total - acc));
    return raw;
  }

  /**
   * 建構粕谷哲 4:6 法動態步驟
   * @param {number} totalWater 總注水量 (g)
   * @param {'balance'|'sweet'|'bright'} tasteMode 前 40% 甜酸比例
   * @param {'light'|'standard'|'strong'} strengthMode 後 60% 濃淡段數
   * @param {'zh-Hant'|'en'} lang 語系
   */
  function buildTetsu46Steps(totalWater, tasteMode = 'balance', strengthMode = 'standard', lang = 'zh-Hant') {
    const en = lang === 'en';
    const first40 = Math.round(totalWater * 0.4 * 10) / 10;
    const last60 = round1(totalWater - first40);

    let p1Ratio = 0.5;
    if (tasteMode === 'sweet') p1Ratio = 5 / 12;
    else if (tasteMode === 'bright') p1Ratio = 7 / 12;

    const p1 = round1(first40 * p1Ratio);
    const p2 = round1(first40 - p1);

    const partCount = strengthMode === 'light' ? 2 : strengthMode === 'strong' ? 4 : 3;
    const tailPours = splitTotal(last60, partCount);
    const waitSec = strengthMode === 'strong' ? 25 : 30;
    const allPours = [p1, p2, ...tailPours];
    const steps = [];

    let cum = 0;
    allPours.forEach((water, idx) => {
      cum = Math.round((cum + water) * 10) / 10;
      const isLast = idx === allPours.length - 1;
      let type = STEP_TYPES[7]; // 繞圈注水
      let note = '';

      if (idx === 0) {
        type = STEP_TYPES[0]; // 悶蒸注水
        const tasteHint = tasteMode === 'sweet'
          ? (en ? 'First 40% (Sweet focus): lower 1st pour slows early extraction' : '前 40%（偏甜設定）：減少第一段水量，保留更多甜感空間')
          : tasteMode === 'bright'
            ? (en ? 'First 40% (Bright focus): higher 1st pour highlights acidity' : '前 40%（偏酸設定）：提高第一段水量，拉出明亮果酸')
            : (en ? 'First 40% (Balanced 50/50): bloom saturation' : '前 40%（標準平衡 5:5）：均勻浸潤排氣');
        note = tasteHint;
      } else if (idx === 1) {
        note = en
          ? `Second pour to 40% (${cum} g) after full drawdown`
          : `前 40% 完成（累計 ${cum}g），建議待前段流乾後再注水`;
      } else {
        const tailIdx = idx - 1;
        note = en
          ? `Last 60% part ${tailIdx}/${partCount} (cum. ${cum} g)`
          : `後 60% 濃淡調整 第 ${tailIdx}/${partCount} 段（累計 ${cum}g）`;
      }

      steps.push({ type, sec: 15, water, note });
      if (!isLast) {
        steps.push({
          type: STEP_TYPES[2], // 等待／斷水
          sec: waitSec,
          water: 0,
          note: en ? 'Wait until water bed drains completely before next pour' : '等待粉層液面流乾後再進行下一段注水'
        });
      } else {
        steps.push({
          type: STEP_TYPES[6], // 滴濾／等待完成
          sec: 30,
          water: 0,
          note: en ? 'Allow complete drawdown (~3:30 total); coarse grind prevents bitterness' : '等待完全滴濾完成（總時間約 3:30），粗研磨即使拉長時間也不易過萃'
        });
      }
    });

    return steps;
  }

  const CHAMPIONS = [
    {
      id: 'tetsu-46',
      category: 'wbrc',
      barista: '粕谷哲 Tetsu Kasuya',
      baristaEn: 'Tetsu Kasuya',
      title: '4:6 手沖法（酸甜濃淡可調）',
      titleEn: '4:6 Method (Interactive Sweetness & Strength)',
      name: '粕谷哲 Tetsu｜4:6 法',
      badge: '2016 WBrC 世界冠軍',
      badgeEn: '2016 WBrC Champion',
      method: '手沖',
      dripper: 'HARIO V60 02',
      shape: '錐形',
      material: '樹脂／塑膠',
      filter: 'V60 漂白濾紙',
      roast: '淺焙',
      dose: 20,
      temp: 92,
      waterSource: '軟水（約 50–80 ppm）',
      grindGuide: '粗研磨（C5 Pro 刻度 14.5–16）',
      grindGuideEn: 'Coarse (C5 Pro dial 14.5–16)',
      summary: '世界最知名手沖理論：前 40% 兩段水量比例決定甜度與酸度；後 60% 分割段數決定濃度與醇厚度。每次注水均須等液面流乾再續注。',
      summaryEn: 'Split total water 40% / 60%: the first 40% tunes sweetness vs acidity; the remaining 60% pours adjust body and strength. Wait for drawdown between pours.',
      custom46: true,
      baseTotalWater: 300,
      notes: '【推薦研磨】粗研磨（C5 Pro 轉盤刻度約 14.5–16，可視流速轉過 15 一點）。水溫淺焙 92–93°C / 中深焙 83–88°C。關鍵在於每段等待濾杯幾乎流乾再注水。',
      steps: buildTetsu46Steps(300, 'balance', 'standard', 'zh-Hant')
    },
    {
      id: 'tetsu-devil',
      category: 'hybrid',
      barista: '粕谷哲 Tetsu Kasuya',
      baristaEn: 'Tetsu Kasuya',
      title: 'Switch 新・惡魔配方（高低溫浸泡混合法）',
      titleEn: 'Switch Devil Recipe (Hybrid Open/Closed)',
      name: '粕谷哲｜Switch 惡魔配方',
      badge: 'Switch 名家代表作',
      badgeEn: 'Switch Signature',
      method: '浸泡式',
      dripper: 'HARIO Switch',
      shape: '浸泡／閥門式',
      material: '玻璃',
      filter: 'V60 漂白濾紙',
      roast: '淺焙',
      dose: 20,
      temp: 90,
      waterSource: '軟水',
      grindGuide: '中細研磨（C5 Pro 刻度 10.5–12）',
      grindGuideEn: 'Medium-fine (C5 Pro dial 10.5–12)',
      summary: '前段開啟閥門用 90°C 熱萃明亮花果香；1:15 後關閉閥門並降溫至 70°C 溫水浸泡，只溶出大量甜感物質而鎖住單寧苦澀。',
      summaryEn: 'Brew open at 90°C for bright aromatics, then close the valve at 1:15 and steep with 70°C water for explosive sweetness without bitterness.',
      notes: '【雙溫雙段關鍵】前 120g 閥門開啟用 90°C；1:15 關閥後將壺內降溫至 70°C（或備另一壺冷水降溫）再注完 280g。研磨：中細（C5 Pro 刻度 10.5–12）。',
      steps: [
        { type: '悶蒸注水', sec: 30, water: 60, note: '【閥門開啟】90°C 熱水繞圈注水 60g，直接滴濾萃取前段香氣' },
        { type: '繞圈注水', sec: 45, water: 60, note: '【閥門保持開啟】90°C 續注 60g（累計 120g）' },
        { type: '開關閥門', sec: 5, water: 0, note: '【關閉閥門】於 1:15 關閉 Switch 閥門，並將手沖壺水溫降至約 70°C' },
        { type: '中心注水', sec: 25, water: 160, note: '【閥門關閉・70°C 溫水】注入 160g 溫水（累計 280g），低溫浸泡釋放甜感並抑制苦澀' },
        { type: '等待／斷水', sec: 25, water: 0, note: '【靜置浸泡】浸泡至 2:10' },
        { type: '開關閥門', sec: 5, water: 0, note: '【開啟閥門】於 2:10 打開閥門放流' },
        { type: '滴濾／等待完成', sec: 45, water: 0, note: '約 3:00 滴濾完成，享受高甜度與乾淨尾韻' }
      ]
    },
    {
      id: 'chad-wang-2017',
      category: 'wbrc',
      barista: '王策 Chad Wang',
      baristaEn: 'Chad Wang',
      title: '中心轉同心圓兩段法',
      titleEn: 'Center-to-Concentric 2-Pour V60',
      name: '王策 Chad｜V60 冠軍兩段法',
      badge: '2017 WBrC 世界冠軍',
      badgeEn: '2017 WBrC Champion',
      method: '手沖',
      dripper: 'HARIO V60 02',
      shape: '錐形',
      material: '陶瓷',
      filter: 'V60 漂白濾紙',
      roast: '淺焙',
      dose: 15,
      temp: 92,
      waterSource: '中偏軟水（70–90 ppm）',
      grindGuide: '中細偏中（C5 Pro 刻度 11.5–13）',
      grindGuideEn: 'Medium-fine (C5 Pro dial 11.5–13)',
      summary: '臺灣第一位 WBrC 世界冠軍經典架構：短悶蒸後直接大水柱兩段式注水，第一段建立萃取效率與甜度，第二段純中心注水維持液位與純淨度。',
      summaryEn: 'Taiwan’s first WBrC Champion approach: short bloom followed by a large concentric main pour and a gentle center finish pour.',
      notes: '【推薦研磨】中細偏中（C5 Pro 刻度約 11.5–13）。重點在第一段先定點中心 2 秒再順暢往外繞圈，第二段則穩住中心硬幣大小不碰觸邊緣。',
      steps: [
        { type: '悶蒸注水', sec: 30, water: 30, note: '由中心向外畫圓注水 30g，確保粉層均勻濕潤排氣' },
        { type: '繞圈注水', sec: 30, water: 130, note: '第一段主注水：中心定點 2 秒後由內向外同心圓穩定大水柱注至 160g' },
        { type: '等待／斷水', sec: 10, water: 0, note: '水位略降、準備銜接第二段' },
        { type: '中心注水', sec: 20, water: 90, note: '第二段注水：集中於中心硬幣大小範圍柔水注至 250g，維持水位並降低後段雜味' },
        { type: '滴濾／等待完成', sec: 35, water: 0, note: '約 2:00–2:05 移開濾杯完成萃取' }
      ]
    },
    {
      id: 'jianing-du-2019',
      category: 'wbrc',
      barista: '杜嘉寧 Jia Ning Du',
      baristaEn: 'Jia Ning Du',
      title: '摺紙濾杯 × 波浪濾紙三段高甜法',
      titleEn: 'ORIGAMI + Wave Filter 3-Pour',
      name: '杜嘉寧｜ORIGAMI 三段法',
      badge: '2019 WBrC 世界冠軍',
      badgeEn: '2019 WBrC Champion',
      method: '手沖',
      dripper: 'ORIGAMI S',
      shape: '錐形',
      material: '陶瓷',
      filter: 'Kalita 155 波浪蛋糕濾紙',
      roast: '淺焙',
      dose: 15,
      temp: 94,
      waterSource: '軟水（40–60 ppm）',
      grindGuide: '中細研磨（C5 Pro 刻度 10.5–12）',
      grindGuideEn: 'Medium-fine (C5 Pro dial 10.5–12)',
      summary: '錐形 Origami 搭配 Kalita 波浪平底濾紙的混搭美學：前高擾動、後柔水與 94°C 高水溫精準萃出飽滿圓潤甜感。',
      summaryEn: 'Paired ORIGAMI brewer with flat-bottom Kalita Wave filter; high-agitation first main pour followed by soft final pour at 94°C.',
      notes: '【推薦器材組合】ORIGAMI S ＋ Kalita 155 蛋糕濾紙（貼合肋條減緩流速）。研磨度 C5 Pro 刻度約 10.5–12，總時間約 2:00 收杯。',
      steps: [
        { type: '悶蒸注水', sec: 30, water: 35, note: '較大水柱（約 6–7g/s）快速繞圈注水 35g 悶蒸' },
        { type: '繞圈注水', sec: 25, water: 105, note: '穩定大水柱由中心向外繞圈注水 105g（累計 140g），高擾動提取前中段香氣' },
        { type: '等待／斷水', sec: 15, water: 0, note: '等待水位下降約一半' },
        { type: '繞圈注水', sec: 20, water: 100, note: '小圈柔水注水 100g（累計 240g），帶出高甜感與圓潤口感' },
        { type: '滴濾／等待完成', sec: 30, water: 0, note: '於 2:00 準時移開濾杯收杯' }
      ]
    },
    {
      id: 'matt-winton-2021',
      category: 'wbrc',
      barista: 'Matt Winton',
      baristaEn: 'Matt Winton',
      title: '五段脈衝雙溫高萃取法',
      titleEn: '5-Pour Dual-Temp Pulse V60',
      name: 'Matt Winton｜雙溫五段法',
      badge: '2021 WBrC 世界冠軍',
      badgeEn: '2021 WBrC Champion',
      method: '手沖',
      dripper: 'HARIO V60 02',
      shape: '錐形',
      material: '金屬',
      filter: 'V60 漂白濾紙',
      roast: '淺焙',
      dose: 15,
      temp: 93,
      waterSource: '低礦物質軟水',
      grindGuide: '中研磨（C5 Pro 刻度 12.5–14）',
      grindGuideEn: 'Medium (C5 Pro dial 12.5–14)',
      summary: '以金屬 V60 保溫並分成 5 次各 50g 注水：前兩段高溫 93°C 強酸甜萃取，後三段切換至 88°C 柔水保留乾淨甜韻不鎖喉。',
      summaryEn: 'Five 50 g pours in a metal V60: first two pours at 93°C for vivid acidity, switching to 88°C for the last three pours for clean sweetness.',
      notes: '【雙水溫技巧】前兩段合計 100g 使用 93°C；第 3–5 段降溫至 88°C（可先用溫水壺預備第二支壺）。研磨 C5 Pro 刻度約 12.5–14。',
      steps: [
        { type: '悶蒸注水', sec: 30, water: 50, note: '第 1 段（93°C）：高流速繞圈注水 50g，讓粉層充分排氣' },
        { type: '繞圈注水', sec: 30, water: 50, note: '第 2 段（93°C）：當液面接近粉床時注水 50g（累計 100g）' },
        { type: '繞圈注水', sec: 30, water: 50, note: '第 3 段（可換 88°C 溫水壺）：注水 50g（累計 150g），柔化後段澀感' },
        { type: '繞圈注水', sec: 30, water: 50, note: '第 4 段（88°C）：注水 50g（累計 200g）' },
        { type: '中心注水', sec: 20, water: 50, note: '第 5 段（88°C）：偏中心柔和注水 50g（累計 250g）' },
        { type: '滴濾／等待完成', sec: 25, water: 0, note: '滴濾完成，展現極致明亮果酸與果汁感' }
      ]
    },
    {
      id: 'carlos-medina-2023',
      category: 'wbrc',
      barista: 'Carlos Medina',
      baristaEn: 'Carlos Medina',
      title: 'ORIGAMI 五段甜感法',
      titleEn: 'ORIGAMI 5-Pour Sweet Profile',
      name: 'Carlos Medina｜5×50g 甜感法',
      badge: '2023 WBrC 世界冠軍',
      badgeEn: '2023 WBrC Champion',
      method: '手沖',
      dripper: 'ORIGAMI S',
      shape: '錐形',
      material: '陶瓷',
      filter: '錐形濾紙',
      roast: '淺焙',
      dose: 15.5,
      temp: 91,
      waterSource: '調整礦物質軟水（約 60 ppm）',
      grindGuide: '中偏粗研磨（C5 Pro 刻度 13.5–15）',
      grindGuideEn: 'Medium-coarse (C5 Pro dial 13.5–15)',
      summary: '極易複製的高容錯冠軍配方：每 30 秒穩定注入 50g，五段合計 250g（15.5g 粉，約 1:16），呈現清晰果汁甜感與平衡酸質。',
      summaryEn: 'Highly repeatable 5×50 g pouring cadence every 30 s with 15.5 g dose and 91°C water.',
      notes: '【推薦研磨】中偏粗研磨（C5 Pro 刻度約 13.5–15）。【推薦參數】15.5g 粉搭 250g 水，91°C。每 30 秒（0:00、0:30、1:00、1:30、2:00）穩定注入 50g，最後一注集中中心較柔和。',
      steps: [
        { type: '悶蒸注水', sec: 30, water: 50, note: '第 1 注：由中心向外穩定繞圈注水 50g' },
        { type: '繞圈注水', sec: 30, water: 50, note: '第 2 注：於 0:30 繞圈注水 50g（累計 100g）' },
        { type: '繞圈注水', sec: 30, water: 50, note: '第 3 注：於 1:00 繞圈注水 50g（累計 150g）' },
        { type: '繞圈注水', sec: 30, water: 50, note: '第 4 注：於 1:30 繞圈注水 50g（累計 200g）' },
        { type: '中心注水', sec: 15, water: 50, note: '第 5 注：於 2:00 柔和注水 50g（累計 250g）' },
        { type: '滴濾／等待完成', sec: 30, water: 0, note: '約 2:45 完成滴濾，層次分明且尾韻甘甜' }
      ]
    },
    {
      id: 'martin-wolfl-2024',
      category: 'wbrc',
      barista: 'Martin Wölfl',
      baristaEn: 'Martin Wölfl',
      title: 'OREA 平底四段柔萃法',
      titleEn: 'OREA Flat-Bottom 4-Pour',
      name: 'Martin Wölfl｜OREA 四段法',
      badge: '2024 WBrC 世界冠軍',
      badgeEn: '2024 WBrC Champion',
      method: '手沖',
      dripper: 'OREA',
      shape: '平底',
      material: '樹脂／塑膠',
      filter: '平底專用濾紙',
      roast: '淺焙',
      dose: 16,
      temp: 92,
      waterSource: '軟水（40–60 ppm）',
      grindGuide: '中研磨（C5 Pro 刻度 12–13.5）',
      grindGuideEn: 'Medium (C5 Pro dial 12–13.5)',
      summary: '2024 最新世界冠軍代表平底濾杯哲學：利用 OREA 平底低旁路設計與四段穩定注水（50/70/70/65g），榨出絲滑包覆感與細緻甜度。',
      summaryEn: 'Flat-bottom precision extraction using OREA brewer with 50/70/70/65 g pours for silky body and sweet clarity.',
      notes: '【推薦器材】OREA 平底濾杯搭配無折痕壓平或波浪濾紙。研磨比 V60 稍粗一階（C5 Pro 刻度 12–13.5），水溫 92°C，16g 粉對 255g 水。',
      steps: [
        { type: '悶蒸注水', sec: 40, water: 50, note: '第 1 段：均勻繞圈注水 50g，靜置悶蒸 40 秒' },
        { type: '繞圈注水', sec: 35, water: 70, note: '第 2 段：穩定繞圈注水 70g（累計 120g）' },
        { type: '繞圈注水', sec: 35, water: 70, note: '第 3 段：繞圈注水 70g（累計 190g）' },
        { type: '中心注水', sec: 20, water: 65, note: '第 4 段：中心小圈柔水注水 65g（累計 255g）減少旁路通道' },
        { type: '滴濾／等待完成', sec: 35, water: 0, note: '平底濾杯高均勻度滴濾至約 2:45 完成' }
      ]
    },
    {
      id: 'berg-wu',
      category: 'masters',
      barista: '吳則霖 Berg Wu（興波咖啡 Simple Kaffa）',
      baristaEn: 'Berg Wu (Simple Kaffa)',
      title: '高低水柱擾動三段法（1:15 高甜感比例）',
      titleEn: 'High/Low Pour Stirring 3-Stage V60',
      name: '吳則霖 Berg Wu｜興波三段法',
      badge: 'WBC 世界冠軍名家',
      badgeEn: 'WBC Champion Master',
      method: '手沖',
      dripper: 'HARIO V60 01',
      shape: '錐形',
      material: '陶瓷',
      filter: 'V60 漂白濾紙',
      roast: '中淺焙',
      dose: 15,
      temp: 91,
      waterSource: '軟水',
      grindGuide: '中細研磨（C5 Pro 刻度 10.5–12）',
      grindGuideEn: 'Medium-fine (C5 Pro dial 10.5–12)',
      summary: '臺灣 WBC 世界冠軍的經典門市手沖邏輯：1:15 緊緻粉水比，前段悶蒸柔和、中段拉高水柱徹底翻攪咖啡粉、後段貼近粉面中心收甜。',
      summaryEn: '1:15 signature Simple Kaffa ratio: gentle bloom, high-pour agitation stage for aroma, and low-pour center finish for sweetness.',
      notes: '【推薦研磨】中細研磨（C5 Pro 刻度約 10.5–12）。【水柱高低節奏】第 1 段低柔悶蒸；第 2 段拉高約 10cm 加強攪拌釋放香氣；第 3 段壓低貼近水面在中心注完 225g。',
      steps: [
        { type: '悶蒸注水', sec: 30, water: 30, note: '低水柱柔和繞圈注水 30g 悶蒸' },
        { type: '繞圈注水', sec: 30, water: 110, note: '第二段拉高水柱、加大翻攪力道繞圈注水 110g（累計 140g），激發花果香氣' },
        { type: '等待／斷水', sec: 15, water: 0, note: '等待粉層水位稍降' },
        { type: '中心注水', sec: 25, water: 85, note: '第三段壓低水柱、於中心小圈慢速注水 85g（累計 225g），集中甜感並避免沖刷杯壁苦澀' },
        { type: '滴濾／等待完成', sec: 25, water: 0, note: '約 2:00–2:05 滴濾完成' }
      ]
    },
    {
      id: 'james-hoffmann-v60',
      category: 'masters',
      barista: 'James Hoffmann',
      baristaEn: 'James Hoffmann',
      title: '終極 1 杯份 V60 五段法（A Better 1-Cup V60）',
      titleEn: 'A Better 1-Cup V60 Technique',
      name: 'James Hoffmann｜1杯份V60五段法',
      badge: '全球經典百萬人氣手法',
      badgeEn: 'Global Classic V60',
      method: '手沖',
      dripper: 'HARIO V60 01',
      shape: '錐形',
      material: '樹脂／塑膠',
      filter: 'V60 漂白濾紙',
      roast: '淺焙',
      dose: 15,
      temp: 95,
      waterSource: '軟水',
      grindGuide: '中細研磨（C5 Pro 刻度 10–11.5）',
      grindGuideEn: 'Medium-fine (C5 Pro dial 10–11.5)',
      summary: '針對小粉量（15g）極易失溫痛點設計的脈衝手法：5 次 50g 短間隔注水維持熱能與水位，搭配悶蒸與收尾兩次溫柔 Swirl（搖晃整平）。',
      summaryEn: 'Engineered for small 15 g doses: 5×50 g timed pulses maintain slurry temperature, plus gentle bloom and drawdown swirls.',
      notes: '【推薦水溫與研磨】淺焙豆直上 95–98°C、極淺可至沸騰；研磨偏細（C5 Pro 刻度 10–11.5）。每次注水 50g 後停水 10 秒讓溫度維持高點。',
      steps: [
        { type: '悶蒸注水', sec: 15, water: 50, note: '注水 50g 後輕搖濾杯（Swirl）5 秒，確保沒有乾粉結塊' },
        { type: '等待／斷水', sec: 30, water: 0, note: '靜置悶蒸排氣至 0:45' },
        { type: '繞圈注水', sec: 15, water: 50, note: '第 2 段：0:45–1:00 繞圈注水 50g（累計 100g）' },
        { type: '等待／斷水', sec: 10, water: 0, note: '短暫停水 10 秒維持理想液溫與粉床高度' },
        { type: '繞圈注水', sec: 10, water: 50, note: '第 3 段：1:10–1:20 繞圈注水 50g（累計 150g）' },
        { type: '等待／斷水', sec: 10, water: 0, note: '短暫停水 10 秒' },
        { type: '繞圈注水', sec: 10, water: 50, note: '第 4 段：1:30–1:40 繞圈注水 50g（累計 200g）' },
        { type: '等待／斷水', sec: 10, water: 0, note: '短暫停水 10 秒' },
        { type: '繞圈注水', sec: 10, water: 50, note: '第 5 段：1:50–2:00 繞圈注水 50g（累計 250g）' },
        { type: '攪拌', sec: 5, water: 0, note: '輕柔水平搖晃濾杯（Gentle Swirl）5 秒，沖下杯壁咖啡粉並整平粉床' },
        { type: '滴濾／等待完成', sec: 55, water: 0, note: '等待滴濾至約 3:00 完成' }
      ]
    },
    {
      id: 'scott-rao-v60',
      category: 'masters',
      barista: 'Scott Rao',
      baristaEn: 'Scott Rao',
      title: '科學兩段式高萃取 ＋ Rao Spin',
      titleEn: 'Updated V60 Two-Pour + Rao Spin',
      name: 'Scott Rao｜科學V60＋Rao Spin',
      badge: '現代科學手沖先驅',
      badgeEn: 'Scientific Extraction Pioneer',
      method: '手沖',
      dripper: 'HARIO V60 02',
      shape: '錐形',
      material: '樹脂／塑膠',
      filter: 'V60 漂白濾紙',
      roast: '淺焙',
      dose: 20,
      temp: 96,
      waterSource: '軟水（40–70 ppm）',
      grindGuide: '中細研磨（C5 Pro 刻度 11–12.5）',
      grindGuideEn: 'Medium-fine (C5 Pro dial 11–12.5)',
      summary: '現代手沖「Rao Spin 水平搖晃整平法」與「3 倍粉重悶蒸」發源配方：追求最高且最均勻的粉層萃取率（高水溫、1:17 比例、極低通道效應）。',
      summaryEn: 'High-extraction 1:17 method featuring a 3× dose bloom and the signature horizontal Rao Spin to guarantee a flat bed.',
      notes: '【推薦研磨】中細研磨（C5 Pro 刻度約 11–12.5）。【科學要點】粉水比 1:17（20g 對 340g），高溫（95–97°C），3 倍粉量悶蒸必攪拌或搖勻；最後一注完成後順時針溫和 Rao Spin 兩圈整平粉床。',
      steps: [
        { type: '悶蒸注水', sec: 15, water: 60, note: '注入 3 倍粉重（60g）悶蒸水' },
        { type: '攪拌', sec: 30, water: 0, note: '立即輕晃濾杯或以湯匙輕撥讓所有乾粉濕透，悶蒸至 0:45' },
        { type: '繞圈注水', sec: 35, water: 140, note: '第一段主注水至約 60% 水量（累計 200g），完成後輕搖濾杯一次' },
        { type: '等待／斷水', sec: 25, water: 0, note: '等待水位下降至約剩一半' },
        { type: '繞圈注水', sec: 30, water: 140, note: '第二段主注水至 340g（粉水比 1:17）' },
        { type: '攪拌', sec: 5, water: 0, note: '【Rao Spin】雙手輕抓濾杯順時針水平搖晃 2–3 圈，防止粉牆掛壁並整平粉床' },
        { type: '滴濾／等待完成', sec: 55, water: 0, note: '約 3:15 滴濾完成，底部應呈平坦無坑洞粉床' }
      ]
    },
    {
      id: 'japanese-iced-izaki',
      category: 'iced',
      barista: '井崎英典 Hidenori Izaki / 日式急冷流',
      baristaEn: 'Hidenori Izaki / Japanese Flash Brew',
      title: '日式急冷冰手沖（60% 熱萃 ＋ 40% 冰鎮）',
      titleEn: 'Japanese Flash Brew Iced Pour-Over',
      name: '井崎英典｜日式急冷冰手沖',
      badge: 'WBC 世界冠軍急冷法',
      badgeEn: 'World Champion Flash Brew',
      method: '手沖',
      dripper: 'HARIO V60 02',
      shape: '錐形',
      material: '樹脂／塑膠',
      filter: 'V60 漂白濾紙',
      roast: '淺焙',
      dose: 20,
      temp: 92,
      waterSource: '軟水 ＋ 透明實心冰塊 120g',
      grindGuide: '細偏中細（C5 Pro 刻度 9–10.5）',
      grindGuideEn: 'Fine-medium (C5 Pro dial 9–10.5)',
      summary: '正宗急冷冰手沖（非加冰稀釋，而是把冰塊當作總水量 40%！）：磨細一階讓 180g 熱水萃出濃縮芳香咖啡，直接滴落 120g 冰塊瞬間鎖香。',
      summaryEn: '40% of total water weight starts as ice in the server. Grind finer so 180 g hot water extracts full flavor onto 120 g ice.',
      notes: '【下壺先放 120g 冰塊】總水重 300g ＝ 180g 熱水萃取 ＋ 120g 冰塊急冷（40%）。因熱水量較少，研磨度須比熱沖調細約 2 格（C5 Pro 刻度 9–10.5）。',
      steps: [
        { type: '悶蒸注水', sec: 40, water: 40, note: '【下壺先放 120g 冰塊】以 92°C 熱水注 40g 悶蒸 40 秒充分排氣' },
        { type: '繞圈注水', sec: 25, water: 50, note: '第 2 段慢速繞圈注水 50g（累計 90g）' },
        { type: '繞圈注水', sec: 25, water: 50, note: '第 3 段繞圈注水 50g（累計 140g）' },
        { type: '中心注水', sec: 20, water: 40, note: '第 4 段中心注水 40g（累計熱萃水 180g）' },
        { type: '滴濾／等待完成', sec: 30, water: 0, note: '熱咖啡直接滴落冰塊瞬間急冷，完整鎖住揮發性花果香氣' },
        { type: '後加冰塊', sec: 0, water: 120, note: '確認下壺 120g 急冷冰塊並輕搖分享壺至冰塊融化冰鎮' }
      ]
    },
    {
      id: 'wac-aeropress-bypass',
      category: 'aeropress',
      barista: 'WAC 世界愛樂壓冠軍經典流派',
      baristaEn: 'WAC World AeroPress Champion Style',
      title: '低溫高粉水濃萃 Bypass 甜感法（含雙層濾紙）',
      titleEn: 'Low-Temp Concentrated Bypass AeroPress',
      name: 'WAC 愛樂壓冠軍｜濃萃Bypass',
      badge: 'WAC 世界愛樂壓冠軍流派',
      badgeEn: 'WAC Champion Bypass',
      method: '愛樂壓',
      dripper: 'AeroPress',
      shape: '其他／不適用',
      material: '樹脂／塑膠',
      filter: 'AeroPress 雙層濾紙',
      roast: '淺焙',
      dose: 18,
      temp: 86,
      waterSource: '低礦物質軟水',
      grindGuide: '中細偏中（C5 Pro 刻度 9–10.5）',
      grindGuideEn: 'Medium-fine (C5 Pro dial 9–10.5)',
      summary: '近年 WAC 世界愛樂壓大賽屢屢奪冠的核心思路：86°C 低水溫 ＋ 僅用 100g 濃萃至 1:30，再透過後加 60g 熱水（Bypass）精準稀釋，口感飽滿甜美不水薄。',
      summaryEn: 'Classic WAC winning formula: brew concentrated with 100 g at 86°C until 1:30, gently press, then bypass with 60 g hot water for rich, syrupy sweetness.',
      notes: '【推薦研磨】中細偏中（C5 Pro 刻度約 9–10.5）。【推薦設定】反壓法（Inverted）或搭配防滴控流蓋，雙層濾紙浸濕；18g 粉 ＋ 86°C 水溫 100g 浸泡至 1:30，押出約 70g 濃萃後加入約 50–70g Bypass 熱水（邊加邊試濃淡）。',
      steps: [
        { type: '注水', sec: 15, water: 100, note: '【反壓法或加裝控流蓋】以 86°C 溫水快速注入 100g' },
        { type: '攪拌', sec: 15, water: 0, note: '以攪拌棒前後輕柔攪拌 10–15 下，使粉水均勻接觸' },
        { type: '等待／斷水', sec: 60, water: 0, note: '鎖緊雙層濕潤濾紙與濾蓋，靜置浸泡至 1:30' },
        { type: '下壓', sec: 30, water: 0, note: '翻轉至分享壺上，穩定慢速下壓 30 秒至聽到氣音即停' },
        { type: '後加水（bypass）', sec: 0, water: 60, waterKind: 'hot', note: '【冠軍 Bypass 手法】於濃縮咖啡液中加入約 60g 熱水（可於 50–70g 間依個人濃淡喜好微調）' }
      ]
    },
    {
      id: 'sherry-hsu-2022',
      category: 'wbrc',
      barista: '徐詩媛 Sherry Hsu',
      baristaEn: 'Sherry Hsu',
      title: 'V60 四段均衡甜感法（2022 WBrC 冠軍）',
      titleEn: 'Balanced 4-Pour V60 (2022 WBrC Champion)',
      name: '徐詩媛 Sherry｜V60 四段法',
      badge: '2022 WBrC 世界冠軍',
      badgeEn: '2022 WBrC Champion',
      method: '手沖',
      dripper: 'HARIO V60 02',
      shape: '錐形',
      material: '陶瓷',
      filter: 'V60 漂白濾紙',
      roast: '淺焙',
      dose: 15,
      temp: 92,
      waterSource: '低礦物質軟水（50–70 ppm）',
      grindGuide: '中細偏中（C5 Pro 刻度 11.5–13）',
      grindGuideEn: 'Medium-fine (C5 Pro dial 11.5–13)',
      summary: '臺灣第二位 WBrC 世界冠軍代表作：15g 粉對 240g 水（1:16），透過溫和悶蒸與三段穩定續注，展現細膩花香、明亮果酸與乾淨甜感。',
      summaryEn: '15 g to 240 g (1:16) four-pour V60 method balancing floral aromatics, bright acidity, and clean sweetness.',
      notes: '【推薦研磨】中細偏中（C5 Pro 刻度約 11.5–13）。四段注水節奏穩定，維持水位高度不過度攪動粉層，約 2:15 完成。',
      steps: [
        { type: '悶蒸注水', sec: 35, water: 40, note: '第 1 段：中心向外均勻繞圈注水 40g 悶蒸 35 秒' },
        { type: '繞圈注水', sec: 30, water: 70, note: '第 2 段：穩定繞圈注水 70g（累計 110g）' },
        { type: '繞圈注水', sec: 30, water: 70, note: '第 3 段：穩定繞圈注水 70g（累計 180g）' },
        { type: '中心注水', sec: 20, water: 60, note: '第 4 段：中心小圈柔水注水 60g（累計 240g）收尾提甜' },
        { type: '滴濾／等待完成', sec: 25, water: 0, note: '等待完全滴濾完成（總時間約 2:20）' }
      ]
    },
    {
      id: 'patrik-rolf-april',
      category: 'masters',
      barista: 'Patrik Rolf (April Coffee)',
      baristaEn: 'Patrik Rolf (April Coffee)',
      title: 'April 平底兩段中心＋繞圈法（12g 小粉量）',
      titleEn: 'April Flat-Bottom 2-Pour (12 g Dose)',
      name: 'Patrik Rolf｜April 兩段法',
      badge: '北歐名家經典',
      badgeEn: 'Nordic Brewer Classic',
      method: '手沖',
      dripper: 'April',
      shape: '平底',
      material: '樹脂／塑膠',
      filter: 'April 平底專用濾紙',
      roast: '淺焙',
      dose: 12,
      temp: 93,
      waterSource: '軟水（40–60 ppm）',
      grindGuide: '中偏粗研磨（C5 Pro 刻度 13–14.5）',
      grindGuideEn: 'Medium-coarse (C5 Pro dial 13–14.5)',
      summary: '北歐極簡代表配方：12g 粉對 200g 水，拆成兩次 100g 注水（每次先中心 50g 再繞圈 50g），低擾動帶出高甜度與純淨茶感。',
      summaryEn: 'Nordic minimalist 12 g : 200 g recipe using two 100 g pours (each 50 g center + 50 g circle) for high sweetness and clarity.',
      notes: '【推薦研磨】中偏粗研磨（C5 Pro 刻度約 13–14.5）。每段 100g 皆以「先中心、後繞圈」控制流速，約 2:10–2:20 完成。',
      steps: [
        { type: '中心注水', sec: 10, water: 50, note: '第 1 段前半（0:00）：中心定點注水 50g' },
        { type: '繞圈注水', sec: 25, water: 50, note: '第 1 段後半：接續向外繞圈注水 50g（累計 100g）並等待至 0:35' },
        { type: '中心注水', sec: 10, water: 50, note: '第 2 段前半（0:35）：中心定點注水 50g（累計 150g）' },
        { type: '繞圈注水', sec: 15, water: 50, note: '第 2 段後半：向外繞圈注水 50g（累計 200g）' },
        { type: '滴濾／等待完成', sec: 75, water: 0, note: '等待平底濾杯自然滴濾完成（總時間約 2:15）' }
      ]
    },
    {
      id: 'kalita-wave-3pour',
      category: 'masters',
      barista: 'Kalita 經典平底流派',
      baristaEn: 'Classic Kalita Wave Style',
      title: 'Kalita Wave 185 三段穩定甜感法',
      titleEn: 'Kalita Wave 185 Steady 3-Pour',
      name: 'Kalita Wave｜三段穩定甜感法',
      badge: '經典平底高容錯',
      badgeEn: 'Flat-Bottom Classic',
      method: '手沖',
      dripper: 'Kalita Wave 185',
      shape: '平底',
      material: '金屬',
      filter: 'Kalita 185 波浪蛋糕濾紙',
      roast: '中淺焙',
      dose: 20,
      temp: 92,
      waterSource: '軟水（50–80 ppm）',
      grindGuide: '中研磨（C5 Pro 刻度 12–13.5）',
      grindGuideEn: 'Medium (C5 Pro dial 12–13.5)',
      summary: '最適合日常穩定出杯的平底濾杯配方：20g 粉對 320g 水（1:16），利用蛋糕濾紙均勻蓄水特性，展現圓潤焦糖甜與厚實口感。',
      summaryEn: 'Reliable everyday 20 g : 320 g flat-bottom recipe delivering rounded sweetness and balanced body.',
      notes: '【推薦研磨】中研磨（C5 Pro 刻度約 12–13.5）。中淺焙至中焙豆皆適用，注水保持小圈柔和，避免沖塌波浪濾紙壁。',
      steps: [
        { type: '悶蒸注水', sec: 35, water: 50, note: '由中心向外輕柔繞圈注水 50g，悶蒸 35 秒' },
        { type: '繞圈注水', sec: 45, water: 150, note: '第 2 段：小圈穩定注水 150g（累計 200g），維持液面高度' },
        { type: '中心注水', sec: 40, water: 120, note: '第 3 段：中心小圈注水 120g（累計 320g）' },
        { type: '滴濾／等待完成', sec: 40, water: 0, note: '約 2:40 滴濾完成，口感圓潤滑順' }
      ]
    },
    {
      id: 'hoffmann-clever-dripper',
      category: 'hybrid',
      barista: 'James Hoffmann',
      baristaEn: 'James Hoffmann',
      title: '聰明濾杯「先水後粉」零阻塞法',
      titleEn: 'Ultimate Clever Dripper (Water-First)',
      name: 'James Hoffmann｜聰明濾杯先水後粉',
      badge: '零失誤日常神器',
      badgeEn: 'Zero-Fuss Immersion',
      method: '浸泡式',
      dripper: 'Clever 聰明濾杯',
      shape: '浸泡／閥門式',
      material: '樹脂／塑膠',
      filter: '梯形 102 濾紙',
      roast: '中淺焙',
      dose: 15,
      temp: 93,
      waterSource: '軟水',
      grindGuide: '中研磨（C5 Pro 刻度 12–13.5）',
      grindGuideEn: 'Medium (C5 Pro dial 12–13.5)',
      summary: '徹底解決聰明濾杯細粉塞紙慢流的經典技巧：先將 250g 熱水倒入濾杯，再倒入 15g 咖啡粉輕攪，流速快又極度乾淨甜美。',
      summaryEn: 'Pour 250 g hot water first, then add 15 g coffee to prevent fines from clogging the filter—fast drawdown and clean sweetness.',
      notes: '【推薦研磨】中研磨（C5 Pro 刻度約 12–13.5）。【水溫建議】中淺焙 93°C（極淺焙可拉至 95–96°C）。【關鍵順序】務必先注水 250g 再倒粉輕拌浸潤；2:00 輕攪破渣、再等 30 秒讓粉沉底後放流。',
      steps: [
        { type: '注水', sec: 15, water: 250, note: '【先水後粉】先濕潤濾紙後，一次倒入 250g 熱水，再倒入 15g 咖啡粉並輕壓使粉全數浸潤' },
        { type: '等待／斷水', sec: 105, water: 0, note: '蓋上蓋子靜置浸泡至 2:00' },
        { type: '攪拌', sec: 10, water: 0, note: '輕柔攪拌破除表面粉層（Crust）' },
        { type: '等待／斷水', sec: 20, water: 0, note: '靜置 20–30 秒讓細粉沉降，避免堵塞濾紙' },
        { type: '滴濾／等待完成', sec: 45, water: 0, note: '放上分享壺開閥放流，約 3:15 完成' }
      ]
    },
    {
      id: 'tetsu-switch-simple',
      category: 'hybrid',
      barista: '粕谷哲 Tetsu Kasuya',
      baristaEn: 'Tetsu Kasuya',
      title: 'HARIO Switch 一鍵沉浸新手懶人法',
      titleEn: 'Simple HARIO Switch Immersion Recipe',
      name: '粕谷哲｜Switch 一鍵沉浸法',
      badge: 'Switch 高容錯入門',
      badgeEn: 'Switch Easy Classic',
      method: '浸泡式',
      dripper: 'HARIO Switch',
      shape: '浸泡／閥門式',
      material: '玻璃',
      filter: 'V60 漂白濾紙',
      roast: '中淺焙',
      dose: 15,
      temp: 93,
      waterSource: '軟水',
      grindGuide: '中細偏中（C5 Pro 刻度 11–13）',
      grindGuideEn: 'Medium-fine (C5 Pro dial 11–13)',
      summary: '不需要控水技巧也能穩定好喝：開閥悶蒸後直接關閥一次注滿浸泡至 2:00，開閥放流即可得到飽滿均勻的甜感與醇厚感。',
      summaryEn: 'Foolproof Switch workflow: open-valve bloom, close valve and pour to 240 g, steep until 2:00, then release.',
      notes: '【推薦研磨】中細偏中（C5 Pro 刻度約 11–13）。無需精細繞圈，關閥浸泡即可確保萃取均勻度。',
      steps: [
        { type: '悶蒸注水', sec: 40, water: 40, note: '【閥門開啟】注入 40g 熱水悶蒸 40 秒' },
        { type: '開關閥門', sec: 5, water: 0, note: '【關閉閥門】按下開關關閉閥門' },
        { type: '繞圈注水', sec: 20, water: 200, note: '【閥門關閉】一次注水 200g（累計 240g）並輕晃使粉水均勻' },
        { type: '等待／斷水', sec: 55, water: 0, note: '靜置浸泡至總時間 2:00' },
        { type: '開關閥門', sec: 5, water: 0, note: '【開啟閥門】打開閥門開始放流' },
        { type: '滴濾／等待完成', sec: 40, water: 0, note: '約 2:45 滴濾完成，甜感飽滿穩定' }
      ]
    },
    {
      id: 'hoffmann-aeropress-classic',
      category: 'aeropress',
      barista: 'James Hoffmann',
      baristaEn: 'James Hoffmann',
      title: '終極愛樂壓正壓經典法（無需反壓）',
      titleEn: 'Ultimate AeroPress Technique (Standard)',
      name: 'James Hoffmann｜終極愛樂壓正壓法',
      badge: '愛樂壓正壓教科書',
      badgeEn: 'AeroPress Standard Classic',
      method: '愛樂壓',
      dripper: 'AeroPress',
      shape: '其他／不適用',
      material: '樹脂／塑膠',
      filter: 'AeroPress 單層濾紙',
      roast: '淺焙',
      dose: 11,
      temp: 93,
      waterSource: '軟水',
      grindGuide: '中細研磨（C5 Pro 刻度 7.5–9）',
      grindGuideEn: 'Medium-fine (C5 Pro dial 7.5–9)',
      summary: '安全穩定的正壓法教科書：11g 粉對 200g 水，注水後立即插上活塞形成負壓防滴漏，浸泡 2 分鐘輕晃沉降後慢壓，極致乾淨順口。',
      summaryEn: 'Safe upright AeroPress classic: 11 g : 200 g, insert plunger to create vacuum seal, steep 2:00, swirl, wait 30 s, and press gently.',
      notes: '【推薦研磨】中細研磨（C5 Pro 刻度約 7.5–9）。【水溫建議】極淺焙 95°C、淺焙 92–93°C、中焙 88–90°C、深焙 85°C。正壓法直接插上活塞約 1cm 即可止漏，不需反壓冒險也能萃出飽滿乾淨的單品風味。',
      steps: [
        { type: '注水', sec: 15, water: 200, note: '【正壓法】一次倒入 200g 熱水，立即輕插活塞形成真空防漏' },
        { type: '等待／斷水', sec: 105, water: 0, note: '靜置浸泡至 2:00' },
        { type: '攪拌', sec: 5, water: 0, note: '連同底座輕輕水平搖晃愛樂壓（Swirl），讓浮在表面的粉沉降' },
        { type: '等待／斷水', sec: 25, water: 0, note: '靜置 25–30 秒讓粉床穩定沉底' },
        { type: '下壓', sec: 30, water: 0, note: '溫柔穩定下壓約 30 秒至聽到嘶嘶氣音即停' }
      ]
    },
    {
      id: 'lance-hedrick-121',
      category: 'masters',
      barista: 'Lance Hedrick',
      baristaEn: 'Lance Hedrick',
      title: '1-2-1 零失誤超長悶蒸兩段法',
      titleEn: '1-2-1 Foolproof Long-Bloom 2-Pour V60',
      name: 'Lance Hedrick｜1-2-1 兩段法',
      badge: '新手高容錯神方',
      badgeEn: 'Beginner-Friendly Classic',
      method: '手沖',
      dripper: 'HARIO V60 02',
      shape: '錐形',
      material: '樹脂／塑膠',
      filter: 'V60 漂白濾紙',
      roast: '淺焙',
      dose: 15,
      temp: 93,
      waterSource: '軟水（50–80 ppm）',
      grindGuide: '中偏粗研磨（C5 Pro 刻度 12.5–14）',
      grindGuideEn: 'Medium-coarse (C5 Pro dial 12.5–14)',
      summary: '只需悶蒸後一次主注水的新手神器：3 倍粉重悶蒸 2 分鐘充分排氣與預萃，接著高流速一氣呵成注至 250g，極低失誤率且乾淨高甜。',
      summaryEn: 'Beginner-friendly single main pour: 3× dose bloom for 2 full minutes, followed by one steady high-flow pour to 250 g.',
      notes: '【推薦研磨】中偏粗研磨（C5 Pro 刻度約 12.5–14）。只需 1 次悶蒸 ＋ 1 次主注水，悶蒸務必等滿 2 分鐘，總時間約 3:15–3:30 完成。',
      steps: [
        { type: '悶蒸注水', sec: 15, water: 45, note: '注入 3 倍粉重（45g）悶蒸水' },
        { type: '攪拌', sec: 5, water: 0, note: '輕柔水平搖晃或輕撥粉層，確保無乾粉結塊' },
        { type: '等待／斷水', sec: 100, water: 0, note: '【關鍵 2 分鐘長悶蒸】靜置至 2:00 充分排氣與均勻浸潤' },
        { type: '繞圈注水', sec: 35, water: 205, note: '於 2:00 以穩定大流速繞圈一次注完至 250g，收尾輕搖濾杯整平' },
        { type: '滴濾／等待完成', sec: 45, water: 0, note: '約 3:15–3:30 滴濾完成，甜感高且乾淨無雜味' }
      ]
    },
    {
      id: 'japanese-dark-roast-84',
      category: 'masters',
      barista: '日式傳統法蘭絨／KONO 流派',
      baristaEn: 'Japanese Low-Temp Dark Roast Style',
      title: '84°C 中深焙焦糖醇厚法（低苦高甜）',
      titleEn: '84°C Silky Dark Roast Pour-Over',
      name: '日式低溫｜中深焙焦糖醇厚法',
      badge: '中深焙專用經典',
      badgeEn: 'Dark Roast Classic',
      method: '手沖',
      dripper: 'HARIO V60 02',
      shape: '錐形',
      material: '陶瓷',
      filter: 'V60 漂白濾紙',
      roast: '中深焙',
      dose: 20,
      temp: 84,
      waterSource: '中軟水（60–100 ppm）',
      grindGuide: '中偏粗研磨（C5 Pro 刻度 13–14.5）',
      grindGuideEn: 'Medium-coarse (C5 Pro dial 13–14.5)',
      summary: '專為中深焙與深焙豆設計：84°C 低水溫 ＋ 1:13 醇厚粉水比 ＋ 中心小圈慢注，榨出黑巧克力與焦糖甜韻，徹底避開焦苦雜澀。',
      summaryEn: 'Tailored for medium-dark & dark roasts: 84°C gentle center pours at 1:13 ratio highlight chocolate sweetness without bitterness.',
      notes: '【推薦研磨】中偏粗研磨（C5 Pro 刻度約 13–14.5）。水溫控制在 83–85°C，注水維持中心小圈不沖杯壁，見白沫前即可提早移開濾杯。',
      steps: [
        { type: '悶蒸注水', sec: 35, water: 40, note: '84°C 柔和中心小圈注水 40g，讓新鮮深焙豆充分膨脹排氣' },
        { type: '中心注水', sec: 45, water: 110, note: '細水柱中心小圈慢繞注水 110g（累計 150g），不碰觸濾紙邊緣' },
        { type: '等待／斷水', sec: 15, water: 0, note: '稍降液位集中前中段醇厚甜感' },
        { type: '中心注水', sec: 35, water: 110, note: '中心柔水注完 110g（累計 260g），見白沫前收手避免尾段焦苦' },
        { type: '滴濾／等待完成', sec: 20, water: 0, note: '約 2:30 提早移開濾杯，展現絲滑黑巧克力與焦糖尾韻' }
      ]
    },
    {
      id: 'coffee-chronicler-switch',
      category: 'hybrid',
      barista: 'Coffee Chronicler',
      baristaEn: 'Coffee Chronicler',
      title: 'Switch 50/50 單溫雙段萬用神方',
      titleEn: 'Switch 50/50 Single-Temp Hybrid',
      name: 'Coffee Chronicler｜Switch 50/50 法',
      badge: 'Switch 全球人氣首選',
      badgeEn: 'Most Popular Switch',
      method: '浸泡式',
      dripper: 'HARIO Switch',
      shape: '浸泡／閥門式',
      material: '玻璃',
      filter: 'V60 漂白濾紙',
      roast: '淺焙',
      dose: 20,
      temp: 93,
      waterSource: '軟水',
      grindGuide: '中細偏中（C5 Pro 刻度 11.5–13）',
      grindGuideEn: 'Medium-fine (C5 Pro dial 11.5–13)',
      summary: '不用準備雙水溫就能兼顧手沖香氣與浸泡甜感：前半段 160g 開閥手沖、0:45 關閥注入後半段 160g 浸泡至 2:00 放流，簡單又極致穩定。',
      summaryEn: 'Single-temp hybrid: pour first 50% (160 g) open, close valve at 0:45 and pour remaining 160 g to steep until 2:00.',
      notes: '【推薦研磨】中細偏中（C5 Pro 刻度約 11.5–13）。免降溫、免複雜繞圈，適合各類淺中焙單品豆日常穩定出杯。',
      steps: [
        { type: '繞圈注水', sec: 25, water: 160, note: '【閥門開啟】直接以 93°C 穩定繞圈注入一半水量 160g' },
        { type: '等待／斷水', sec: 20, water: 0, note: '【閥門保持開啟】滴濾至 0:45，建立乾淨花果酸香' },
        { type: '開關閥門', sec: 5, water: 0, note: '【關閉閥門】於 0:45 關閉開關' },
        { type: '繞圈注水', sec: 25, water: 160, note: '【閥門關閉】注入剩餘 160g（累計 320g）' },
        { type: '等待／斷水', sec: 45, water: 0, note: '靜置浸泡至總時間 2:00，帶出飽滿甜度與醇厚口感' },
        { type: '開關閥門', sec: 5, water: 0, note: '【開啟閥門】於 2:00 打開開關放流' },
        { type: '滴濾／等待完成', sec: 55, water: 0, note: '約 2:55–3:00 滴濾完成，兼顧乾淨度與高甜度' }
      ]
    },
    {
      id: 'hoffmann-iced-v60',
      category: 'iced',
      barista: 'James Hoffmann',
      baristaEn: 'James Hoffmann',
      title: '40% 冰鎮 V60 日式冰手沖（單杯清爽版）',
      titleEn: 'Iced Filter Coffee (40% Ice Flash Brew)',
      name: 'James Hoffmann｜40% 冰鎮 V60',
      badge: '經典冰手沖入門',
      badgeEn: 'Classic Iced V60',
      method: '手沖',
      dripper: 'HARIO V60 01',
      shape: '錐形',
      material: '樹脂／塑膠',
      filter: 'V60 漂白濾紙',
      roast: '淺焙',
      dose: 15,
      temp: 95,
      waterSource: '軟水 ＋ 實心冰塊 100g',
      grindGuide: '細偏中細（C5 Pro 刻度 9.5–10.5）',
      grindGuideEn: 'Fine-medium (C5 Pro dial 9.5–10.5)',
      summary: '專為 15g 單人份設計的急冷冰手沖：150g 滾燙熱水一次慢繞萃取，滴落 100g 下壺冰塊瞬間急冷，清澈多汁、酸香明亮。',
      summaryEn: '15 g single-cup flash brew: 150 g hot brew water onto 100 g server ice with bloom swirl and one continuous spiral pour.',
      notes: '【推薦研磨】細偏中細（C5 Pro 刻度約 9.5–10.5）。下壺先放 100g 冰塊（佔總重 40%），熱萃完成後畫圓搖晃至冰塊融化冰鎮，再倒入裝冰的飲用杯。',
      steps: [
        { type: '悶蒸注水', sec: 15, water: 45, note: '【下壺先放 100g 冰塊】注水 45g 後輕搖濾杯讓咖啡粉完全浸濕' },
        { type: '等待／斷水', sec: 30, water: 0, note: '靜置悶蒸至 0:45 充分排氣' },
        { type: '繞圈注水', sec: 40, water: 105, note: '穩定慢速繞圈一次注完剩餘 105g（累計熱萃水 150g）' },
        { type: '攪拌', sec: 5, water: 0, note: '輕柔水平搖晃濾杯 1–2 圈整平粉床' },
        { type: '滴濾／等待完成', sec: 40, water: 0, note: '約 2:10 完成熱萃滴濾' },
        { type: '後加冰塊', sec: 0, water: 100, note: '確認下壺 100g 急冷冰塊並搖晃分享壺至均勻冰鎮' }
      ]
    },
    {
      id: 'aeropress-espresso-base',
      category: 'aeropress',
      barista: '愛樂壓特調濃萃流派',
      baristaEn: 'AeroPress Espresso-Style Concentrate',
      title: '1:5 濃萃基底（冰美式／冰拿鐵萬用）',
      titleEn: '1:5 Concentrated Base (Iced Americano / Latte)',
      name: '愛樂壓｜冰美式・拿鐵濃萃基底',
      badge: '特調濃萃必學',
      badgeEn: 'Iced Latte / Americano Base',
      method: '愛樂壓',
      dripper: 'AeroPress',
      shape: '其他／不適用',
      material: '樹脂／塑膠',
      filter: 'AeroPress 單層濾紙',
      roast: '中深焙',
      dose: 18,
      temp: 85,
      waterSource: '軟水（後段可換成鮮奶做拿鐵）',
      grindGuide: '細研磨（C5 Pro 刻度 6–7.5）',
      grindGuideEn: 'Fine (C5 Pro dial 6–7.5)',
      summary: '家中沒有義式機也能做出醇厚冰拿鐵或冰美式：18g 細粉搭 85°C 熱水 90g 1:5 濃萃，後加冰水即成冰美式，換成 150ml 冰鮮奶秒變冰拿鐵！',
      summaryEn: '18 g fine coffee with 90 g water at 85°C (1:5 concentrate); dilute with cold water + ice for an iced Americano, or swap water for milk for an iced latte.',
      notes: '【推薦研磨】細研磨（C5 Pro 刻度約 6–7.5）。【水溫建議】中深焙細研磨建議 83–85°C 避開焦苦；若用淺焙豆可微升至 88–90°C。後段 110g 冰水可改換成 150ml 鮮奶／燕麥奶製作拿鐵。',
      steps: [
        { type: '注水', sec: 15, water: 90, note: '【正壓或加裝控流蓋】以 85°C 熱水注入 90g（1:5 高濃度萃取）' },
        { type: '攪拌', sec: 15, water: 0, note: '快速前後攪拌 15 秒充分釋放醇厚感與咖啡油脂' },
        { type: '等待／斷水', sec: 45, water: 0, note: '輕插活塞防漏，靜置浸泡至 1:15' },
        { type: '下壓', sec: 25, water: 0, note: '穩定慢速下壓 25 秒榨出濃郁咖啡液（約 65–70g）' },
        { type: '後加水（bypass）', sec: 0, water: 110, waterKind: 'cold', note: '加入 110g 冰水做冰美式（做冰拿鐵時可改換成 150ml 冰鮮奶）' },
        { type: '後加冰塊', sec: 0, water: 80, note: '加入 80g 冰塊拌勻即可享用' }
      ]
    },
    {
      id: 'vietnamese-phin-iced',
      category: 'iced',
      barista: '越式傳統滴濾流派（Cà Phê Sữa Đá）',
      baristaEn: 'Traditional Vietnamese Phin (Cà Phê Sữa Đá)',
      title: '越式滴濾壺 Phin｜傳統濃萃／煉乳冰咖啡',
      titleEn: 'Traditional Vietnamese Phin Iced Coffee',
      name: '越式滴濾壺 Phin｜煉乳冰咖啡',
      badge: '越式經典滴濾',
      badgeEn: 'Vietnamese Phin Classic',
      method: '越南滴濾壺',
      dripper: '越南滴濾壺 Phin',
      shape: '平底',
      material: '金屬',
      filter: '金屬濾網',
      roast: '深焙',
      dose: 20,
      temp: 94,
      waterSource: '軟水（杯底可先加 20–30g 煉乳）',
      grindGuide: '中細研磨（C5 Pro 刻度 9.5–11）',
      grindGuideEn: 'Medium-fine (C5 Pro dial 9.5–11)',
      summary: '完整支援越式滴濾壺 Phin：20g 深焙粉悶蒸後緩慢滴濾 4 分鐘萃出濃郁焦香咖啡液，搭配煉乳與滿杯冰塊，重現道地西貢街頭風味。',
      summaryEn: 'Authentic slow-drip Phin recipe: 20 g dark roast with 90 g hot water over ~4 minutes, served over 120 g ice (with optional condensed milk).',
      notes: '【推薦研磨】中細研磨（C5 Pro 刻度約 9.5–11）。【水溫建議】搭配煉乳建議 92–94°C 萃出濃香；若不加煉乳單喝建議降溫至 86–88°C。壓片輕放即可勿重壓，理想流速為每秒 1–2 滴；杯底可先放入 20–30g 煉乳，滴完拌勻倒冰。',
      steps: [
        { type: '悶蒸注水', sec: 30, water: 20, note: '輕放金屬壓片（勿重壓），注入 20g 熱水悶蒸 30 秒讓粉層密合' },
        { type: '注水', sec: 15, water: 70, note: '緩慢注滿剩餘 70g 熱水（累計 90g）並蓋上壺蓋保溫' },
        { type: '滴濾／等待完成', sec: 240, water: 0, note: '維持每秒 1–2 滴慢速滴濾約 4 分鐘完成（杯底可預先加煉乳）' },
        { type: '後加冰塊', sec: 0, water: 120, note: '移開滴濾壺、拌勻後倒入滿杯約 120g 冰塊即可享用' }
      ]
    }
  ];

  function recipeSums(r) {
    let brewWater = 0;
    let totalSec = 0;
    let postWater = 0;
    let postIce = 0;
    let pours = 0;
    for (const s of r.steps) {
      if (MANUAL_SET.has(s.type)) {
        if (s.type === STEP_TYPES[11]) postIce += Number(s.water) || 0;
        else postWater += Number(s.water) || 0;
      } else {
        totalSec += Number(s.sec) || 0;
        if (POUR_SET.has(s.type)) {
          brewWater += Number(s.water) || 0;
          pours++;
        }
      }
    }
    brewWater = Math.round(brewWater * 10) / 10;
    postWater = Math.round(postWater * 10) / 10;
    postIce = Math.round(postIce * 10) / 10;
    const totalInput = Math.round((brewWater + postWater + postIce) * 10) / 10;
    return { brewWater, totalSec, postWater, postIce, pours, totalInput };
  }

  function scaleRecipeToDose(recipe, targetDose) {
    if (!targetDose || !Number.isFinite(targetDose) || targetDose <= 0) return recipe;
    const nextDose = Math.min(200, Math.max(0.1, Math.round(targetDose * 10) / 10));
    const factor = nextDose / recipe.dose;
    if (Math.abs(factor - 1) < 1e-6) return recipe;

    const scaled = copy(recipe);
    scaled.dose = nextDose;
    scaled.steps = scaled.steps.map(s => {
      const next = { ...s };
      if (POUR_SET.has(next.type) || MANUAL_SET.has(next.type)) {
        next.water = Math.min(3000, round1(next.water * factor));
      }
      return next;
    });
    return scaled;
  }

  function buildRecipeFromTemplate(tpl, options = {}) {
    const lang = options.lang || 'zh-Hant';
    const targetDose = (options.targetDose && Number.isFinite(Number(options.targetDose)))
      ? Math.min(200, Math.max(0.1, round1(Number(options.targetDose))))
      : tpl.dose;

    const tasteMode = options.tasteMode || 'balance';
    const strengthMode = options.strengthMode || 'standard';

    let steps = copy(tpl.steps);
    if (tpl.custom46) {
      const totalWater = Math.min(10000, round1(tpl.baseTotalWater * (targetDose / tpl.dose)));
      steps = buildTetsu46Steps(totalWater, tasteMode, strengthMode, lang);
    } else if (Math.abs(targetDose - tpl.dose) > 1e-6) {
      const factor = targetDose / tpl.dose;
      steps = steps.map(s => {
        const next = { ...s };
        if (POUR_SET.has(next.type) || MANUAL_SET.has(next.type)) {
          next.water = Math.min(3000, round1(next.water * factor));
        }
        return next;
      });
    }

    let suffix = '';
    if (tpl.custom46) {
      const tMap = lang === 'en'
        ? { balance: 'Balanced', sweet: 'Sweet', bright: 'Bright' }
        : { balance: '平衡', sweet: '偏甜', bright: '偏酸' };
      const sMap = lang === 'en'
        ? { light: 'Light', standard: 'Std', strong: 'Strong' }
        : { light: '清爽', standard: '標準', strong: '濃郁' };
      suffix = ` (${tMap[tasteMode]}·${sMap[strengthMode]})`;
    }

    const r = {
      id: newId(),
      favorite: false,
      name: (tpl.name + suffix).slice(0, 300),
      method: tpl.method,
      dripper: tpl.dripper,
      shape: tpl.shape,
      material: tpl.material,
      filter: tpl.filter || '',
      grinder: '',
      grind: '',
      grindGuide: tpl.grindGuide || '',
      grindGuideEn: tpl.grindGuideEn || '',
      dose: targetDose,
      temp: tpl.temp,
      waterSource: tpl.waterSource || '',
      cold: 0,
      ice: 0,
      bean: '',
      roaster: '',
      origin: '',
      process: '',
      roast: tpl.roast || '未填',
      roastDate: '',
      openDate: '',
      notes: String(tpl.notes || '').slice(0, 3000),
      steps
    };
    return r;
  }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { CHAMPIONS, buildTetsu46Steps, buildRecipeFromTemplate, scaleRecipeToDose, recipeSums };
  }

  if (typeof document === 'undefined' || document.getElementById('coffeeChampionDialog')) return;

  const isEn = () => document.documentElement.lang === 'en';
  const L = (zh, en) => (isEn() ? en : zh);
  const esc = s => String(s ?? '').replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]));

  // Inject OLED Monochrome Styles matching Scheme C
  if (!document.getElementById('coffeeChampionStyle')) {
    const style = document.createElement('style');
    style.id = 'coffeeChampionStyle';
    style.textContent = String.raw`
      .champ-trigger-btn {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 6px;
        background: rgba(255, 255, 255, 0.1) !important;
        border: 1.5px solid rgba(255, 255, 255, 0.45) !important;
        color: #ffffff !important;
        font-weight: 600 !important;
        border-radius: 13px !important;
        padding: 9px 14px !important;
        min-height: 44px;
        transition: background 0.16s ease, border-color 0.16s ease, color 0.16s ease;
      }
      .champ-trigger-btn:hover {
        background: #ffffff !important;
        color: #000000 !important;
        border-color: #ffffff !important;
      }
      #openChampionLibraryGuide {
        display: flex;
        width: 100%;
        margin: 10px 0 16px !important;
      }
      #coffeeChampionDialog {
        box-sizing: border-box;
        width: min(920px, calc(100% - 24px)) !important;
        max-width: calc(100% - 24px) !important;
        max-height: 90vh;
        background: #0a0a0a !important;
        border: 1px solid rgba(255, 255, 255, 0.2) !important;
        border-radius: 20px !important;
        padding: 18px !important;
        color: #f4f4f5 !important;
      }
      .champ-head {
        display: flex;
        flex-wrap: nowrap;
        justify-content: space-between;
        align-items: flex-start;
        gap: 10px;
        margin-bottom: 12px;
        padding-bottom: 10px;
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
      }
      .champ-head > div {
        min-width: 0;
        flex: 1 1 auto;
      }
      .champ-head > button {
        flex-shrink: 0;
        margin: 0 !important;
        padding: 6px 12px !important;
        min-height: 36px !important;
        font-size: 13.5px !important;
        white-space: nowrap;
      }
      .champ-head h2 {
        margin: 0;
        font-size: 1.25rem;
        color: #ffffff;
      }
      .champ-controls {
        display: grid;
        gap: 12px;
        margin-bottom: 16px;
      }
      .champ-cats, .champ-dose-bar, .champ-pills {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 6px;
      }
      .champ-pill {
        margin: 0 !important;
        min-height: 36px !important;
        padding: 5px 12px !important;
        font-size: 13.5px !important;
        border-radius: 999px !important;
        background: #161616 !important;
        border: 1px solid rgba(255, 255, 255, 0.14) !important;
        color: #d4d4d8 !important;
      }
      .champ-pill[aria-pressed="true"] {
        background: #ffffff !important;
        color: #000000 !important;
        border-color: #ffffff !important;
        font-weight: 700 !important;
      }
      .champ-dose-wrap {
        background: #121212;
        border: 1px solid rgba(255, 255, 255, 0.12);
        border-radius: 14px;
        padding: 10px 14px;
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        justify-content: space-between;
        gap: 10px;
      }
      .champ-dose-custom {
        width: 88px !important;
        min-height: 36px !important;
        padding: 4px 10px !important;
        font-size: 14px !important;
        font-family: 'JetBrains Mono', monospace;
      }
      .champ-grid {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 14px;
      }
      @media (max-width: 720px) {
        .champ-grid {
          grid-template-columns: 1fr;
        }
      }
      @media (max-width: 599px) {
        #coffeeChampionDialog {
          padding: 14px !important;
          border-radius: 16px !important;
        }
        .champ-head {
          margin-bottom: 10px;
          padding-bottom: 8px;
        }
        .champ-head h2 {
          font-size: 1.12rem;
        }
        .champ-head p {
          display: none;
        }
        .champ-controls {
          gap: 8px;
          margin-bottom: 12px;
        }
        .champ-cats {
          flex-wrap: nowrap;
          overflow-x: auto;
          -webkit-overflow-scrolling: touch;
          padding-bottom: 4px;
        }
        .champ-cats .champ-pill {
          flex-shrink: 0;
          white-space: nowrap;
          min-height: 34px !important;
          padding: 4px 10px !important;
          font-size: 13px !important;
        }
        .champ-dose-wrap {
          padding: 8px 10px;
          gap: 6px;
        }
        .champ-card {
          padding: 14px;
        }
      }
      .champ-card {
        background: #141414;
        border: 1px solid rgba(255, 255, 255, 0.14);
        border-radius: 16px;
        padding: 16px;
        display: flex;
        flex-direction: column;
        gap: 10px;
      }
      .champ-card-top {
        display: flex;
        flex-wrap: wrap;
        justify-content: space-between;
        align-items: center;
        gap: 6px;
      }
      .champ-badge {
        display: inline-block;
        font-size: 12px;
        padding: 3px 9px;
        border-radius: 999px;
        background: #ffffff;
        color: #000000;
        font-weight: 700;
      }
      .champ-barista {
        font-size: 13px;
        color: #a1a1aa;
      }
      .champ-title {
        margin: 0;
        font-size: 1.08rem;
        color: #ffffff;
        font-weight: 600;
      }
      .champ-meta {
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
      }
      .champ-chip {
        font-size: 12px;
        padding: 3px 8px;
        border-radius: 8px;
        background: rgba(255, 255, 255, 0.06);
        border: 1px solid rgba(255, 255, 255, 0.1);
        color: #e4e4e7;
        font-family: 'JetBrains Mono', 'Noto Sans TC', monospace;
      }
      .champ-chip.scaled {
        background: rgba(255, 255, 255, 0.14);
        border-color: rgba(255, 255, 255, 0.35);
        color: #ffffff;
      }
      .champ-desc {
        margin: 0;
        font-size: 13.5px;
        line-height: 1.55;
        color: #d4d4d8;
      }
      .champ-46-box {
        background: #0d0d0d;
        border: 1px solid rgba(255, 255, 255, 0.16);
        border-radius: 12px;
        padding: 10px;
        display: grid;
        gap: 8px;
      }
      .champ-46-row {
        display: flex;
        flex-direction: column;
        gap: 4px;
      }
      .champ-46-label {
        font-size: 12px;
        color: #a1a1aa;
      }
      .champ-steps-details {
        background: #0d0d0d;
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 12px;
        padding: 8px 12px;
      }
      .champ-steps-details summary {
        font-size: 13.5px !important;
        margin: 0 !important;
        color: #e4e4e7;
      }
      .champ-step-list {
        margin: 8px 0 0;
        padding-left: 18px;
        font-size: 13px;
        line-height: 1.6;
        color: #d4d4d8;
      }
      .champ-actions {
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
        margin-top: auto;
        padding-top: 6px;
      }
      .champ-btn-primary {
        flex: 1 1 100%;
        margin: 0 !important;
        background: #ffffff !important;
        color: #000000 !important;
        border-color: #ffffff !important;
        font-weight: 700 !important;
      }
      .champ-btn-sec {
        flex: 1 1 calc(50% - 4px);
        margin: 0 !important;
        font-size: 13.5px !important;
      }
      .champ-card-clickable {
        cursor: pointer;
        transition: border-color 0.16s ease, background 0.16s ease, transform 0.12s ease;
      }
      .champ-card-clickable:hover,
      .champ-card-clickable:focus-visible {
        border-color: rgba(255, 255, 255, 0.5) !important;
        background: #1b1b1b;
        outline: none;
      }
      .champ-desc-clamp {
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
      }
      .champ-card-cue {
        margin-top: auto;
        padding-top: 4px;
        font-size: 13px;
        font-weight: 600;
        color: #ffffff;
        text-align: right;
      }
      .champ-detail {
        display: grid;
        gap: 14px;
      }
      .champ-detail-nav {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 10px;
        padding-bottom: 10px;
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
      }
      .champ-detail-nav button {
        margin: 0 !important;
        min-height: 38px !important;
        padding: 6px 12px !important;
        font-size: 13.5px !important;
      }
      .champ-metrics {
        display: grid;
        grid-template-columns: repeat(4, minmax(0, 1fr));
        gap: 8px;
      }
      .champ-metric {
        background: #161616;
        border: 1px solid rgba(255, 255, 255, 0.12);
        border-radius: 12px;
        padding: 10px 8px;
        text-align: center;
      }
      .champ-metric span {
        display: block;
        font-size: 12px;
        color: #a1a1aa;
      }
      .champ-metric strong {
        display: block;
        margin-top: 4px;
        font-size: 18px;
        font-family: 'JetBrains Mono', monospace;
        color: #ffffff;
      }
      @media (max-width: 520px) {
        .champ-metrics {
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }
      }
      .champ-detail-box {
        background: #141414;
        border: 1px solid rgba(255, 255, 255, 0.12);
        border-radius: 14px;
        padding: 12px 14px;
      }
      .champ-detail-box h4 {
        margin: 0 0 8px;
        font-size: 14.5px;
        color: #ffffff;
      }
      .champ-detail-steps {
        margin: 0;
        padding: 0;
        list-style: none;
        display: grid;
        gap: 8px;
      }
      .champ-detail-step {
        background: #1a1a1a;
        border: 1px solid rgba(255, 255, 255, 0.08);
        border-radius: 10px;
        padding: 10px 12px;
        font-size: 13.5px;
        line-height: 1.55;
      }
      .champ-detail-step-head {
        display: flex;
        flex-wrap: wrap;
        justify-content: space-between;
        gap: 6px;
        font-weight: 600;
        color: #ffffff;
        margin-bottom: 3px;
      }
      .champ-detail-step-time {
        font-family: 'JetBrains Mono', monospace;
        font-size: 12.5px;
        color: #a1a1aa;
      }
      .champ-detail-step-note {
        color: #d4d4d8;
        font-size: 13px;
      }
    `;
    document.head.append(style);
  }

  let activeCategory = 'all';
  let activeRecipeId = null;
  let listScrollTop = 0;
  let targetDose = null;
  let tetsuTaste = 'balance';
  let tetsuStrength = 'standard';

  const dialog = document.createElement('dialog');
  dialog.id = 'coffeeChampionDialog';
  dialog.setAttribute('data-coffee-user-text', 'true');
  document.body.append(dialog);

  const catCount = id => (id === 'all' ? CHAMPIONS.length : CHAMPIONS.filter(c => c.category === id).length);
  const CATS = [
    { id: 'all', zh: `全部 (${catCount('all')})`, en: `All (${catCount('all')})` },
    { id: 'wbrc', zh: `🏆 WBrC 世界冠軍 (${catCount('wbrc')})`, en: `🏆 WBrC Champions (${catCount('wbrc')})` },
    { id: 'masters', zh: `✨ 名家經典 (${catCount('masters')})`, en: `✨ Master Classics (${catCount('masters')})` },
    { id: 'hybrid', zh: `🔀 Switch／浸泡 (${catCount('hybrid')})`, en: `🔀 Switch / Immersion (${catCount('hybrid')})` },
    { id: 'iced', zh: `🧊 急冷冰手沖 (${catCount('iced')})`, en: `🧊 Iced Flash Brew (${catCount('iced')})` },
    { id: 'aeropress', zh: `🧪 愛樂壓 (${catCount('aeropress')})`, en: `🧪 AeroPress (${catCount('aeropress')})` }
  ];

  function stageDraftRecipe(r) {
    if (typeof run !== 'undefined' && run) {
      if (typeof msg === 'function') msg(L('請先重設計時', 'Reset the timer first'));
      return false;
    }
    const addBtn = document.getElementById('add');
    if (!addBtn || typeof window.sample !== 'function') {
      return false;
    }
    const origSample = window.sample;
    window.sample = () => copy(r);
    try {
      addBtn.click();
    } finally {
      window.sample = origSample;
    }
    // If recipe-draft-fix reused an existing 'pour' draft slot, push r into the form & draft map:
    const nameInput = document.getElementById('name');
    const doseEl = document.getElementById('dose');
    const recipesSel = document.getElementById('recipes');
    const stepBoxCount = document.querySelectorAll('#steps > .box').length;
    const firstWater = Number(document.getElementById('sw0')?.value);
    const expectedFirstWater = r.steps[0] ? Number(r.steps[0].water) : NaN;
    const tempEl = document.getElementById('temp');
    const notesEl = document.getElementById('notes');
    if (
      nameInput &&
      recipesSel &&
      typeof fill === 'function' &&
      (
        nameInput.value !== r.name ||
        (doseEl && Number(doseEl.value) !== r.dose) ||
        (tempEl && Number(tempEl.value) !== r.temp) ||
        (notesEl && notesEl.value !== r.notes) ||
        stepBoxCount !== r.steps.length ||
        firstWater !== expectedFirstWater
      )
    ) {
      const targetId = typeof selected !== 'undefined' ? selected : recipesSel.value;
      const nextDraft = copy(r);
      nextDraft.id = targetId;
      fill(nextDraft);
      if (typeof recipesSel.onchange === 'function') {
        recipesSel.onchange({ target: { value: targetId } });
      }
    }
    if (typeof render === 'function') {
      try { render(); } catch (e) {}
    }
    return true;
  }

  function brewNow(r) {
    if (!stageDraftRecipe(r)) return;
    dialog.close();
    const enterGuide = document.getElementById('coffeeEnterGuide');
    if (enterGuide) {
      enterGuide.click();
    } else {
      const guideTab = document.querySelector('nav button[data-tab="guide"]');
      if (guideTab) guideTab.click();
    }
    if (typeof msg === 'function') {
      msg(L(`已帶入「${r.name}」至引導沖煮，按下開始即可計時`, `Loaded "${r.name}" into Guided Brewing`));
    }
  }

  function loadToStudio(r) {
    if (!stageDraftRecipe(r)) return;
    dialog.close();
    const brewTab = document.querySelector('nav button[data-tab="brew"]');
    if (brewTab) brewTab.click();
    const panel = document.getElementById('coffeeRecipePanel');
    if (panel) panel.scrollIntoView({ behavior: 'smooth', block: 'start' });
    if (typeof msg === 'function') {
      msg(L(`已載入「${r.name}」為工作室草稿，可自由調整後按「儲存為新配方」`, `Loaded "${r.name}" into Recipe Studio`));
    }
  }

  function saveToMyRecipes(r) {
    if (typeof db === 'undefined' || !Array.isArray(db.recipes)) return;
    if (db.recipes.length >= 500) {
      if (typeof msg === 'function') msg(L('配方已達上限', 'Recipe limit reached'));
      return;
    }
    const item = copy(r);
    const baseName = item.name;
    let uniqueName = baseName;
    let idx = 2;
    while (db.recipes.some(x => x.name === uniqueName)) {
      uniqueName = `${baseName.slice(0, 280)}（${idx++}）`;
    }
    item.name = uniqueName;
    if (typeof vr === 'function' && !vr(item)) {
      if (typeof msg === 'function') msg(L('配方格式驗證未通過', 'Recipe failed validation'));
      return;
    }
    db.recipes.push(item);
    if (typeof selected !== 'undefined') selected = item.id;
    const ok = typeof save === 'function' ? save() : true;
    if (typeof load === 'function') load();
    dialog.close();
    if (typeof msg === 'function') {
      msg(ok
        ? L(`已存入我的配方：${item.name}`, `Saved to your recipes: ${item.name}`)
        : L('目前僅暫存於記憶體，請備份', 'Saved in memory only; back up data'));
    }
  }

  function fmtSec(sec) {
    const s = Math.max(0, Math.round(sec));
    const m = Math.floor(s / 60);
    const rem = s % 60;
    return `${m}:${String(rem).padStart(2, '0')}`;
  }

  function renderDetailView(tpl, en) {
    const built = buildRecipeFromTemplate(tpl, {
      lang: en ? 'en' : 'zh-Hant',
      targetDose,
      tasteMode: tetsuTaste,
      strengthMode: tetsuStrength
    });
    const sums = recipeSums(built);
    const isScaled = Math.abs(built.dose - tpl.dose) > 1e-6;
    const ratio = built.dose > 0 ? (sums.brewWater / built.dose).toFixed(1) : '—';

    const wrap = document.createElement('div');
    wrap.className = 'champ-detail';

    // Top Nav: Back to List + Close
    const nav = document.createElement('div');
    nav.className = 'champ-detail-nav';
    const backBtn = document.createElement('button');
    backBtn.type = 'button';
    backBtn.textContent = en ? '← Back to recipes' : '← 返回配方清單';
    backBtn.onclick = () => {
      activeRecipeId = null;
      targetDose = null;
      renderDialogContent();
      dialog.scrollTop = listScrollTop;
    };
    const closeBtn = document.createElement('button');
    closeBtn.type = 'button';
    closeBtn.textContent = en ? 'Close ✕' : '關閉 ✕';
    closeBtn.onclick = () => dialog.close();
    nav.append(backBtn, closeBtn);
    wrap.append(nav);

    // Header: Badge + Barista + Title + Summary
    const top = document.createElement('div');
    top.className = 'champ-card-top';
    top.innerHTML = `
      <span class="champ-badge">${esc(en ? tpl.badgeEn : tpl.badge)}</span>
      <span class="champ-barista">${esc(en ? tpl.baristaEn : tpl.barista)}</span>
    `;
    const h2 = document.createElement('h2');
    h2.style.margin = '0';
    h2.style.fontSize = '1.3rem';
    h2.textContent = en ? tpl.titleEn : tpl.title;
    const summaryP = document.createElement('p');
    summaryP.className = 'champ-desc';
    summaryP.textContent = en ? tpl.summaryEn : tpl.summary;
    wrap.append(top, h2, summaryP);

    // 4-tile Core Metrics Grid
    const metrics = document.createElement('div');
    metrics.className = 'champ-metrics';
    for (const [k, v] of [
      [en ? 'Coffee' : '粉量', `${built.dose} g`],
      [en ? `Water (1:${ratio})` : `萃取水 (1:${ratio})`, `${sums.brewWater} g`],
      [en ? 'Temp' : '水溫', `${built.temp}°C`],
      [en ? 'Time' : '預計時間', fmtSec(sums.totalSec)]
    ]) {
      const box = document.createElement('div');
      box.className = 'champ-metric';
      box.innerHTML = `<span>${esc(k)}</span><strong>${esc(v)}</strong>`;
      metrics.append(box);
    }
    wrap.append(metrics);

    // Gear & Grind Card
    const gearBox = document.createElement('div');
    gearBox.className = 'champ-detail-box';
    const gearChips = [
      `<span class="champ-chip">${esc(built.dripper)}</span>`,
      built.filter ? `<span class="champ-chip">${esc(built.filter)}</span>` : '',
      built.roast && built.roast !== '未填' ? `<span class="champ-chip">${esc(built.roast)}</span>` : '',
      `<span class="champ-chip scaled">${esc(en ? tpl.grindGuideEn : tpl.grindGuide)}</span>`
    ].filter(Boolean);
    if (sums.postIce > 0) gearChips.push(`<span class="champ-chip scaled">+${sums.postIce}g ${en ? 'Ice' : '冰塊'}</span>`);
    if (sums.postWater > 0) gearChips.push(`<span class="champ-chip scaled">+${sums.postWater}g Bypass</span>`);
    if (isScaled) gearChips.push(`<span class="champ-chip scaled">${en ? `Scaled from ${tpl.dose}g` : `原 ${tpl.dose}g 已換算`}</span>`);
    gearBox.innerHTML = `<h4>${en ? 'Equipment & Recommended Grind' : '器材與推薦研磨'}</h4><div class="champ-meta">${gearChips.join('')}</div>`;
    wrap.append(gearBox);

    // Dose Scaler
    const doseWrap = document.createElement('div');
    doseWrap.className = 'champ-dose-wrap';
    const doseLabel = document.createElement('span');
    doseLabel.style.fontSize = '13.5px';
    doseLabel.style.color = '#e4e4e7';
    doseLabel.textContent = en ? '⚖️ Scale Coffee Dose:' : '⚖️ 目標粉量（自動換算水量）：';
    const doseBar = document.createElement('div');
    doseBar.className = 'champ-dose-bar';
    for (const val of [null, 12, 15, 18, 20, 25]) {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'champ-pill';
      b.setAttribute('aria-pressed', String(targetDose === val));
      b.textContent = val === null ? (en ? `Original (${tpl.dose}g)` : `原配方 (${tpl.dose}g)`) : `${val}g`;
      b.onclick = () => {
        targetDose = val;
        renderDialogContent();
      };
      doseBar.append(b);
    }
    const customInput = document.createElement('input');
    customInput.type = 'number';
    customInput.min = '5';
    customInput.max = '100';
    customInput.step = '0.5';
    customInput.placeholder = en ? 'Custom g' : '自訂 g';
    customInput.className = 'champ-dose-custom';
    customInput.value = targetDose && ![12, 15, 18, 20, 25].includes(targetDose) ? String(targetDose) : '';
    customInput.onchange = () => {
      const v = Number(customInput.value);
      targetDose = Number.isFinite(v) && v >= 5 && v <= 100 ? v : null;
      renderDialogContent();
    };
    doseBar.append(customInput);
    doseWrap.append(doseLabel, doseBar);
    wrap.append(doseWrap);

    // Tetsu 4:6 Customizer Controls
    if (tpl.custom46) {
      const box46 = document.createElement('div');
      box46.className = 'champ-46-box';
      const r1 = document.createElement('div');
      r1.className = 'champ-46-row';
      const l1 = document.createElement('span');
      l1.className = 'champ-46-label';
      l1.textContent = en ? 'First 40% (Acidity / Sweetness balance):' : '前 40% 兩段比例（決定甜酸走向）：';
      const p1 = document.createElement('div');
      p1.className = 'champ-pills';
      for (const [id, zhLabel, enLabel] of [
        ['balance', '標準平衡 (5:5)', 'Balanced (5:5)'],
        ['sweet', '偏甜飽滿 (5:7)', 'Sweeter (5:7)'],
        ['bright', '偏酸明亮 (7:5)', 'Brighter (7:5)']
      ]) {
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'champ-pill';
        b.setAttribute('aria-pressed', String(tetsuTaste === id));
        b.textContent = en ? enLabel : zhLabel;
        b.onclick = () => {
          tetsuTaste = id;
          renderDialogContent();
        };
        p1.append(b);
      }
      r1.append(l1, p1);

      const r2 = document.createElement('div');
      r2.className = 'champ-46-row';
      const l2 = document.createElement('span');
      l2.className = 'champ-46-label';
      l2.textContent = en ? 'Remaining 60% (Strength / Body pours):' : '後 60% 注水段數（決定濃度厚薄）：';
      const p2 = document.createElement('div');
      p2.className = 'champ-pills';
      for (const [id, zhLabel, enLabel] of [
        ['light', '清爽 (2段)', 'Light (2 pours)'],
        ['standard', '標準 (3段)', 'Standard (3 pours)'],
        ['strong', '濃郁 (4段)', 'Strong (4 pours)']
      ]) {
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'champ-pill';
        b.setAttribute('aria-pressed', String(tetsuStrength === id));
        b.textContent = en ? enLabel : zhLabel;
        b.onclick = () => {
          tetsuStrength = id;
          renderDialogContent();
        };
        p2.append(b);
      }
      r2.append(l2, p2);
      box46.append(r1, r2);
      wrap.append(box46);
    }

    // Brewing Tips
    if (built.notes) {
      const notesBox = document.createElement('div');
      notesBox.className = 'champ-detail-box';
      notesBox.innerHTML = `<h4>${en ? 'Brewing Notes & Tips' : '沖煮要點'}</h4><p class="champ-desc" style="margin:0">${esc(built.notes)}</p>`;
      wrap.append(notesBox);
    }

    // Expanded Full Step Timeline
    const stepsBox = document.createElement('div');
    stepsBox.className = 'champ-detail-box';
    const stepsTitle = document.createElement('h4');
    stepsTitle.textContent = en
      ? `Brewing Steps (${built.steps.length} steps · ${sums.pours} pours · ${sums.brewWater}g)`
      : `完整沖煮步驟（共 ${built.steps.length} 段 · ${sums.pours} 段注水 · ${sums.brewWater}g）`;
    const ul = document.createElement('ol');
    ul.className = 'champ-detail-steps';
    let cum = 0;
    let elapsed = 0;
    built.steps.forEach((st, idx) => {
      const li = document.createElement('li');
      li.className = 'champ-detail-step';
      const isManual = MANUAL_SET.has(st.type);
      if (POUR_SET.has(st.type)) cum = Math.round((cum + st.water) * 10) / 10;
      const timeLabel = isManual ? (en ? 'Manual' : '手動確認') : `${fmtSec(elapsed)} (${st.sec}s)`;
      const amtLabel = isManual
        ? `+${st.water}g`
        : POUR_SET.has(st.type)
          ? `+${st.water}g → ${cum}g`
          : '';
      if (!isManual) elapsed += st.sec;
      li.innerHTML = `
        <div class="champ-detail-step-head">
          <span>${idx + 1}. ${esc(st.type)}${amtLabel ? ' · ' + esc(amtLabel) : ''}</span>
          <span class="champ-detail-step-time">${esc(timeLabel)}</span>
        </div>
        ${st.note ? `<div class="champ-detail-step-note">${esc(st.note)}</div>` : ''}
      `;
      ul.append(li);
    });
    stepsBox.append(stepsTitle, ul);
    wrap.append(stepsBox);

    // Bottom Actions
    const actions = document.createElement('div');
    actions.className = 'champ-actions';
    const btnBrew = document.createElement('button');
    btnBrew.type = 'button';
    btnBrew.className = 'champ-btn-primary';
    btnBrew.textContent = en ? 'Brew Now →' : '直接帶入沖煮 →';
    btnBrew.onclick = () => brewNow(built);

    const btnStudio = document.createElement('button');
    btnStudio.type = 'button';
    btnStudio.className = 'champ-btn-sec';
    btnStudio.textContent = en ? 'Load into Studio' : '載入工作室微調';
    btnStudio.onclick = () => loadToStudio(built);

    const btnSave = document.createElement('button');
    btnSave.type = 'button';
    btnSave.className = 'champ-btn-sec';
    btnSave.textContent = en ? '＋ Save to My Recipes' : '＋ 存入我的配方';
    btnSave.onclick = () => saveToMyRecipes(built);

    actions.append(btnBrew, btnStudio, btnSave);
    wrap.append(actions);

    dialog.append(wrap);
  }

  function renderDialogContent() {
    const en = isEn();
    dialog.replaceChildren();

    if (activeRecipeId) {
      const tpl = CHAMPIONS.find(c => c.id === activeRecipeId);
      if (tpl) {
        renderDetailView(tpl, en);
        return;
      }
      activeRecipeId = null;
    }

    const list = CHAMPIONS.filter(c => activeCategory === 'all' || c.category === activeCategory);

    const head = document.createElement('div');
    head.className = 'champ-head';
    head.innerHTML = `
      <div>
        <h2>🏆 ${en ? 'Master & Champion Recipes' : '名家與世界賽配方總覽'}</h2>
        <p class="hint" style="margin:4px 0 0">${en
          ? 'Tap any recipe to view full overview, scale dose, inspect steps, and start brewing.'
          : '點選任一配方查看完整概覽、換算粉量、檢視步驟並一鍵帶入沖煮。'}</p>
      </div>
    `;
    const closeBtn = document.createElement('button');
    closeBtn.type = 'button';
    closeBtn.textContent = en ? 'Close ✕' : '關閉 ✕';
    closeBtn.style.margin = '0';
    closeBtn.onclick = () => dialog.close();
    head.append(closeBtn);
    dialog.append(head);

    // Step 1 Controls: Category pills ONLY (clean & compact!)
    const controls = document.createElement('div');
    controls.className = 'champ-controls';
    const catRow = document.createElement('div');
    catRow.className = 'champ-cats';
    for (const c of CATS) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'champ-pill';
      btn.setAttribute('aria-pressed', String(activeCategory === c.id));
      btn.textContent = en ? c.en : c.zh;
      btn.onclick = () => {
        activeCategory = c.id;
        renderDialogContent();
      };
      catRow.append(btn);
    }
    controls.append(catRow);
    dialog.append(controls);

    // Compact Summary Cards Grid
    const grid = document.createElement('div');
    grid.className = 'champ-grid';

    for (const tpl of list) {
      const built = buildRecipeFromTemplate(tpl, { lang: en ? 'en' : 'zh-Hant' });
      const sums = recipeSums(built);
      const ratio = built.dose > 0 ? (sums.brewWater / built.dose).toFixed(1) : '—';

      const card = document.createElement('article');
      card.className = 'champ-card champ-card-clickable';
      card.tabIndex = 0;
      card.setAttribute('role', 'button');

      const openDetail = () => {
        listScrollTop = dialog.scrollTop;
        activeRecipeId = tpl.id;
        targetDose = null;
        renderDialogContent();
        dialog.scrollTop = 0;
      };
      card.onclick = openDetail;
      card.onkeydown = e => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          openDetail();
        }
      };

      const top = document.createElement('div');
      top.className = 'champ-card-top';
      top.innerHTML = `
        <span class="champ-badge">${esc(en ? tpl.badgeEn : tpl.badge)}</span>
        <span class="champ-barista">${esc(en ? tpl.baristaEn : tpl.barista)}</span>
      `;
      card.append(top);

      const h3 = document.createElement('h3');
      h3.className = 'champ-title';
      h3.textContent = en ? tpl.titleEn : tpl.title;
      card.append(h3);

      const meta = document.createElement('div');
      meta.className = 'champ-meta';
      const chips = [
        `<span class="champ-chip">${esc(built.dripper)}</span>`,
        `<span class="champ-chip">${built.dose}g : ${sums.brewWater}g (1:${ratio})</span>`,
        `<span class="champ-chip">${built.temp}°C</span>`,
        `<span class="champ-chip">${fmtSec(sums.totalSec)}</span>`,
        `<span class="champ-chip">${esc(en ? tpl.grindGuideEn : tpl.grindGuide)}</span>`
      ];
      if (sums.postIce > 0) chips.push(`<span class="champ-chip scaled">+${sums.postIce}g ${en ? 'Ice' : '冰塊'}</span>`);
      if (sums.postWater > 0) chips.push(`<span class="champ-chip scaled">+${sums.postWater}g Bypass</span>`);
      meta.innerHTML = chips.join('');
      card.append(meta);

      const desc = document.createElement('p');
      desc.className = 'champ-desc champ-desc-clamp';
      desc.textContent = en ? tpl.summaryEn : tpl.summary;
      card.append(desc);

      const cue = document.createElement('div');
      cue.className = 'champ-card-cue';
      cue.textContent = en ? 'View overview & steps →' : '查看概覽與步驟 →';
      card.append(cue);

      grid.append(card);
    }

    dialog.append(grid);
  }

  function openChampionDialog() {
    activeRecipeId = null;
    targetDose = null;
    listScrollTop = 0;
    renderDialogContent();
    if (!dialog.open) dialog.showModal();
    dialog.scrollTop = 0;
  }

  function mountTriggers() {
    // 1. Recipe Studio trigger button
    const aeroBtn = document.getElementById('aero');
    if (aeroBtn && !document.getElementById('openChampionLibraryStudio')) {
      const studioBtn = document.createElement('button');
      studioBtn.id = 'openChampionLibraryStudio';
      studioBtn.type = 'button';
      studioBtn.className = 'champ-trigger-btn';
      studioBtn.setAttribute('data-coffee-user-text', 'true');
      studioBtn.textContent = L('🏆 名家／世界賽配方庫', '🏆 Master & Champion Recipes');
      studioBtn.onclick = openChampionDialog;
      aeroBtn.after(studioBtn);
    }

    // 2. Guided Brewing preparation panel trigger button
    const flowPrepare = document.getElementById('flowPrepare');
    if (flowPrepare && !document.getElementById('openChampionLibraryGuide')) {
      const guideBtn = document.createElement('button');
      guideBtn.id = 'openChampionLibraryGuide';
      guideBtn.type = 'button';
      guideBtn.className = 'champ-trigger-btn';
      guideBtn.setAttribute('data-coffee-user-text', 'true');
      guideBtn.textContent = L('🏆 載入名家／冠軍配方', '🏆 Champion Recipes');
      guideBtn.onclick = openChampionDialog;
      const beginBtn = document.getElementById('flowBegin');
      if (beginBtn) beginBtn.after(guideBtn);
      else flowPrepare.append(guideBtn);
    }
  }

  function refreshTriggerLabels() {
    const sBtn = document.getElementById('openChampionLibraryStudio');
    if (sBtn) sBtn.textContent = L('🏆 名家／世界賽配方庫', '🏆 Master & Champion Recipes');
    const gBtn = document.getElementById('openChampionLibraryGuide');
    if (gBtn) gBtn.textContent = L('🏆 載入名家／冠軍配方', '🏆 Champion Recipes');
  }

  mountTriggers();

  let lastLang = document.documentElement.lang;
  new MutationObserver(() => {
    const nextLang = document.documentElement.lang;
    if (nextLang === lastLang) return;
    lastLang = nextLang;
    refreshTriggerLabels();
    if (dialog.open) renderDialogContent();
  }).observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });
})();
