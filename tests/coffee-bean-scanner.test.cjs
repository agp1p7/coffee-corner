const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const scanner = require('../coffee-bean-scanner.js');

test('mapRoastLevel maps Chinese and English roast levels into allowed options', () => {
  assert.equal(scanner.mapRoastLevel('淺焙'), '淺焙');
  assert.equal(scanner.mapRoastLevel('極淺焙'), '淺焙');
  assert.equal(scanner.mapRoastLevel('Filter Roast / Light'), '淺焙');
  assert.equal(scanner.mapRoastLevel('淺中焙'), '中淺焙');
  assert.equal(scanner.mapRoastLevel('Light-Medium'), '中淺焙');
  assert.equal(scanner.mapRoastLevel('City'), '中淺焙');
  assert.equal(scanner.mapRoastLevel('Medium'), '中焙');
  assert.equal(scanner.mapRoastLevel('Omni Roast'), '中焙');
  assert.equal(scanner.mapRoastLevel('Full City'), '中深焙');
  assert.equal(scanner.mapRoastLevel('中深烘'), '中深焙');
  assert.equal(scanner.mapRoastLevel('French Dark'), '深焙');
  assert.equal(scanner.mapRoastLevel(''), '未填');
  assert.equal(scanner.mapRoastLevel('unknown label'), '未填');
});

test('normalizeIsoDate parses common coffee bag date formats and rejects invalid dates', () => {
  assert.equal(scanner.normalizeIsoDate('2026-11-05'), '2026-11-05');
  assert.equal(scanner.normalizeIsoDate('2026/11/5'), '2026-11-05');
  assert.equal(scanner.normalizeIsoDate('2026.03.09'), '2026-03-09');
  assert.equal(scanner.normalizeIsoDate('2026年4月18日'), '2026-04-18');
  assert.equal(scanner.normalizeIsoDate('20261119'), '2026-11-19');
  assert.equal(scanner.normalizeIsoDate('26.11.08'), '2026-11-08');
  assert.equal(scanner.normalizeIsoDate('11/05/2026'), '2026-11-05');
  assert.equal(scanner.normalizeIsoDate('25/11/2026'), '2026-11-25');
  assert.equal(scanner.normalizeIsoDate('2026-02-30'), '');
  assert.equal(scanner.normalizeIsoDate('not a date'), '');
  assert.equal(scanner.normalizeIsoDate(''), '');
});

test('parseScannerJson strips markdown fences, normalizes fields, and enforces caps', () => {
  const sample = '```json\n' + JSON.stringify({
    bean: '  衣索比亞 耶加雪菲\n沃卡  ',
    roaster: 'Simple Kaffa',
    origin: 'Ethiopia Yirgacheffe Worka',
    process: 'Washed 水洗',
    roast: 'Light-Medium',
    roastDate: '2026/11/12',
    beanFlavor: '白花、水蜜桃、檸檬紅茶'
  }) + '\n```';

  const res = scanner.parseScannerJson(sample);
  assert.deepEqual(res, {
    bean: '衣索比亞 耶加雪菲 沃卡',
    roaster: 'Simple Kaffa',
    origin: 'Ethiopia Yirgacheffe Worka',
    process: 'Washed 水洗',
    roast: '中淺焙',
    roastDate: '2026-11-12',
    beanFlavor: '白花、水蜜桃、檸檬紅茶'
  });

  const longRes = scanner.normalizeScannedBean({
    bean: 'A'.repeat(200),
    beanFlavor: 'F'.repeat(500)
  });
  assert.equal(longRes.bean.length, scanner.FIELD_LIMITS.bean);
  assert.equal(longRes.beanFlavor.length, scanner.FIELD_LIMITS.beanFlavor);
  assert.equal(longRes.roast, '未填');
  assert.equal(longRes.roastDate, '');
});

test('classifyScanError returns user-friendly zh/en messages for key failure modes', () => {
  assert.equal(scanner.classifyScanError({ code: 'NOT_SIGNED_IN' }).code, 'NOT_SIGNED_IN');
  assert.equal(scanner.classifyScanError({ code: 'COOLDOWN' }).code, 'COOLDOWN');
  assert.equal(scanner.classifyScanError({ code: 'IMAGE_INVALID' }).code, 'IMAGE_INVALID');
  assert.equal(scanner.classifyScanError(new Error('429 RESOURCE_EXHAUSTED')).code, 'QUOTA_EXCEEDED');
  assert.equal(scanner.classifyScanError(new Error('403 Firebase AI Logic API has not been used in project')).code, 'API_DISABLED');
  assert.equal(scanner.classifyScanError(new Error('App-Check token invalid')).code, 'APP_CHECK_FAILED');
  assert.equal(scanner.classifyScanError(new Error('TypeError: Failed to fetch')).code, 'OFFLINE');
  assert.equal(scanner.classifyScanError(new Error('something unexpected')).code, 'UNKNOWN');
});

test('index.html loads coffee-bean-scanner.js before coffee-workspace.js', () => {
  const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
  const scanIdx = html.indexOf('./coffee-bean-scanner.js');
  const wsIdx = html.indexOf('./coffee-workspace.js');
  assert.ok(scanIdx > 0, 'index.html should include coffee-bean-scanner.js');
  assert.ok(wsIdx > scanIdx, 'coffee-bean-scanner.js should load before coffee-workspace.js');
});
