// coffee-cloud-sync.js
// 跨裝置雲端同步模組（一隅・咖啡角 v2）
// 特色：Local-First、首登防護性本機備份、內容雜湊 + updatedAt 衝突比對、軟刪除墓碑（不復活已刪資料）、大批量分批上傳

const FIREBASE_SDK_VER = '11.10.0';
import { initializeApp } from 'https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js';
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged
} from 'https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js';
import {
  getFirestore,
  doc,
  collection,
  getDoc,
  getDocs,
  setDoc,
  writeBatch
} from 'https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js';

const firebaseConfig = {
  apiKey: "AIzaSyCYZKHQrqLGExQGDUf8d3pknW46TeGNGOY",
  authDomain: "coffee-corner-96380.firebaseapp.com",
  projectId: "coffee-corner-96380",
  storageBucket: "coffee-corner-96380.firebasestorage.app",
  messagingSenderId: "135285994980",
  appId: "1:135285994980:web:a0026e7821dd71292b83f1",
  measurementId: "G-GV6G9BV1MD"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const dbStore = getFirestore(app);
const provider = new GoogleAuthProvider();

const STORAGE_KEY = 'yiyu-coffee-v2';
const SYNC_META_PREFIX = 'yiyu-coffee-sync-meta-v1:';
const LAST_UID_KEY = 'yiyu-coffee-sync-last-uid';
const TOMBSTONE_TTL_MS = 90 * 24 * 60 * 60 * 1000;
const MAX_BATCH_OPS = 350;

const isEn = () => document.documentElement.lang === 'en';
const L = (zh, en) => (isEn() ? en : zh);

let isApplyingCloudSync = false;
let isSyncInProgress = false;
let pendingSyncAfterFinish = false;
let syncTimer = null;
let inWindowSave = false;
let lastStateInfo = { state: 'idle', email: '', timeStr: '', detail: '' };

// -------------------------------------------------------------------------
// 1. 時間戳記、穩定序列化、內容雜湊與文件 ID 安全處理
// -------------------------------------------------------------------------
function toEpochMs(val) {
  if (typeof val === 'number' && Number.isFinite(val)) return val;
  if (typeof val === 'string' && val.trim()) {
    const parsed = Date.parse(val);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  if (val && typeof val.toMillis === 'function') {
    try { return val.toMillis(); } catch (e) { return 0; }
  }
  if (val && typeof val.seconds === 'number') {
    return val.seconds * 1000;
  }
  return 0;
}

const VOLATILE_KEYS = new Set([
  'updatedAt', 'deletedAt', '_syncHash', 'guideCursor', 'guideEvents', 'guideMode'
]);

function stableSerialize(val) {
  if (val === null || val === undefined) return 'null';
  if (typeof val !== 'object') return JSON.stringify(val);
  if (Array.isArray(val)) return '[' + val.map(stableSerialize).join(',') + ']';
  const keys = Object.keys(val).filter(k => !VOLATILE_KEYS.has(k)).sort();
  return '{' + keys.map(k => JSON.stringify(k) + ':' + stableSerialize(val[k])).join(',') + '}';
}

function hashItem(item) {
  const str = stableSerialize(item);
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(16).padStart(8, '0');
}

function getItemId(colName, item) {
  if (!item || typeof item !== 'object') return '';
  if (item.id && typeof item.id === 'string') return item.id;
  if (colName === 'beans') {
    const name = item.bean || item.name || '';
    if (!name) return '';
    return `${name}_${item.roastDate || ''}`;
  }
  return '';
}

function safeDocId(rawId) {
  const encoded = encodeURIComponent(String(rawId || ''))
    .replace(/\./g, '%2E');
  if (!encoded || encoded === '.' || encoded === '..') return 'item_' + hashItem({ rawId });
  if (encoded.startsWith('__') && encoded.endsWith('__')) return 'u_' + encoded;
  return encoded;
}

function cleanItemForLocal(colName, docData) {
  if (!docData || typeof docData !== 'object') return null;
  const copy = JSON.parse(JSON.stringify(docData));
  delete copy.deletedAt;
  delete copy._syncHash;
  // 僅保留非數字 sync-stamp 的杯測 ISO updatedAt（或統一不汙染其他資料結構）
  if (colName !== 'cups' || typeof copy.updatedAt === 'number') {
    delete copy.updatedAt;
  }
  if (colName === 'equipment') {
    const type = copy.type === 'grinder' ? 'grinder' : 'dripper';
    copy.type = type;
    copy.id = typeof copy.id === 'string' && copy.id.trim() ? copy.id.trim().slice(0, 159) : 'eq_' + hashItem(copy);
    copy.name = String(copy.name ?? '').trim().slice(0, 160);
    copy.brand = String(copy.brand ?? '').trim().slice(0, 160);
    copy.model = String(copy.model ?? '').trim().slice(0, 160);
    copy.shape = type === 'dripper' ? String(copy.shape ?? '其他／不適用').trim().slice(0, 160) || '其他／不適用' : '';
    copy.material = type === 'dripper' ? String(copy.material ?? '其他／未填').trim().slice(0, 160) || '其他／未填' : '';
    copy.unit = type === 'grinder' ? String(copy.unit ?? '').trim().slice(0, 160) : '';
    copy.active = typeof copy.active === 'boolean' ? copy.active : true;
    if (copy.review !== undefined && typeof copy.review !== 'boolean') delete copy.review;
  } else if (colName === 'beans') {
    copy.id = typeof copy.id === 'string' && copy.id.trim() ? copy.id.trim().slice(0, 159) : 'bean_' + hashItem(copy);
    copy.active = typeof copy.active === 'boolean' ? copy.active : true;
    for (const k of ['bean', 'roaster', 'origin', 'process', 'roast', 'roastDate', 'openDate']) {
      copy[k] = String(copy[k] ?? '').trim().slice(0, 5000);
    }
    if (copy.beanFlavor !== undefined && copy.beanFlavor !== null) {
      copy.beanFlavor = String(copy.beanFlavor).trim().slice(0, 3000);
    } else {
      delete copy.beanFlavor;
    }
  }
  return copy;
}

function prepareCloudPayload(colName, id, item, updatedAtMs, deletedAtMs = 0) {
  if (deletedAtMs > 0) {
    return {
      id,
      deletedAt: deletedAtMs,
      updatedAt: updatedAtMs || deletedAtMs
    };
  }
  const payload = JSON.parse(JSON.stringify(item));
  delete payload.deletedAt;
  delete payload._syncHash;
  if (!payload.id) payload.id = id;
  payload.updatedAt = updatedAtMs;
  return payload;
}

// -------------------------------------------------------------------------
// 2. 本機 DB 與 Sync Meta 讀寫
// -------------------------------------------------------------------------
function getActiveMetaUid() {
  return (auth.currentUser && auth.currentUser.uid) ||
    localStorage.getItem(LAST_UID_KEY) ||
    '_pending';
}

function loadSyncMeta(uid) {
  try {
    const raw = localStorage.getItem(SYNC_META_PREFIX + uid);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        lastSyncedAt: Number(parsed.lastSyncedAt) || 0,
        items: parsed.items && typeof parsed.items === 'object' ? parsed.items : {},
        tombstones: parsed.tombstones && typeof parsed.tombstones === 'object' ? parsed.tombstones : {}
      };
    }
  } catch (e) {
    console.warn('[Sync] 讀取同步中繼資料失敗', e);
  }
  return { lastSyncedAt: 0, items: {}, tombstones: {} };
}

