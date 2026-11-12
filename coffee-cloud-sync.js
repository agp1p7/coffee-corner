// coffee-cloud-sync.js
// 跨裝置雲端同步模組（一隅・咖啡角）
// 核心特色：Local-First（離線優先）、首次同步前自動匯出 JSON 備份、依 ID 智慧合併

import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js';
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged
} from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js';
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  collection,
  getDocs,
  writeBatch
} from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js';

const firebaseConfig = {
  apiKey: "AIzaSyCYZKHQrqLGExQGDUf8d3pknW46TeGNGOY",
  authDomain: "coffee-corner-96380.firebaseapp.com",
  projectId: "coffee-corner-96380",
  storageBucket: "coffee-corner-96380.firebasestorage.app",
  messagingSenderId: "135285994980",
  appId: "1:135285994980:web:a0026e7821dd71292b83f1",
  measurementId: "G-GV6G9BV1MD"
};

// 初始化 Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const dbStore = getFirestore(app);
const provider = new GoogleAuthProvider();

const STORAGE_KEY = 'yiyu-coffee-v2';

// 取得當前本機 db
function getLocalDB() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY) || localStorage.getItem('yiyu-coffee-v1');
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.warn('[Sync] 讀取本機資料庫失敗', e);
  }
  return typeof db !== 'undefined' ? db : { version: 2, recipes: [], cups: [] };
}

// 寫入並儲存本機 db
function saveLocalDB(newDb) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newDb));
    if (typeof db !== 'undefined') {
      Object.assign(db, newDb);
    }
    // 重新渲染介面
    if (typeof load === 'function') try { load(); } catch(e){}
    if (typeof logs === 'function') try { logs(); } catch(e){}
    if (typeof render === 'function') try { render(); } catch(e){}
  } catch (e) {
    console.error('[Sync] 儲存合併資料失敗', e);
  }
}

