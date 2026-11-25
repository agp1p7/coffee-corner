'use strict';
const assert = require('node:assert/strict');
const CoffeeSteps = require('../coffee-step-model.js');
const Champs = require('../coffee-champion-recipes.js');

let passed = 0;
function test(name, fn) {
  fn();
  passed++;
  console.log('PASS ' + name);
}

const METHODS = new Set(['手沖', '愛樂壓', '浸泡式', '越南滴濾壺', '其他']);
const SHAPES = new Set(['錐形', '平底', '梯形', '浸泡／閥門式', '其他／不適用']);
const MATERIALS = new Set(['樹脂／塑膠', '陶瓷', '玻璃', '金屬', '其他／未填']);
const ROASTS = new Set(['未填', '淺焙', '中淺焙', '中焙', '中深焙', '深焙']);

function assertValidRecipe(r) {
  assert.equal(typeof r.id, 'string');
  assert.ok(r.id.length > 0);
  assert.ok(r.name.trim().length > 0 && r.name.length <= 300);
  assert.ok(METHODS.has(r.method), 'valid method: ' + r.method);
  assert.ok(SHAPES.has(r.shape), 'valid shape: ' + r.shape);
  assert.ok(MATERIALS.has(r.material), 'valid material: ' + r.material);
  assert.ok(ROASTS.has(r.roast), 'valid roast: ' + r.roast);
  assert.equal(r.grind, '', 'grind should remain empty string for numeric input safety');
  assert.ok(r.dose > 0 && r.dose <= 200);
  assert.ok(r.temp >= 0 && r.temp <= 100);
  assert.equal(r.cold, 0);
  assert.equal(r.ice, 0);
  CoffeeSteps.validateSteps(r);
  const sum = CoffeeSteps.summary(r);
  assert.ok(sum.water > 0 && sum.water <= 10000);
}

test('includes 43 curated master & champion recipes', () => {
  assert.equal(Champs.CHAMPIONS.length, 43);
  assert.equal(new Set(Champs.CHAMPIONS.map(c => c.id)).size, 43);
  const aeroCount = Champs.CHAMPIONS.filter(c => c.method === '愛樂壓').length;
  const pourCount = Champs.CHAMPIONS.filter(c => c.method === '手沖' || c.method === '浸泡式').length;
  assert.ok(aeroCount >= 12, 'expected >= 12 AeroPress recipes, got ' + aeroCount);
  assert.ok(pourCount >= 30, 'expected >= 30 pour-over/hybrid recipes, got ' + pourCount);
});

test('all 43 built recipes pass strict schema and CoffeeSteps validation', () => {
  for (const tpl of Champs.CHAMPIONS) {
    assert.ok(typeof tpl.grindGuide === 'string' && tpl.grindGuide.includes('C5 Pro') && !/C40/i.test(tpl.grindGuide), 'C5 Pro grindGuide present: ' + tpl.id);
    assert.ok(typeof tpl.grindGuideEn === 'string' && tpl.grindGuideEn.includes('C5 Pro') && !/C40/i.test(tpl.grindGuideEn), 'C5 Pro grindGuideEn present: ' + tpl.id);
    assert.ok(Number.isFinite(tpl.grindMinUm) && Number.isFinite(tpl.grindMaxUm) && tpl.grindMinUm > 200 && tpl.grindMaxUm >= tpl.grindMinUm, 'valid micron range: ' + tpl.id);
    assert.ok(/研磨/.test(tpl.notes) && !/C40/i.test(tpl.notes), 'notes include C5 Pro grind guidance: ' + tpl.id);
    for (const lang of ['zh-Hant', 'en']) {
      const r = Champs.buildRecipeFromTemplate(tpl, { lang });
      assertValidRecipe(r);
      assert.equal(r.grindGuide, tpl.grindGuide);
      assert.equal(r.grindGuideEn, tpl.grindGuideEn);
    }
  }
});

test('all 9 Tetsu 4:6 taste & strength combinations pass validation and preserve 40/60 split', () => {
  const tetsu = Champs.CHAMPIONS.find(c => c.id === 'tetsu-46');
  assert.ok(tetsu);
  for (const dose of [15, 20, 25]) {
    for (const tasteMode of ['balance', 'sweet', 'bright']) {
      for (const strengthMode of ['light', 'standard', 'strong']) {
        const r = Champs.buildRecipeFromTemplate(tetsu, { targetDose: dose, tasteMode, strengthMode });
        assertValidRecipe(r);
        const sum = CoffeeSteps.summary(r);
        const expectedWater = Math.round(tetsu.baseTotalWater * (dose / tetsu.dose) * 10) / 10;
        assert.ok(Math.abs(sum.water - expectedWater) <= 0.2, `Expected ~${expectedWater}, got ${sum.water}`);
      }
    }
  }
});

test('all 43 recipes pass dose scaling for 12g, 15g, 18g, 20g, 25g', () => {
  for (const tpl of Champs.CHAMPIONS) {
    for (const targetDose of [12, 15, 18, 20, 25]) {
      const r = Champs.buildRecipeFromTemplate(tpl, { targetDose });
      assertValidRecipe(r);
      assert.equal(r.dose, targetDose);
    }
  }
});

test('scaleGramText scales gram amounts while preserving flow rate, temperature, ratios, and grind dial', () => {
  const input = '20g 粉對 300g 水（1:15）；約 6–7g/s、60/60/50/100g，range 60–70g，93°C，C5 Pro 刻度 13.5–15，15.5 g 參考';
  const out = Champs.scaleGramText(input, 0.75);
  assert.ok(out.includes('15g 粉對 225g 水（1:15）'), out);
  assert.ok(out.includes('6–7g/s'), out);
  assert.ok(out.includes('45/45/37.5/75g'), out);
  assert.ok(out.includes('45–52.5g'), out);
  assert.ok(out.includes('93°C'), out);
  assert.ok(out.includes('C5 Pro 刻度 13.5–15'), out);
  assert.ok(out.includes('11.6 g'), out);
});

test('buildRecipeFromTemplate scales step notes and recipe notes on dose change', () => {
  const matt = Champs.CHAMPIONS.find(c => c.id === 'matt-winton-2021');
  const mattScaled = Champs.buildRecipeFromTemplate(matt, { targetDose: 15 });
  assert.equal(mattScaled.dose, 15);
  assert.ok(mattScaled.steps[0].note.includes('45g') && !mattScaled.steps[0].note.includes('60g'), mattScaled.steps[0].note);
  assert.ok(mattScaled.steps[1].note.includes('90g') && !mattScaled.steps[1].note.includes('120g'), mattScaled.steps[1].note);
  assert.ok(mattScaled.notes.includes('15g') && mattScaled.notes.includes('225g') && mattScaled.notes.includes('93°C') && mattScaled.notes.includes('88°C'), mattScaled.notes);

  const devil = Champs.CHAMPIONS.find(c => c.id === 'tetsu-devil');
  assert.ok(devil);
  const devilScaled = Champs.buildRecipeFromTemplate(devil, { targetDose: 15 });
  assert.equal(devilScaled.dose, 15);
  assert.ok(devilScaled.steps[0].note.includes('45g'), devilScaled.steps[0].note);
  assert.ok(devilScaled.steps[3].note.includes('120g') && devilScaled.steps[3].note.includes('210g'), devilScaled.steps[3].note);
  assert.ok(devilScaled.notes.includes('90g') && devilScaled.notes.includes('210g') && devilScaled.notes.includes('90°C') && devilScaled.notes.includes('70°C'), devilScaled.notes);
});

console.log(JSON.stringify({ passed, failed: 0 }));