function saveSyncMeta(uid, meta) {
  try {
    localStorage.setItem(SYNC_META_PREFIX + uid, JSON.stringify(meta));
  } catch (e) {
    console.warn('[Sync] 寫入同步中繼資料失敗', e);
  }
}

function getLocalDB() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY) || localStorage.getItem('yiyu-coffee-v1');
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.warn('[Sync] 讀取本機資料庫失敗', e);
  }
  return typeof db !== 'undefined' ? db : { version: 2, recipes: [], cups: [] };
}

function getCollectionArray(sourceDb, colName) {
  if (!sourceDb || typeof sourceDb !== 'object') return [];
  if (colName === 'recipes') return Array.isArray(sourceDb.recipes) ? sourceDb.recipes : [];
  if (colName === 'cups') return Array.isArray(sourceDb.cups) ? sourceDb.cups : [];
  if (colName === 'beans') return (sourceDb.beanCatalog && Array.isArray(sourceDb.beanCatalog.items)) ? sourceDb.beanCatalog.items : [];
  if (colName === 'equipment') return (sourceDb.equipment && Array.isArray(sourceDb.equipment.items)) ? sourceDb.equipment.items : [];
  return [];
}

// 偵測本機與已知基準之間的新增、修改與刪除，維護 tombstones
function reconcileLocalDiff(localDb, meta, now, markNewItemsAsNow = false) {
  const cols = ['recipes', 'cups', 'beans', 'equipment'];
  const currentKeys = new Set();

  for (const col of cols) {
    const arr = getCollectionArray(localDb, col);
    for (const item of arr) {
      const id = getItemId(col, item);
      if (!id) continue;
      const mKey = `${col}:${id}`;
      currentKeys.add(mKey);
      const h = hashItem(item);
      const known = meta.items[mKey];
      const explicitTs = toEpochMs(item.updatedAt);

      if (!known) {
        const ts = (markNewItemsAsNow || meta.lastSyncedAt > 0)
          ? Math.max(explicitTs, now)
          : explicitTs;
        meta.items[mKey] = { hash: h, updatedAt: ts };
        // 若使用者以同 ID 重建曾經刪除的項目，清除舊墓碑
        if (meta.tombstones[mKey] && ts > meta.tombstones[mKey]) {
          delete meta.tombstones[mKey];
        }
      } else {
        if (known.hash !== h) {
          known.hash = h;
          known.updatedAt = Math.max(Number(known.updatedAt) || 0, explicitTs, now);
          delete meta.tombstones[mKey];
        } else if (explicitTs > (Number(known.updatedAt) || 0)) {
          known.updatedAt = explicitTs;
        }
      }
    }
  }

  // 曾存在於 meta.items 但本機清單已移除者 -> 標記軟刪除墓碑
  for (const mKey of Object.keys(meta.items)) {
    if (!currentKeys.has(mKey)) {
      delete meta.items[mKey];
      meta.tombstones[mKey] = Math.max(Number(meta.tombstones[mKey]) || 0, now);
    }
  }

  // 清理過期墓碑
  for (const [mKey, delTs] of Object.entries(meta.tombstones)) {
    if (now - Number(delTs) > TOMBSTONE_TTL_MS) {
      delete meta.tombstones[mKey];
    }
  }
}

