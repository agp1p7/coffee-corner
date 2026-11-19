(function () {
  'use strict';

  const ROAST_LEVELS = ['未填', '淺焙', '中淺焙', '中焙', '中深焙', '深焙'];
  const FIELD_LIMITS = {
    bean: 120,
    roaster: 100,
    origin: 120,
    process: 80,
    beanFlavor: 300
  };

  function cleanStr(val, maxLen) {
    if (val === null || val === undefined) return '';
    return String(val)
      .replace(/[\r\n\t]+/g, ' ')
      .replace(/\s{2,}/g, ' ')
      .trim()
      .slice(0, maxLen);
  }

  function mapRoastLevel(raw) {
    const s = cleanStr(raw, 60);
    if (!s) return '未填';
    if (ROAST_LEVELS.includes(s)) return s;
    const low = s.toLowerCase();

    // Traditional / Simplified Chinese patterns
    if (/極淺|超淺|淺焙|輕焙|浅烘|浅焙/.test(s) && !/中/.test(s)) return '淺焙';
    if (/中淺|淺中|中浅|浅中/.test(s)) return '中淺焙';
    if (/中深|深中/.test(s)) return '中深焙';
    if (/極深|重焙|深焙|深烘/.test(s) && !/中/.test(s)) return '深焙';
    if (/中焙|中烘|中度/.test(s)) return '中焙';

    // English roast patterns (check Full City / Medium-Dark before City / Medium-Light)
    if (/(medium[\s\-/]*dark|dark[\s\-/]*medium|full\s*city|vienna)/i.test(low)) return '中深焙';
    if (/(medium[\s\-/]*light|light[\s\-/]*medium|\bcity\b(?!\s*\+))/i.test(low)) return '中淺焙';
    if (/(extra\s*light|very\s*light|nordic|cinnamon|filter\s*roast|\blight\b)/i.test(low)) return '淺焙';
    if (/(french|italian|espresso\s*dark|extra\s*dark|\bdark\b)/i.test(low)) return '深焙';
    if (/(omni|\bmedium\b|city\+|balanced)/i.test(low)) return '中焙';

    return '未填';
  }

  function isValidYmd(y, m, d) {
    if (!Number.isInteger(y) || !Number.isInteger(m) || !Number.isInteger(d)) return false;
    if (y < 2000 || y > 2100 || m < 1 || m > 12 || d < 1 || d > 31) return false;
    const dt = new Date(Date.UTC(y, m - 1, d));
    return dt.getUTCFullYear() === y && dt.getUTCMonth() === m - 1 && dt.getUTCDate() === d;
  }

  function pad2(n) {
    return String(n).padStart(2, '0');
  }

  function normalizeIsoDate(raw) {
    const s = cleanStr(raw, 40);
    if (!s) return '';

    // YYYY-MM-DD / YYYY/MM/DD / YYYY.MM.DD / YYYY年MM月DD日
    let m = s.match(/(20\d{2})\s*[-\/.年]\s*(\d{1,2})\s*[-\/.月]\s*(\d{1,2})\s*日?/);
    if (m) {
      const y = Number(m[1]), mo = Number(m[2]), d = Number(m[3]);
      return isValidYmd(y, mo, d) ? `${y}-${pad2(mo)}-${pad2(d)}` : '';
    }

    // Compact YYYYMMDD
    m = s.match(/\b(20\d{2})(\d{2})(\d{2})\b/);
    if (m) {
      const y = Number(m[1]), mo = Number(m[2]), d = Number(m[3]);
      return isValidYmd(y, mo, d) ? `${y}-${pad2(mo)}-${pad2(d)}` : '';
    }

    // YY/MM/DD or YY.MM.DD or YY-MM-DD (assume 20YY)
    m = s.match(/\b(\d{2})[-\/.](\d{1,2})[-\/.](\d{1,2})\b/);
    if (m) {
      const a = Number(m[1]), b = Number(m[2]), c = Number(m[3]);
      if (a >= 20 && a <= 40 && isValidYmd(2000 + a, b, c)) {
        return `20${pad2(a)}-${pad2(b)}-${pad2(c)}`;
      }
    }

    // MM/DD/YYYY or DD/MM/YYYY
    m = s.match(/\b(\d{1,2})[-\/.](\d{1,2})[-\/.](20\d{2})\b/);
    if (m) {
      const a = Number(m[1]), b = Number(m[2]), y = Number(m[3]);
      if (a > 12 && isValidYmd(y, b, a)) return `${y}-${pad2(b)}-${pad2(a)}`;
      if (isValidYmd(y, a, b)) return `${y}-${pad2(a)}-${pad2(b)}`;
    }

    return '';
  }

  function normalizeScannedBean(raw) {
    const src = raw && typeof raw === 'object' && !Array.isArray(raw) ? raw : {};
    const flavorRaw = src.beanFlavor !== undefined ? src.beanFlavor
      : src.flavor !== undefined ? src.flavor
      : src.tastingNotes !== undefined ? src.tastingNotes
      : src.notes !== undefined ? src.notes : '';

    return {
      bean: cleanStr(src.bean ?? src.name ?? src.coffeeName, FIELD_LIMITS.bean),
      roaster: cleanStr(src.roaster ?? src.brand, FIELD_LIMITS.roaster),
      origin: cleanStr(src.origin ?? src.region ?? src.farm, FIELD_LIMITS.origin),
      process: cleanStr(src.process ?? src.processing, FIELD_LIMITS.process),
      roast: mapRoastLevel(src.roast ?? src.roastLevel),
      roastDate: normalizeIsoDate(src.roastDate ?? src.roastedOn ?? src.date),
      beanFlavor: cleanStr(flavorRaw, FIELD_LIMITS.beanFlavor)
    };
  }

  function parseScannerJson(text) {
    const raw = String(text || '').trim();
    if (!raw) throw new Error('EMPTY_AI_RESPONSE');
    const stripped = raw
      .replace(/^```(?:json)?\s*/i, '')
      .replace(/\s*```$/i, '')
      .trim();
    let parsed;
    try {
      parsed = JSON.parse(stripped);
    } catch (e) {
      const match = stripped.match(/\{[\s\S]*\}/);
      if (!match) throw new Error('INVALID_AI_JSON');
      parsed = JSON.parse(match[0]);
    }
    return normalizeScannedBean(parsed);
  }

  function buildScanPrompt(lang) {
    const preferEn = lang === 'en';
    return [
      'You are a specialty coffee bean bag label reader.',
      'Extract coffee bean information visible on this coffee bag image into JSON.',
      preferEn
        ? 'Keep text concise and natural in English (or preserve original proper nouns).'
        : '請使用繁體中文整理欄位（專有名詞、莊園名或烘豆商名稱可保留原文或常見中譯）。',
      'Rules:',
      '- bean: Concise coffee name (e.g., Ethiopia Yirgacheffe Worka Sakaro / 衣索比亞 耶加雪菲 沃卡). Include variety if prominent.',
      '- roaster: Coffee roaster / brand name.',
      '- origin: Country, region, washing station, or farm.',
      '- process: Processing method (e.g., 水洗 / 日曬 / 蜜處理 / 厭氧日曬 or Washed / Natural / Honey).',
      '- roast: MUST be exactly one of: "未填", "淺焙", "中淺焙", "中焙", "中深焙", "深焙". If unclear, return "未填".',
      '- roastDate: Roasted date in strict YYYY-MM-DD format if clearly printed or stamped (ignore best-before/expiry dates unless clearly labeled as roast date). If not visible, return "".',
      '- beanFlavor: Tasting notes / flavor descriptors separated by "、" (or ", " in English), e.g., "白花、水蜜桃、柑橘、紅茶尾韻".',
      '- NEVER fabricate information that is not visible on the bag. Return "" (or "未填" for roast) for any unreadable or absent field.'
    ].join('\n');
  }

  function classifyScanError(err) {
    const rawMsg = String((err && (err.message || err.code)) || err || '');
    const code = String((err && err.code) || '');
    const low = (rawMsg + ' ' + code).toLowerCase();

    if (code === 'NOT_SIGNED_IN' || low.includes('not_signed_in')) {
      return {
        code: 'NOT_SIGNED_IN',
        zh: '請先登入 Google 帳號才能使用拍豆袋辨識（保護免費額度）。',
        en: 'Please sign in with Google first to use AI bag scanning.'
      };
    }
    if (code === 'COOLDOWN' || low.includes('cooldown')) {
      return {
        code: 'COOLDOWN',
        zh: '操作太頻繁，請稍等幾秒再掃描下一張。',
        en: 'Please wait a few seconds before scanning another photo.'
      };
    }
    if (code === 'IMAGE_INVALID' || low.includes('image_invalid')) {
      return {
        code: 'IMAGE_INVALID',
        zh: '請選擇有效的圖片檔（JPG／PNG／WEBP，20 MB 以內）。',
        en: 'Please select a valid image file (JPG/PNG/WEBP, under 20 MB).'
      };
    }
    if (low.includes('429') || low.includes('resource_exhausted') || low.includes('quota') || low.includes('rate limit')) {
      return {
        code: 'QUOTA_EXCEEDED',
        zh: '今日免費 AI 辨識額度已達上限，請稍後再試或先手動填寫。',
        en: 'Daily free AI quota reached. Please try again later or fill manually.'
      };
    }
    if (low.includes('app-check') || low.includes('appcheck') || low.includes('attestation') || low.includes('recaptcha')) {
      return {
        code: 'APP_CHECK_FAILED',
        zh: 'App Check 驗證未通過，請重新整理網頁或確認網域設定。',
        en: 'App Check verification failed. Reload the page and try again.'
      };
    }
    if (
      low.includes('firebase-ai') ||
      low.includes('api-not-enabled') ||
      low.includes('service_disabled') ||
      low.includes('permission_denied') ||
      low.includes('403') ||
      low.includes('not enabled') ||
      low.includes('has not been used in project')
    ) {
      return {
        code: 'API_DISABLED',
        zh: '尚未在 Firebase Console 開啟「AI Logic（Gemini Developer API）」。開啟免費方案後即可使用！',
        en: 'Firebase AI Logic (Gemini Developer API) is not enabled in Firebase Console yet.'
      };
    }
    if (low.includes('404') || low.includes('no longer available') || low.includes('not found for api version')) {
      return {
        code: 'MODEL_UNAVAILABLE',
        zh: 'AI 辨識模型目前暫時無法使用，請稍後再試或聯絡更新。',
        en: 'AI model is temporarily unavailable. Please try again later.'
      };
    }
    if (low.includes('network') || low.includes('failed to fetch') || low.includes('offline')) {
      return {
        code: 'OFFLINE',
        zh: '網路連線異常，請確認連線後再試。',
        en: 'Network error. Please check your connection and try again.'
      };
    }
    return {
      code: 'UNKNOWN',
      zh: '無法辨識豆袋內容，請換光線較亮、標籤清晰的照片再試，或手動填寫。',
      en: 'Could not read the coffee bag. Try a clearer, well-lit photo or enter manually.'
    };
  }

  const api = {
    ROAST_LEVELS,
    FIELD_LIMITS,
    mapRoastLevel,
    normalizeIsoDate,
    normalizeScannedBean,
    parseScannerJson,
    buildScanPrompt,
    classifyScanError
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
  if (typeof window !== 'undefined') {
    window.CoffeeBeanScannerUtils = api;
  }
})();
