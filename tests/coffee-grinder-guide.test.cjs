'use strict';
const assert = require('node:assert/strict');
const GrinderGuide = require('../coffee-grinder-guide.js');
const Champs = require('../coffee-champion-recipes.js');

let passed = 0;
function test(name, fn) {
  fn();
  passed++;
  console.log('PASS ' + name);
}

test('includes 13 mainstream grinders with monotonic anchor curves', () => {
  assert.equal(GrinderGuide.GRINDERS.length, 13);
  assert.equal(new Set(GrinderGuide.GRINDERS.map(g => g.id)).size, 13);
  assert.ok(GrinderGuide.GRINDERS.some(g => g.id === '1zpresso-x-ultra'));
  for (const g of GrinderGuide.GRINDERS) {
    assert.equal(g.anchors.length, GrinderGuide.MICRON_ANCHORS.length, g.id);
    for (let i = 1; i < g.anchors.length; i++) {
      assert.ok(g.anchors[i] > g.anchors[i - 1], `monotonic anchors for ${g.id}`);
    }
  }
});

test('converts micron ranges cleanly across all 13 grinders', () => {
  for (const g of GrinderGuide.GRINDERS) {
    const pourOver = GrinderGuide.convertMicronsToDial(g.id, 700, 820, 'zh-Hant');
    assert.ok(pourOver.rangeText.length > 0, g.id);
    assert.ok(!/undefined|NaN/.test(pourOver.rangeText), g.id + ': ' + pourOver.rangeText);
    const aero = GrinderGuide.convertMicronsToDial(g.id, 550, 680, 'en');
    assert.ok(aero.rangeText.length > 0, g.id);
    assert.ok(!/undefined|NaN/.test(aero.rangeText), g.id + ': ' + aero.rangeText);
  }
});

test('matches user equipment names accurately including C5 ESP vs C5 Pro and X-Ultra', () => {
  assert.equal(GrinderGuide.matchGrinderByName('Timemore C5 Pro'), 'timemore-c5-pro');
  assert.equal(GrinderGuide.matchGrinderByName('泰摩 C5 ESP Pro'), 'timemore-c5-esp-pro');
  assert.equal(GrinderGuide.matchGrinderByName('1Zpresso X-Ultra'), '1zpresso-x-ultra');
  assert.equal(GrinderGuide.matchGrinderByName('1Z K-Ultra'), '1zpresso-k-ultra');
  assert.equal(GrinderGuide.matchGrinderByName('ZP6 Special'), '1zpresso-zp6');
  assert.equal(GrinderGuide.matchGrinderByName('Q Air'), '1zpresso-q-air');
  assert.equal(GrinderGuide.matchGrinderByName('KINGrinder K6'), 'kingrinder-k6');
  assert.equal(GrinderGuide.matchGrinderByName('Fellow Ode Gen 2'), 'fellow-ode-gen2');
  assert.equal(GrinderGuide.matchGrinderByName('Baratza Encore ESP'), 'baratza-encore-esp');
  assert.equal(GrinderGuide.matchGrinderByName('小飛馬 600N'), 'feima-600n');
  assert.equal(GrinderGuide.matchGrinderByName('Niche Zero'), 'niche-zero');
  assert.equal(GrinderGuide.matchGrinderByName('Comandante C40'), 'comandante-c40');
  assert.equal(GrinderGuide.matchGrinderByName('Timemore C3 Pro'), 'timemore-c3');
});

test('formats X-Ultra rot.num.click notation and standard bilingual guide text', () => {
  const xUltra = GrinderGuide.convertMicronsToDial('1zpresso-x-ultra', 700, 820, 'zh-Hant');
  assert.match(xUltra.rangeText, /^\d+\.\d+\.\d+–\d+\.\d+\.\d+$/);

  const tpl = Champs.CHAMPIONS.find(c => c.id === 'chad-wang-2017');
  const zh = GrinderGuide.formatGrindGuide(tpl, { lang: 'zh-Hant', grinderId: '1zpresso-x-ultra' });
  const en = GrinderGuide.formatGrindGuide(tpl, { lang: 'en', grinderId: '1zpresso-x-ultra' });
  assert.ok(zh.includes('1Zpresso X-Ultra') && zh.includes('μm') && zh.includes('鎖死歸零'), zh);
  assert.ok(en.includes('1Zpresso X-Ultra') && en.includes('μm') && en.includes('rot.num.click'), en);
});

test('infers micron ranges from C5 Pro notes or method fallbacks', () => {
  const fromNotes = GrinderGuide.inferMicronRange({
    method: '手沖',
    notes: '【推薦研磨】中細至中研磨（C5 Pro 刻度 13–14.2）。'
  });
  assert.ok(fromNotes.minUm >= 700 && fromNotes.maxUm <= 860, JSON.stringify(fromNotes));

  const fallbackAero = GrinderGuide.inferMicronRange({ method: '愛樂壓' });
  assert.equal(fallbackAero.minUm, 550);
  assert.equal(fallbackAero.maxUm, 680);
});

test('all 43 champion recipes convert cleanly across all 13 grinders', () => {
  for (const tpl of Champs.CHAMPIONS) {
    for (const g of GrinderGuide.GRINDERS) {
      const text = GrinderGuide.formatGrindGuide(tpl, { lang: 'zh-Hant', grinderId: g.id });
      assert.ok(text.includes(g.name) && text.includes('μm'), `${tpl.id} / ${g.id}: ${text}`);
    }
  }
});

test('does not duplicate grinder label when recipe.grindGuide already contains formatted text', () => {
  const rec = {
    method: '手沖',
    grindGuide: '中粗研磨 · 小飛馬 600N / 楊家 600N 刻度 4.5–5（約 800–930 μm · 刀盤輕觸歸0 · 1–8刻度）',
    grindMinUm: 800,
    grindMaxUm: 930
  };
  const out = GrinderGuide.formatGrindGuide(rec, { lang: 'zh-Hant', grinderId: 'feima-600n' });
  const matches = out.match(/小飛馬 600N/g) || [];
  assert.equal(matches.length, 1, 'expected single grinder name occurrence: ' + out);
});

console.log(JSON.stringify({ passed, failed: 0 }));