function applyDbToMemoryAndUI(updatedDb, writeToStorage = true) {
  let finalDb = updatedDb;
  if (typeof migrate === 'function') {
    try {
      finalDb = migrate(updatedDb);
    } catch (err) {
      console.error('[Sync] 合併結果未通過核心格式驗證，中止寫入以保護資料:', err);
      return false;
    }
  }

  isApplyingCloudSync = true;
  try {
    if (writeToStorage) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(finalDb));
    }
    if (typeof db !== 'undefined' && db && typeof db === 'object') {
      const prevEquipObj = db.equipment && typeof db.equipment === 'object' ? db.equipment : null;
      const prevBeanObj = db.beanCatalog && typeof db.beanCatalog === 'object' ? db.beanCatalog : null;
      for (const k of Object.keys(db)) {
        if (!(k in finalDb)) delete db[k];
      }
      Object.assign(db, finalDb);
      // 保留 coffee-equipment.js 與 coffee-workspace.js 快取的物件參考，使其無需重整即可即時呈現雲端變更
      if (prevEquipObj && Array.isArray(prevEquipObj.items) && finalDb.equipment && Array.isArray(finalDb.equipment.items)) {
        prevEquipObj.version = finalDb.equipment.version ?? 1;
        prevEquipObj.legacyImported = finalDb.equipment.legacyImported ?? true;
        prevEquipObj.items.splice(0, prevEquipObj.items.length, ...finalDb.equipment.items);
        db.equipment = prevEquipObj;
      }
      if (prevBeanObj && Array.isArray(prevBeanObj.items) && finalDb.beanCatalog && Array.isArray(finalDb.beanCatalog.items)) {
        prevBeanObj.version = finalDb.beanCatalog.version ?? 1;
        prevBeanObj.items.splice(0, prevBeanObj.items.length, ...finalDb.beanCatalog.items);
        db.beanCatalog = prevBeanObj;
      }
      if (typeof selected !== 'undefined' && Array.isArray(db.recipes) && db.recipes.length > 0) {
        if (!db.recipes.some(r => r.id === selected)) {
          // eslint-disable-next-line no-global-assign
          selected = db.recipes[0].id;
        }
      }
    }
    if (typeof load === 'function') try { load(); } catch (e) {}
    if (typeof logs === 'function') try { logs(); } catch (e) {}
    if (typeof render === 'function') try { render(); } catch (e) {}
  } finally {
    isApplyingCloudSync = false;
  }
  return true;
}

// -------------------------------------------------------------------------
// 3. UI 文案與語系連動
// -------------------------------------------------------------------------
function setTextIfChanged(el, text) {
  if (el && el.textContent !== text) el.textContent = text;
}

function setAttrIfChanged(el, attr, val) {
  if (el && el.getAttribute(attr) !== val) el.setAttribute(attr, val);
}

function renderSyncStatusUI() {
  const box = document.getElementById('cloudSyncBox');
  const statusEl = document.getElementById('syncStatusDesc');
  const btnLogin = document.getElementById('btnGoogleLogin');
  const btnLogout = document.getElementById('btnGoogleLogout');
  const btnSync = document.getElementById('btnManualSync');
  const currentLang = document.documentElement.lang || 'zh-Hant';

  if (box) {
    setAttrIfChanged(box, 'data-coffee-user-text', 'true');
    const titleEl = box.querySelector('h3');
    setTextIfChanged(titleEl, L('☁️ 跨裝置雲端同步（Google 帳號）', '☁️ Cross-Device Cloud Sync (Google)'));
    const hintPs = Array.from(box.querySelectorAll('p.hint'));
    const noticeP = hintPs[hintPs.length - 1];
    if (noticeP && noticeP.getAttribute('data-sync-lang') !== currentLang) {
      noticeP.setAttribute('data-sync-lang', currentLang);
      noticeP.innerHTML = L(
        '※ 登入後將自動雙向同步您的配方、沖煮日記、豆庫與器材（支援時間戳衝突比對與同步刪除）；如需離線留存可隨時使用下方「JSON 備份」。',
        '※ Once signed in, recipes, brew journal, beans, and equipment sync automatically with conflict resolution. Use "JSON backup" below anytime for a manual copy.'
      );
    }
  }

  setTextIfChanged(btnLogin, L('使用 Google 登入同步', 'Sign in with Google'));
  setTextIfChanged(btnLogout, L('登出帳號', 'Sign out'));
  setTextIfChanged(btnSync, L('立即同步', 'Sync now'));

  if (!statusEl) return;
  setAttrIfChanged(statusEl, 'data-sync-state', lastStateInfo.state);

  let nextStatusText = '';
  switch (lastStateInfo.state) {
    case 'syncing':
      nextStatusText = L('🔄 正在同步雲端資料...', '🔄 Syncing with cloud...');
      break;
    case 'synced':
      nextStatusText = L(
        `✅ 已同步（帳號：${lastStateInfo.email}，上次：${lastStateInfo.timeStr}）`,
        `✅ Synced (${lastStateInfo.email}, last: ${lastStateInfo.timeStr})`
      );
      break;
    case 'offline':
      nextStatusText = L(
        '📡 目前離線。資料已安全儲存在本機，恢復連線後將自動同步。',
        '📡 Offline. Changes are safely saved locally and will sync once online.'
      );
      break;
    case 'error':
      nextStatusText = L(
        `⚠️ 同步未完成：${lastStateInfo.detail || '請檢查網路連線'}`,
        `⚠️ Sync incomplete: ${lastStateInfo.detail || 'Check your network connection'}`
      );
      break;
    case 'connected':
      nextStatusText = L(
        `☁️ 已連結：${lastStateInfo.email}，準備同步...`,
        `☁️ Connected: ${lastStateInfo.email}, preparing sync...`
      );
      break;
    default:
      nextStatusText = L(
        '未登入。資料僅保存在此裝置中。',
        'Not signed in. Data stays on this device only.'
      );
      break;
  }
  setTextIfChanged(statusEl, nextStatusText);
}

