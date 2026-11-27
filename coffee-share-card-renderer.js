(function (root, factory) {
  'use strict';
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.CoffeeCardB = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  const POUR = ['悶蒸注水', '注水', '繞圈注水', '中心注水'];
  const POST = '後加水（bypass）';
  const ICE = '後加冰塊';

  const THEMES = {
    sumi: {
      bg: '#11100F',
      surface: '#1A1815',
      border: '#3A352E',
      rule: '#2D2924',
      ink: '#ECE8E0',
      ink2: '#A8A095',
      accent: '#D98A4E',
      glint: '#F8E2C8'
    },
    ocean: {
      bg: '#0E151D',
      surface: '#141E29',
      border: '#2E4359',
      rule: '#243547',
      ink: '#E6EFF6',
      ink2: '#9BB1C6',
      accent: '#6EB2D4',
      glint: '#CBE8F7'
    },
    washi: {
      bg: '#F3EEE4',
      surface: '#FAF6EE',
      border: '#C8BFA8',
      rule: '#DDD4C3',
      ink: '#1C1915',
      ink2: '#6E655A',
      accent: '#A85A24',
      glint: '#FFF4E6'
    },
    sakura: {
      bg: '#FBF1F3',
      surface: '#FFF8F9',
      border: '#DDBAC4',
      rule: '#EBD3DA',
      ink: '#2B1A20',
      ink2: '#75545E',
      accent: '#B84A6E',
      glint: '#FFEAF0'
    },
    matcha: {
      bg: '#EFF3EC',
      surface: '#F7FAF5',
      border: '#B8C9B5',
      rule: '#D0DDD0',
      ink: '#1B241C',
      ink2: '#556657',
      accent: '#47734B',
      glint: '#E9F4EA'
    }
  };

  function totals(r) {
    let water = 0;
    let postCold = r.cold || 0;
    let postRoom = 0;
    let postHot = 0;
    let postIce = r.ice || 0;
    const kinds = ['cold', 'room', 'hot'];
    if (!Array.isArray(r.steps)) throw Error('Invalid steps');
    for (const s of r.steps) {
      if (!Number.isFinite(s.water) || s.water < 0) throw Error('Invalid amount');
      if (POUR.includes(s.type)) water += s.water;
      else if (s.type === ICE) postIce += s.water;
      else if (s.type === POST) {
        if (s.waterKind !== undefined && !kinds.includes(s.waterKind)) throw Error('Invalid water kind');
        if ((s.waterKind || 'cold') === 'cold') postCold += s.water;
        else if (s.waterKind === 'room') postRoom += s.water;
        else postHot += s.water;
      }
    }
    if (
      (r.cold > 0 && r.steps.some(s => s.type === POST)) ||
      (r.ice > 0 && r.steps.some(s => s.type === ICE))
    ) {
      throw Error('Ambiguous additions');
    }
    if (![water, postCold, postRoom, postHot, postIce].every(v => Number.isFinite(v) && v >= 0) || water <= 0) {
      throw Error('Invalid totals');
    }
    return { water, postCold, postRoom, postHot, postIce, postWater: postCold + postRoom + postHot };
  }

  function lines(ctx, value, width, size) {
    ctx.font = size + 'px Iansui, serif';
    const result = [];
    let row = '';
    for (const ch of String(value).replace(/\r/g, '')) {
      if (ch === '\n') {
        result.push(row);
        row = '';
      } else if (ctx.measureText(row + ch).width > width && row) {
        result.push(row);
        row = ch;
      } else {
        row += ch;
      }
    }
    if (row || !result.length) result.push(row);
    return result;
  }

  function measureBlock(ctx, value, width, height, max, min) {
    for (let size = max; size >= min; size--) {
      const a = lines(ctx, value, width, size);
      const lineHeight = size * 1.28;
      if (a.length * lineHeight <= height && a.every(v => ctx.measureText(v).width <= width)) {
        return { fits: true, size, lineHeight, rows: a, usedHeight: a.length * lineHeight };
      }
    }
    return { fits: false, size: min, lineHeight: min * 1.28, rows: [], usedHeight: 0 };
  }

  function block(ctx, value, x, y, width, height, max, min) {
    const m = measureBlock(ctx, value, width, height, max, min);
    if (!m.fits) return false;
    ctx.font = m.size + 'px Iansui, serif';
    m.rows.forEach((v, i) => ctx.fillText(v, x, y + i * m.lineHeight));
    return true;
  }

  function drawBrandEmblem(ctx, x, y, size, pal) {
    const s = size / 24;
    const prevStroke = ctx.strokeStyle;
    const prevWidth = ctx.lineWidth;
    const prevFill = ctx.fillStyle;

    ctx.strokeStyle = pal.border;
    ctx.lineWidth = 1;
    ctx.strokeRect(x, y, size, size);

    ctx.strokeStyle = pal.ink;
    ctx.lineWidth = Math.max(1.5, 1.6 * s);

    // Top-left & bottom-right architectural corner brackets
    ctx.beginPath();
    ctx.moveTo(x + 3.5 * s, y + 8.5 * s);
    ctx.lineTo(x + 3.5 * s, y + 3.5 * s);
    ctx.lineTo(x + 8.5 * s, y + 3.5 * s);
    ctx.moveTo(x + 20.5 * s, y + 15.5 * s);
    ctx.lineTo(x + 20.5 * s, y + 20.5 * s);
    ctx.lineTo(x + 15.5 * s, y + 20.5 * s);
    ctx.stroke();

    // Minimal geometric V60 dripper + base line
    ctx.beginPath();
    ctx.moveTo(x + 6.8 * s, y + 6.6 * s);
    ctx.lineTo(x + 17.2 * s, y + 6.6 * s);
    ctx.lineTo(x + 13.6 * s, y + 13.6 * s);
    ctx.lineTo(x + 10.4 * s, y + 13.6 * s);
    ctx.lineTo(x + 6.8 * s, y + 6.6 * s);
    ctx.moveTo(x + 9.2 * s, y + 15.2 * s);
    ctx.lineTo(x + 14.8 * s, y + 15.2 * s);
    ctx.stroke();

    // Subtle inner rib lines
    ctx.strokeStyle = pal.ink2;
    ctx.lineWidth = Math.max(1, 0.9 * s);
    ctx.beginPath();
    ctx.moveTo(x + 9.5 * s, y + 6.8 * s);
    ctx.lineTo(x + 11.2 * s, y + 13.3 * s);
    ctx.moveTo(x + 14.5 * s, y + 6.8 * s);
    ctx.lineTo(x + 12.8 * s, y + 13.3 * s);
    ctx.stroke();

    // Warm copper/amber coffee drop (guarded for minimal mock canvases)
    if (typeof ctx.arc === 'function' && typeof ctx.fill === 'function') {
      ctx.fillStyle = pal.accent;
      ctx.beginPath();
      ctx.moveTo(x + 12 * s, y + 16.5 * s);
      ctx.lineTo(x + 13.9 * s, y + 19.1 * s);
      ctx.arc(x + 12 * s, y + 19.3 * s, 2.0 * s, 0, Math.PI, false);
      ctx.lineTo(x + 12 * s, y + 16.5 * s);
      ctx.fill();
    }

    ctx.strokeStyle = prevStroke;
    ctx.lineWidth = prevWidth;
    ctx.fillStyle = prevFill;
  }

  function draw(ctx, c, options = {}) {
    const r = c.recipe;
    const x = totals(r);
    const story = options.story === true;
    const h = story ? 1920 : 1080;
    const L = (a, b) => (options.lang === 'en' ? b : a);
    const pal = THEMES[options.theme] || THEMES.sumi;

    if (!Number.isFinite(r.dose) || r.dose <= 0 || !Number.isFinite(r.temp) || !Number.isFinite(c.seconds) || c.seconds < 0) {
      throw Error('Invalid brew parameters');
    }
    const clock = v => {
      const n = Math.floor(v);
      return String(Math.floor(n / 60)).padStart(2, '0') + ':' + String(n % 60).padStart(2, '0');
    };

    let fits = true;
    ctx.fillStyle = pal.bg;
    ctx.fillRect(0, 0, 1080, h);
    ctx.strokeStyle = pal.border;
    ctx.lineWidth = 1.5;
    ctx.strokeRect(36, 36, 1008, h - 72);
    ctx.textBaseline = 'top';
    ctx.textAlign = 'left';

    function put(value, xx, y, w, height, max, min, color) {
      ctx.fillStyle = color || pal.ink;
      const m = measureBlock(ctx, value, w, height, max, min);
      if (!m.fits) {
        fits = false;
        return 0;
      }
      ctx.font = m.size + 'px Iansui, serif';
      m.rows.forEach((v, i) => ctx.fillText(v, xx, y + i * m.lineHeight));
      return m.usedHeight;
    }

    function rule(y) {
      ctx.strokeStyle = pal.rule;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(64, y);
      ctx.lineTo(1016, y);
      ctx.stroke();
    }

    // Top Header: Emblem + 44px Brand
    drawBrandEmblem(ctx, 96, story ? 86 : 68, story ? 56 : 50, pal);
    ctx.fillStyle = pal.ink;
    ctx.font = '44px Iansui, serif';
    ctx.textAlign = 'right';
    ctx.fillText(L('一隅・咖啡角', 'Coffee Corner'), 984, story ? 92 : 76);
    ctx.textAlign = 'left';

    // Title (Bean name) & optional Roaster
    const beanTitle = r.bean || L('未指定咖啡豆', 'Coffee not specified');
    const titleY = story ? 190 : 150;
    const titleMaxH = story ? 180 : 76;
    const titleUsed = put(beanTitle, 96, titleY, 888, titleMaxH, story ? 66 : 54, story ? 38 : 28, pal.ink);
    let cursorY = titleY + (titleUsed || (story ? 84 : 66)) + (story ? 18 : 10);

    const roasterStr = String(r.roaster || '').trim();
    if (roasterStr) {
      const rUsed = put(roasterStr, 96, cursorY, 888, story ? 86 : 42, story ? 38 : 26, story ? 24 : 18, pal.ink2);
      cursorY += (rUsed || (story ? 44 : 30)) + (story ? 22 : 12);
    }

    // Bean Metadata 2-Column Grid (aligned with 32px minimum padding, expanding dynamically if multi-line)
    const beanFlavor = options.beanFlavor === undefined
      ? (typeof r.beanFlavor === 'string'
        ? r.beanFlavor
        : r.beanSnapshot && typeof r.beanSnapshot.beanFlavor === 'string'
          ? r.beanSnapshot.beanFlavor
          : '')
      : String(options.beanFlavor);

    const fields = [
      ['產地', 'Origin', r.origin],
      ['處理法', 'Process', r.process],
      ['焙度', 'Roast', ['未填', 'Not specified'].includes(r.roast) ? '' : r.roast],
      ['風味描述', 'Flavor description', beanFlavor]
    ].filter(a => String(a[2] || '').trim());

    const minTop = story ? 550 : 300;
    const gridTop = Math.max(minTop, cursorY + 4);
    const pad = 32;
    const baseRowH = story ? 240 : 144;
    const valOffset = story ? 96 : 76;
    const labelH = story ? 44 : 32;

    if (fields.length) {
      const rowCount = Math.ceil(fields.length / 2);
      const rowHeights = [];
      for (let rowIdx = 0; rowIdx < rowCount; rowIdx++) {
        let neededH = baseRowH;
        for (let colIdx = 0; colIdx < 2; colIdx++) {
          const idx = rowIdx * 2 + colIdx;
          if (idx >= fields.length) continue;
          const f = fields[idx];
          const w = colIdx === 1 ? 424 : 400;
          const m = measureBlock(ctx, f[2], w, story ? 210 : 112, story ? 36 : 26, story ? 22 : 18);
          if (m.fits) {
            const candidate = valOffset + Math.ceil(m.usedHeight) + pad;
            if (candidate > neededH) neededH = candidate;
          }
        }
        rowHeights.push(neededH);
      }

      const totalGridH = rowHeights.reduce((a, b) => a + b, 0);
      const gridBottom = gridTop + totalGridH;
      rule(gridTop);

      let yy = gridTop;
      for (let rowIdx = 0; rowIdx < rowCount; rowIdx++) {
        const rowH = rowHeights[rowIdx];
        for (let colIdx = 0; colIdx < 2; colIdx++) {
          const idx = rowIdx * 2 + colIdx;
          if (idx >= fields.length) continue;
          const f = fields[idx];
          const xx = colIdx === 1 ? 560 : 96;
          const w = colIdx === 1 ? 424 : 400;
          put(L(f[0], f[1]), xx, yy + pad, w, labelH, story ? 30 : 22, story ? 24 : 18, pal.ink2);
          put(f[2], xx, yy + valOffset, w, rowH - valOffset - pad, story ? 36 : 26, story ? 22 : 18, pal.ink);
        }
        yy += rowH;
        if (rowIdx < rowCount - 1) rule(yy);
      }
      rule(gridBottom);
      if (fields.length > 1) {
        ctx.strokeStyle = pal.rule;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(528, gridTop);
        ctx.lineTo(528, gridBottom);
        ctx.stroke();
      }
      cursorY = gridBottom + (story ? 38 : 22);
    } else {
      rule(gridTop);
      cursorY = gridTop + (story ? 36 : 22);
    }

    // Reserve footer space if equipment or date is included
    const grindText = r.grind
      ? L('刻度 ', 'Setting ') + r.grind + (r.grindUnit ? ' ' + r.grindUnit : '')
      : (r.grindGuide || r.grindGuideEn
        ? L('推薦研磨 ', 'Recommended ') + L(r.grindGuide || r.grindGuideEn, r.grindGuideEn || r.grindGuide)
        : '');
    const extra = [];
    if (options.gear) {
      const gearStr = [r.dripper, r.grinder, grindText].filter(Boolean).join(' · ');
      if (gearStr) extra.push(gearStr);
    }
    if (options.date) {
      const d = new Date(c.date);
      if (Number.isFinite(d.getTime())) extra.push(d.toLocaleDateString(options.lang === 'en' ? 'en' : 'zh-TW'));
    }

    const bottomEdge = h - (story ? 64 : 48);
    let footerReserve = 0;
    if (extra.length) {
      const extraText = extra.join(' · ');
      const fm = measureBlock(ctx, extraText, 888, story ? 96 : 64, story ? 26 : 20, story ? 18 : 14);
      footerReserve = fm.fits ? Math.max(story ? 52 : 34, Math.ceil(fm.usedHeight) + 12) : (story ? 96 : 64);
    }
    const contentBottomLimit = bottomEdge - footerReserve;

    // Recipe name + Parameters Card
    if (r.name) {
      const nameUsed = put(r.name, 96, cursorY, 888, story ? 60 : 38, story ? 36 : 26, story ? 24 : 18, pal.accent);
      cursorY += (nameUsed || (story ? 44 : 30)) + (story ? 18 : 10);
    }

    const parameters =
      r.dose + ' g ' + L('粉', 'coffee') + ' · ' + x.water + ' g ' + L('萃取水', 'brew water') + ' · ' + r.temp + '°C\n' +
      L('粉水比 1:', 'Brew ratio 1:') + (x.water / r.dose).toFixed(1) + ' · ' + L('實際計時 ', 'Actual time ') + clock(c.seconds);

    const paramUsed = put(parameters, 96, cursorY, 888, story ? 136 : 82, story ? 40 : 28, story ? 26 : 20, pal.ink);
    cursorY += (paramUsed || (story ? 96 : 66)) + (story ? 18 : 10);

    const additions = [
      [x.postCold, '後加冷水', 'Cold bypass'],
      [x.postRoom, '後加常溫水', 'Room-temperature bypass'],
      [x.postHot, '後加熱水', 'Hot bypass'],
      [x.postIce, '後加冰', 'Ice added']
    ]
      .filter(a => a[0] > 0)
      .map(a => L(a[1], a[2]) + ' ' + a[0] + ' g');

    if (additions.length) {
      const addUsed = put(additions.join(' · '), 96, cursorY, 888, story ? 84 : 42, story ? 32 : 24, story ? 22 : 16, pal.accent);
      cursorY += (addUsed || (story ? 40 : 28)) + (story ? 20 : 12);
    }

    // Flexible Tasting Notes section consuming available height down to footer
    const note = options.note === undefined ? String(c.taste || '') : String(options.note);
    if (note.trim()) {
      const ruleY = cursorY + 4;
      rule(ruleY);
      const labelY = ruleY + (story ? 24 : 16);
      const nLabelUsed = put(L('本杯風味筆記', 'This cup’s tasting notes'), 96, labelY, 888, story ? 42 : 34, story ? 28 : 22, story ? 22 : 18, pal.ink2);
      const noteBodyY = labelY + (nLabelUsed || (story ? 36 : 28)) + (story ? 14 : 8);
      const availNoteH = Math.max(story ? 44 : 28, contentBottomLimit - noteBodyY - (story ? 18 : 10));
      put(note.trim(), 96, noteBodyY, 888, availNoteH, story ? 34 : 26, story ? 20 : 15, pal.ink);
    }

    // Footer (Equipment & Date)
    if (extra.length) {
      const extraText = extra.join(' · ');
      const footerY = bottomEdge - footerReserve + 8;
      put(extraText, 96, footerY, 888, footerReserve, story ? 26 : 20, story ? 18 : 14, pal.ink2);
    }

    return { fits, width: 1080, height: h, totals: x };
  }

  return Object.freeze({ draw, totals, block, flavorSections: true, dualTheme: true, themes: Object.keys(THEMES) });
});