// 自動備份機制（確保登入前零風險）
function exportSafetyBackup() {
  try {
    const current = getLocalDB();
    const hasData = (current.recipes && current.recipes.length > 0) || (current.cups && current.cups.length > 0);
    if (!hasData) return;

    const str = JSON.stringify(current, null, 2);
    const blob = new Blob([str], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `coffee-corner-backup-before-sync-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 10000);
    console.log('[Sync] 登入前自動防護備份已下載');
  } catch (e) {
    console.warn('[Sync] 自動下載備份略過', e);
  }
}

// 雲端與本機雙向同步核心邏輯
async function syncWithCloud(user) {
  const statusEl = document.getElementById('syncStatusDesc');
  const btnSync = document.getElementById('btnManualSync');
  if (btnSync) btnSync.disabled = true;
  if (statusEl) statusEl.textContent = '🔄 正在同步雲端資料...';

  try {
    const userId = user.uid;
    const local = getLocalDB();
    const now = Date.now();

    // 1. 讀取雲端各集合
    const collectionsToSync = ['recipes', 'cups'];
    const cloudData = { recipes: [], cups: [], beans: [], equipment: [] };

    for (const colName of ['recipes', 'cups', 'beans', 'equipment']) {
      try {
        const colRef = collection(dbStore, 'users', userId, colName);
        const snap = await getDocs(colRef);
        snap.forEach(d => cloudData[colName].push(d.data()));
      } catch (err) {
        console.warn(`[Sync] 讀取集合 ${colName} 失敗:`, err);
      }
    }

    // 2. 智慧合併（依 id 比對）
    let hasLocalChanges = false;
    const batch = writeBatch(dbStore);
    let batchCount = 0;

    // --- 合併 recipes ---
    const localRecipes = local.recipes || [];
    const mergedRecipesMap = new Map();
    // 先放本機
    localRecipes.forEach(r => {
      if (r && r.id) mergedRecipesMap.set(r.id, r);
    });
    // 再合併雲端（若本機沒有則加入）
    cloudData.recipes.forEach(cr => {
      if (!cr || !cr.id) return;
      if (!mergedRecipesMap.has(cr.id)) {
        mergedRecipesMap.set(cr.id, cr);
        hasLocalChanges = true;
      }
    });
    // 將本機新配方上傳至雲端
    localRecipes.forEach(r => {
      if (r && r.id) {
        const existsInCloud = cloudData.recipes.some(cr => cr.id === r.id);
        if (!existsInCloud && batchCount < 400) {
          const docRef = doc(dbStore, 'users', userId, 'recipes', r.id);
          batch.set(docRef, { ...r, updatedAt: r.updatedAt || now }, { merge: true });
          batchCount++;
        }
      }
    });

    // --- 合併 cups (沖煮紀錄) ---
    const localCups = local.cups || [];
    const mergedCupsMap = new Map();
    localCups.forEach(c => {
      if (c && c.id) mergedCupsMap.set(c.id, c);
    });
    cloudData.cups.forEach(cc => {
      if (!cc || !cc.id) return;
      if (!mergedCupsMap.has(cc.id)) {
        mergedCupsMap.set(cc.id, cc);
        hasLocalChanges = true;
      }
    });
    localCups.forEach(c => {
      if (c && c.id) {
        const existsInCloud = cloudData.cups.some(cc => cc.id === c.id);
        if (!existsInCloud && batchCount < 400) {
          const docRef = doc(dbStore, 'users', userId, 'cups', c.id);
          batch.set(docRef, { ...c, updatedAt: c.updatedAt || now }, { merge: true });
          batchCount++;
        }
      }
    });

    // --- 合併 beans (咖啡豆庫) ---
    const localBeans = (local.beanCatalog && local.beanCatalog.items) || [];
    const mergedBeansMap = new Map();
    localBeans.forEach(b => {
      const bid = b.id || (b.name + '_' + (b.roastDate || ''));
      mergedBeansMap.set(bid, b);
    });
    cloudData.beans.forEach(cb => {
      const cbid = cb.id || (cb.name + '_' + (cb.roastDate || ''));
      if (!mergedBeansMap.has(cbid)) {
        mergedBeansMap.set(cbid, cb);
        hasLocalChanges = true;
      }
    });
    localBeans.forEach(b => {
      const bid = b.id || (b.name + '_' + (b.roastDate || ''));
      const exists = cloudData.beans.some(cb => (cb.id || (cb.name + '_' + (cb.roastDate || ''))) === bid);
      if (!exists && batchCount < 400) {
        const docRef = doc(dbStore, 'users', userId, 'beans', bid.replace(/[\/\s]/g, '_'));
        batch.set(docRef, { ...b, updatedAt: now }, { merge: true });
        batchCount++;
      }
    });

    // --- 合併 equipment (器材) ---
    const localGear = (local.equipment && local.equipment.items) || [];
    const mergedGearMap = new Map();
    localGear.forEach(g => {
      if (g && g.id) mergedGearMap.set(g.id, g);
    });
    cloudData.equipment.forEach(cg => {
      if (!cg || !cg.id) return;
      if (!mergedGearMap.has(cg.id)) {
        mergedGearMap.set(cg.id, cg);
        hasLocalChanges = true;
      }
    });
    localGear.forEach(g => {
      if (g && g.id) {
        const exists = cloudData.equipment.some(cg => cg.id === g.id);
        if (!exists && batchCount < 400) {
          const docRef = doc(dbStore, 'users', userId, 'equipment', g.id);
          batch.set(docRef, { ...g, updatedAt: now }, { merge: true });
          batchCount++;
        }
      }
    });

    // 提交批次上傳至 Firestore
    if (batchCount > 0) {
      await batch.commit();
      console.log(`[Sync] 已上傳 ${batchCount} 筆本機新資料至雲端`);
    }

    // 若有自雲端拉取新資料，更新本機 db
    if (hasLocalChanges) {
      const updatedDB = {
        ...local,
        recipes: Array.from(mergedRecipesMap.values()),
        cups: Array.from(mergedCupsMap.values()),
        beanCatalog: { version: 1, items: Array.from(mergedBeansMap.values()) },
        equipment: { items: Array.from(mergedGearMap.values()) }
      };
      saveLocalDB(updatedDB);
    }

    // 記錄最後同步時間
    const timeStr = new Date().toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' });
    if (statusEl) {
      statusEl.textContent = `✅ 已同步（帳號：${user.email}，上次：${timeStr}）`;
    }
    if (typeof msg === 'function') {
      msg(`雲端同步完成（${timeStr}）`);
    }
  } catch (err) {
    console.error('[Sync] 同步過程發生錯誤:', err);
    if (statusEl) {
      statusEl.textContent = `⚠️ 同步未完成：${err.message || '請檢查網路連線'}`;
    }
  } finally {
    if (btnSync) btnSync.disabled = false;
  }
}

// 監聽登入狀態改變
onAuthStateChanged(auth, user => {
  const statusEl = document.getElementById('syncStatusDesc');
  const btnLogin = document.getElementById('btnGoogleLogin');
  const btnLogout = document.getElementById('btnGoogleLogout');
  const btnSync = document.getElementById('btnManualSync');

  if (user) {
    if (btnLogin) btnLogin.hidden = true;
    if (btnLogout) btnLogout.hidden = false;
    if (btnSync) btnSync.hidden = false;
    if (statusEl) statusEl.textContent = `☁️ 已連結：${user.email}，準備同步...`;
    syncWithCloud(user);
  } else {
    if (btnLogin) btnLogin.hidden = false;
    if (btnLogout) btnLogout.hidden = true;
    if (btnSync) btnSync.hidden = true;
    if (statusEl) statusEl.textContent = '未登入。資料僅保存在此裝置中。';
  }
});

// 綁定按鈕事件
window.addEventListener('DOMContentLoaded', () => {
  const btnLogin = document.getElementById('btnGoogleLogin');
  const btnLogout = document.getElementById('btnGoogleLogout');
  const btnSync = document.getElementById('btnManualSync');

  if (btnLogin) {
    btnLogin.onclick = async () => {
      try {
        // 首登前先執行防護性自動備份
        exportSafetyBackup();
        await signInWithPopup(auth, provider);
      } catch (err) {
        console.error('[Sync] 登入失敗:', err);
        alert(`登入未完成：${err.message || err.code}`);
      }
    };
  }

  if (btnLogout) {
    btnLogout.onclick = async () => {
      try {
        await signOut(auth);
        if (typeof msg === 'function') msg('已登出雲端同步，本機資料已完整保留');
      } catch (err) {
        console.error('[Sync] 登出失敗:', err);
      }
    };
  }

  if (btnSync) {
    btnSync.onclick = () => {
      if (auth.currentUser) {
        syncWithCloud(auth.currentUser);
      }
    };
  }
});

// 攔截並監聽本機 save()，自動觸發雲端同步
if (typeof window !== 'undefined') {
  let syncTimer = null;
  const triggerDebouncedSync = () => {
    if (auth.currentUser) {
      clearTimeout(syncTimer);
      syncTimer = setTimeout(() => {
        syncWithCloud(auth.currentUser);
      }, 1500);
    }
  };

  // 當 localStorage 更新時監聽
  window.addEventListener('storage', e => {
    if (e.key === STORAGE_KEY) triggerDebouncedSync();
  });

  // 攔截 save
  const origSave = window.save;
  if (typeof origSave === 'function') {
    window.save = function(...args) {
      const res = origSave.apply(this, args);
      if (res) triggerDebouncedSync();
      return res;
    };
  }
}