// -------------------------------------------------------------------------
// 4. 核心雙向同步（含時間戳比較、墓碑刪除與分批提交）
// -------------------------------------------------------------------------
async function commitOpsInChunks(ops) {
  for (let i = 0; i < ops.length; i += MAX_BATCH_OPS) {
    const slice = ops.slice(i, i + MAX_BATCH_OPS);
    const batch = writeBatch(dbStore);
    for (const op of slice) {
      batch.set(op.ref, op.data);
    }
    await batch.commit();
  }
}

async function syncWithCloud(user) {
  if (!user) return;
  if (typeof navigator !== 'undefined' && navigator.onLine === false) {
    lastStateInfo = { ...lastStateInfo, state: 'offline', email: user.email || '' };
    renderSyncStatusUI();
    return;
  }
  if (isSyncInProgress) {
    pendingSyncAfterFinish = true;
    return;
  }

  isSyncInProgress = true;
  pendingSyncAfterFinish = false;
  const btnSync = document.getElementById('btnManualSync');
  if (btnSync) btnSync.disabled = true;

  lastStateInfo = { ...lastStateInfo, state: 'syncing', email: user.email || '' };
  renderSyncStatusUI();

  try {
    const userId = user.uid;
    localStorage.setItem(LAST_UID_KEY, userId);

    const now = Date.now();
    const local = getLocalDB();
    const meta = loadSyncMeta(userId);
    reconcileLocalDiff(local, meta, now, false);

    // 1. 讀取雲端各集合（同時支援新舊 docId 對應）
    const colNames = ['recipes', 'cups', 'beans', 'equipment'];
    const cloudMaps = { recipes: new Map(), cups: new Map(), beans: new Map(), equipment: new Map() };

    for (const colName of colNames) {
      const colRef = collection(dbStore, 'users', userId, colName);
      const snap = await getDocs(colRef);
      snap.forEach(d => {
        const data = d.data();
        const id = getItemId(colName, data) || d.id;
        if (!id) return;
        const prev = cloudMaps[colName].get(id);
        const curTs = Math.max(toEpochMs(data.updatedAt), toEpochMs(data.deletedAt));
        const prevTs = prev ? Math.max(toEpochMs(prev.data.updatedAt), toEpochMs(prev.data.deletedAt)) : -1;
        if (!prev || curTs >= prevTs) {
          cloudMaps[colName].set(id, { docId: d.id, data });
        }
      });
    }

    // 2. 逐集合執行雙向衝突比對與墓碑合併
    const pendingOps = [];
    const mergedResult = {};
    let hasLocalChanges = false;
    const nextMetaItems = {};
    const nextTombstones = { ...meta.tombstones };

    for (const colName of colNames) {
      const localArr = getCollectionArray(local, colName);
      const localMap = new Map();
      for (const item of localArr) {
        const id = getItemId(colName, item);
        if (id) localMap.set(id, item);
      }

      const cloudMap = cloudMaps[colName];
      const allIds = new Set([...localMap.keys(), ...cloudMap.keys()]);
      for (const mKey of Object.keys(meta.tombstones)) {
        if (mKey.startsWith(colName + ':')) {
          allIds.add(mKey.slice(colName.length + 1));
        }
      }

      const mergedArr = [];

      for (const id of allIds) {
        const mKey = `${colName}:${id}`;
        const localItem = localMap.get(id);
        const known = meta.items[mKey];
        const localTs = localItem
          ? Math.max(known ? (Number(known.updatedAt) || 0) : 0, toEpochMs(localItem.updatedAt))
          : 0;
        const localTombTs = Number(meta.tombstones[mKey]) || 0;

        const cloudEntry = cloudMap.get(id);
        const cloudRaw = cloudEntry ? cloudEntry.data : null;
        const cloudUpdatedTs = cloudRaw ? toEpochMs(cloudRaw.updatedAt) : 0;
        const cloudDeletedTs = cloudRaw ? toEpochMs(cloudRaw.deletedAt) : 0;
        const cloudIsDeleted = Boolean(cloudRaw && cloudDeletedTs > 0 && cloudDeletedTs >= cloudUpdatedTs);
        const docIdToUse = cloudEntry ? cloudEntry.docId : safeDocId(id);

        if (localItem) {
          const localHash = hashItem(localItem);

          if (!cloudRaw) {
            // 僅本機存在：上傳雲端
            const stamp = localTs || now;
            mergedArr.push(localItem);
            nextMetaItems[mKey] = { hash: localHash, updatedAt: stamp };
            delete nextTombstones[mKey];
            pendingOps.push({
              ref: doc(dbStore, 'users', userId, colName, docIdToUse),
              data: prepareCloudPayload(colName, id, localItem, stamp)
            });
          } else if (cloudIsDeleted) {
            if (localTs > cloudDeletedTs) {
              // 本機在遠端刪除之後又新建或編輯過 -> 本機勝出並覆寫雲端
              mergedArr.push(localItem);
              nextMetaItems[mKey] = { hash: localHash, updatedAt: localTs };
              delete nextTombstones[mKey];
              pendingOps.push({
                ref: doc(dbStore, 'users', userId, colName, docIdToUse),
                data: prepareCloudPayload(colName, id, localItem, localTs)
              });
            } else {
              // 遠端已刪除較新 -> 本機移除
              hasLocalChanges = true;
              nextTombstones[mKey] = cloudDeletedTs;
            }
          } else {
            // 雙方皆有效存在：比較內容雜湊與時間戳
            const cloudClean = cleanItemForLocal(colName, cloudRaw);
            const cloudHash = hashItem(cloudClean);

            if (localHash === cloudHash) {
              mergedArr.push(localItem);
              nextMetaItems[mKey] = {
                hash: localHash,
                updatedAt: Math.max(localTs, cloudUpdatedTs, now)
              };
              delete nextTombstones[mKey];
            } else if (localTs > cloudUpdatedTs) {
              // 本機較新 -> 保留本機並推上雲端
              mergedArr.push(localItem);
              nextMetaItems[mKey] = { hash: localHash, updatedAt: localTs };
              delete nextTombstones[mKey];
              pendingOps.push({
                ref: doc(dbStore, 'users', userId, colName, docIdToUse),
                data: prepareCloudPayload(colName, id, localItem, localTs)
              });
            } else if (cloudUpdatedTs > localTs) {
              // 雲端較新 -> 下拉更新本機
              mergedArr.push(cloudClean);
              nextMetaItems[mKey] = { hash: cloudHash, updatedAt: cloudUpdatedTs };
              delete nextTombstones[mKey];
              hasLocalChanges = true;
            } else {
              // 時間戳相等但內容不同時保留本機（安全不覆寫）並推新時間戳
              const stamp = now;
              mergedArr.push(localItem);
              nextMetaItems[mKey] = { hash: localHash, updatedAt: stamp };
              pendingOps.push({
                ref: doc(dbStore, 'users', userId, colName, docIdToUse),
                data: prepareCloudPayload(colName, id, localItem, stamp)
              });
            }
          }
        } else {
          // 本機目前無此筆資料
          if (cloudRaw && !cloudIsDeleted) {
            if (localTombTs >= cloudUpdatedTs && localTombTs > 0) {
              // 本機在更晚時間點主動刪除此筆 -> 上傳軟刪除墓碑
              nextTombstones[mKey] = localTombTs;
              pendingOps.push({
                ref: doc(dbStore, 'users', userId, colName, docIdToUse),
                data: prepareCloudPayload(colName, id, null, localTombTs, localTombTs)
              });
            } else {
              // 雲端新資料（或他處於刪除後重新編輯） -> 拉回本機
              const cloudClean = cleanItemForLocal(colName, cloudRaw);
              const cloudHash = hashItem(cloudClean);
              mergedArr.push(cloudClean);
              nextMetaItems[mKey] = { hash: cloudHash, updatedAt: cloudUpdatedTs || now };
              delete nextTombstones[mKey];
              hasLocalChanges = true;
            }
          } else if (cloudIsDeleted && cloudDeletedTs > 0) {
            nextTombstones[mKey] = Math.max(localTombTs, cloudDeletedTs);
          }
        }
      }

      mergedResult[colName] = mergedArr;
    }

    // 核心驗證保護：vd(d) 要求 recipes 至少 1 筆
    if (mergedResult.recipes.length === 0 && local.recipes && local.recipes.length > 0) {
      const keep = local.recipes[0];
      mergedResult.recipes.push(keep);
      hasLocalChanges = true;
      if (keep.id) {
        nextMetaItems[`recipes:${keep.id}`] = { hash: hashItem(keep), updatedAt: now };
        delete nextTombstones[`recipes:${keep.id}`];
      }
    }

    // 3. 先提交雲端批次寫入，再寫回本機（避免網路失敗時基準不一致）
    if (pendingOps.length > 0) {
      await commitOpsInChunks(pendingOps);
      console.log(`[Sync] 已同步 ${pendingOps.length} 筆變更至雲端`);
    }

    if (hasLocalChanges) {
      const updatedDB = {
        ...local,
        version: 2,
        recipes: mergedResult.recipes,
        cups: mergedResult.cups,
        beanCatalog: { version: 1, items: mergedResult.beans },
        equipment: {
          version: 1,
          legacyImported: local.equipment?.legacyImported ?? true,
          items: mergedResult.equipment
        }
      };
      applyDbToMemoryAndUI(updatedDB, true);
    }

    saveSyncMeta(userId, {
      lastSyncedAt: now,
      items: nextMetaItems,
      tombstones: nextTombstones
    });

    const timeStr = new Date().toLocaleTimeString(isEn() ? 'en-US' : 'zh-TW', {
      hour: '2-digit',
      minute: '2-digit'
    });
    lastStateInfo = { state: 'synced', email: user.email || '', timeStr, detail: '' };
    renderSyncStatusUI();

    if (typeof msg === 'function' && (hasLocalChanges || pendingOps.length > 0)) {
      msg(L(`雲端同步完成（${timeStr}）`, `Cloud sync finished (${timeStr})`));
    }
  } catch (err) {
    console.error('[Sync] 同步過程發生錯誤:', err);
    const offlineErr = typeof navigator !== 'undefined' && navigator.onLine === false;
    lastStateInfo = {
      state: offlineErr ? 'offline' : 'error',
      email: user.email || '',
      timeStr: lastStateInfo.timeStr,
      detail: err && err.message ? err.message : ''
    };
    renderSyncStatusUI();
  } finally {
    isSyncInProgress = false;
    if (btnSync) btnSync.disabled = false;
    if (pendingSyncAfterFinish && auth.currentUser) {
      pendingSyncAfterFinish = false;
      syncWithCloud(auth.currentUser);
    }
  }
}

