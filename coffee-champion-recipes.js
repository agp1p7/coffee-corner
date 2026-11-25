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
      grindGuide: '粗研磨（C5 Pro 刻度 16–17.2）',
      grindGuideEn: 'Coarse (C5 Pro dial 16–17.2)',
      grindMinUm: 950,
      grindMaxUm: 1060,
      grindLevel: '粗研磨',
      grindLevelEn: 'Coarse',
      summary: '世界最知名手沖理論：前 40% 兩段水量比例決定甜度與酸度；後 60% 分割段數決定濃度與醇厚度。每次注水均須等液面流乾再續注。',
      summaryEn: 'Split total water 40% / 60%: the first 40% tunes sweetness vs acidity; the remaining 60% pours adjust body and strength. Wait for drawdown between pours.',
      custom46: true,
      baseTotalWater: 300,
      notes: '【推薦研磨】粗研磨（C5 Pro 轉盤刻度約 16–17.2，從完全鎖死歸零起算，約轉過一圈 0–2.2 大格）。水溫淺焙 92–93°C / 中深焙 83–88°C。關鍵在於每段等待濾杯幾乎流乾再注水。',
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
      grindGuide: '中細研磨（C5 Pro 刻度 12–13.2）',
      grindGuideEn: 'Medium-fine (C5 Pro dial 12–13.2)',
      grindMinUm: 650,
      grindMaxUm: 770,
      grindLevel: '中細研磨',
      grindLevelEn: 'Medium-fine',
      summary: '前段開啟閥門用 90°C 熱萃明亮花果香；1:15 後關閉閥門並降溫至 70°C 溫水浸泡，只溶出大量甜感物質而鎖住單寧苦澀。',
      summaryEn: 'Brew open at 90°C for bright aromatics, then close the valve at 1:15 and steep with 70°C water for explosive sweetness without bitterness.',
      notes: '【雙溫雙段關鍵】前 120g 閥門開啟用 90°C；1:15 關閥後將壺內降溫至 70°C（或備另一壺冷水降溫）再注完 280g。研磨：中細（C5 Pro 刻度 12–13.2）。',
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
      grindGuide: '中細偏中（C5 Pro 刻度 13–14.2）',
      grindGuideEn: 'Medium-fine (C5 Pro dial 13–14.2)',
      grindMinUm: 730,
      grindMaxUm: 850,
      grindLevel: '中細偏中',
      grindLevelEn: 'Medium-fine',
      summary: '臺灣第一位 WBrC 世界冠軍經典架構：短悶蒸後直接大水柱兩段式注水，第一段建立萃取效率與甜度，第二段純中心注水維持液位與純淨度。',
      summaryEn: 'Taiwan’s first WBrC Champion approach: short bloom followed by a large concentric main pour and a gentle center finish pour.',
      notes: '【推薦研磨】中細偏中（C5 Pro 刻度約 13–14.2）。重點在第一段先定點中心 2 秒再順暢往外繞圈，第二段則穩住中心硬幣大小不碰觸邊緣。',
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
      grindGuide: '中細研磨（C5 Pro 刻度 12–13.2）',
      grindGuideEn: 'Medium-fine (C5 Pro dial 12–13.2)',
      grindMinUm: 650,
      grindMaxUm: 770,
      grindLevel: '中細研磨',
      grindLevelEn: 'Medium-fine',
      summary: '錐形 Origami 搭配 Kalita 波浪平底濾紙的混搭美學：前高擾動、後柔水與 94°C 高水溫精準萃出飽滿圓潤甜感。',
      summaryEn: 'Paired ORIGAMI brewer with flat-bottom Kalita Wave filter; high-agitation first main pour followed by soft final pour at 94°C.',
      notes: '【推薦器材組合】ORIGAMI S ＋ Kalita 155 蛋糕濾紙（貼合肋條減緩流速）。研磨度 C5 Pro 刻度約 12–13.2，總時間約 2:00 收杯。',
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
      dose: 20,
      temp: 93,
      waterSource: '低礦物質軟水',
      grindGuide: '中偏粗研磨（C5 Pro 刻度 15–16.2）',
      grindGuideEn: 'Medium-coarse (C5 Pro dial 15–16.2)',
      grindMinUm: 880,
      grindMaxUm: 990,
      grindLevel: '中偏粗研磨',
      grindLevelEn: 'Medium-coarse',
      summary: '2021 WBrC 官方原版：20g 粉對 300g 水（1:15），以金屬 V60 保溫分成 5 次各 60g 注水，前兩段 93°C 強酸甜萃取，後三段降溫至 88°C 保留乾淨甜韻。',
      summaryEn: 'Official 2021 WBrC 20 g : 300 g (1:15) five 60 g pours in a metal V60: first two pours at 93°C, switching to 88°C for the last three pours.',
      notes: '【雙水溫技巧】20g 粉對 300g 水（1:15）；前兩段合計 120g 使用 93°C，第 3–5 段降溫至 88°C（可預備第二支壺）。研磨偏粗（C5 Pro 刻度約 15–16.2），不搖晃不攪拌，靠大水流自然翻攪。',
      steps: [
        { type: '悶蒸注水', sec: 30, water: 60, note: '第 1 段（93°C）：高流速中心轉繞圈注水 60g，讓粉層充分排氣' },
        { type: '繞圈注水', sec: 30, water: 60, note: '第 2 段（93°C）：當液面接近粉床時注水 60g（累計 120g）' },
        { type: '繞圈注水', sec: 30, water: 60, note: '第 3 段（切換 88°C）：注水 60g（累計 180g），柔化後段澀感' },
        { type: '繞圈注水', sec: 30, water: 60, note: '第 4 段（88°C）：注水 60g（累計 240g）' },
        { type: '中心注水', sec: 25, water: 60, note: '第 5 段（88°C）：偏中心柔和注水 60g（累計 300g）' },
        { type: '滴濾／等待完成', sec: 35, water: 0, note: '約 3:00 滴濾完成，展現明亮果酸與果汁感' }
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
      dripper: 'ORIGAMI Air S',
      shape: '錐形',
      material: '樹脂／塑膠',
      filter: '錐形濾紙',
      roast: '淺焙',
      dose: 15.5,
      temp: 91,
      waterSource: '調整礦物質軟水（約 60 ppm）',
      grindGuide: '中偏粗研磨（C5 Pro 刻度 15–16.2）',
      grindGuideEn: 'Medium-coarse (C5 Pro dial 15–16.2)',
      grindMinUm: 880,
      grindMaxUm: 990,
      grindLevel: '中偏粗研磨',
      grindLevelEn: 'Medium-coarse',
      summary: '極易複製的高容錯冠軍配方：每 30 秒穩定注入 50g，五段合計 250g（15.5g 粉，約 1:16），呈現清晰果汁甜感與平衡酸質。',
      summaryEn: 'Highly repeatable 5×50 g pouring cadence every 30 s with 15.5 g dose and 91°C water.',
      notes: '【推薦研磨】中偏粗研磨（C5 Pro 刻度約 15–16.2）。【推薦參數】15.5g 粉搭 250g 水，91°C。每 30 秒（0:00、0:30、1:00、1:30、2:00）穩定注入 50g，最後一注集中中心較柔和。',
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
      dripper: 'OREA V4',
      shape: '平底',
      material: '樹脂／塑膠',
      filter: '平底專用濾紙',
      roast: '淺焙',
      dose: 17,
      temp: 93,
      waterSource: '軟水（40–60 ppm）',
      grindGuide: '中研磨（C5 Pro 刻度 13.2–15）',
      grindGuideEn: 'Medium (C5 Pro dial 13.2–15)',
      grindMinUm: 780,
      grindMaxUm: 880,
      grindLevel: '中研磨',
      grindLevelEn: 'Medium',
      summary: '2024 WBrC 官方原版：17g 粉對 270g 水（93°C），使用 OREA V4 平底濾杯與四段柔水（60/60/50/100g，每 40 秒一段），榨出絲滑包覆感與細緻甜度。',
      summaryEn: 'Official 2024 WBrC OREA V4 recipe: 17 g : 270 g at 93°C across four gentle pours (60 / 60 / 50 / 100 g every 40 s) for silky sweetness.',
      notes: '【推薦器材】OREA V4 平底濾杯（原版搭配 Melodrip 柔水，家中可採貼近水面細柔水流取代）。研磨 C5 Pro 刻度 13.2–15，水溫 93°C，17g 粉對 270g 水，約 2:25 完成。',
      steps: [
        { type: '悶蒸注水', sec: 40, water: 60, note: '第 1 段（0:00）：柔水繞圈注水 60g，悶蒸至 0:40' },
        { type: '繞圈注水', sec: 40, water: 60, note: '第 2 段（0:40）：穩定柔水繞圈注水 60g（累計 120g）' },
        { type: '繞圈注水', sec: 40, water: 50, note: '第 3 段（1:20）：繞圈柔水注水 50g（累計 170g）' },
        { type: '中心注水', sec: 15, water: 100, note: '第 4 段（2:00）：穩定柔水注水 100g（累計 270g）減少旁路通道' },
        { type: '滴濾／等待完成', sec: 15, water: 0, note: '約 2:25–2:30 完成滴濾，輕晃分享壺均勻後享用' }
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
      grindGuide: '中細研磨（C5 Pro 刻度 12–13.2）',
      grindGuideEn: 'Medium-fine (C5 Pro dial 12–13.2)',
      grindMinUm: 650,
      grindMaxUm: 770,
      grindLevel: '中細研磨',
      grindLevelEn: 'Medium-fine',
      summary: '臺灣 WBC 世界冠軍的經典門市手沖邏輯：1:15 緊緻粉水比，前段悶蒸柔和、中段拉高水柱徹底翻攪咖啡粉、後段貼近粉面中心收甜。',
      summaryEn: '1:15 signature Simple Kaffa ratio: gentle bloom, high-pour agitation stage for aroma, and low-pour center finish for sweetness.',
      notes: '【推薦研磨】中細研磨（C5 Pro 刻度約 12–13.2）。【水柱高低節奏】第 1 段低柔悶蒸；第 2 段拉高約 10cm 加強攪拌釋放香氣；第 3 段壓低貼近水面在中心注完 225g。',
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
      grindGuide: '中細研磨（C5 Pro 刻度 11.2–13）',
      grindGuideEn: 'Medium-fine (C5 Pro dial 11.2–13)',
      grindMinUm: 620,
      grindMaxUm: 730,
      grindLevel: '中細研磨',
      grindLevelEn: 'Medium-fine',
      summary: '針對小粉量（15g）極易失溫痛點設計的脈衝手法：5 次 50g 短間隔注水維持熱能與水位，搭配悶蒸與收尾兩次溫柔 Swirl（搖晃整平）。',
      summaryEn: 'Engineered for small 15 g doses: 5×50 g timed pulses maintain slurry temperature, plus gentle bloom and drawdown swirls.',
      notes: '【推薦水溫與研磨】淺焙豆直上 95–98°C、極淺可至沸騰；研磨偏細（C5 Pro 刻度 11.2–13）。每次注水 50g 後停水 10 秒讓溫度維持高點。',
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
      grindGuide: '中細研磨（C5 Pro 刻度 12.2–14）',
      grindGuideEn: 'Medium-fine (C5 Pro dial 12.2–14)',
      grindMinUm: 700,
      grindMaxUm: 800,
      grindLevel: '中細研磨',
      grindLevelEn: 'Medium-fine',
      summary: '現代手沖「Rao Spin 水平搖晃整平法」與「3 倍粉重悶蒸」發源配方：追求最高且最均勻的粉層萃取率（高水溫、1:17 比例、極低通道效應）。',
      summaryEn: 'High-extraction 1:17 method featuring a 3× dose bloom and the signature horizontal Rao Spin to guarantee a flat bed.',
      notes: '【推薦研磨】中細研磨（C5 Pro 刻度約 12.2–14）。【科學要點】粉水比 1:17（20g 對 340g），高溫（95–97°C），3 倍粉量悶蒸必攪拌或搖勻；最後一注完成後順時針溫和 Rao Spin 兩圈整平粉床。',
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
      grindGuide: '細偏中細（C5 Pro 刻度 11–12.2）',
      grindGuideEn: 'Fine-medium (C5 Pro dial 11–12.2)',
      grindMinUm: 600,
      grindMaxUm: 700,
      grindLevel: '細偏中細',
      grindLevelEn: 'Fine-medium',
      summary: '正宗急冷冰手沖（非加冰稀釋，而是把冰塊當作總水量 40%！）：磨細一階讓 180g 熱水萃出濃縮芳香咖啡，直接滴落 120g 冰塊瞬間鎖香。',
      summaryEn: '40% of total water weight starts as ice in the server. Grind finer so 180 g hot water extracts full flavor onto 120 g ice.',
      notes: '【下壺先放 120g 冰塊】總水重 300g ＝ 180g 熱水萃取 ＋ 120g 冰塊急冷（40%）。因熱水量較少，研磨度須比熱沖調細約 2 格（C5 Pro 刻度 11–12.2）。',
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
      grindGuide: '中細偏中（C5 Pro 刻度 11–12.2）',
      grindGuideEn: 'Medium-fine (C5 Pro dial 11–12.2)',
      grindMinUm: 600,
      grindMaxUm: 700,
      grindLevel: '中細偏中',
      grindLevelEn: 'Medium-fine',
      summary: '近年 WAC 世界愛樂壓大賽屢屢奪冠的核心思路：86°C 低水溫 ＋ 僅用 100g 濃萃至 1:30，再透過後加 60g 熱水（Bypass）精準稀釋，口感飽滿甜美不水薄。',
      summaryEn: 'Classic WAC winning formula: brew concentrated with 100 g at 86°C until 1:30, gently press, then bypass with 60 g hot water for rich, syrupy sweetness.',
      notes: '【推薦研磨】中細偏中（C5 Pro 刻度約 11–12.2）。【推薦設定】反壓法（Inverted）或搭配防滴控流蓋，雙層濾紙浸濕；18g 粉 ＋ 86°C 水溫 100g 浸泡至 1:30，押出約 70g 濃萃後加入約 50–70g Bypass 熱水（邊加邊試濃淡）。',
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
      title: '平底濾杯雙溫四段法（2022 WBrC 冠軍）',
      titleEn: 'Flat-Bottom Dual-Temp 4-Pour (2022 WBrC Champion)',
      name: '徐詩媛 Sherry｜平底雙溫四段法',
      badge: '2022 WBrC 世界冠軍',
      badgeEn: '2022 WBrC Champion',
      method: '手沖',
      dripper: 'OREA',
      shape: '平底',
      material: '樹脂／塑膠',
      filter: '平底波浪濾紙',
      roast: '淺焙',
      dose: 14,
      temp: 95,
      waterSource: '低礦物質軟水（50–70 ppm）',
      grindGuide: '中偏粗研磨（C5 Pro 刻度 14.2–16）',
      grindGuideEn: 'Medium-coarse (C5 Pro dial 14.2–16)',
      grindMinUm: 850,
      grindMaxUm: 950,
      grindLevel: '中偏粗研磨',
      grindLevelEn: 'Medium-coarse',
      summary: '臺灣第二位 WBrC 世界冠軍原版：平底濾杯 14g 粉對 200g 水（1:14.3），首段以 70°C 低溫悶蒸 50g 鎖住花果香，後三段以 95°C 各注 50g 帶出飽滿甜感。',
      summaryEn: 'Official 2022 WBrC flat-bottom recipe: 14 g : 200 g (1:14.3) with a 70°C 50 g bloom followed by three 50 g pours at 95°C.',
      notes: '【雙水溫技巧】第 1 段以 70°C 溫水悶蒸 50g，第 2–4 段切換 95°C 熱水每 30 秒各注 50g（合計 200g）。【推薦研磨】中偏粗研磨（C5 Pro 刻度約 14.2–16），搭配平底濾杯（如 OREA / B75 / Kalita Wave）。',
      steps: [
        { type: '悶蒸注水', sec: 30, water: 50, note: '第 1 段（0:00｜70°C 溫水）：繞圈注入 50g 低溫悶蒸鎖香' },
        { type: '繞圈注水', sec: 30, water: 50, note: '第 2 段（0:30｜95°C 熱水）：繞圈注水 50g（累計 100g）' },
        { type: '中心注水', sec: 30, water: 50, note: '第 3 段（1:00｜95°C 熱水）：中心小圈注水 50g（累計 150g）' },
        { type: '中心注水', sec: 20, water: 50, note: '第 4 段（1:30｜95°C 熱水）：中心小圈注水 50g（累計 200g）' },
        { type: '滴濾／等待完成', sec: 30, water: 0, note: '等待完全滴濾完成（總時間約 2:20）' }
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
      grindGuide: '中偏粗研磨（C5 Pro 刻度 14.2–16）',
      grindGuideEn: 'Medium-coarse (C5 Pro dial 14.2–16)',
      grindMinUm: 850,
      grindMaxUm: 950,
      grindLevel: '中偏粗研磨',
      grindLevelEn: 'Medium-coarse',
      summary: '北歐極簡代表配方：12g 粉對 200g 水，拆成兩次 100g 注水（每次先中心 50g 再繞圈 50g），低擾動帶出高甜度與純淨茶感。',
      summaryEn: 'Nordic minimalist 12 g : 200 g recipe using two 100 g pours (each 50 g center + 50 g circle) for high sweetness and clarity.',
      notes: '【推薦研磨】中偏粗研磨（C5 Pro 刻度約 14.2–16）。每段 100g 皆以「先中心、後繞圈」控制流速，約 2:10–2:20 完成。',
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
      grindGuide: '中研磨（C5 Pro 刻度 13.2–15）',
      grindGuideEn: 'Medium (C5 Pro dial 13.2–15)',
      grindMinUm: 780,
      grindMaxUm: 880,
      grindLevel: '中研磨',
      grindLevelEn: 'Medium',
      summary: '最適合日常穩定出杯的平底濾杯配方：20g 粉對 320g 水（1:16），利用蛋糕濾紙均勻蓄水特性，展現圓潤焦糖甜與厚實口感。',
      summaryEn: 'Reliable everyday 20 g : 320 g flat-bottom recipe delivering rounded sweetness and balanced body.',
      notes: '【推薦研磨】中研磨（C5 Pro 刻度約 13.2–15）。中淺焙至中焙豆皆適用，注水保持小圈柔和，避免沖塌波浪濾紙壁。',
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
      grindGuide: '中研磨（C5 Pro 刻度 13.2–15）',
      grindGuideEn: 'Medium (C5 Pro dial 13.2–15)',
      grindMinUm: 780,
      grindMaxUm: 880,
      grindLevel: '中研磨',
      grindLevelEn: 'Medium',
      summary: '徹底解決聰明濾杯細粉塞紙慢流的經典技巧：先將 250g 熱水倒入濾杯，再倒入 15g 咖啡粉輕攪，流速快又極度乾淨甜美。',
      summaryEn: 'Pour 250 g hot water first, then add 15 g coffee to prevent fines from clogging the filter—fast drawdown and clean sweetness.',
      notes: '【推薦研磨】中研磨（C5 Pro 刻度約 13.2–15）。【水溫建議】中淺焙 93°C（極淺焙可拉至 95–96°C）。【關鍵順序】務必先注水 250g 再倒粉輕拌浸潤；2:00 輕攪破渣、再等 30 秒讓粉沉底後放流。',
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
      grindGuide: '中細偏中（C5 Pro 刻度 12.2–14.2）',
      grindGuideEn: 'Medium-fine (C5 Pro dial 12.2–14.2)',
      grindMinUm: 700,
      grindMaxUm: 850,
      grindLevel: '中細偏中',
      grindLevelEn: 'Medium-fine',
      summary: '不需要控水技巧也能穩定好喝：開閥悶蒸後直接關閥一次注滿浸泡至 2:00，開閥放流即可得到飽滿均勻的甜感與醇厚感。',
      summaryEn: 'Foolproof Switch workflow: open-valve bloom, close valve and pour to 240 g, steep until 2:00, then release.',
      notes: '【推薦研磨】中細偏中（C5 Pro 刻度約 12.2–14.2）。無需精細繞圈，關閥浸泡即可確保萃取均勻度。',
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
      grindGuide: '中細研磨（C5 Pro 刻度 10–11.2）',
      grindGuideEn: 'Medium-fine (C5 Pro dial 10–11.2)',
      grindMinUm: 550,
      grindMaxUm: 630,
      grindLevel: '中細研磨',
      grindLevelEn: 'Medium-fine',
      summary: '安全穩定的正壓法教科書：11g 粉對 200g 水，注水後立即插上活塞形成負壓防滴漏，浸泡 2 分鐘輕晃沉降後慢壓，極致乾淨順口。',
      summaryEn: 'Safe upright AeroPress classic: 11 g : 200 g, insert plunger to create vacuum seal, steep 2:00, swirl, wait 30 s, and press gently.',
      notes: '【推薦研磨】中細研磨（C5 Pro 刻度約 10–11.2）。【水溫建議】極淺焙 95°C、淺焙 92–93°C、中焙 88–90°C、深焙 85°C。正壓法直接插上活塞約 1cm 即可止漏，不需反壓冒險也能萃出飽滿乾淨的單品風味。',
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
      grindGuide: '中偏粗研磨（C5 Pro 刻度 14–15.2）',
      grindGuideEn: 'Medium-coarse (C5 Pro dial 14–15.2)',
      grindMinUm: 800,
      grindMaxUm: 900,
      grindLevel: '中偏粗研磨',
      grindLevelEn: 'Medium-coarse',
      summary: '只需悶蒸後一次主注水的新手神器：3 倍粉重悶蒸 2 分鐘充分排氣與預萃，接著高流速一氣呵成注至 250g，極低失誤率且乾淨高甜。',
      summaryEn: 'Beginner-friendly single main pour: 3× dose bloom for 2 full minutes, followed by one steady high-flow pour to 250 g.',
      notes: '【推薦研磨】中偏粗研磨（C5 Pro 刻度約 14–15.2）。只需 1 次悶蒸 ＋ 1 次主注水，悶蒸務必等滿 2 分鐘，總時間約 3:15–3:30 完成。',
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
      grindGuide: '中偏粗研磨（C5 Pro 刻度 14.2–16）',
      grindGuideEn: 'Medium-coarse (C5 Pro dial 14.2–16)',
      grindMinUm: 850,
      grindMaxUm: 950,
      grindLevel: '中偏粗研磨',
      grindLevelEn: 'Medium-coarse',
      summary: '專為中深焙與深焙豆設計：84°C 低水溫 ＋ 1:13 醇厚粉水比 ＋ 中心小圈慢注，榨出黑巧克力與焦糖甜韻，徹底避開焦苦雜澀。',
      summaryEn: 'Tailored for medium-dark & dark roasts: 84°C gentle center pours at 1:13 ratio highlight chocolate sweetness without bitterness.',
      notes: '【推薦研磨】中偏粗研磨（C5 Pro 刻度約 14.2–16）。水溫控制在 83–85°C，注水維持中心小圈不沖杯壁，見白沫前即可提早移開濾杯。',
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
      grindGuide: '中細偏中（C5 Pro 刻度 13–14.2）',
      grindGuideEn: 'Medium-fine (C5 Pro dial 13–14.2)',
      grindMinUm: 730,
      grindMaxUm: 850,
      grindLevel: '中細偏中',
      grindLevelEn: 'Medium-fine',
      summary: '不用準備雙水溫就能兼顧手沖香氣與浸泡甜感：前半段 160g 開閥手沖、0:45 關閥注入後半段 160g 浸泡至 2:00 放流，簡單又極致穩定。',
      summaryEn: 'Single-temp hybrid: pour first 50% (160 g) open, close valve at 0:45 and pour remaining 160 g to steep until 2:00.',
      notes: '【推薦研磨】中細偏中（C5 Pro 刻度約 13–14.2）。免降溫、免複雜繞圈，適合各類淺中焙單品豆日常穩定出杯。',
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
      grindGuide: '細偏中細（C5 Pro 刻度 11.1–12.2）',
      grindGuideEn: 'Fine-medium (C5 Pro dial 11.1–12.2)',
      grindMinUm: 620,
      grindMaxUm: 700,
      grindLevel: '細偏中細',
      grindLevelEn: 'Fine-medium',
      summary: '專為 15g 單人份設計的急冷冰手沖：150g 滾燙熱水一次慢繞萃取，滴落 100g 下壺冰塊瞬間急冷，清澈多汁、酸香明亮。',
      summaryEn: '15 g single-cup flash brew: 150 g hot brew water onto 100 g server ice with bloom swirl and one continuous spiral pour.',
      notes: '【推薦研磨】細偏中細（C5 Pro 刻度約 11.1–12.2）。下壺先放 100g 冰塊（佔總重 40%），熱萃完成後畫圓搖晃至冰塊融化冰鎮，再倒入裝冰的飲用杯。',
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
      grindGuide: '細研磨（C5 Pro 刻度 8–9.2）',
      grindGuideEn: 'Fine (C5 Pro dial 8–9.2)',
      grindMinUm: 400,
      grindMaxUm: 520,
      grindLevel: '細研磨',
      grindLevelEn: 'Fine',
      summary: '家中沒有義式機也能做出醇厚冰拿鐵或冰美式：18g 細粉搭 85°C 熱水 90g 1:5 濃萃，後加冰水即成冰美式，換成 150ml 冰鮮奶秒變冰拿鐵！',
      summaryEn: '18 g fine coffee with 90 g water at 85°C (1:5 concentrate); dilute with cold water + ice for an iced Americano, or swap water for milk for an iced latte.',
      notes: '【推薦研磨】細研磨（C5 Pro 刻度約 8–9.2）。【水溫建議】中深焙細研磨建議 83–85°C 避開焦苦；若用淺焙豆可微升至 88–90°C。後段 110g 冰水可改換成 150ml 鮮奶／燕麥奶製作拿鐵。',
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
      grindGuide: '中細研磨（C5 Pro 刻度 11.1–13）',
      grindGuideEn: 'Medium-fine (C5 Pro dial 11.1–13)',
      grindMinUm: 620,
      grindMaxUm: 730,
      grindLevel: '中細研磨',
      grindLevelEn: 'Medium-fine',
      summary: '完整支援越式滴濾壺 Phin：20g 深焙粉悶蒸後緩慢滴濾 4 分鐘萃出濃郁焦香咖啡液，搭配煉乳與滿杯冰塊，重現道地西貢街頭風味。',
      summaryEn: 'Authentic slow-drip Phin recipe: 20 g dark roast with 90 g hot water over ~4 minutes, served over 120 g ice (with optional condensed milk).',
      notes: '【推薦研磨】中細研磨（C5 Pro 刻度約 11.1–13）。【水溫建議】搭配煉乳建議 92–94°C 萃出濃香；若不加煉乳單喝建議降溫至 86–88°C。壓片輕放即可勿重壓，理想流速為每秒 1–2 滴；杯底可先放入 20–30g 煉乳，滴完拌勻倒冰。',
      steps: [
        { type: '悶蒸注水', sec: 30, water: 20, note: '輕放金屬壓片（勿重壓），注入 20g 熱水悶蒸 30 秒讓粉層密合' },
        { type: '注水', sec: 15, water: 70, note: '緩慢注滿剩餘 70g 熱水（累計 90g）並蓋上壺蓋保溫' },
        { type: '滴濾／等待完成', sec: 240, water: 0, note: '維持每秒 1–2 滴慢速滴濾約 4 分鐘完成（杯底可預先加煉乳）' },
        { type: '後加冰塊', sec: 0, water: 120, note: '移開滴濾壺、拌勻後倒入滿杯約 120g 冰塊即可享用' }
      ]
    },
    {
      id: 'george-peng-2025',
      category: 'wbrc',
      barista: '彭近蘭 George Peng',
      baristaEn: 'George Peng',
      title: '2025 WBrC 冠軍｜Solo 平底雙溫三段法',
      titleEn: '2025 WBrC Champion Solo Flat-Bottom Dual-Temp',
      name: '彭近蘭 George Peng｜2025 WBrC 冠軍',
      badge: '2025 WBrC 世界冠軍',
      badgeEn: '2025 WBrC Champion',
      method: '手沖',
      dripper: 'Solo 平底濾杯',
      shape: '平底',
      material: '陶瓷',
      filter: '平底專用濾紙',
      roast: '淺焙',
      dose: 15,
      temp: 96,
      waterSource: '軟水（低礦物質）',
      grindGuide: '中偏粗研磨（C5 Pro 刻度 12.2–14）',
      grindGuideEn: 'Medium-coarse (C5 Pro dial 12.2–14)',
      grindMinUm: 700,
      grindMaxUm: 820,
      grindLevel: '中偏粗研磨',
      grindLevelEn: 'Medium-coarse',
      summary: '2025 年雅加達 WBrC 世界冠軍官方路線：15g 粉配 210g 水（1:14）分三段注水，前兩段 96°C 高溫釋放茉莉花香與酸甜，末段切換 80°C 柔水收尾鎖住絲滑甜感。',
      summaryEn: '2025 WBrC winning structure: 15 g : 210 g (1:14) in 3 pours—96°C for the first 110 g to unlock aromatics, then 80°C gentle center pour to finish.',
      notes: '【推薦研磨】中偏粗研磨（C5 Pro 刻度約 12.2–14，約 700–820 μm）。【雙溫技巧】準備 96°C 與 80°C 兩壺水；最後 100g 改用 80°C 搭配 Melodrip 或極細柔水流，可大幅減少尾段乾澀感，總時間約 1:50–2:10。',
      steps: [
        { type: '悶蒸注水', sec: 30, water: 30, note: '第 1 段（96°C）：繞圈注水 30g 悶蒸至 0:30' },
        { type: '繞圈注水', sec: 40, water: 80, note: '第 2 段（96°C）：0:30 繞圈注水 80g（累計 110g）' },
        { type: '中心注水', sec: 20, water: 100, note: '第 3 段（切換 80°C）：1:10 起柔和注水 100g（累計 210g）' },
        { type: '滴濾／等待完成', sec: 30, water: 0, note: '約 2:00 完成滴濾，甜美絲滑且花果香奔放' }
      ]
    },
    {
      id: 'emi-fukahori-2018',
      category: 'wbrc',
      barista: 'Emi Fukahori',
      baristaEn: 'Emi Fukahori',
      title: '2018 WBrC 冠軍｜開關閥門三段雙溫混合法',
      titleEn: '2018 WBrC Hybrid Open/Closed Dual-Temp Method',
      name: 'Emi Fukahori｜2018 WBrC 冠軍混合法',
      badge: '2018 WBrC 世界冠軍',
      badgeEn: '2018 WBrC Champion',
      method: '浸泡式',
      dripper: 'GINA / HARIO Switch',
      shape: '浸泡／閥門式',
      material: '玻璃',
      filter: 'V60 漂白濾紙',
      roast: '淺焙',
      dose: 17,
      temp: 95,
      waterSource: '中軟水（約 90–100 ppm）',
      grindGuide: '中粗研磨（C5 Pro 刻度 14.1–16）',
      grindGuideEn: 'Medium-coarse (C5 Pro dial 14.1–16)',
      grindMinUm: 820,
      grindMaxUm: 960,
      grindLevel: '中粗研磨',
      grindLevelEn: 'Medium-coarse',
      summary: '首位以混合閥門濾杯奪下 WBrC 世界冠軍的經典架構：前段 80°C 關閥浸泡引甜、中段 95°C 開閥滴濾開展果酸、尾段再關閥用 80°C 溫水補齊果汁飽滿度。',
      summaryEn: '2018 WBrC breakthrough hybrid routine: 80°C closed steep → 95°C open drip → 80°C closed finish across 17 g : 220 g.',
      notes: '【推薦研磨】中粗研磨（C5 Pro 刻度約 14.1–16，約 820–960 μm）。原版使用 GINA 閥門濾杯，居家可用 HARIO Switch 完全重現；準備 80°C 與 95°C 兩壺水即可執行。',
      steps: [
        { type: '開關閥門', sec: 5, water: 0, note: '【先關閉閥門】準備進入第一段 80°C 溫水浸泡' },
        { type: '悶蒸注水', sec: 40, water: 50, note: '第 1 段（80°C・關閥）：注入 50g 溫水浸泡鎖住前段甜香' },
        { type: '開關閥門', sec: 5, water: 0, note: '【0:45 開啟閥門】切換至熱水手沖滴濾階段' },
        { type: '繞圈注水', sec: 55, water: 100, note: '第 2 段（95°C・開閥）：穩定繞圈注水 100g（累計 150g）萃出明亮酸質' },
        { type: '開關閥門', sec: 5, water: 0, note: '【1:45 再次關閉閥門】準備最後一段 80°C 浸泡' },
        { type: '中心注水', sec: 40, water: 70, note: '第 3 段（80°C・關閥）：注入 70g 溫水（累計 220g）浸泡增添醇厚果汁感' },
        { type: '開關閥門', sec: 5, water: 0, note: '【2:30 開啟閥門】打開開關放流至完成' },
        { type: '滴濾／等待完成', sec: 25, water: 0, note: '約 2:55 滴濾完成，層次極為豐富' }
      ]
    },
    {
      id: 'matt-perger-v60',
      category: 'masters',
      barista: 'Matt Perger',
      baristaEn: 'Matt Perger',
      title: 'Matt Perger 經典小粉量 V60 高甜攪拌法',
      titleEn: 'Matt Perger Classic 12g V60 Recipe',
      name: 'Matt Perger｜經典 12g V60 法',
      badge: 'WBC 亞軍世界名家',
      badgeEn: 'WBC Legend Classic',
      method: '手沖',
      dripper: 'HARIO V60 01',
      shape: '錐形',
      material: '樹脂／塑膠',
      filter: 'V60 漂白濾紙',
      roast: '淺焙',
      dose: 12,
      temp: 97,
      waterSource: '軟水（40–70 ppm）',
      grindGuide: '中細研磨（C5 Pro 刻度 11.2–13）',
      grindGuideEn: 'Medium-fine (C5 Pro dial 11.2–13)',
      grindMinUm: 620,
      grindMaxUm: 740,
      grindLevel: '中細研磨',
      grindLevelEn: 'Medium-fine',
      summary: '風靡全球十年的 12g 單杯經典：97°C 近沸水搭配悶蒸湯匙「十字來回攪拌」，讓極小粉量也能在 2 分 20 秒內達到高均勻度與明亮甜韻。',
      summaryEn: 'Iconic 12 g : 200 g (1:16.7) single-cup V60 method using 97°C water and a thorough back-and-forth bloom stir.',
      notes: '【推薦研磨】中細研磨（C5 Pro 刻度約 11.2–13，約 620–740 μm）。悶蒸後用湯匙前後左右輕快拌勻取代畫圓繞拌，最後輕拍濾杯（Tap）或輕晃整平粉床，約 2:20 收杯。',
      steps: [
        { type: '悶蒸注水', sec: 10, water: 50, note: '以 97°C 熱水快速注入 50g 浸潤全數咖啡粉' },
        { type: '攪拌', sec: 20, water: 0, note: '用湯匙前後左右攪拌讓乾粉充分濕透並靜置至 0:30' },
        { type: '繞圈注水', sec: 30, water: 50, note: '0:30 由中心向外畫圓注水 50g（累計 100g）' },
        { type: '繞圈注水', sec: 25, water: 100, note: '1:00 穩定繞圈注完最後 100g（累計 200g）' },
        { type: '滴濾／等待完成', sec: 55, water: 0, note: '輕晃或輕拍濾杯整平粉牆，約 2:20 滴濾完成' }
      ]
    },
    {
      id: 'osmotic-flow-kono',
      category: 'masters',
      barista: 'CAFEC 滲透流派 Osmotic Flow',
      baristaEn: 'CAFEC Osmotic Flow Method',
      title: '滲透流手沖法 Osmotic Flow（純中心漢堡隆起）',
      titleEn: 'Osmotic Flow Center-Dome Pour-Over',
      name: '滲透流｜Osmotic Flow 手沖法',
      badge: '日系甘甜經典',
      badgeEn: 'Japanese Osmotic Classic',
      method: '手沖',
      dripper: 'KONO 名門濾杯',
      shape: '錐形',
      material: '樹脂／塑膠',
      filter: 'KONO / CAFEC 中深焙濾紙',
      roast: '中焙',
      dose: 20,
      temp: 88,
      waterSource: '中軟水',
      grindGuide: '中偏粗研磨（C5 Pro 刻度 14.1–16）',
      grindGuideEn: 'Medium-coarse (C5 Pro dial 14.1–16)',
      grindMinUm: 820,
      grindMaxUm: 950,
      grindLevel: '中偏粗研磨',
      grindLevelEn: 'Medium-coarse',
      summary: '日本 CAFEC 推廣的滲透流經典：全程維持中心一圓極慢低水位注水，讓粉層中央自然膨脹成圓頂（漢堡），利用對流僅萃取純淨甘甜而不帶雜澀。',
      summaryEn: 'Traditional Japanese center-only low-water-level method that keeps coffee dome intact and prevents astringency.',
      notes: '【推薦研磨】中偏粗研磨（C5 Pro 刻度約 14.1–16，約 820–950 μm）。水溫中焙約 88–90°C、深焙可降至 80–83°C；重點是水流絕不沖刷外圍粉牆，緩慢累加至 300g（約 3:30–4:00 完成）。',
      steps: [
        { type: '悶蒸注水', sec: 15, water: 40, note: '於正中心小圓緩慢注入 40g 浸潤中心粉層' },
        { type: '等待／斷水', sec: 30, water: 0, note: '靜待粉層圓頂自然膨脹悶蒸至 0:45' },
        { type: '中心注水', sec: 75, water: 110, note: '極細柔水流於中心 10 元硬幣範圍慢注至 150g（約 2:00）' },
        { type: '中心注水', sec: 70, water: 100, note: '持續中心細水慢注維持粉層膨脹，注至 250g（約 3:10）' },
        { type: '中心注水', sec: 20, water: 50, note: '中心補滿至 300g，外圈泡沫保留不沖散' },
        { type: '滴濾／等待完成', sec: 30, water: 0, note: '約 3:50–4:00 收杯，口感如奶油糖漿般圓潤甘甜' }
      ]
    },
    {
      id: 'kono-drip-dark',
      category: 'masters',
      barista: 'KONO 河野流派',
      baristaEn: 'KONO Classic Point-Drip Style',
      title: 'KONO 名門濾杯點滴悶蒸厚實法（中深焙適配）',
      titleEn: 'KONO Point-Drip Rich Body Method',
      name: 'KONO 名門｜點滴悶蒸三段法',
      badge: '日系醇厚代表',
      badgeEn: 'KONO Japanese Classic',
      method: '手沖',
      dripper: 'KONO 名門濾杯',
      shape: '錐形',
      material: '樹脂／塑膠',
      filter: 'KONO 原廠棉質濾紙',
      roast: '中深焙',
      dose: 18,
      temp: 85,
      waterSource: '中軟水',
      grindGuide: '中研磨（C5 Pro 刻度 13.2–15.1）',
      grindGuideEn: 'Medium (C5 Pro dial 13.2–15.1)',
      grindMinUm: 780,
      grindMaxUm: 900,
      grindLevel: '中研磨',
      grindLevelEn: 'Medium',
      summary: '針對下段無肋條、流速飽滿的 KONO 濾杯設計：先以水滴式慢慢浸透粉心，接續中心小圈緩慢注水至 240g（1:13.3），帶出厚實油脂感與焦糖甜韻。',
      summaryEn: 'Tailored for KONO’s short-ribbed cone: gentle drop-wise center saturation followed by two slow center pours for syrupy body.',
      notes: '【推薦研磨】中研磨（C5 Pro 刻度約 13.2–15.1，約 780–900 μm）。KONO 下半部貼壁無肋條能延長浸泡感；建議 84–86°C 水溫並保留尾段高泡不放流到底，甘甜圓潤極耐喝。',
      steps: [
        { type: '悶蒸注水', sec: 40, water: 35, note: '以點滴或極細水柱自正中心慢慢滲入 35g 熱水，等粉層膨脹飽滿' },
        { type: '中心注水', sec: 50, water: 105, note: '中心 5 元硬幣大小極慢繞圈注水 105g（累計 140g）' },
        { type: '等待／斷水', sec: 15, water: 0, note: '略微降低液位保留中心濃度' },
        { type: '中心注水', sec: 45, water: 100, note: '持續中心柔水注水 100g（累計 240g）' },
        { type: '滴濾／等待完成', sec: 20, water: 0, note: '見表面泡沫下降至接近粉面即可提前移開濾杯，總時間約 2:50' }
      ]
    },
    {
      id: 'nel-drip-flannel',
      category: 'masters',
      barista: '日本職人法蘭絨流派',
      baristaEn: 'Traditional Japanese Nel Drip (Flannel)',
      title: '法蘭絨手沖 Nel Drip（濃醇絲綢 1:11.8）',
      titleEn: 'Classic Flannel Nel Drip (Velvety Body)',
      name: '日式法蘭絨｜Nel Drip 絲綢醇厚法',
      badge: '職人極致口感',
      badgeEn: 'Artisan Flannel Craft',
      method: '手沖',
      dripper: '法蘭絨濾布 Nel Drip',
      shape: '其他／不適用',
      material: '其他／未填',
      filter: '法蘭絨濾布（絨毛面朝外）',
      roast: '深焙',
      dose: 22,
      temp: 83,
      waterSource: '中軟水（70–100 ppm）',
      grindGuide: '中粗研磨（C5 Pro 刻度 14.2–16.1）',
      grindGuideEn: 'Medium-coarse (C5 Pro dial 14.2–16.1)',
      grindMinUm: 840,
      grindMaxUm: 980,
      grindLevel: '中粗研磨',
      grindLevelEn: 'Medium-coarse',
      summary: '法蘭絨濾布保留極高比例的咖啡油脂與細微膠質，配合 83°C 低水溫與 22g 重粉量緩慢斷水萃取，喝起來如黑巧克力糖漿般絲滑零刺舌。',
      summaryEn: '22 g : 260 g at 83°C through flannel cloth preserves full coffee oils for a syrupy, velvet-like dark roast cup.',
      notes: '【推薦研磨】中粗研磨（C5 Pro 刻度約 14.2–16.1，約 840–980 μm）。法蘭絨使用前務必以熱水擰乾微濕（不滴水狀態）；第一段先像畫圈寫「の」字讓粉完全濕潤，分四次慢慢萃完。',
      steps: [
        { type: '悶蒸注水', sec: 45, water: 40, note: '83°C 溫水極慢均勻濕潤 22g 深焙粉（約 40g），悶蒸至表面起皺' },
        { type: '中心注水', sec: 45, water: 80, note: '中心畫小圓「の」字慢注 80g（累計 120g）' },
        { type: '等待／斷水', sec: 15, water: 0, note: '略停等水位微降' },
        { type: '中心注水', sec: 45, water: 70, note: '持續柔和中心慢注 70g（累計 190g）' },
        { type: '中心注水', sec: 40, water: 70, note: '最後溫柔注入 70g（累計 260g）' },
        { type: '滴濾／等待完成', sec: 30, water: 0, note: '見液面降至絨布一半即收杯，保留最醇厚焦糖餘韻' }
      ]
    },
    {
      id: 'melitta-trapezoid-3pour',
      category: 'masters',
      barista: 'Melitta / Kalita 扇形梯形流派',
      baristaEn: 'Classic Trapezoid 3-Pour Method',
      title: '梯形（扇形）單孔／三孔濾杯三段均衡法',
      titleEn: 'Trapezoid Dripper Steady 3-Pour',
      name: '梯形濾杯｜單孔・三孔三段均衡法',
      badge: '梯形濾杯必備',
      badgeEn: 'Trapezoid Classic',
      method: '手沖',
      dripper: 'Melitta 梯形濾杯',
      shape: '梯形',
      material: '陶瓷',
      filter: '梯形 102 濾紙',
      roast: '中淺焙',
      dose: 15,
      temp: 91,
      waterSource: '軟水',
      grindGuide: '中研磨（C5 Pro 刻度 13–14.2）',
      grindGuideEn: 'Medium (C5 Pro dial 13–14.2)',
      grindMinUm: 720,
      grindMaxUm: 850,
      grindLevel: '中研磨',
      grindLevelEn: 'Medium',
      summary: '專為單孔 Melitta 或三孔 Kalita 扇形濾杯設計：利用窄底慢流蓄水構造，採溫和三段注入避免水位過高溢流或尾段塞孔，口感甜潤乾淨。',
      summaryEn: 'Designed for Melitta / Kalita trapezoid drippers: controlled 3-pour cadence prevents clogging while unlocking rounded sweetness.',
      notes: '【推薦研磨】中研磨（C5 Pro 刻度約 13–14.2，約 720–850 μm）。扇形濾紙記得先摺好底部與側邊壓線貼合杯壁；中段保持中低水位不滿杯，約 2:35–2:50 完成。',
      steps: [
        { type: '悶蒸注水', sec: 35, water: 40, note: '順粉層脈絡緩慢注入 40g 熱水悶蒸 35 秒' },
        { type: '繞圈注水', sec: 45, water: 100, note: '第 2 段以小圈穩定注水 100g（累計 140g），水位控制在杯高 2/3 以下' },
        { type: '等待／斷水', sec: 15, water: 0, note: '待水位下降至剩 1/3 再接下一注' },
        { type: '中心注水', sec: 35, water: 100, note: '第 3 段中心偏小圈注完 100g（累計 240g）' },
        { type: '滴濾／等待完成', sec: 35, water: 0, note: '約 2:45 滴濾完成，圓潤平衡且不易過萃' }
      ]
    },
    {
      id: 'tim-wendelboe-v60',
      category: 'masters',
      barista: 'Tim Wendelboe',
      baristaEn: 'Tim Wendelboe',
      title: 'Tim Wendelboe 北歐淺焙一刀流 V60（96°C 高溫清澈法）',
      titleEn: 'Tim Wendelboe Nordic Light-Roast V60',
      name: 'Tim Wendelboe｜北歐一刀流 V60',
      badge: 'WBC 冠軍北歐宗師',
      badgeEn: 'Nordic Light-Roast Master',
      method: '手沖',
      dripper: 'HARIO V60 02',
      shape: '錐形',
      material: '樹脂／塑膠',
      filter: 'V60 漂白濾紙',
      roast: '淺焙',
      dose: 15,
      temp: 96,
      waterSource: '極軟水（20–50 ppm）',
      grindGuide: '中細研磨（C5 Pro 刻度 12–13.1）',
      grindGuideEn: 'Medium-fine (C5 Pro dial 12–13.1)',
      grindMinUm: 640,
      grindMaxUm: 760,
      grindLevel: '中細研磨',
      grindLevelEn: 'Medium-fine',
      summary: '挪威咖啡宗師 Tim Wendelboe 的極簡單次注水邏輯：96°C 高溫搭配 1:16.7，悶蒸後用穩定中低水流一次順暢注完 250g，展現最透明純淨的北歐茶感與花果酸。',
      summaryEn: 'Ultra-clean Nordic light-roast classic: 15 g : 250 g at 96°C with a bloom followed by one continuous gentle pour.',
      notes: '【推薦研磨】中細研磨（C5 Pro 刻度約 12–13.1，約 640–760 μm）。水溫建議極淺焙 96–98°C；注水力道溫和不過度翻攪，最後輕晃濾杯讓表面平順即可。',
      steps: [
        { type: '悶蒸注水', sec: 10, water: 50, note: '96°C 熱水均勻注入 50g 後輕晃濾杯讓乾粉徹底浸濕' },
        { type: '等待／斷水', sec: 25, water: 0, note: '悶蒸至 0:35 完成排氣' },
        { type: '繞圈注水', sec: 75, water: 200, note: '0:35 起以穩定細水流緩慢畫同心圓一次注完 200g（累計 250g）' },
        { type: '攪拌', sec: 5, water: 0, note: '輕柔水平搖晃兩圈讓掛壁粉牆回到粉床' },
        { type: '滴濾／等待完成', sec: 45, water: 0, note: '約 2:40 滴濾完成，花香極為清澈明亮' }
      ]
    },
    {
      id: 'kurasu-kyoto-v60',
      category: 'masters',
      barista: 'Kurasu Kyoto（京都）',
      baristaEn: 'Kurasu Kyoto',
      title: '京都 Kurasu 經典四段 V60（14g 小杯高甜法）',
      titleEn: 'Kurasu Kyoto Everyday 4-Pour V60 (14g)',
      name: '京都 Kurasu｜經典四段 V60 法',
      badge: '京都名店每日出杯',
      badgeEn: 'Kurasu Kyoto Classic',
      method: '手沖',
      dripper: 'HARIO V60 01',
      shape: '錐形',
      material: '陶瓷',
      filter: 'V60 漂白濾紙',
      roast: '淺焙',
      dose: 14,
      temp: 91,
      waterSource: '軟水',
      grindGuide: '中細偏中研磨（C5 Pro 刻度 12.1–13.2）',
      grindGuideEn: 'Medium-fine (C5 Pro dial 12.1–13.2)',
      grindMinUm: 680,
      grindMaxUm: 800,
      grindLevel: '中細偏中研磨',
      grindLevelEn: 'Medium-fine',
      summary: '京都 Kurasu 門市長年公開的招牌標準出杯法：14g 粉配 200g 水（1:14.3），以 40/60/50/50g 節奏穩定推進，兼顧日式溫潤甜感與現代淺焙乾淨花果香。',
      summaryEn: 'Kurasu Kyoto’s signature daily recipe: 14 g : 200 g at 91°C across four rhythmic pours (40 / 60 / 50 / 50 g).',
      notes: '【推薦研磨】中細偏中研磨（C5 Pro 刻度約 12.1–13.2，約 680–800 μm）。每段在水位將見粉床時接續下一注，最後於 2:10–2:20 完成收杯。',
      steps: [
        { type: '悶蒸注水', sec: 40, water: 40, note: '第 1 段（0:00）：注入 40g 悶蒸 40 秒' },
        { type: '繞圈注水', sec: 30, water: 60, note: '第 2 段（0:40）：繞圈注入 60g（累計 100g）' },
        { type: '繞圈注水', sec: 25, water: 50, note: '第 3 段（1:10）：小圈注水 50g（累計 150g）' },
        { type: '中心注水', sec: 20, water: 50, note: '第 4 段（1:35）：中心柔和注完 50g（累計 200g）' },
        { type: '滴濾／等待完成', sec: 25, water: 0, note: '約 2:15–2:20 完成滴濾，滑順甜美零雜味' }
      ]
    },
    {
      id: 'tetsu-46-iced',
      category: 'iced',
      barista: '粕谷哲 Tetsu Kasuya',
      baristaEn: 'Tetsu Kasuya',
      title: '粕谷哲 4:6 急冷冰手沖（60% 熱萃 ＋ 40% 冰鎮）',
      titleEn: 'Tetsu Kasuya Iced 4:6 Flash Brew',
      name: '粕谷哲｜4:6 急冷冰手沖',
      badge: '4:6 法夏季冰沖版',
      badgeEn: 'Iced 4:6 Signature',
      method: '手沖',
      dripper: 'HARIO V60 02',
      shape: '錐形',
      material: '樹脂／塑膠',
      filter: 'V60 漂白濾紙',
      roast: '淺焙',
      dose: 20,
      temp: 92,
      waterSource: '軟水 ＋ 透明實心冰塊 120g',
      grindGuide: '中細研磨（C5 Pro 刻度 12–13.1）',
      grindGuideEn: 'Medium-fine (C5 Pro dial 12–13.1)',
      grindMinUm: 640,
      grindMaxUm: 760,
      grindLevel: '中細研磨',
      grindLevelEn: 'Medium-fine',
      summary: '粕谷哲專為冰手沖調整的 4:6 急冷版：將總水量拆為 180g 熱水五段慢萃與 120g 下壺冰塊急冷，並比熱沖版本大幅調細研磨度以拉高前段甜酸萃取。',
      summaryEn: 'Tetsu Kasuya’s iced adaptation: grind finer than hot 4:6 and split into 180 g hot water across 5 pours onto 120 g ice.',
      notes: '【推薦研磨】中細研磨（C5 Pro 刻度約 12–13.1，約 640–760 μm），需比熱沖 4:6 調細約 3–4 大格以補償熱水量減少。下壺先放 120g 冰塊，最後輕搖冰鎮即成。',
      steps: [
        { type: '悶蒸注水', sec: 15, water: 40, note: '【下壺先放 120g 冰塊】第 1 段（0:00）注 40g 悶蒸' },
        { type: '等待／斷水', sec: 25, water: 0, note: '等粉層流乾至 0:40' },
        { type: '繞圈注水', sec: 15, water: 35, note: '第 2 段（0:40）繞圈注 35g（累計 75g）' },
        { type: '等待／斷水', sec: 20, water: 0, note: '等流乾後接下一段' },
        { type: '繞圈注水', sec: 15, water: 35, note: '第 3 段（1:15）注水 35g（累計 110g）' },
        { type: '等待／斷水', sec: 15, water: 0, note: '等流乾後接下一段' },
        { type: '繞圈注水', sec: 15, water: 35, note: '第 4 段（1:45）注水 35g（累計 145g）' },
        { type: '等待／斷水', sec: 15, water: 0, note: '等流乾後接最後一段' },
        { type: '中心注水', sec: 15, water: 35, note: '第 5 段（2:15）中心注水 35g（累計熱萃水 180g）' },
        { type: '滴濾／等待完成', sec: 25, water: 0, note: '約 2:55 滴濾完成，瞬間鎖香冰鎮' },
        { type: '後加冰塊', sec: 0, water: 120, note: '確認下壺 120g 急冷冰塊並輕搖分享壺均勻冰鎮' }
      ]
    },
    {
      id: 'wac-2024-stanica',
      category: 'aeropress',
      barista: 'George Stanica（羅馬尼亞）',
      baristaEn: 'George Stanica (Romania)',
      title: '2024 WAC 世界冠軍｜兩段分注冷熱雙段 Bypass 法',
      titleEn: '2024 WAC Champion Dual-Pour Split-Bypass Recipe',
      name: '2024 WAC 冠軍｜George Stanica 配方',
      badge: '2024 WAC 世界冠軍',
      badgeEn: '2024 WAC Champion',
      method: '愛樂壓',
      dripper: 'AeroPress',
      shape: '其他／不適用',
      material: '樹脂／塑膠',
      filter: 'AeroPress 單層濾紙',
      roast: '淺焙',
      dose: 18,
      temp: 96,
      waterSource: '調整軟水（約 85–90 ppm）',
      grindGuide: '中粗研磨（C5 Pro 刻度 14–15.2）',
      grindGuideEn: 'Medium-coarse (C5 Pro dial 14–15.2)',
      grindMinUm: 800,
      grindMaxUm: 920,
      grindLevel: '中粗研磨',
      grindLevelEn: 'Medium-coarse',
      summary: '2024 年里斯本世界愛樂壓大賽冠軍奪冠配方：反壓先以 96°C 柔水 50g 悶蒸 30 秒，再補 50g 十字輕攪後壓出約 78g 濃萃，最後用熱水＋常溫水雙段 Bypass 至 155g。',
      summaryEn: '2024 WAC 1st place (Lisbon): inverted 18 g : 100 g at 96°C with 30 s bloom, NSEW stir, ~78 g press, plus warm & room-temp bypass.',
      notes: '【推薦研磨】中粗研磨（C5 Pro 刻度約 14–15.2，約 800–920 μm）。原版搭配 Melodrip 柔水降擾動；後段分兩次 Bypass（先熱水至 ~130g，再補 25g 常溫 0ppm 水）可兼顧香氣與適口溫度。',
      steps: [
        { type: '悶蒸注水', sec: 10, water: 50, note: '【反壓法】以 96°C 柔水緩慢注入 50g 浸潤' },
        { type: '等待／斷水', sec: 25, water: 0, note: '悶蒸排氣至 0:35' },
        { type: '注水', sec: 10, water: 50, note: '再注入 50g 熱水（累計萃取水 100g）' },
        { type: '攪拌', sec: 10, water: 0, note: '東西南北十字輕柔攪拌 10 秒，接著鎖上濕濾蓋' },
        { type: '等待／斷水', sec: 25, water: 0, note: '靜置浸泡至 1:20，輕排多餘空氣後於 1:35 翻轉' },
        { type: '下壓', sec: 35, water: 0, note: '緩慢勻速下壓至目標濃萃約 76–79g（總時約 2:10）' },
        { type: '後加水（bypass）', sec: 0, water: 55, waterKind: 'hot', note: '加入約 55g 溫熱水稀釋濃萃，可視需要再補約 20–25g 常溫水微調適口溫度' }
      ]
    },
    {
      id: 'wac-2023-wipvasutt',
      category: 'aeropress',
      barista: 'Tay Wipvasutt（泰國）',
      baristaEn: 'Tay Wipvasutt (Thailand)',
      title: '2023 WAC 世界冠軍｜中段二次加粉奇襲法',
      titleEn: '2023 WAC Champion Split-Dose Staggered Recipe',
      name: '2023 WAC 冠軍｜Tay Wipvasutt 配方',
      badge: '2023 WAC 世界冠軍',
      badgeEn: '2023 WAC Champion',
      method: '愛樂壓',
      dripper: 'AeroPress',
      shape: '其他／不適用',
      material: '樹脂／塑膠',
      filter: 'AeroPress 單層濾紙',
      roast: '淺焙',
      dose: 18,
      temp: 89,
      waterSource: '軟水',
      grindGuide: '中偏粗研磨（C5 Pro 刻度 13.1–15）',
      grindGuideEn: 'Medium-coarse (C5 Pro dial 13.1–15)',
      grindMinUm: 760,
      grindMaxUm: 880,
      grindLevel: '中偏粗研磨',
      grindLevelEn: 'Medium-coarse',
      summary: '2023 年墨爾本 WAC 世界冠軍最具話題的創意手法：18g 粉拆成先放 16g、浸泡 45 秒後再倒入最後 2g 乾粉（保留最新鮮花果前調香氣），再押出 Bypass。',
      summaryEn: '2023 WAC winning twist (Melbourne): steep 16 g at 89°C, drop in the final 2 g dry coffee at 0:45 for fresh aromatics, press & bypass.',
      notes: '【推薦研磨】中偏粗研磨（C5 Pro 刻度約 13.1–15，約 760–880 μm）。記得預先留出 2g 磨好乾粉於 0:45 投入（實作中亦可先在 16g/2g 分裝好，全粉合計 18g），末段 Bypass 至總重約 155g。',
      steps: [
        { type: '注水', sec: 15, water: 100, note: '【反壓法・先放 16g 粉】以 89°C 溫水注入 100g' },
        { type: '等待／斷水', sec: 15, water: 0, note: '浸泡至 0:30' },
        { type: '攪拌', sec: 5, water: 0, note: '0:30 輕拌 5 秒' },
        { type: '等待／斷水', sec: 10, water: 0, note: '0:45 倒入預留的最後 2g 乾粉增加花果前韻' },
        { type: '攪拌', sec: 5, water: 0, note: '0:55 再輕拌 5 秒，鎖濾蓋靜置至 1:35' },
        { type: '等待／斷水', sec: 40, water: 0, note: '排氣並翻轉上壺準備下壓' },
        { type: '下壓', sec: 30, water: 0, note: '穩定慢壓約 30 秒，總萃取液約 100g' },
        { type: '後加水（bypass）', sec: 0, water: 55, waterKind: 'room', note: '加入約 50–55g 溫／常溫水稀釋至總杯量約 155g' }
      ]
    },
    {
      id: 'wac-2022-jibbi-little',
      category: 'aeropress',
      barista: 'Jibbi Little（澳洲）',
      baristaEn: 'Jibbi Little (Australia)',
      title: '2022 WAC 世界冠軍｜高攪拌 94ml 濃萃高甜法',
      titleEn: '2022 WAC Champion High-Agitation 94g Bypass',
      name: '2022 WAC 冠軍｜Jibbi Little 配方',
      badge: '2022 WAC 世界冠軍',
      badgeEn: '2022 WAC Champion',
      method: '愛樂壓',
      dripper: 'AeroPress',
      shape: '其他／不適用',
      material: '樹脂／塑膠',
      filter: 'AeroPress 單層濾紙',
      roast: '淺焙',
      dose: 18,
      temp: 91,
      waterSource: '軟水',
      grindGuide: '中細研磨（C5 Pro 刻度 11–12.2）',
      grindGuideEn: 'Medium-fine (C5 Pro dial 11–12.2)',
      grindMinUm: 600,
      grindMaxUm: 720,
      grindLevel: '中細研磨',
      grindLevelEn: 'Medium-fine',
      summary: '2022 年溫哥華 WAC 世界冠軍配方：極緊實 18g 對 94g 熱水（約 1:5.2）輕拌 35 下建立超高甜度濃萃，浸泡至 1:40 慢壓後 Bypass 至 150g，爆發飽和果汁甜感。',
      summaryEn: '2022 WAC champion (Vancouver): 18 g : 94 g concentrate at 91°C stirred 35× gently, pressed at 1:40, and hot-bypassed to 150 g.',
      notes: '【推薦研磨】中細研磨（C5 Pro 刻度約 11–12.2，約 600–720 μm）。原版有去銀皮與輕篩細粉；一般家用直接中細研磨搭配輕柔均勻攪拌 35 下即可呈現極高甜感與乾淨度。',
      steps: [
        { type: '注水', sec: 15, water: 94, note: '【反壓法】以 91°C 熱水注入 94g' },
        { type: '攪拌', sec: 20, water: 0, note: '以攪拌棒輕柔均勻攪拌約 35 下確保全粉充分萃取' },
        { type: '等待／斷水', sec: 65, water: 0, note: '於 1:20 蓋上濕潤濾蓋並排氣，1:30 翻轉靜置至 1:40' },
        { type: '下壓', sec: 30, water: 0, note: '1:40–2:10 穩定柔和下壓 30 秒榨出飽滿濃萃' },
        { type: '後加水（bypass）', sec: 0, water: 56, waterKind: 'hot', note: '加入熱水至總飲品重約 150g（約加 56–70g 視口味濃淡調整）' }
      ]
    },
    {
      id: 'wac-2021-merikanto',
      category: 'aeropress',
      barista: 'Tuomas Merikanto（芬蘭）',
      baristaEn: 'Tuomas Merikanto (Finland)',
      title: '2021 WAC 世界冠軍｜80°C 低溫免 Bypass 直飲法',
      titleEn: '2021 WAC Champion 80°C No-Bypass Recipe',
      name: '2021 WAC 冠軍｜Tuomas Merikanto 配方',
      badge: '2021 WAC 世界冠軍',
      badgeEn: '2021 WAC Champion',
      method: '愛樂壓',
      dripper: 'AeroPress',
      shape: '其他／不適用',
      material: '樹脂／塑膠',
      filter: 'AeroPress 雙層濾紙',
      roast: '淺焙',
      dose: 18,
      temp: 80,
      waterSource: '軟水',
      grindGuide: '中偏粗研磨（C5 Pro 刻度 13.1–15）',
      grindGuideEn: 'Medium-coarse (C5 Pro dial 13.1–15)',
      grindMinUm: 760,
      grindMaxUm: 880,
      grindLevel: '中偏粗研磨',
      grindLevelEn: 'Medium-coarse',
      summary: '不愛計算 Bypass 稀釋的首選冠軍配方！18g 淺焙豆搭 80°C 低水溫一次注入 200g（雙層濾紙），2 分鐘直出即可飲用，花香與甜味極其乾淨討喜。',
      summaryEn: '2021 WAC champion (no bypass): 18 g : 200 g at a gentle 80°C with double filter papers, steep 1:40 and press in 20 s.',
      notes: '【推薦研磨】中偏粗研磨（C5 Pro 刻度約 13.1–15，約 760–880 μm）。使用 2 張浸濕濾紙增加澄清度，80°C 低水溫讓這支配方毫無尖酸與苦澀，非常適合淺焙水洗豆日常直飲。',
      steps: [
        { type: '注水', sec: 15, water: 200, note: '【反壓法・雙層濾紙】以 80°C 溫水一次注滿 200g' },
        { type: '攪拌', sec: 5, water: 0, note: '極輕柔點撥消除氣泡即可（勿過度攪拌）' },
        { type: '等待／斷水', sec: 80, water: 0, note: '鎖緊雙層濕濾紙並輕排多餘空氣，浸泡至 1:40' },
        { type: '下壓', sec: 20, water: 0, note: '1:40 翻轉至分享壺上，穩定 20 秒壓完直接享用（免 Bypass）' }
      ]
    },
    {
      id: 'wac-2019-van-bunnik',
      category: 'aeropress',
      barista: 'Wendelien van Bunnik（荷蘭）',
      baristaEn: 'Wendelien van Bunnik (Netherlands)',
      title: '2019 WAC 世界冠軍｜30g 大粉量極速高甜濃萃法',
      titleEn: '2019 WAC Champion 30g High-Dose Fast Press',
      name: '2019 WAC 冠軍｜Wendelien 30g 法',
      badge: '2019 WAC 世界冠軍',
      badgeEn: '2019 WAC Champion',
      method: '愛樂壓',
      dripper: 'AeroPress',
      shape: '其他／不適用',
      material: '樹脂／塑膠',
      filter: 'AeroPress 單層濾紙',
      roast: '淺焙',
      dose: 30,
      temp: 92,
      waterSource: '軟水',
      grindGuide: '中偏粗研磨（C5 Pro 刻度 13.1–15.1）',
      grindGuideEn: 'Medium-coarse (C5 Pro dial 13.1–15.1)',
      grindMinUm: 760,
      grindMaxUm: 900,
      grindLevel: '中偏粗研磨',
      grindLevelEn: 'Medium-coarse',
      summary: 'WAC 史上最著名的「大粉量閃電快沖流」：30g 重粉僅配 100g 水強力攪拌 20 下，第 40 秒即開始壓出約 60g 極致濃香精華，再大比例加入 120g Bypass 水！',
      summaryEn: '2019 WAC icon (London): 30 g : 100 g at 92°C, vigorous 20× stir, flip & press at 0:40, then bypass with 120 g water.',
      notes: '【推薦研磨】中偏粗研磨（C5 Pro 刻度約 13.1–15.1，約 760–900 μm）。重粉量（30g）配極短萃取時間只搶最香甜的前中段可溶物，再靠 120g 後加水稀釋出果汁甜感，爽朗飽滿。',
      steps: [
        { type: '注水', sec: 10, water: 100, note: '【反壓法】30g 粉快速注入 100g（92°C）熱水' },
        { type: '攪拌', sec: 10, water: 0, note: '強力快速前後攪拌 20 下' },
        { type: '等待／斷水', sec: 20, water: 0, note: '鎖上濕濾蓋並排去空氣，至 0:40 翻轉上壺' },
        { type: '下壓', sec: 20, water: 0, note: '0:40 起穩定將所有液體壓出（約 60g 精華濃萃）' },
        { type: '後加水（bypass）', sec: 0, water: 120, waterKind: 'hot', note: '加入 120g 溫熱水稀釋濃萃即可享用' }
      ]
    },
    {
      id: 'wac-2018-ibarra-garay',
      category: 'aeropress',
      barista: 'Carolina Ibarra Garay（美國）',
      baristaEn: 'Carolina Ibarra Garay (USA)',
      title: '2018 WAC 世界冠軍｜35g 粗磨極濃正壓筷子攪拌法',
      titleEn: '2018 WAC Champion 35g Coarse Upright Method',
      name: '2018 WAC 冠軍｜Carolina 35g 法',
      badge: '2018 WAC 世界冠軍',
      badgeEn: '2018 WAC Champion',
      method: '愛樂壓',
      dripper: 'AeroPress',
      shape: '其他／不適用',
      material: '樹脂／塑膠',
      filter: 'AeroPress 單層濾紙',
      roast: '淺焙',
      dose: 35,
      temp: 85,
      waterSource: '軟水',
      grindGuide: '粗研磨（C5 Pro 刻度 15–16.2）',
      grindGuideEn: 'Coarse (C5 Pro dial 15–16.2)',
      grindMinUm: 860,
      grindMaxUm: 1000,
      grindLevel: '粗研磨',
      grindLevelEn: 'Coarse',
      summary: '2018 年雪梨 WAC 冠軍的標誌性正壓大粉量配方：35g 粗粉在 85°C 下搭配筷子連續攪拌 30 秒快速萃取前段甜香，壓完後補 100g 水稀釋，如蜜桃果茶般醇厚甘美。',
      summaryEn: '2018 WAC champion (Sydney): upright 35 g coarse grind + 100 g water at 85°C, brisk 30 s chopstick stir, press & bypass +100 g.',
      notes: '【推薦研磨】粗研磨（C5 Pro 刻度約 15–16.2，約 860–1000 μm）。正壓架在壺上注入 100g 邊攪拌 30 秒，快速壓出約 70g 濃液後補 100g 溫／熱水（總飲用液約 170g）。',
      steps: [
        { type: '注水', sec: 20, water: 100, note: '【正壓法】35g 粗磨粉快速注入 100g（85°C）溫水' },
        { type: '攪拌', sec: 30, water: 0, note: '以木筷或攪拌棒穩速連續攪拌 30 秒充分萃出果膠甜感' },
        { type: '下壓', sec: 30, water: 0, note: '插上活塞穩定緩壓約 30 秒至空氣嘶聲（約 70g 濃液）' },
        { type: '後加水（bypass）', sec: 0, water: 100, waterKind: 'hot', note: '加入約 100g 溫熱水調和至總重約 170g（共 200g 總用水）' }
      ]
    },
    {
      id: 'tim-wendelboe-aeropress',
      category: 'aeropress',
      barista: 'Tim Wendelboe',
      baristaEn: 'Tim Wendelboe',
      title: 'Tim Wendelboe 北歐淺焙 1 分鐘正壓經典法',
      titleEn: 'Tim Wendelboe Nordic 1-Minute Upright AeroPress',
      name: 'Tim Wendelboe｜1 分鐘正壓愛樂壓',
      badge: '北歐正壓代表作',
      badgeEn: 'Nordic Upright Classic',
      method: '愛樂壓',
      dripper: 'AeroPress',
      shape: '其他／不適用',
      material: '樹脂／塑膠',
      filter: 'AeroPress 單層濾紙',
      roast: '淺焙',
      dose: 14,
      temp: 96,
      waterSource: '極軟水',
      grindGuide: '中細研磨（C5 Pro 刻度 11.2–13）',
      grindGuideEn: 'Medium-fine (C5 Pro dial 11.2–13)',
      grindMinUm: 620,
      grindMaxUm: 740,
      grindLevel: '中細研磨',
      grindLevelEn: 'Medium-fine',
      summary: '挪威宗師每天都在喝的超快速正壓法：14g 淺焙粉配 96°C 沸水 200g，攪拌 3 下插蓋浸泡到 1 分鐘，拔蓋再輕拌 3 下直接壓下，乾淨、清爽、1 分半內喝到！',
      summaryEn: 'Tim Wendelboe’s fast daily upright brew: 14 g : 200 g at 96°C, stir 3×, steep 1:00, stir 3× again, and press gently.',
      notes: '【推薦研磨】中細研磨（C5 Pro 刻度約 11.2–13，約 620–740 μm）。正壓免反轉不怕灑，14g 粉水比 1:14.3 帶出清爽茶感與清晰果酸，是辦公室與旅行神方。',
      steps: [
        { type: '注水', sec: 15, water: 200, note: '【正壓法】一次將 200g（96°C）熱水倒入 14g 粉中' },
        { type: '攪拌', sec: 5, water: 0, note: '前後快速攪拌 3 下後立即輕插活塞防漏' },
        { type: '等待／斷水', sec: 40, water: 0, note: '靜置浸泡至總時間 1:00' },
        { type: '攪拌', sec: 5, water: 0, note: '1:00 拔起活塞再前後輕拌 3 下幫助沉降' },
        { type: '下壓', sec: 25, water: 0, note: '重新插上活塞並輕柔均速壓到底（約 1:30 完成）' }
      ]
    },
    {
      id: 'jonathan-gagne-aeropress',
      category: 'aeropress',
      barista: 'Jonathan Gagné（天體物理學家）',
      baristaEn: 'Jonathan Gagné (Coffee Ad Astra)',
      title: 'Gagné 物理極限 10 分鐘長浸泡高甜愛樂壓',
      titleEn: 'Jonathan Gagné 10-Minute Long-Steep AeroPress',
      name: 'Jonathan Gagné｜10 分鐘長浸泡極甜法',
      badge: '咖啡物理學經典',
      badgeEn: 'Coffee Science Classic',
      method: '愛樂壓',
      dripper: 'AeroPress',
      shape: '其他／不適用',
      material: '樹脂／塑膠',
      filter: 'AeroPress 單層濾紙（可搭控流蓋）',
      roast: '淺焙',
      dose: 18,
      temp: 98,
      waterSource: '軟水',
      grindGuide: '中研磨（C5 Pro 刻度 12.2–14）',
      grindGuideEn: 'Medium (C5 Pro dial 12.2–14)',
      grindMinUm: 700,
      grindMaxUm: 820,
      grindLevel: '中研磨',
      grindLevelEn: 'Medium',
      summary: '知名咖啡物理學者 Jonathan Gagné 的科學實驗之作：高水溫正壓插上活塞密封浸泡 9–10 分鐘讓溫差趨緩、自然達成完全均勻高萃取，竟能媲美頂級手沖的清澈與爆表甜度！',
      summaryEn: 'Astrophysicist Jonathan Gagné’s long-steep immersion method: 18 g : 250 g at 98°C steeped 9–10 minutes upright for hand-pour-level clarity & sweetness.',
      notes: '【推薦研磨】中研磨（C5 Pro 刻度約 12.2–14，約 700–820 μm）。原版推薦搭配 Fellow Prismo 控流蓋免預滴漏；若用一般濾蓋，注水攪拌後立即輕插活塞形成負壓即可鎖水 10 分鐘。',
      steps: [
        { type: '注水', sec: 20, water: 250, note: '【正壓法】以近沸 98°C 熱水繞圈注滿 250g' },
        { type: '攪拌', sec: 10, water: 0, note: '前後柔和輕拌避免畫圓旋渦，隨即插上活塞約 1cm 形成真空鎖水' },
        { type: '等待／斷水', sec: 540, water: 0, note: '靜置長浸泡 9 分鐘（總時 9:30），讓細粉沉底且極端均勻萃取' },
        { type: '下壓', sec: 45, water: 0, note: '極緩慢溫柔地花 40–50 秒壓到底，不激起底層細粉，甜感驚人' }
      ]
    },
    {
      id: 'alan-adler-fast-aeropress',
      category: 'aeropress',
      barista: 'Alan Adler（AeroPress 發明人）',
      baristaEn: 'Alan Adler (AeroPress Inventor)',
      title: '發明人 Alan Adler 原版 1 分鐘低酸滑順快壓法',
      titleEn: 'Alan Adler Original 80°C 1-Minute Classic',
      name: 'Alan Adler 原創｜1 分鐘滑順正壓法',
      badge: '發明人原版設定',
      badgeEn: 'Inventor Original',
      method: '愛樂壓',
      dripper: 'AeroPress',
      shape: '其他／不適用',
      material: '樹脂／塑膠',
      filter: 'AeroPress 單層濾紙',
      roast: '中焙',
      dose: 16,
      temp: 82,
      waterSource: '軟水',
      grindGuide: '中細偏細研磨（C5 Pro 刻度 10–11.2）',
      grindGuideEn: 'Fine-medium (C5 Pro dial 10–11.2)',
      grindMinUm: 540,
      grindMaxUm: 660,
      grindLevel: '中細偏細研磨',
      grindLevelEn: 'Fine-medium',
      summary: 'AeroPress 發明人 Alan Adler 親自示範的極速日常飲法：80–85°C 低水溫 ＋ 偏細研磨 ＋ 正壓快攪 15 秒隨即慢壓，低苦低酸且焦糖香甜，不到 1 分鐘完成！',
      summaryEn: 'The inventor’s own 1-minute routine: 16 g fine-medium roast at 82°C, stir 15 s upright, and press immediately in 30 s.',
      notes: '【推薦研磨】中細偏細研磨（C5 Pro 刻度約 10–11.2，約 540–660 μm）。中焙至中深焙尤其適合 80–82°C，淺焙可提高至 85–88°C；不愛酸澀苦味的人必試的極速日常配方。',
      steps: [
        { type: '注水', sec: 15, water: 160, note: '【正壓法】以 82°C 溫水注至刻線約 160g' },
        { type: '攪拌', sec: 15, water: 0, note: '用攪拌棒均勻上下攪拌 10–15 秒' },
        { type: '下壓', sec: 30, water: 0, note: '插上活塞直接均速輕壓約 30 秒至氣音即停，純淨低苦零雜味' }
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

  function fmtScaledNum(val, factor) {
    const n = Math.round(Number(val) * factor * 10) / 10;
    return Number.isInteger(n) ? String(n) : String(n);
  }

  function scaleGramText(text, factor) {
    if (typeof text !== 'string' || !text || !Number.isFinite(factor) || Math.abs(factor - 1) < 1e-6) return text;
    return text.replace(
      /(\d+(?:\.\d+)?(?:\s*\/\s*\d+(?:\.\d+)?)+|\d+(?:\.\d+)?\s*[–\-~～]\s*\d+(?:\.\d+)?|\d+(?:\.\d+)?)(\s*g)(?![A-Za-z/／])/g,
      (match, nums, unit) => nums.replace(/\d+(?:\.\d+)?/g, n => fmtScaledNum(n, factor)) + unit
    );
  }

  function scaleRecipeToDose(recipe, targetDose) {
    if (!targetDose || !Number.isFinite(targetDose) || targetDose <= 0) return recipe;
    const nextDose = Math.min(200, Math.max(0.1, Math.round(targetDose * 10) / 10));
    const factor = nextDose / recipe.dose;
    if (Math.abs(factor - 1) < 1e-6) return recipe;

    const scaled = copy(recipe);
    scaled.dose = nextDose;
    if (typeof scaled.notes === 'string' && scaled.notes) {
      scaled.notes = scaleGramText(scaled.notes, factor).slice(0, 3000);
    }
    scaled.steps = scaled.steps.map(s => {
      const next = { ...s };
      if (POUR_SET.has(next.type) || MANUAL_SET.has(next.type)) {
        next.water = Math.min(3000, round1(next.water * factor));
      }
      if (typeof next.note === 'string' && next.note) {
        next.note = scaleGramText(next.note, factor).slice(0, 1000);
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
    const factor = targetDose / tpl.dose;
    const isDoseScaled = Math.abs(factor - 1) > 1e-6;

    let steps = copy(tpl.steps);
    if (tpl.custom46) {
      const totalWater = Math.min(10000, round1(tpl.baseTotalWater * factor));
      steps = buildTetsu46Steps(totalWater, tasteMode, strengthMode, lang);
    } else if (isDoseScaled) {
      steps = steps.map(s => {
        const next = { ...s };
        if (POUR_SET.has(next.type) || MANUAL_SET.has(next.type)) {
          next.water = Math.min(3000, round1(next.water * factor));
        }
        if (typeof next.note === 'string' && next.note) {
          next.note = scaleGramText(next.note, factor).slice(0, 1000);
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

    const scaledNotes = isDoseScaled ? scaleGramText(String(tpl.notes || ''), factor) : String(tpl.notes || '');
    const grinderApi = typeof window !== 'undefined' ? window.CoffeeGrinderGuide : null;
    const activeGrinderId = options.grinderId || (grinderApi ? grinderApi.getPreferredGrinderId() : 'timemore-c5-pro');
    const useDynamicGuide = grinderApi && activeGrinderId !== 'timemore-c5-pro';
    const zhGuide = useDynamicGuide
      ? grinderApi.formatGrindGuide(tpl, { lang: 'zh-Hant', grinderId: activeGrinderId })
      : (tpl.grindGuide || '');
    const enGuide = useDynamicGuide
      ? grinderApi.formatGrindGuide(tpl, { lang: 'en', grinderId: activeGrinderId })
      : (tpl.grindGuideEn || '');

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
      grindGuide: zhGuide,
      grindGuideEn: enGuide,
      grindMinUm: tpl.grindMinUm,
      grindMaxUm: tpl.grindMaxUm,
      grindLevel: tpl.grindLevel || '',
      grindLevelEn: tpl.grindLevelEn || '',
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
      notes: scaledNotes.slice(0, 3000),
      steps
    };
    return r;
  }

  if (typeof window !== 'undefined') {
    window.CoffeeScaleGramText = scaleGramText;
  }
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { CHAMPIONS, buildTetsu46Steps, buildRecipeFromTemplate, scaleRecipeToDose, scaleGramText, recipeSums };
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
        background: rgba(226, 168, 99, 0.13) !important;
        border: 1.5px solid rgba(226, 168, 99, 0.42) !important;
        color: #f3cfa0 !important;
        font-weight: 600 !important;
        border-radius: 13px !important;
        padding: 9px 14px !important;
        min-height: 44px;
        transition: background 0.16s ease, border-color 0.16s ease, color 0.16s ease, box-shadow 0.16s ease;
      }
      .champ-trigger-btn:hover {
        background: linear-gradient(135deg, #e7b26f, #d3944b) !important;
        color: #140e09 !important;
        border-color: #e7b26f !important;
        box-shadow: 0 4px 16px rgba(226, 168, 99, 0.25);
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
        background: linear-gradient(180deg, #181411 0%, #110e0c 100%) !important;
        border: 1px solid rgba(245, 222, 195, 0.16) !important;
        border-radius: 20px !important;
        padding: 18px !important;
        color: #f5efe6 !important;
        box-shadow: 0 24px 60px rgba(0, 0, 0, 0.78);
      }
      .champ-head {
        display: flex;
        flex-wrap: nowrap;
        justify-content: space-between;
        align-items: flex-start;
        gap: 10px;
        margin-bottom: 12px;
        padding-bottom: 10px;
        border-bottom: 1px solid rgba(245, 222, 195, 0.1);
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
        color: #f5efe6;
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
        background: #211b17 !important;
        border: 1px solid rgba(245, 222, 195, 0.14) !important;
        color: #d6cbbd !important;
      }
      .champ-pill[aria-pressed="true"] {
        background: linear-gradient(135deg, #e7b26f, #d3944b) !important;
        color: #140e09 !important;
        border-color: #e7b26f !important;
        font-weight: 700 !important;
        box-shadow: 0 2px 10px rgba(226, 168, 99, 0.22);
      }
      .champ-dose-wrap {
        background: #1c1714;
        border: 1px solid rgba(245, 222, 195, 0.12);
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
        background: #1f1a17;
        border: 1px solid rgba(245, 222, 195, 0.12);
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
        padding: 3px 10px;
        border-radius: 999px;
        background: linear-gradient(135deg, #e7b26f, #d3944b);
        color: #140e09;
        font-weight: 700;
      }
      .champ-barista {
        font-size: 13px;
        color: #b5a899;
      }
      .champ-title {
        margin: 0;
        font-size: 1.08rem;
        color: #f5efe6;
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
        background: rgba(245, 222, 195, 0.06);
        border: 1px solid rgba(245, 222, 195, 0.12);
        color: #e6dccf;
        font-family: 'JetBrains Mono', 'Noto Sans TC', monospace;
      }
      .champ-chip.scaled {
        background: rgba(226, 168, 99, 0.16);
        border-color: rgba(226, 168, 99, 0.42);
        color: #f7d8af;
      }
      .champ-desc {
        margin: 0;
        font-size: 13.5px;
        line-height: 1.55;
        color: #cfc5b8;
      }
      .champ-46-box {
        background: #171310;
        border: 1px solid rgba(245, 222, 195, 0.14);
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
        color: #b5a899;
      }
      .champ-steps-details {
        background: #171310;
        border: 1px solid rgba(245, 222, 195, 0.1);
        border-radius: 12px;
        padding: 8px 12px;
      }
      .champ-steps-details summary {
        font-size: 13.5px !important;
        margin: 0 !important;
        color: #e6dccf;
      }
      .champ-step-list {
        margin: 8px 0 0;
        padding-left: 18px;
        font-size: 13px;
        line-height: 1.6;
        color: #cfc5b8;
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
        background: linear-gradient(135deg, #e7b26f, #d3944b) !important;
        color: #140e09 !important;
        border-color: #e7b26f !important;
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
        border-color: rgba(226, 168, 99, 0.45) !important;
        background: #251f1b;
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
        color: #e2a863;
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
        border-bottom: 1px solid rgba(245, 222, 195, 0.1);
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
        background: #1f1a17;
        border: 1px solid rgba(245, 222, 195, 0.12);
        border-radius: 12px;
        padding: 10px 8px;
        text-align: center;
      }
      .champ-metric span {
        display: block;
        font-size: 12px;
        color: #b5a899;
      }
      .champ-metric strong {
        display: block;
        margin-top: 4px;
        font-size: 18px;
        font-family: 'JetBrains Mono', monospace;
        color: #f3cfa0;
      }
      @media (max-width: 520px) {
        .champ-metrics {
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }
      }
      .champ-detail-box {
        background: #1a1512;
        border: 1px solid rgba(245, 222, 195, 0.11);
        border-radius: 14px;
        padding: 12px 14px;
      }
      .champ-detail-box h4 {
        margin: 0 0 8px;
        font-size: 14.5px;
        color: #f3cfa0;
      }
      .champ-detail-steps {
        margin: 0;
        padding: 0;
        list-style: none;
        display: grid;
        gap: 8px;
      }
      .champ-detail-step {
        background: #231d19;
        border: 1px solid rgba(245, 222, 195, 0.08);
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
        color: #f5efe6;
        margin-bottom: 3px;
      }
      .champ-detail-step-time {
        font-family: 'JetBrains Mono', monospace;
        font-size: 12.5px;
        color: #e2a863;
      }
      .champ-detail-step-note {
        color: #d6cbbd;
        font-size: 13px;
      }
      .champ-filter-row {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        align-items: center;
      }
      .champ-search-input {
        flex: 1 1 220px;
        min-height: 38px !important;
        padding: 6px 12px !important;
        font-size: 13.5px !important;
        border-radius: 10px !important;
      }
      .champ-grinder-select {
        flex: 0 1 260px;
        min-height: 38px !important;
        padding: 6px 10px !important;
        font-size: 13.5px !important;
        border-radius: 10px !important;
      }
      .champ-drippers {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 6px;
      }
      .champ-count-note {
        font-size: 12.5px;
        color: #b5a899;
        margin: 0;
      }
      .champ-empty {
        grid-column: 1 / -1;
        text-align: center;
        padding: 28px 14px;
        border-radius: 14px;
        border: 1px dashed rgba(245, 222, 195, 0.22);
        color: #b5a899;
        font-size: 14px;
      }
      .champ-detail-head-row {
        display: flex;
        flex-wrap: wrap;
        justify-content: space-between;
        align-items: center;
        gap: 8px;
        margin-bottom: 8px;
      }
      .champ-detail-head-row h4 {
        margin: 0 !important;
      }
    `;
    document.head.append(style);
  }

  let activeCategory = 'all';
  let activeDripper = 'all';
  let searchQuery = '';
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

  const DRIPPERS = [
    { id: 'all', zh: '全部器具', en: 'All brewers', match: () => true },
    { id: 'v60', zh: 'V60 / ORIGAMI', en: 'V60 / ORIGAMI', match: c => /v60|origami/i.test(c.dripper) },
    { id: 'flat', zh: '平底濾杯', en: 'Flat-Bottom', match: c => /orea|kalita|april|solo/i.test(c.dripper) },
    { id: 'switch', zh: 'Switch / 聰明', en: 'Switch / Clever', match: c => c.method === '浸泡式' },
    { id: 'classic', zh: 'KONO / 法蘭絨 / 梯形', en: 'KONO / Nel / Trapezoid', match: c => /kono|nel|法蘭絨|melitta/i.test(c.dripper) || c.shape === '梯形' },
    { id: 'aeropress', zh: '愛樂壓', en: 'AeroPress', match: c => c.method === '愛樂壓' },
    { id: 'phin', zh: '越式 Phin', en: 'Phin', match: c => c.method === '越南滴濾壺' }
  ];

  function grinderGuideLine(tpl, en, compact) {
    const api = typeof window !== 'undefined' ? window.CoffeeGrinderGuide : null;
    if (api) return api.formatGrindGuide(tpl, { lang: en ? 'en' : 'zh-Hant', compact });
    return en ? tpl.grindGuideEn : tpl.grindGuide;
  }

  function makeGrinderSelect(id, en, onSelect) {
    const api = typeof window !== 'undefined' ? window.CoffeeGrinderGuide : null;
    if (!api) return null;
    const sel = document.createElement('select');
    sel.id = id;
    sel.className = 'champ-grinder-select';
    sel.setAttribute('aria-label', en ? 'Select grinder for calibration' : '選擇換算磨豆機');
    const currentId = api.getPreferredGrinderId();
    for (const g of api.GRINDERS) {
      const opt = document.createElement('option');
      opt.value = g.id;
      opt.textContent = (en ? 'Grinder: ' : '磨豆機：') + g.name;
      if (g.id === currentId) opt.selected = true;
      sel.append(opt);
    }
    sel.onchange = () => {
      api.setPreferredGrinderId(sel.value);
      if (typeof onSelect === 'function') onSelect();
    };
    return sel;
  }

  function filteredRecipes() {
    const dripperRule = DRIPPERS.find(d => d.id === activeDripper) || DRIPPERS[0];
    const q = searchQuery.trim().toLowerCase();
    return CHAMPIONS.filter(c => {
      if (activeCategory !== 'all' && c.category !== activeCategory) return false;
      if (!dripperRule.match(c)) return false;
      if (!q) return true;
      const hay = [c.name, c.title, c.titleEn, c.barista, c.baristaEn, c.dripper, c.filter, c.method, c.roast, c.summary, c.summaryEn, c.badge, c.badgeEn].join(' ').toLowerCase();
      return hay.includes(q);
    });
  }

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
    const rawSummary = en ? tpl.summaryEn : tpl.summary;
    summaryP.textContent = isScaled ? scaleGramText(rawSummary, built.dose / tpl.dose) : rawSummary;
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
    const gearHead = document.createElement('div');
    gearHead.className = 'champ-detail-head-row';
    const gearTitle = document.createElement('h4');
    gearTitle.textContent = en ? 'Equipment & Recommended Grind' : '器材與推薦研磨';
    gearHead.append(gearTitle);
    const detailGrinderSel = makeGrinderSelect('champDetailGrinderSelect', en, () => renderDialogContent());
    if (detailGrinderSel) gearHead.append(detailGrinderSel);
    const gearMeta = document.createElement('div');
    gearMeta.className = 'champ-meta';
    const gearChips = [
      `<span class="champ-chip">${esc(built.dripper)}</span>`,
      built.filter ? `<span class="champ-chip">${esc(built.filter)}</span>` : '',
      built.roast && built.roast !== '未填' ? `<span class="champ-chip">${esc(built.roast)}</span>` : '',
      `<span class="champ-chip scaled">${esc(grinderGuideLine(tpl, en, false))}</span>`
    ].filter(Boolean);
    if (sums.postIce > 0) gearChips.push(`<span class="champ-chip scaled">+${sums.postIce}g ${en ? 'Ice' : '冰塊'}</span>`);
    if (sums.postWater > 0) gearChips.push(`<span class="champ-chip scaled">+${sums.postWater}g Bypass</span>`);
    if (isScaled) gearChips.push(`<span class="champ-chip scaled">${en ? `Scaled from ${tpl.dose}g` : `原 ${tpl.dose}g 已換算`}</span>`);
    gearMeta.innerHTML = gearChips.join('');
    gearBox.append(gearHead, gearMeta);
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

    const controls = document.createElement('div');
    controls.className = 'champ-controls';

    const filterRow = document.createElement('div');
    filterRow.className = 'champ-filter-row';
    const searchInput = document.createElement('input');
    searchInput.id = 'champSearchInput';
    searchInput.type = 'search';
    searchInput.className = 'champ-search-input';
    searchInput.value = searchQuery;
    searchInput.placeholder = en ? 'Search recipes, champions, drippers…' : '搜尋配方、冠軍、濾杯、愛樂壓…';
    searchInput.setAttribute('aria-label', searchInput.placeholder);
    filterRow.append(searchInput);

    const grinderSel = makeGrinderSelect('champGrinderSelect', en, () => renderCardsGrid());
    if (grinderSel) filterRow.append(grinderSel);
    controls.append(filterRow);

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

    const dripperRow = document.createElement('div');
    dripperRow.className = 'champ-drippers';
    for (const d of DRIPPERS) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'champ-pill';
      btn.setAttribute('aria-pressed', String(activeDripper === d.id));
      btn.textContent = en ? d.en : d.zh;
      btn.onclick = () => {
        activeDripper = d.id;
        renderDialogContent();
      };
      dripperRow.append(btn);
    }
    controls.append(dripperRow);

    const countNote = document.createElement('p');
    countNote.className = 'champ-count-note';
    controls.append(countNote);
    dialog.append(controls);

    const grid = document.createElement('div');
    grid.className = 'champ-grid';
    dialog.append(grid);

    function renderCardsGrid() {
      const items = filteredRecipes();
      countNote.textContent = en
        ? `Showing ${items.length} / ${CHAMPIONS.length} recipes`
        : `顯示 ${items.length} / ${CHAMPIONS.length} 支配方`;
      grid.replaceChildren();

      if (!items.length) {
        const empty = document.createElement('div');
        empty.className = 'champ-empty';
        empty.textContent = en
          ? 'No recipes match the current search and filters.'
          : '沒有符合搜尋或篩選條件的配方，試著清空關鍵字或切換全部器具。';
        grid.append(empty);
        return;
      }

      for (const tpl of items) {
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
          `<span class="champ-chip">${esc(grinderGuideLine(tpl, en, true))}</span>`
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
    }

    searchInput.oninput = () => {
      searchQuery = searchInput.value;
      renderCardsGrid();
    };

    renderCardsGrid();
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

  if (typeof window !== 'undefined' && typeof window.addEventListener === 'function') {
    window.addEventListener('coffee-grinder-change', () => {
      if (dialog.open) renderDialogContent();
    });
  }
})();
