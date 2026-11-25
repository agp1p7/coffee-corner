(function () {
  'use strict';

  const STORAGE_KEY = 'yiyu-coffee-grinder-pref';
  const DEFAULT_ID = 'timemore-c5-pro';
  const MICRON_ANCHORS = [400, 550, 650, 750, 850, 950, 1050];

  const GRINDERS = [
    {
      id: 'timemore-c5-pro',
      name: 'Timemore C5 Pro',
      shortName: 'C5 Pro',
      brand: 'Timemore',
      kind: 'hand',
      zeroZh: '鎖死歸零 · 每大格3響',
      zeroEn: 'Burr-lock zero · 3 clicks/num',
      unitZh: '數字刻度（大格.小格）',
      unitEn: 'Dial number (num.click)',
      aliases: ['timemore c5 pro', 'c5 pro', 'chestnut c5', '泰摩 c5', 'c5'],
      anchors: [24, 30, 36, 40, 44, 48, 52],
      format: 'timemore-c5'
    },
    {
      id: 'timemore-c5-esp-pro',
      name: 'Timemore C5 ESP Pro',
      shortName: 'C5 ESP Pro',
      brand: 'Timemore',
      kind: 'hand',
      zeroZh: '鎖死歸零 · 約15μm/響',
      zeroEn: 'Burr-lock zero · ~15μm/click',
      unitZh: '響數 (clicks)',
      unitEn: 'Clicks',
      aliases: ['timemore c5 esp pro', 'c5 esp pro', 'c5 esp', 'c5esp'],
      anchors: [28, 38, 46, 53, 60, 67, 74],
      format: 'clicks'
    },
    {
      id: 'timemore-c3',
      name: 'Timemore C3 / C3 Pro',
      shortName: 'Timemore C3',
      brand: 'Timemore',
      kind: 'hand',
      zeroZh: '鎖死歸零 · 從0數響',
      zeroEn: 'Burr-lock zero · count clicks',
      unitZh: '格數 (clicks)',
      unitEn: 'Clicks',
      aliases: ['timemore c3', 'c3 pro', 'c3s', 'c3 esp', '泰摩 c3', '栗子 c3'],
      anchors: [12, 15, 17, 19, 21, 23, 25],
      format: 'clicks'
    },
    {
      id: 'comandante-c40',
      name: 'Comandante C40 MK4',
      shortName: 'C40',
      brand: 'Comandante',
      kind: 'hand',
      zeroZh: '手柄不垂落歸零 · 標準軸',
      zeroEn: 'Handle-stop zero · std axle',
      unitZh: '格數 (clicks)',
      unitEn: 'Clicks',
      aliases: ['comandante c40', 'comandante', 'c40', '司令官'],
      anchors: [15, 19, 22, 25, 28, 31, 34],
      format: 'clicks'
    },
    {
      id: '1zpresso-zp6',
      name: '1Zpresso ZP6 Special',
      shortName: '1Z ZP6',
      brand: '1Zpresso',
      kind: 'hand',
      zeroZh: '鎖死歸零 · 0.0起算',
      zeroEn: 'Burr-lock zero · 0.0 start',
      unitZh: '刻度 (號.小格)',
      unitEn: 'Dial (num.click)',
      aliases: ['1zpresso zp6', 'zp6 special', 'zp6', '1z zp6'],
      anchors: [32, 38, 43, 48, 53, 58, 63],
      format: '1z-decimal'
    },
    {
      id: '1zpresso-k-ultra',
      name: '1Zpresso K-Ultra',
      shortName: '1Z K-Ultra',
      brand: '1Zpresso',
      kind: 'hand',
      zeroZh: '鎖死歸零 · 每大格10響',
      zeroEn: 'Burr-lock zero · 10 clicks/num',
      unitZh: '刻度 (號.小格)',
      unitEn: 'Dial (num.click)',
      aliases: ['1zpresso k-ultra', 'k-ultra', 'k ultra', 'kultra', '1z k'],
      anchors: [45, 58, 68, 77, 85, 93, 102],
      format: '1z-decimal'
    },
    {
      id: '1zpresso-x-ultra',
      name: '1Zpresso X-Ultra',
      shortName: '1Z X-Ultra',
      brand: '1Zpresso',
      kind: 'hand',
      zeroZh: '鎖死歸零 · 圈.號.小格',
      zeroEn: 'Burr-lock zero · rot.num.click',
      unitZh: '圈.號.小格 (每圈60響)',
      unitEn: 'rot.num.click (60/rot)',
      aliases: ['1zpresso x-ultra', 'x-ultra', 'x ultra', 'xultra', 'x-pro', '1z x'],
      anchors: [80, 100, 115, 128, 140, 152, 165],
      format: '1z-xultra'
    },
    {
      id: '1zpresso-q-air',
      name: '1Zpresso Q Air / Q2',
      shortName: '1Z Q Air',
      brand: '1Zpresso',
      kind: 'hand',
      zeroZh: '鎖死歸零 · 每圈30響',
      zeroEn: 'Burr-lock zero · 30 clicks/rot',
      unitZh: '圈.號.小格 (每圈30響)',
      unitEn: 'rot.num.sub (30/rot)',
      aliases: ['1zpresso q air', 'q air', 'qair', 'q2 s', 'q2', '1z q'],
      anchors: [33, 39, 44, 48, 53, 58, 63],
      format: '1z-qair'
    },
    {
      id: 'kingrinder-k6',
      name: 'KINGrinder K6',
      shortName: 'KINGrinder K6',
      brand: 'KINGrinder',
      kind: 'hand',
      zeroZh: '鎖死歸零 · 總響數',
      zeroEn: 'Burr-lock zero · total clicks',
      unitZh: '總響數 (clicks)',
      unitEn: 'Total clicks',
      aliases: ['kingrinder k6', 'kingrinder', 'k6'],
      anchors: [65, 78, 88, 96, 105, 115, 125],
      format: 'clicks'
    },
    {
      id: 'fellow-ode-gen2',
      name: 'Fellow Ode Gen 2',
      shortName: 'Ode Gen 2',
      brand: 'Fellow',
      kind: 'electric',
      zeroZh: '原廠Gen 2刀盤 · 1–11刻度',
      zeroEn: 'Stock Gen 2 burrs · dial 1–11',
      unitZh: '轉盤刻度 (1–11)',
      unitEn: 'Dial (1–11)',
      aliases: ['fellow ode gen 2', 'ode gen 2', 'ode gen2', 'ode 2', 'fellow ode', 'ode'],
      anchors: [6, 9, 11, 14, 17, 20, 23],
      format: 'ode'
    },
    {
      id: 'baratza-encore-esp',
      name: 'Baratza Encore ESP',
      shortName: 'Encore ESP',
      brand: 'Baratza',
      kind: 'electric',
      zeroZh: '1–40刻度 · 21起為手沖段',
      zeroEn: 'Dial 1–40 · filter from 21',
      unitZh: '轉盤刻度 (1–40)',
      unitEn: 'Dial (1–40)',
      aliases: ['baratza encore esp', 'encore esp', 'baratza', 'encore'],
      anchors: [19, 22, 25, 27, 29, 31, 34],
      format: 'int'
    },
    {
      id: 'feima-600n',
      name: '小飛馬 600N / 楊家 600N',
      shortName: '小飛馬 600N',
      brand: 'Yang-Chia',
      kind: 'electric',
      zeroZh: '刀盤輕觸歸0 · 1–8刻度',
      zeroEn: 'Burr-touch zero · dial 1–8',
      unitZh: '轉盤刻度 (1–8)',
      unitEn: 'Dial (1–8)',
      aliases: ['小飛馬 600n', '楊家 600n', 'feima 600n', '600n', '610n', '小飛馬', '楊家', 'feima'],
      anchors: [2.5, 3.0, 3.5, 4.0, 4.5, 5.0, 5.5],
      format: 'half'
    },
    {
      id: 'niche-zero',
      name: 'Niche Zero',
      shortName: 'Niche Zero',
      brand: 'Niche',
      kind: 'electric',
      zeroZh: '原廠校準點歸零 · 0–50刻度',
      zeroEn: 'Calibrated zero · dial 0–50',
      unitZh: '轉盤刻度 (0–50)',
      unitEn: 'Dial (0–50)',
      aliases: ['niche zero', 'niche'],
      anchors: [20, 25, 30, 34, 38, 43, 48],
      format: 'int'
    }
  ];

  const GRINDER_MAP = Object.fromEntries(GRINDERS.map(g => [g.id, g]));

  // Sort aliases longest-first so "C5 ESP Pro" matches before "C5 Pro".
  const ALIAS_ENTRIES = [];
  for (const g of GRINDERS) {
    for (const alias of g.aliases) {
      ALIAS_ENTRIES.push({ id: g.id, alias: alias.toLowerCase() });
    }
  }
  ALIAS_ENTRIES.sort((a, b) => b.alias.length - a.alias.length);

  function getGrinder(id) {
    return GRINDER_MAP[id] || GRINDER_MAP[DEFAULT_ID];
  }

  function getPreferredGrinderId() {
    try {
      if (typeof localStorage !== 'undefined') {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved && GRINDER_MAP[saved]) return saved;
      }
    } catch (e) {}
    return DEFAULT_ID;
  }

  function setPreferredGrinderId(id) {
    const validId = GRINDER_MAP[id] ? id : DEFAULT_ID;
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(STORAGE_KEY, validId);
      }
    } catch (e) {}
    if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function' && typeof CustomEvent === 'function') {
      try {
        window.dispatchEvent(new CustomEvent('coffee-grinder-change', { detail: { id: validId } }));
      } catch (e) {}
    }
    return validId;
  }

  function matchGrinderByName(name) {
    const raw = String(name || '').trim().toLowerCase();
    if (!raw) return null;
    for (const entry of ALIAS_ENTRIES) {
      if (raw.includes(entry.alias)) return entry.id;
    }
    return null;
  }

  function resolveGrinderId(recipe) {
    if (recipe && recipe.grinder) {
      const matched = matchGrinderByName(recipe.grinder);
      if (matched) return matched;
    }
    return getPreferredGrinderId();
  }

  function interpolatePiecewise(x, xs, ys) {
    if (x <= xs[0]) {
      const slope = (ys[1] - ys[0]) / (xs[1] - xs[0]);
      return ys[0] + (x - xs[0]) * slope;
    }
    const last = xs.length - 1;
    if (x >= xs[last]) {
      const slope = (ys[last] - ys[last - 1]) / (xs[last] - xs[last - 1]);
      return ys[last] + (x - xs[last]) * slope;
    }
    for (let i = 0; i < last; i++) {
      if (x >= xs[i] && x <= xs[i + 1]) {
        const t = (x - xs[i]) / (xs[i + 1] - xs[i]);
        return ys[i] + t * (ys[i + 1] - ys[i]);
      }
    }
    return ys[0];
  }

  function parseC5DialToClicks(str) {
    const parts = String(str || '').trim().split('.');
    const major = Number(parts[0]);
    if (!Number.isFinite(major)) return NaN;
    if (parts.length === 1) return major * 3;
    const minor = Number(parts[1]);
    if (!Number.isFinite(minor)) return major * 3;
    if (parts[1] === '5') return Math.round((major + 0.5) * 3);
    return major * 3 + Math.min(2, Math.max(0, Math.round(minor)));
  }

  function inferMicronRange(recipe) {
    const r = recipe || {};
    const explicitMin = Number(r.grindMinUm);
    const explicitMax = Number(r.grindMaxUm);
    if (Number.isFinite(explicitMin) && Number.isFinite(explicitMax) && explicitMin > 100 && explicitMax >= explicitMin) {
      return {
        minUm: Math.round(explicitMin),
        maxUm: Math.round(explicitMax),
        level: r.grindLevel || '',
        levelEn: r.grindLevelEn || ''
      };
    }

    const guideBlob = [r.grindGuide, r.grindGuideEn, r.notes].filter(Boolean).join(' ');
    const umMatch = guideBlob.match(/(\d{3,4})\s*[–\-~]\s*(\d{3,4})\s*μm/i);
    if (umMatch) {
      const u1 = Math.max(300, Math.min(1250, Number(umMatch[1])));
      const u2 = Math.max(u1 + 20, Math.min(1300, Number(umMatch[2])));
      return { minUm: u1, maxUm: u2, level: r.grindLevel || '', levelEn: r.grindLevelEn || '' };
    }
    const c5Match = guideBlob.match(/C5 Pro[^0-9]*(\d+(?:\.\d+)?)\s*[–\-~]\s*(\d+(?:\.\d+)?)/i);
    if (c5Match) {
      const c1 = parseC5DialToClicks(c5Match[1]);
      const c2 = parseC5DialToClicks(c5Match[2]);
      if (Number.isFinite(c1) && Number.isFinite(c2)) {
        const c5Anchors = GRINDER_MAP['timemore-c5-pro'].anchors;
        const u1 = Math.max(300, Math.min(1250, Math.round(interpolatePiecewise(c1, c5Anchors, MICRON_ANCHORS) / 10) * 10));
        const u2 = Math.max(u1 + 20, Math.min(1300, Math.round(interpolatePiecewise(c2, c5Anchors, MICRON_ANCHORS) / 10) * 10));
        return {
          minUm: u1,
          maxUm: u2,
          level: r.grindLevel || '',
          levelEn: r.grindLevelEn || ''
        };
      }
    }

    if (r.method === '愛樂壓') return { minUm: 550, maxUm: 680, level: '中研磨', levelEn: 'Medium' };
    if (r.method === '浸泡式') return { minUm: 780, maxUm: 950, level: '中粗研磨', levelEn: 'Medium-coarse' };
    if (r.method === '越南滴濾壺') return { minUm: 600, maxUm: 720, level: '中細研磨', levelEn: 'Medium-fine' };
    if (r.method === '手沖' && r.shape === '平底') return { minUm: 720, maxUm: 860, level: '中研磨', levelEn: 'Medium' };
    if (r.method === '手沖') return { minUm: 660, maxUm: 800, level: '中細至中研磨', levelEn: 'Medium-fine to medium' };
    return { minUm: 700, maxUm: 860, level: '中研磨', levelEn: 'Medium' };
  }

  function formatSingleDial(grinder, rawValue) {
    const val = Math.max(0, rawValue);
    switch (grinder.format) {
      case 'timemore-c5': {
        const clicks = Math.max(3, Math.round(val));
        const major = Math.floor(clicks / 3);
        const sub = clicks % 3;
        return sub === 0 ? String(major) : `${major}.${sub}`;
      }
      case 'clicks':
        return String(Math.max(1, Math.round(val)));
      case 'int':
        return String(Math.max(1, Math.round(val)));
      case 'half': {
        const rounded = Math.max(1, Math.round(val * 2) / 2);
        return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
      }
      case 'ode': {
        const steps = Math.max(0, Math.round(val));
        const major = 1 + Math.floor(steps / 3);
        const sub = steps % 3;
        return sub === 0 ? String(major) : `${major}.${sub}`;
      }
      case '1z-decimal': {
        const clicks = Math.max(1, Math.round(val));
        return (clicks / 10).toFixed(1);
      }
      case '1z-xultra': {
        const clicks = Math.max(1, Math.round(val));
        const rot = Math.floor(clicks / 60);
        const rem = clicks % 60;
        const num = Math.floor(rem / 10);
        const sub = rem % 10;
        return `${rot}.${num}.${sub}`;
      }
      case '1z-qair': {
        const clicks = Math.max(1, Math.round(val));
        const rot = Math.floor(clicks / 30);
        const rem = clicks % 30;
        const num = Math.floor(rem / 3);
        const sub = rem % 3;
        return `${rot}.${num}.${sub}`;
      }
      default:
        return String(Math.round(val));
    }
  }

  function convertMicronsToDial(grinderId, minUm, maxUm, lang) {
    const grinder = getGrinder(grinderId);
    const loRaw = interpolatePiecewise(minUm, MICRON_ANCHORS, grinder.anchors);
    const hiRaw = interpolatePiecewise(maxUm, MICRON_ANCHORS, grinder.anchors);
    const lo = formatSingleDial(grinder, loRaw);
    const hi = formatSingleDial(grinder, Math.max(loRaw, hiRaw));
    const unitSuffix = grinder.format === 'clicks' ? (lang === 'en' ? ' clicks' : ' 格') : '';
    const rangeText = lo === hi ? `${lo}${unitSuffix}` : `${lo}–${hi}${unitSuffix}`;
    return {
      grinder,
      lo,
      hi,
      rangeText,
      minUm: Math.round(minUm),
      maxUm: Math.round(maxUm)
    };
  }

  function extractLevel(recipe, inferred, en) {
    const sanitize = raw => {
      const part = String(raw || '').split('·')[0].trim();
      return /刻度|dial|\d\s*μm/i.test(part) ? '' : part;
    };
    if (en) {
      if (recipe && recipe.grindLevelEn) return sanitize(recipe.grindLevelEn);
      if (inferred.levelEn) return sanitize(inferred.levelEn);
      const g = String((recipe && recipe.grindGuideEn) || '');
      const m = g.match(/^([^(]+)/);
      return m ? sanitize(m[1]) : '';
    }
    if (recipe && recipe.grindLevel) return sanitize(recipe.grindLevel);
    if (inferred.level) return sanitize(inferred.level);
    const g = String((recipe && recipe.grindGuide) || '');
    const m = g.match(/^([^（(]+)/);
    return m ? sanitize(m[1]) : '';
  }

  function formatGrindGuide(recipe, opts) {
    const o = opts || {};
    const en = o.lang === 'en';
    const grinderId = o.grinderId || resolveGrinderId(recipe);
    const inferred = inferMicronRange(recipe);
    const conv = convertMicronsToDial(grinderId, inferred.minUm, inferred.maxUm, o.lang || 'zh-Hant');
    if (o.compact) {
      return `${conv.grinder.shortName} ${conv.rangeText} · ${conv.minUm}–${conv.maxUm} μm`;
    }
    const level = o.includeLevel === false ? '' : extractLevel(recipe, inferred, en);
    const levelPrefix = level ? `${level} · ` : '';
    if (en) {
      return `${levelPrefix}${conv.grinder.name} dial ${conv.rangeText} (~${conv.minUm}–${conv.maxUm} μm · ${conv.grinder.zeroEn})`;
    }
    return `${levelPrefix}${conv.grinder.name} 刻度 ${conv.rangeText}（約 ${conv.minUm}–${conv.maxUm} μm · ${conv.grinder.zeroZh}）`;
  }

  const api = {
    STORAGE_KEY,
    DEFAULT_ID,
    MICRON_ANCHORS,
    GRINDERS,
    getGrinder,
    getPreferredGrinderId,
    setPreferredGrinderId,
    matchGrinderByName,
    resolveGrinderId,
    inferMicronRange,
    convertMicronsToDial,
    formatGrindGuide
  };

  if (typeof window !== 'undefined') {
    window.CoffeeGrinderGuide = api;
  }
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
})();