// -------------------------------------------------------------------------
// 5. 事件綁定、自動追蹤與多頁籤同步
// -------------------------------------------------------------------------
function recordLocalSaveMutation() {
  if (isApplyingCloudSync) return;
  const uid = getActiveMetaUid();
  const meta = loadSyncMeta(uid);
  reconcileLocalDiff(getLocalDB(), meta, Date.now(), true);
  saveSyncMeta(uid, meta);
  triggerDebouncedSync();
}

function triggerDebouncedSync() {
  if (!auth.currentUser) return;
  clearTimeout(syncTimer);
  syncTimer = setTimeout(() => {
    if (auth.currentUser) syncWithCloud(auth.currentUser);
  }, 1500);
}

onAuthStateChanged(auth, user => {
  const btnLogin = document.getElementById('btnGoogleLogin');
  const btnLogout = document.getElementById('btnGoogleLogout');
  const btnSync = document.getElementById('btnManualSync');

  if (user) {
    if (btnLogin) btnLogin.hidden = true;
    if (btnLogout) btnLogout.hidden = false;
    if (btnSync) btnSync.hidden = false;
    lastStateInfo = { ...lastStateInfo, state: 'connected', email: user.email || '' };
    renderSyncStatusUI();
    syncWithCloud(user);
  } else {
    if (btnLogin) btnLogin.hidden = false;
    if (btnLogout) btnLogout.hidden = true;
    if (btnSync) btnSync.hidden = true;
    lastStateInfo = { state: 'idle', email: '', timeStr: '', detail: '' };
    renderSyncStatusUI();
  }
});

function bindUIControls() {
  const btnLogin = document.getElementById('btnGoogleLogin');
  const btnLogout = document.getElementById('btnGoogleLogout');
  const btnSync = document.getElementById('btnManualSync');

  if (btnLogin && !btnLogin._syncBound) {
    btnLogin._syncBound = true;
    btnLogin.onclick = async () => {
      try {
        await signInWithPopup(auth, provider);
      } catch (err) {
        console.error('[Sync] 登入失敗:', err);
        alert(L(`登入未完成：${err.message || err.code}`, `Sign-in incomplete: ${err.message || err.code}`));
      }
    };
  }

  if (btnLogout && !btnLogout._syncBound) {
    btnLogout._syncBound = true;
    btnLogout.onclick = async () => {
      try {
        await signOut(auth);
        if (typeof msg === 'function') {
          msg(L('已登出雲端同步，本機資料已完整保留', 'Signed out of cloud sync; local data is preserved'));
        }
      } catch (err) {
        console.error('[Sync] 登出失敗:', err);
      }
    };
  }

  if (btnSync && !btnSync._syncBound) {
    btnSync._syncBound = true;
    btnSync.onclick = () => {
      if (auth.currentUser) syncWithCloud(auth.currentUser);
    };
  }

  renderSyncStatusUI();
}

if (document.readyState === 'loading') {
  window.addEventListener('DOMContentLoaded', bindUIControls);
} else {
  bindUIControls();
}

if (typeof window !== 'undefined') {
  // 多頁籤同步：他頁更新 localStorage 時同步刷新本頁記憶體與畫面
  window.addEventListener('storage', e => {
    if (e.key === STORAGE_KEY && e.newValue && !isApplyingCloudSync) {
      try {
        const parsed = JSON.parse(e.newValue);
        applyDbToMemoryAndUI(parsed, false);
        triggerDebouncedSync();
      } catch (err) {
        console.warn('[Sync] 跨頁籤解析失敗:', err);
      }
    }
  });

  // 網路恢復連線時自動補同步
  window.addEventListener('online', () => {
    if (auth.currentUser) syncWithCloud(auth.currentUser);
  });

  // 監聽語系切換（必須比對語系是否真的改變，否則會與 coffee-i18n.js 的 apply() 形成無限微任務迴圈）
  let lastSyncLang = document.documentElement.lang;
  new MutationObserver(() => {
    const nextLang = document.documentElement.lang;
    if (nextLang === lastSyncLang) return;
    lastSyncLang = nextLang;
    renderSyncStatusUI();
  }).observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });

  // 雙重攔截：save() ＋ Storage.prototype.setItem
  if (typeof window.save === 'function' && !window.save._syncWrapped) {
    const origSave = window.save;
    const wrappedSave = function (...args) {
      inWindowSave = true;
      let res = false;
      try {
        res = origSave.apply(this, args);
      } finally {
        inWindowSave = false;
      }
      if (res) recordLocalSaveMutation();
      return res;
    };
    wrappedSave._syncWrapped = true;
    window.save = wrappedSave;
  }

  try {
    const origSetItem = Storage.prototype.setItem;
    if (!origSetItem._syncWrapped) {
      const patchedSetItem = function (k, v) {
        origSetItem.call(this, k, v);
        if (this === localStorage && k === STORAGE_KEY && !isApplyingCloudSync && !inWindowSave) {
          recordLocalSaveMutation();
        }
      };
      patchedSetItem._syncWrapped = true;
      Storage.prototype.setItem = patchedSetItem;
    }
  } catch (e) {
    console.warn('[Sync] setItem hook skipped', e);
  }
}

// =========================================================================
// 短網址配方快照服務（Firestore shared_recipes）
// =========================================================================
const SHORT_ALPHABET = '23456789abcdefghjkmnpqrstuvwxyz';
function makeShortId(len = 8) {
  const bytes = new Uint8Array(len);
  crypto.getRandomValues(bytes);
  let out = '';
  for (let i = 0; i < len; i++) out += SHORT_ALPHABET[bytes[i] % SHORT_ALPHABET.length];
  return out;
}

window.CoffeeShortShare = {
  async create(pack) {
    if (!pack || pack.format !== 'coffee-corner.recipe' || pack.version !== 1 || !pack.recipe) {
      throw new Error('Invalid recipe package');
    }
    const serialized = JSON.stringify(pack);
    if (new TextEncoder().encode(serialized).length > 262144) {
      throw new Error('Recipe exceeds 256 KB');
    }
    const shortId = makeShortId(8);
    await setDoc(doc(dbStore, 'shared_recipes', shortId), {
      format: 'coffee-corner.recipe',
      version: 1,
      recipe: JSON.parse(JSON.stringify(pack.recipe)),
      createdAt: Date.now()
    });
    return shortId;
  },
  async resolve(shortId) {
    const id = String(shortId || '').trim();
    if (!/^[A-Za-z0-9_-]{4,32}$/.test(id)) {
      throw new Error('Invalid short link ID');
    }
    const snap = await getDoc(doc(dbStore, 'shared_recipes', id));
    if (!snap.exists()) {
      throw new Error('Shared recipe not found or expired');
    }
    const data = snap.data();
    return {
      format: data.format || 'coffee-corner.recipe',
      version: data.version || 1,
      recipe: data.recipe
    };
  }
};

// =========================================================================
// 拍咖啡豆袋 AI 辨識服務（Firebase AI Logic · Gemini Developer API 免費額度）
// =========================================================================
let aiModulePromise = null;
let aiInstance = null;
let appCheckInitPromise = null;
let lastScanAt = 0;
const APP_CHECK_SITE_KEY = '6Leo5icuAAAAAPrsS5v7vhfsPk9CnJ_keRrZY2A7';
const SCAN_COOLDOWN_MS = 4000;
const SCAN_MAX_FILE_BYTES = 20 * 1024 * 1024;
const SCAN_MAX_EDGE = 1024;
const SCAN_MODELS = ['gemini-3.5-flash-lite', 'gemini-3.5-flash'];

async function ensureAppCheck() {
  if (!appCheckInitPromise) {
    appCheckInitPromise = import(`https://www.gstatic.com/firebasejs/${FIREBASE_SDK_VER}/firebase-app-check.js`)
      .then((acMod) => {
        return acMod.initializeAppCheck(app, {
          provider: new acMod.ReCaptchaEnterpriseProvider(APP_CHECK_SITE_KEY),
          isTokenAutoRefreshEnabled: true
        });
      })
      .catch((err) => {
        appCheckInitPromise = null;
        throw err;
      });
  }
  return appCheckInitPromise;
}

async function loadFirebaseAI() {
  await ensureAppCheck();
  if (!aiModulePromise) {
    aiModulePromise = import(`https://www.gstatic.com/firebasejs/${FIREBASE_SDK_VER}/firebase-ai.js`).catch((err) => {
      aiModulePromise = null;
      throw err;
    });
  }
  const mod = await aiModulePromise;
  if (!aiInstance) {
    aiInstance = mod.getAI(app, { backend: new mod.GoogleAIBackend() });
  }
  return { mod, ai: aiInstance };
}

function compressImageFile(file) {
  return new Promise((resolve, reject) => {
    const hasImageMime = file && typeof file.type === 'string' && file.type.startsWith('image/');
    const hasImageExt = file && (!file.type || file.type === 'application/octet-stream') &&
      typeof file.name === 'string' &&
      /\.(jpe?g|png|webp|gif|heic|heif|bmp|avif)$/i.test(file.name);
    if (!file || (!hasImageMime && !hasImageExt)) {
      const err = new Error('IMAGE_INVALID');
      err.code = 'IMAGE_INVALID';
      reject(err);
      return;
    }
    if (file.size > SCAN_MAX_FILE_BYTES) {
      const err = new Error('IMAGE_INVALID');
      err.code = 'IMAGE_INVALID';
      reject(err);
      return;
    }
    const objUrl = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      try {
        let w = img.naturalWidth || img.width;
        let h = img.naturalHeight || img.height;
        if (!w || !h) throw new Error('IMAGE_INVALID');
        const scale = Math.min(1, SCAN_MAX_EDGE / Math.max(w, h));
        const tw = Math.max(1, Math.round(w * scale));
        const th = Math.max(1, Math.round(h * scale));
        const canvas = document.createElement('canvas');
        canvas.width = tw;
        canvas.height = th;
        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error('Canvas unavailable');
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, tw, th);
        ctx.drawImage(img, 0, 0, tw, th);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.82);
        const base64 = dataUrl.split(',')[1] || '';
        if (!base64) throw new Error('IMAGE_INVALID');
        resolve({ base64, mimeType: 'image/jpeg', previewDataUrl: dataUrl });
      } catch (e) {
        if (!e.code) e.code = 'IMAGE_INVALID';
        reject(e);
      } finally {
        URL.revokeObjectURL(objUrl);
      }
    };
    img.onerror = () => {
      URL.revokeObjectURL(objUrl);
      const err = new Error('IMAGE_INVALID');
      err.code = 'IMAGE_INVALID';
      reject(err);
    };
    img.src = objUrl;
  });
}

window.CoffeeBeanScanner = {
  isSignedIn() {
    return !!auth.currentUser;
  },
  async signIn() {
    if (auth.currentUser) return auth.currentUser;
    const res = await signInWithPopup(auth, provider);
    return res.user;
  },
  async scanFile(file, opts = {}) {
    if (!auth.currentUser) {
      const err = new Error('NOT_SIGNED_IN');
      err.code = 'NOT_SIGNED_IN';
      throw err;
    }
    const now = Date.now();
    if (now - lastScanAt < SCAN_COOLDOWN_MS) {
      const err = new Error('COOLDOWN');
      err.code = 'COOLDOWN';
      throw err;
    }
    const utils = window.CoffeeBeanScannerUtils;
    if (!utils) throw new Error('Scanner utils not loaded');

    const { base64, mimeType, previewDataUrl } = await compressImageFile(file);

    const { mod, ai } = await loadFirebaseAI();
    const { getGenerativeModel, Schema } = mod;

    const responseSchema = Schema.object({
      properties: {
        bean: Schema.string({ description: 'Coffee name' }),
        roaster: Schema.string({ description: 'Roaster or brand name' }),
        origin: Schema.string({ description: 'Country, region, or farm' }),
        process: Schema.string({ description: 'Processing method' }),
        roast: Schema.enumString({
          enum: utils.ROAST_LEVELS,
          description: 'Roast level'
        }),
        roastDate: Schema.string({ description: 'Roast date YYYY-MM-DD or empty string' }),
        beanFlavor: Schema.string({ description: 'Tasting notes / flavor descriptors' })
      }
    });

    const prompt = utils.buildScanPrompt(opts.lang || document.documentElement.lang);
    const parts = [
      prompt,
      { inlineData: { mimeType, data: base64 } }
    ];

    let lastErr = null;
    for (const modelName of SCAN_MODELS) {
      try {
        const model = getGenerativeModel(ai, {
          model: modelName,
          generationConfig: {
            responseMimeType: 'application/json',
            responseSchema,
            temperature: 0.1
          }
        });
        const result = await model.generateContent(parts);
        const text = result && result.response && typeof result.response.text === 'function'
          ? result.response.text()
          : '';
        const beanData = utils.parseScannerJson(text);
        lastScanAt = Date.now();
        return { beanData, modelUsed: modelName, previewDataUrl };
      } catch (err) {
        lastErr = err;
        const msgStr = String(err && (err.message || err.code) || '').toLowerCase();
        if (msgStr.includes('429') || msgStr.includes('resource_exhausted') || msgStr.includes('quota')) {
          lastScanAt = Date.now();
        }
        // If API is disabled or auth/app-check failed, no need to retry secondary model
        if (
          msgStr.includes('not enabled') ||
          msgStr.includes('permission_denied') ||
          msgStr.includes('app-check') ||
          msgStr.includes('recaptcha') ||
          msgStr.includes('403')
        ) {
          console.error('[BeanScanner]', err);
          throw err;
        }
      }
    }
    if (lastErr) console.error('[BeanScanner]', lastErr);
    throw lastErr || new Error('SCAN_FAILED');
  }
};
