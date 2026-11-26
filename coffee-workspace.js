(function(){
'use strict';
const B=['bean','roaster','origin','process','roast','roastDate','openDate'],copy=x=>JSON.parse(JSON.stringify(x));
const FLAVOR='beanFlavor',flavor=b=>b&&typeof b[FLAVOR]==='string'?b[FLAVOR]:'';
function snapshotFlavor(r){return r&&typeof r[FLAVOR]==='string'?r[FLAVOR]:flavor(r&&r.beanSnapshot);}
function pinnedFlavor(r){return r&&typeof r[FLAVOR]==='string'?r[FLAVOR]:r&&r.beanSnapshot?flavor(r.beanSnapshot):null;}
function catalogFlavor(r,items){if(!r)return '';const id=r.beanId||(r.beanSnapshot&&r.beanSnapshot.id);if(id){const b=items.find(x=>x.id===id);return flavor(b);}if(typeof r.bean!=='string'||!r.bean.trim())return '';const matches=items.filter(b=>same(b,r));return matches.length===1?flavor(matches[0]):'';}
function beanOK(b){return b&&typeof b.id==='string'&&b.id.length>0&&b.id.length<160&&typeof b.active==='boolean'&&B.every(k=>typeof b[k]==='string'&&b[k].length<=5000)&&(b[FLAVOR]===undefined||typeof b[FLAVOR]==='string'&&b[FLAVOR].length<=3000)&&b.bean.trim();}
function catalogOK(c){return c&&c.version===1&&Array.isArray(c.items)&&c.items.length<=1000&&c.items.every(beanOK)&&new Set(c.items.map(b=>b.id)).size===c.items.length;}
function clean(r){const n=copy(r);for(const k of ['guideEvents','guideCursor','guideMode'])delete n[k];return n;}
function same(a,b){return B.every(k=>(a[k]||'')===(b[k]||''));}
function stepState(type){const manual=['後加水（bypass）','後加冰塊'].includes(type),pour=['悶蒸注水','注水','繞圈注水','中心注水'].includes(type);return{manual,amount:manual||pour,kind:type==='後加水（bypass）'};}
function configureStep(type,sec,water,kind){const f=stepState(type.value);sec.disabled=f.manual;sec.required=!f.manual;sec.min=f.manual?'0':'1';if(f.manual)sec.value='0';else if(Number(sec.value)<=0)sec.value='20';water.disabled=!f.amount;water.required=f.amount;water.min=f.amount?'.1':'0';if(!f.amount)water.value='0';else if(Number(water.value)<=0)water.value='30';kind.parentElement.hidden=!f.kind;return f;}
function stepValue(x){const f=stepState(x.type.value),s={type:x.type.value,sec:f.manual?0:Number(x.sec.value),water:Number(x.water.value),note:x.note.value.trim()};if(f.kind)s.waterKind=x.kind.value;return s;}
function postAmounts(r){let water=Number(r.cold)||0,ice=Number(r.ice)||0;for(const s of r.steps){if(s.type==='後加水（bypass）')water+=Number(s.water)||0;else if(s.type==='後加冰塊')ice+=Number(s.water)||0;}return{water,ice};}
if(typeof module!=='undefined'&&module.exports)module.exports={beanOK,catalogOK,clean,same,stepState,configureStep,stepValue,postAmounts,flavor,snapshotFlavor,pinnedFlavor,catalogFlavor};
if(typeof document==='undefined'||document.getElementById('coffeeWorkspace'))return;
const $=id=>document.getElementById(id),L=(a,b)=>document.documentElement.lang==='en'?b:a,E=(t,s)=>{const x=document.createElement(t);if(s!==undefined)x.textContent=s;return x;};
const cardModuleBase=new URL('.',document.currentScript?document.currentScript.src:document.baseURI);
function additionText(r){const x=postAmounts(r);return(x.water>0?' · '+L('後加水 ','Bypass water ')+x.water+' g':'')+(x.ice>0?' · '+L('後加冰 ','Ice added ')+x.ice+' g':'');}
function grindGuideText(r){const g=typeof window!=='undefined'?window.CoffeeGrinderGuide:null;if(g)return g.formatGrindGuide(r,{lang:document.documentElement.lang});if(r.grindGuide||r.grindGuideEn)return L(r.grindGuide||r.grindGuideEn,r.grindGuideEn||r.grindGuide);const mNote=String(r.notes||'').match(/【推薦研磨】([^。\n]+)/);if(mNote&&document.documentElement.lang!=='en')return mNote[1];if(r.method==='愛樂壓')return L('中研磨（C5 Pro 刻度 11–15.2）','Medium (C5 Pro dial 11–15.2)');if(r.method==='浸泡式')return L('中粗研磨（C5 Pro 刻度 1圈+4.2–1圈+12）','Medium-coarse (C5 Pro dial 1r+4.2–1r+12)');if(r.method==='越南滴濾壺')return L('中細研磨（C5 Pro 刻度 12.1–1圈+1.2）','Medium-fine (C5 Pro dial 12.1–1r+1.2)');if(r.method==='手沖'&&r.shape==='平底')return L('中研磨（C5 Pro 刻度 1圈+1.2–1圈+8.1）','Medium (C5 Pro dial 1r+1.2–1r+8.1)');if(r.method==='手沖')return L('中細至中研磨（C5 Pro 刻度 14.2–1圈+5.2）','Medium-fine to medium (C5 Pro dial 14.2–1r+5.2)');return L('中研磨（C5 Pro 刻度 1圈+0.2–1圈+8.1）','Medium (C5 Pro dial 1r+0.2–1r+8.1)');}
const labels=[];function prune(){for(let i=labels.length-1;i>=0;i--)if(!labels[i][0].isConnected)labels.splice(i,1);}function text(x,a,b){labels.push([x,a,b||a]);x.textContent=L(a,b||a);return x;}function own(x){x.setAttribute('data-coffee-user-text','true');return x;}function button(p,a,b,fn){const x=text(E('button'),a,b);x.type='button';x.onclick=fn;p.append(x);return x;}
function field(p,a,b,value,type='text'){const w=E('label'),s=text(E('span'),a,b),x=E(Array.isArray(type)?'select':type==='textarea'?'textarea':'input');if(Array.isArray(type)){for(const v of [...new Set([...type,value])]){const o=E('option',v);o.value=v;x.append(o);}}else{if(type!=='textarea')x.type=type;x.maxLength=5000;if(type==='number'){x.min='0';x.step='any';}}x.value=value??'';w.append(s,x);p.append(w);return x;}
function detail(p,a,b){const d=E('details');d.append(text(E('summary'),a,b));p.append(d);return d;}
function modal(){const d=own(E('dialog'));d.className='workspace-dialog';document.body.append(d);return d;}
function normalizeBeanCatalog(data){
 const raw=data&&data.beanCatalog;if(!raw||typeof raw!=='object'||Array.isArray(raw)){data.beanCatalog={version:1,items:[]};return data.beanCatalog;}
 const seen=new Set(),items=[];
 if(Array.isArray(raw.items))for(const b of raw.items){
  if(items.length>=1000||!b||typeof b!=='object'||Array.isArray(b))continue;
  const name=String(b.bean??'').trim().slice(0,5000);if(!name)continue;
  let bid=typeof b.id==='string'?b.id.trim():'';if(!bid||bid.length>=160||seen.has(bid))bid=uid();
  seen.add(bid);
  const out={id:bid,active:typeof b.active==='boolean'?b.active:true};
  for(const k of B)out[k]=String(b[k]??'').trim().slice(0,5000);
  if(b[FLAVOR]!==undefined&&b[FLAVOR]!==null)out[FLAVOR]=String(b[FLAVOR]).trim().slice(0,3000);
  if(beanOK(out))items.push(out);
 }
 data.beanCatalog={version:1,items};return data.beanCatalog;
}
let bound=null;function beans(){if(bound!==db){if(db.beanCatalog===undefined){const items=[];for(const r of [...db.recipes,...db.cups.map(c=>c.recipe)]){if(!r.bean||items.length>=1000)continue;const b={id:uid(),active:true,...Object.fromEntries(B.map(k=>[k,String(r[k]||'')])),[FLAVOR]:snapshotFlavor(r)};if(beanOK(b)&&!items.some(x=>same(x,b)))items.push(b);}db.beanCatalog={version:1,items};}else{const prev=JSON.stringify(db.beanCatalog);normalizeBeanCatalog(db);if(prev!==JSON.stringify(db.beanCatalog)&&typeof save==='function')try{save();}catch(e){}}if(!catalogOK(db.beanCatalog))throw Error('Invalid bean catalog');bound=db;}return db.beanCatalog.items;}
try{beans();}catch(e){msg('Invalid bean catalog; back up existing data first.');return;}
const oldMigrate=migrate;migrate=function(d){const n=oldMigrate(d);if(n.beanCatalog!==undefined){normalizeBeanCatalog(n);if(!catalogOK(n.beanCatalog))throw Error('Invalid bean catalog');}return n;};
function stampBean(r,id){if(id==='__snapshot')return;const b=beans().find(x=>x.id===id);for(const k of B)r[k]=b?b[k]:k==='roast'?'未填':'';r[FLAVOR]=b?flavor(b):'';r.beanId=b?b.id:'';r.beanSnapshot=b?copy(b):null;}
function beanSelect(s,r){s.replaceChildren();const empty=E('option',L('暫不指定','Not specified'));empty.value='';s.append(empty);let match=beans().find(b=>same(b,r));for(const b of beans().filter(b=>b.active||b===match)){const o=E('option',b.bean+(b.roastDate?' · '+b.roastDate:'')+(!b.active?L('（封存）',' (archived)'):''));o.value=b.id;s.append(o);}if(r.bean&&!match){const o=E('option',r.bean+L('（配方快照）',' (recipe snapshot)'));o.value='__snapshot';s.append(o);s.value='__snapshot';}else s.value=match?match.id:'';}
function gearSelect(s,r,t){s.replaceChildren();const empty=E('option',L('暫不指定','Not specified'));empty.value='';s.append(empty);const items=db.equipment?.items||[],match=items.find(x=>x.type===t&&x.name===r[t]&&(t==='dripper'?x.shape===r.shape&&x.material===r.material:x.unit===(r.grindUnit||'')));for(const x of items.filter(x=>x.type===t&&(x.active||x===match))){const o=E('option',x.name);o.value=x.id;s.append(o);}if(r[t]&&!match){const o=E('option',r[t]+L('（配方快照）',' (recipe snapshot)'));o.value='__snapshot';s.append(o);s.value='__snapshot';}else s.value=match?match.id:'';}
function stampGear(r,t,id){if(id==='__snapshot')return;const x=(db.equipment?.items||[]).find(x=>x.id===id&&x.type===t);r[t]=x?x.name:'';r[t+'EquipmentId']=x?x.id:'';r.equipmentSnapshot=r.equipmentSnapshot||{};r.equipmentSnapshot[t]=x?copy(x):null;if(t==='dripper'){r.shape=x?x.shape:'其他／不適用';r.material=x?x.material:'其他／未填';}else{r.grind='';r.grindUnit=x?x.unit:'';}}
const nav=document.querySelector('nav'),history=$('history'),records=E('div'),my=own(E('div'));my.id='coffeeWorkspace';for(const child of [...history.children])records.append(child);history.append(my,records);const title=text(E('h2'),'我的咖啡','My coffee'),tabs=E('div'),beanPanel=E('div'),gearPanel=E('div');my.append(title,tabs,beanPanel,gearPanel);tabs.className='workspace-tabs';let sub='beans';const subButtons={};function showSub(v){sub=v;beanPanel.hidden=v!=='beans';gearPanel.hidden=v!=='gear';records.hidden=v!=='records';for(const k of Object.keys(subButtons))subButtons[k].setAttribute('aria-pressed',String(k===v));}
for(const [v,a,b]of [['beans','咖啡豆','Coffee beans'],['gear','我的器材','Equipment'],['records','沖煮紀錄','Brew journal']])subButtons[v]=button(tabs,a,b,()=>{showSub(v);refresh();});
const toolbar=$('coffeeEquipmentManager');if(toolbar)gearPanel.append(toolbar);const gearList=E('div');gearPanel.append(gearList);
function go(id,push=true){const raw=id;if(id==='brew-edit')id='brew';if(!['brew','guide','history','settings'].includes(id))id='brew';document.querySelectorAll('main>section').forEach(s=>s.hidden=s.id!==id);nav.querySelectorAll('button').forEach(b=>{b.classList.toggle('coffee-current-tab',b.dataset.tab===id);if(b.dataset.tab===id)b.setAttribute('aria-current','page');else b.removeAttribute('aria-current');});if(id==='history'){logs();refresh();}if(push&&location.hash!=='#'+id)window.history.pushState(null,'','#'+id);if(typeof window!=='undefined'&&typeof window.dispatchEvent==='function'&&typeof CustomEvent==='function')try{window.dispatchEvent(new CustomEvent('coffee-tab-change',{detail:{id,raw}}));}catch(e){}}
for(const b of nav.querySelectorAll('button')){b.onclick=()=>go(b.dataset.tab);if(b.dataset.tab==='history')text(own(b),'我的咖啡','My coffee');if(b.dataset.tab==='brew')text(own(b),'沖煮台','Brew');if(b.dataset.tab==='settings'){text(own(b),'設定','Settings');b.classList.add('workspace-settings');}}
for(const key of ['brew','history','guide','settings']){const b=nav.querySelector('[data-tab='+key+']');if(b)nav.append(b);}
for(const event of ['popstate','hashchange'])window.addEventListener(event,e=>{e.stopImmediatePropagation();go(location.hash.slice(1),false);},true);
const back=$('guide').querySelector('button');if(back){text(own(back),'← 返回沖煮台','← Back to Brew');back.onclick=()=>go('brew');}
const beanDialog=modal();function editBean(item=null,after=null,opts=null){
 beanDialog.replaceChildren();
 beanDialog.append(text(E('h2'),item?'編輯咖啡豆':'新增咖啡豆',item?'Edit coffee':'Add coffee'));
 const scanBox=E('div');scanBox.className='bean-scan-box';
 const scanActions=E('div');scanActions.className='bean-scan-actions';
 const camInput=E('input');camInput.type='file';camInput.accept='image/*';camInput.setAttribute('capture','environment');camInput.hidden=true;
 const fileInput=E('input');fileInput.type='file';fileInput.accept='image/*';fileInput.hidden=true;
 const scanStatus=E('p');scanStatus.className='bean-scan-status hint';scanStatus.setAttribute('role','status');
 const scanPreview=E('img');scanPreview.className='bean-scan-preview';scanPreview.alt=L('豆袋預覽','Coffee bag preview');scanPreview.hidden=true;
 const scanHint=text(E('p'),'拍豆袋標籤自動填表（需登入 Google，請避開宅配單個資；照片不存雲端）。','Snap the coffee bag label to auto-fill (Google sign-in required; avoid personal shipping labels; photo is not stored).');
 scanHint.className='hint bean-scan-hint';
 const form=E('form'),controls={};
 let scanning=false;
 function showLoginAction(){
  scanStatus.replaceChildren(document.createTextNode(L('請先登入 Google 帳號才能使用拍豆袋辨識：','Sign in with Google first to scan coffee bags: ')));
  const loginBtn=E('button',L('立即登入 Google','Sign in with Google'));loginBtn.type='button';loginBtn.className='bean-scan-login';
  loginBtn.onclick=async()=>{
   const scanner=window.CoffeeBeanScanner;
   if(!scanner||typeof scanner.signIn!=='function'){msg(L('雲端模組尚未載入完成，請稍後再試。','Cloud module is still loading; try again shortly.'));return;}
   loginBtn.disabled=true;
   try{await scanner.signIn();scanStatus.textContent=L('✓ 已登入！現在可以拍豆袋或選照片辨識。','✓ Signed in! You can now snap or choose a coffee bag photo.');scanStatus.classList.remove('is-error');scanStatus.classList.add('is-ok');}
   catch(err){scanStatus.textContent=L('登入未完成，請再試一次。','Sign-in was cancelled or failed.');loginBtn.disabled=false;}
  };
  scanStatus.append(loginBtn);
 }
 function ensureScannerReady(){
  const scanner=window.CoffeeBeanScanner;
  if(!scanner||typeof scanner.scanFile!=='function'){
   scanStatus.classList.remove('is-ok');scanStatus.classList.add('is-error');
   scanStatus.textContent=L('AI 辨識模組尚未載入完成，請稍候或重新整理頁面。','AI scanner module is not ready yet. Please wait or reload.');
   return false;
  }
  if(typeof scanner.isSignedIn==='function'&&!scanner.isSignedIn()){
   scanStatus.classList.remove('is-ok');scanStatus.classList.add('is-error');
   showLoginAction();
   return false;
  }
  return true;
 }
 const camBtn=button(scanActions,'📷 拍豆袋辨識','📷 Snap bag',()=>{if(!scanning&&ensureScannerReady())camInput.click();});
 const pickBtn=button(scanActions,'🖼️ 選豆袋照片','🖼️ Choose photo',()=>{if(!scanning&&ensureScannerReady())fileInput.click();});
 camBtn.className='bean-scan-btn';pickBtn.className='bean-scan-btn';
 async function handleScanFile(file){
  if(!file||scanning)return;
  try{
   if(!ensureScannerReady())return;
   const scanner=window.CoffeeBeanScanner;
   scanning=true;camBtn.disabled=pickBtn.disabled=true;
   scanStatus.classList.remove('is-ok','is-error');
   scanStatus.textContent=L('⏳ AI 正在辨識豆袋標籤，請稍候…','⏳ Reading coffee bag label…');
   const res=await scanner.scanFile(file,{lang:document.documentElement.lang});
   if(res.previewDataUrl){scanPreview.src=res.previewDataUrl;scanPreview.hidden=false;}
   const d=res.beanData||{};
   let filled=0;
   for(const k of ['bean','roaster','origin','process','roastDate']){
    if(d[k]){controls[k].value=d[k];filled++;}
   }
   if(d.roast&&d.roast!=='未填'){controls.roast.value=d.roast;filled++;}
   if(d.beanFlavor){controls[FLAVOR].value=d.beanFlavor;filled++;}
   if(filled>0){
    scanStatus.classList.add('is-ok');
    scanStatus.textContent=L(`✓ 已自動填入 ${filled} 項豆袋資訊，請核對後按「儲存咖啡豆」。`,`✓ Auto-filled ${filled} fields. Review and click Save coffee.`);
    if(!controls.bean.value.trim())controls.bean.focus();
   }else{
    scanStatus.classList.add('is-error');
    scanStatus.textContent=L('未在照片中辨識出清楚的豆袋資訊，請換光線較亮、對焦清晰的照片再試。','No clear coffee label info detected. Try a brighter, sharper photo.');
   }
  }catch(err){
   scanStatus.classList.remove('is-ok');scanStatus.classList.add('is-error');
   const utils=window.CoffeeBeanScannerUtils;
   const info=utils&&typeof utils.classifyScanError==='function'?utils.classifyScanError(err):{code:'UNKNOWN',zh:'辨識失敗，請稍後再試。',en:'Scan failed. Please try again.'};
   if(info.code==='NOT_SIGNED_IN')showLoginAction();
   else scanStatus.textContent=L(info.zh,info.en);
  }finally{
   scanning=false;camBtn.disabled=pickBtn.disabled=false;camInput.value='';fileInput.value='';
  }
 }
 camInput.onchange=()=>{if(camInput.files&&camInput.files[0])handleScanFile(camInput.files[0]);};
 fileInput.onchange=()=>{if(fileInput.files&&fileInput.files[0])handleScanFile(fileInput.files[0]);};
 scanBox.append(scanActions,camInput,fileInput,scanHint,scanPreview,scanStatus);
 beanDialog.append(scanBox);
 for(const k of B){const c=C.find(c=>c[0]===k);controls[k]=field(form,c[1],c[1],item?item[k]:c[3],c[2]);}
 controls[FLAVOR]=field(form,'風味描述（選填）','Flavor description (optional)',item?flavor(item):'','textarea');
 controls[FLAVOR].maxLength=3000;controls[FLAVOR].rows=3;controls[FLAVOR].style.width='100%';
 form.append(text(E('p'),'記錄這支豆子的風味，與每杯品飲筆記分開。','Describe this coffee separately from each cup’s tasting notes.'));
 controls.bean.required=true;
 const submit=text(E('button'),'儲存咖啡豆','Save coffee');submit.type='submit';form.append(submit);
 beanDialog.append(form);
 button(beanDialog,'取消','Cancel',()=>beanDialog.close());
 form.onsubmit=e=>{e.preventDefault();if(!form.reportValidity())return;const b={id:item?item.id:uid(),active:item?item.active:true,...Object.fromEntries(B.map(k=>[k,controls[k].value.trim()])),[FLAVOR]:controls[FLAVOR].value.trim()};if(!beanOK(b)||!item&&beans().length>=1000){msg(L('請確認豆名與資料數量','Check the coffee name and catalog limit'));return;}const list=beans(),i=list.findIndex(x=>x.id===b.id);const previous=i<0?null:list[i];if(i<0)list.push(b);else list[i]=b;if(!save()){if(i<0)list.splice(list.indexOf(b),1);else list[i]=previous;msg(L('未能儲存咖啡豆，原資料保留；請先備份並檢查儲存狀態。','Could not save the coffee. Original data was kept; back up and check storage.'));return;}if(after)after(b);beanDialog.close();refresh();};
 beanDialog.showModal();
 if(opts&&opts.focusScan){
  if(window.CoffeeBeanScanner&&typeof window.CoffeeBeanScanner.isSignedIn==='function'&&!window.CoffeeBeanScanner.isSignedIn()){
   scanStatus.classList.remove('is-ok');scanStatus.classList.add('is-error');
   showLoginAction();
  }
  camBtn.focus();
 }
}
function refresh(){const items=beans();beanPanel.replaceChildren();prune();button(beanPanel,'＋新增咖啡豆','＋ Add coffee',()=>editBean());button(beanPanel,'📷 拍豆袋新增','📷 Scan coffee bag',()=>editBean(null,null,{focusScan:true}));if(!items.length)beanPanel.append(text(E('p'),'先新增咖啡豆，沖煮時就能直接選取。','Add a coffee to select it when brewing.'));for(const b of items){const box=E('article');box.className='box';box.append(E('h3',b.bean),E('p',[b.roaster,b.roast,b.roastDate,!b.active?L('已封存','Archived'):''].filter(Boolean).join(' · ')));if(flavor(b))box.append(E('p',flavor(b)));button(box,'編輯','Edit',()=>editBean(b));button(box,b.active?'封存':'啟用',b.active?'Archive':'Activate',()=>{b.active=!b.active;save();refresh();});beanPanel.append(box);}gearList.replaceChildren();const eqItems=db.equipment?.items||[];if(!eqItems.length)gearList.append(text(E('p'),'點上方「我的器材／新增器材」即可從 31 款常見濾杯與磨豆機一鍵加入，或手動建立器材。','Tap "My equipment / Add equipment" above to 1-tap add from 31 common drippers & grinders, or add custom gear.'));for(const x of eqItems){const box=E('article');box.className='box';box.append(E('h3',x.name),E('p',[x.type==='dripper'?L('沖煮器具','Brewer'):L('磨豆機','Grinder'),x.unit,x.active?'':L('已停用','Inactive')].filter(Boolean).join(' · ')));gearList.append(box);}refreshPickers();}
const oldRead=read,oldFill=fill,initialBeanRecipe=db.recipes.find(r=>r.id===selected)||db.recipes[0];let beanChoice=initialBeanRecipe.beanSnapshot||null,recipeBeanFlavor=pinnedFlavor(initialBeanRecipe);
read=function(){const r=oldRead();const b=beanChoice&&same(beanChoice,r)?beanChoice:beans().find(b=>same(b,r));r[FLAVOR]=beanChoice&&same(beanChoice,r)?flavor(beanChoice):recipeBeanFlavor!==null?recipeBeanFlavor:b?flavor(b):'';r.beanId=b?b.id:'';r.beanSnapshot=b?copy(b):null;if(r.beanSnapshot)r.beanSnapshot[FLAVOR]=r[FLAVOR];return r;};
fill=function(r){beanChoice=r.beanSnapshot||null;recipeBeanFlavor=pinnedFlavor(r);oldFill(r);if(defaultSelect)beanSelect(defaultSelect,read());};
const defaultBox=own(E('div')),defaultSelect=field(defaultBox,'預設咖啡豆（選填）','Default coffee (optional)','',[]);$('fields').append(defaultBox);defaultSelect.onchange=()=>{const r=read();stampBean(r,defaultSelect.value);beanChoice=r.beanSnapshot;recipeBeanFlavor=flavor(r);for(const k of B)$(k).value=r[k];render();};
const addBeanForRecipe=b=>{defaultSelect.value=b.id;const r=read();stampBean(r,b.id);beanChoice=r.beanSnapshot;recipeBeanFlavor=flavor(r);for(const k of B)$(k).value=r[k];render();};
button(defaultBox,'＋新增咖啡豆','＋ Add coffee',()=>editBean(null,addBeanForRecipe));
button(defaultBox,'📷 拍豆袋新增','📷 Scan coffee bag',()=>editBean(null,addBeanForRecipe,{focusScan:true}));
const oldBeanDetails=$('beans').closest('details');if(oldBeanDetails)oldBeanDetails.hidden=true;
const advanced=detail($('form'),'進階設定','Advanced settings');for(const k of ['filter','waterSource','cold','ice','notes']){const label=$(k).closest('label');if(label)advanced.append(label);}const scale=$('scale').closest('details');if(scale)advanced.append(scale);
const totals=own(E('p'));$('fields').after(totals);
const recordHeading=records.querySelector('h2');if(recordHeading)text(own(recordHeading),'沖煮紀錄','Brew journal');
const oldPrepare=$('flowPrepare'),begin=$('flowBegin'),mode=$('flowMode'),modeDetails=mode.closest('details'),prepHeading=text(E('h3'),'選配方，準備沖煮','Choose a recipe and brew'),prepGrid=E('div');prepGrid.className='fields';const recipePick=field(prepGrid,'配方','Recipe','',[]),beanPick=field(prepGrid,'咖啡豆','Coffee','',[]),dripperPick=field(prepGrid,'沖煮器具','Brewer','',[]),grinderPick=field(prepGrid,'磨豆機','Grinder','',[]),prepInfo=E('div');prepInfo.className='flow-prepare-summary';const tweak=detail(oldPrepare,'本次微調','Adjust this brew');const dose=field(tweak,'粉量 g','Coffee dose g',20,'number'),temp=field(tweak,'水溫 °C','Temperature °C',92,'number'),grind=field(tweak,'研磨刻度','Grind setting','');const tweakGrindHint=E('p');tweakGrindHint.className='hint';grind.closest('label').append(tweakGrindHint);dose.min='.1';dose.max='200';dose.required=true;temp.max='100';temp.required=true;
let prepared=clean(db.recipes.find(r=>r.id===selected)||db.recipes[0]),preparedDoseBase=prepared.dose,editorRun=null;
const scalePrepBtn=button(tweak,'⚖️ 依粉量等比例縮放水量','⚖️ Scale water to dose',()=>{
 if(run||!dose.reportValidity()||!(prepared.dose>0)||!(preparedDoseBase>0))return;
 const f=prepared.dose/preparedDoseBase;
 if(Math.abs(f-1)<1e-6){msg(L('粉量尚未變更，無須縮放','Dose is unchanged'));return;}
 const scaled=copy(prepared);
 for(const s of scaled.steps){
  if(['悶蒸注水','注水','繞圈注水','中心注水','後加水（bypass）','後加冰塊'].includes(s.type))s.water=Math.round(s.water*f*10)/10;
  if(typeof window.CoffeeScaleGramText==='function'&&s.note)s.note=window.CoffeeScaleGramText(s.note,f).slice(0,1000);
 }
 scaled.cold=Math.round((Number(scaled.cold)||0)*f*10)/10;
 scaled.ice=Math.round((Number(scaled.ice)||0)*f*10)/10;
 if(typeof window.CoffeeScaleGramText==='function'&&scaled.notes)scaled.notes=window.CoffeeScaleGramText(scaled.notes,f).slice(0,3000);
 if(!vr(scaled)){msg(L('縮放後超出範圍','Scaled amounts out of range'));return;}
 prepared=scaled;preparedDoseBase=prepared.dose;render();
 msg(L('已依目前粉量等比例縮放本次水量','Water scaled proportionally to dose'));
});
scalePrepBtn.className='ws-scale-prep-btn';
tweak.append(text(E('p'),'只影響這一杯，不覆蓋原配方；改粉量後可按上方按鈕等比例縮放水量。','Only this brew changes. After changing dose, tap the button above to scale water proportionally.'));oldPrepare.replaceChildren(prepHeading,prepInfo,begin,prepGrid,tweak,modeDetails);
function syncPrepared(){beanSelect(beanPick,prepared);gearSelect(dripperPick,prepared,'dripper');gearSelect(grinderPick,prepared,'grinder');dose.value=prepared.dose;temp.value=prepared.temp;grind.value=prepared.grind;}
function refreshPickers(){beanSelect(defaultSelect,read());recipePick.replaceChildren();for(const r of db.recipes){const o=E('option',(r.favorite?'★ ':'')+r.name);o.value=r.id;recipePick.append(o);}if(!db.recipes.some(r=>r.id===prepared.id)||JSON.stringify(prepared)!==JSON.stringify(clean(db.recipes.find(r=>r.id===prepared.id)))){const o=E('option',L('本次設定：','This brew: ')+prepared.name);o.value='__current';recipePick.append(o);recipePick.value='__current';}else recipePick.value=prepared.id;syncPrepared();}
recipePick.onchange=()=>{const r=db.recipes.find(x=>x.id===recipePick.value);if(r){prepared=clean(r);preparedDoseBase=prepared.dose;syncPrepared();render();}};beanPick.onchange=()=>{stampBean(prepared,beanPick.value);render();};dripperPick.onchange=()=>{stampGear(prepared,'dripper',dripperPick.value);render();};grinderPick.onchange=()=>{stampGear(prepared,'grinder',grinderPick.value);grind.value=prepared.grind;render();};for(const [x,k]of [[dose,'dose'],[temp,'temp'],[grind,'grind']])x.oninput=()=>{prepared[k]=k==='grind'?x.value:x.value===''?NaN:Number(x.value);render();};
const addBeanForBrew=b=>{stampBean(prepared,b.id);syncPrepared();};button(oldPrepare,'＋新增咖啡豆','＋ Add coffee',()=>editBean(null,addBeanForBrew));button(oldPrepare,'📷 拍豆袋新增','📷 Scan coffee bag',()=>editBean(null,addBeanForBrew,{focusScan:true}));let newGearIds=null;button(oldPrepare,'管理／新增器材','Manage / add equipment',()=>{newGearIds=new Set((db.equipment?.items||[]).map(x=>x.id));toolbar.querySelector('button').click();});$('coffeeEquipmentDialog').addEventListener('close',()=>{newGearIds=null;});
const originalStart=$('start').onclick;
const countdownDialog=modal();countdownDialog.id='coffeePrepCountdown';countdownDialog.classList.add('prep-countdown-dialog');
let countdownTimer=null;
function stopCountdown(){if(countdownTimer){clearInterval(countdownTimer);countdownTimer=null;}if(countdownDialog.open)countdownDialog.close();}
countdownDialog.addEventListener('close',()=>{if(countdownTimer){clearInterval(countdownTimer);countdownTimer=null;}});
function startBrewNow(e){if(run)return;editorRun=copy(read());run=clean(prepared);lock(true);stats();live();originalStart.call($('start'),e);}
function runPrepCountdown(e){
 stopCountdown();
 let left=10;
 const first=prepared.steps[0];
 const firstDesc=first?(first.type+(first.water>0?' · '+first.water+' g':'')+(first.sec>0?' · '+first.sec+L(' 秒',' s'):'')):'';
 const titleEl=E('h3',L('準備開始沖煮','Get ready to brew')),nameEl=E('p',prepared.name),numEl=E('div',String(left)),stepEl=E('p',firstDesc?L('第 1 步：','Step 1: ')+firstDesc:''),actions=E('div');
 nameEl.className='hint';numEl.className='prep-countdown-num';stepEl.className='prep-countdown-step';actions.className='prep-countdown-actions';
 const nowBtn=E('button',L('立即開始','Start now'));nowBtn.type='button';nowBtn.className='flow-primary';nowBtn.onclick=()=>{stopCountdown();startBrewNow(e);};
 const cancelBtn=E('button',L('取消','Cancel'));cancelBtn.type='button';cancelBtn.onclick=stopCountdown;
 actions.append(nowBtn,cancelBtn);
 countdownDialog.replaceChildren(titleEl,nameEl,numEl,stepEl,actions);
 countdownDialog.showModal();
 countdownTimer=setInterval(()=>{
  left--;
  if(left<=0){stopCountdown();if(typeof beep==='function')try{beep();}catch(err){}startBrewNow(e);return;}
  numEl.textContent=String(left);
  if(left<=3&&typeof beep==='function')try{beep();}catch(err){}
 },1000);
}
begin.onclick=e=>{if(run)return;if(!dose.reportValidity()||!temp.reportValidity()||!vr(prepared)){msg(L('請確認本次參數與步驟','Check this brew’s parameters and steps'));return;}runPrepCountdown(e);};
const fillBeforeUndo=fill;fill=function(r){if(run&&r===run&&editorRun){selected=editorRun.id;fillBeforeUndo(editorRun);$('recipes').value=selected;}else fillBeforeUndo(r);};
$('coffeeEnterGuide').onclick=()=>{const r=valid();if(!r)return;prepared=clean(r);preparedDoseBase=prepared.dose;refreshPickers();go('guide');};
const scores=detail($('coffeeReviewPanel'),'進階品飲／測量（選填）','Advanced tasting / measurements (optional)');for(const k of [...S,'yieldMass','tds'])scores.append($(k).closest('label'));for(const k of S)$(k).value='';
function cupStepEditor(parent,steps){
const rows=[],list=E('div');parent.append(list);
const add=button(parent,'＋新增步驟','＋ Add step',()=>{if(rows.length>=60)return;create({type:'注水',sec:20,water:30,note:''});refresh();rows[rows.length-1].type.focus();});
function refresh(){rows.forEach((x,i)=>{x.caption[1]='步驟 '+(i+1);x.caption[2]='Step '+(i+1);x.heading.textContent=L(x.caption[1],x.caption[2]);x.up.disabled=i===0;x.down.disabled=i===rows.length-1;x.remove.disabled=rows.length<=1;list.append(x.row);});add.disabled=rows.length>=60;}
function move(x,delta){const i=rows.indexOf(x),j=i+delta;if(i<0||j<0||j>=rows.length)return;rows.splice(i,1);rows.splice(j,0,x);refresh();x.heading.focus();}
function create(step){const row=E('div'),heading=E('h3');row.className='box';heading.tabIndex=-1;row.append(heading);const caption=[heading,'',''];labels.push(caption);
const type=field(row,'動作','Action',step.type,T),sec=field(row,'秒數','Seconds',step.sec,'number'),water=field(row,'新增水量 g','Water added g',step.water,'number'),note=field(row,'提示','Instruction',step.note),kind=field(row,'後加水種類','Bypass water kind',step.waterKind||'cold',['cold','room','hot']),hint=text(E('p'),'本段由使用者確認完成，不強制倒數；後加量不計入萃取注水。','Confirm this step manually; no countdown. Post additions are separate from brew water.');
[['冷水','Cold water'],['常溫水','Room-temperature water'],['熱水','Hot water']].forEach((a,i)=>text(kind.children[i],...a));sec.max='7200';sec.step='1';water.max='3000';note.maxLength=1000;hint.className='hint';row.append(hint);
function waterUI(){const f=configureStep(type,sec,water,kind);hint.hidden=!f.manual;}type.onchange=waterUI;waterUI();
const x={row,heading,caption,type,sec,water,note,kind};x.up=button(row,'↑ 上移','↑ Move up',()=>move(x,-1));x.down=button(row,'↓ 下移','↓ Move down',()=>move(x,1));x.remove=button(row,'刪除此步驟','Delete step',()=>{const i=rows.indexOf(x);if(i<0||rows.length<=1)return;rows.splice(i,1);row.remove();refresh();rows[Math.min(i,rows.length-1)].heading.focus();});rows.push(x);}
steps.forEach(create);refresh();return rows;
}
const editDialog=modal();
function toLocalDatetimeValue(iso){const d=iso?new Date(iso):new Date();const dt=Number.isFinite(d.getTime())?d:new Date();const p=n=>String(n).padStart(2,'0');return `${dt.getFullYear()}-${p(dt.getMonth()+1)}-${p(dt.getDate())}T${p(dt.getHours())}:${p(dt.getMinutes())}`;}
function addCup(){
 if(!db.recipes.length){msg(L('請先建立至少一個配方','Create at least one recipe first'));return;}
 editDialog.replaceChildren();
 const form=E('form');
 editDialog.append(text(E('h2'),'補記沖煮紀錄','Log past brew'),form);
 let r=clean(db.recipes.find(x=>x.id===selected)||db.recipes[0]);
 const templatePick=field(form,'配方範本','Recipe template','',[]);
 templatePick.replaceChildren();
 for(const rec of db.recipes){const o=E('option',(rec.favorite?'★ ':'')+rec.name);o.value=rec.id;templatePick.append(o);}
 templatePick.value=r.id;
 const brewTime=field(form,'沖煮時間','Brew date & time',toLocalDatetimeValue(),'datetime-local');
 brewTime.required=true;
 const pickGrid=E('div');pickGrid.className='fields';form.append(pickGrid);
 const bPick=field(pickGrid,'咖啡豆','Coffee','',[]);
 const dPick=field(pickGrid,'沖煮器具','Brewer','',[]);
 const gPick=field(pickGrid,'磨豆機','Grinder','',[]);
 const quickGrid=E('div');quickGrid.className='fields';form.append(quickGrid);
 const qDose=field(quickGrid,'粉量 g','Coffee dose g',r.dose,'number');qDose.min='.1';qDose.max='200';qDose.required=true;
 const qTemp=field(quickGrid,'水溫 °C','Temperature °C',r.temp,'number');qTemp.min='0';qTemp.max='100';qTemp.required=true;
 const qGrind=field(quickGrid,'研磨刻度','Grind setting',r.grind);
 const seconds=field(quickGrid,'實際計時（秒）','Actual timed seconds',m(r).total,'number');seconds.min='0';seconds.max='86400';seconds.step='1';seconds.required=true;
 const rating=field(form,'喜歡程度','Enjoyment','3',['1','2','3','4','5']);
 const strength=field(form,'濃淡','Strength','剛好',['剛好','太淡','太濃']);
 const taste=field(form,'風味筆記','Tasting notes','','textarea');
 const next=field(form,'下次調整','Next change','');
 const more=detail(form,'進階參數與步驟（選填）','Advanced parameters & steps (optional)');
 const sc={};for(const k of S){sc[k]=field(more,k,k,'','number');sc[k].min='1';sc[k].max='5';sc[k].step='1';}
 const mass=field(more,'成品重 g','Beverage mass g','','number');
 const tds=field(more,'TDS %','TDS %','','number');
 const advFields=E('div');advFields.className='fields';more.append(advFields);
 const advSkip=new Set(['dose','temp','grind',...B]);
 const controls={};
 for(const spec of C){if(!advSkip.has(spec[0]))controls[spec[0]]=field(advFields,spec[1],spec[1],r[spec[0]],spec[2]);}
 if(controls.name)controls.name.required=true;
 const stepWrap=E('div');more.append(stepWrap);
 let rows=cupStepEditor(stepWrap,r.steps);
 function syncFromTemplate(){
  beanSelect(bPick,r);gearSelect(dPick,r,'dripper');gearSelect(gPick,r,'grinder');
  qDose.value=r.dose;qTemp.value=r.temp;qGrind.value=r.grind;seconds.value=m(r).total;
  for(const k of Object.keys(controls))controls[k].value=r[k]??'';
  stepWrap.replaceChildren();rows=cupStepEditor(stepWrap,r.steps);
 }
 syncFromTemplate();
 templatePick.onchange=()=>{const chosen=db.recipes.find(x=>x.id===templatePick.value);if(!chosen)return;r=clean(chosen);syncFromTemplate();};
 bPick.onchange=()=>{stampBean(r,bPick.value);};
 dPick.onchange=()=>{stampGear(r,'dripper',dPick.value);};
 gPick.onchange=()=>{stampGear(r,'grinder',gPick.value);qGrind.value=r.grind;};
 form.append(text(E('p'),'補記只新增這筆沖煮紀錄，不會修改原配方。','Logging this brew adds a journal entry only; the source recipe is unchanged.'));
 const submit=text(E('button'),'新增紀錄','Add entry');submit.type='submit';form.append(submit);
 button(editDialog,'取消','Cancel',()=>editDialog.close());
 form.onsubmit=e=>{
  e.preventDefault();
  if(!form.reportValidity())return;
  if(db.cups.length>=20000){msg(L('紀錄已達上限，請備份清理','Journal limit reached; back up and clear old entries'));return;}
  const nRecipe=copy(r);
  for(const k of Object.keys(controls)){const spec=C.find(x=>x[0]===k);nRecipe[k]=spec&&spec[2]==='number'?Number(controls[k].value):controls[k].value.trim();}
  nRecipe.dose=Number(qDose.value);
  nRecipe.temp=Number(qTemp.value);
  nRecipe.grind=qGrind.value.trim();
  nRecipe.grindValue=nRecipe.grind!==''&&Number.isFinite(Number(nRecipe.grind))&&Number(nRecipe.grind)>=0?Number(nRecipe.grind):null;
  nRecipe.steps=rows.map(stepValue);
  const parsedTime=Date.parse(brewTime.value);
  const isoDate=Number.isFinite(parsedTime)?new Date(parsedTime).toISOString():new Date().toISOString();
  const c={
   id:uid(),
   date:isoDate,
   recipe:nRecipe,
   seconds:Math.round(Number(seconds.value)),
   breaks:m(nRecipe).breaks,
   markers:[],
   strength:strength.value,
   rating:Number(rating.value),
   taste:taste.value.trim(),
   next:next.value.trim(),
   yieldMass:mass.value===''?null:Number(mass.value),
   tds:tds.value===''?null:Number(tds.value)
  };
  for(const k of S)c[k]=sc[k].value===''?null:Number(sc[k].value);
  if(!vd({...db,cups:[c]})){msg(L('請確認數值、步驟與欄位長度','Check values, steps and field lengths'));return;}
  db.cups.unshift(c);
  if(!save()){db.cups.splice(db.cups.indexOf(c),1);msg(L('未能儲存紀錄，請先備份並檢查儲存狀態。','Could not save the entry. Back up and check storage.'));return;}
  editDialog.close();
  logs();
  msg(L('已補記這筆沖煮紀錄','Past brew logged'));
 };
 editDialog.showModal();
}
function editCup(c){editDialog.replaceChildren();const form=E('form');editDialog.append(text(E('h2'),'編輯這杯紀錄','Edit this brew'),form);const rating=field(form,'喜歡程度','Enjoyment',String(c.rating),['1','2','3','4','5']),strength=field(form,'濃淡','Strength',c.strength,['剛好','太淡','太濃']),taste=field(form,'風味筆記','Tasting notes',c.taste,'textarea'),next=field(form,'下次調整','Next change',c.next),seconds=field(form,'實際計時（秒）','Actual timed seconds',c.seconds,'number'),more=detail(form,'修正本次參數','Correct this brew’s parameters'),r=copy(c.recipe),controls={};for(const spec of C)controls[spec[0]]=field(more,spec[1],spec[1],r[spec[0]],spec[2]);controls.name.required=true;const sc={};for(const k of S)sc[k]=field(more,k,k,c[k]??'','number');const mass=field(more,'成品重 g','Beverage mass g',c.yieldMass??'','number'),tds=field(more,'TDS %','TDS %',c.tds??'','number');const rows=cupStepEditor(more,r.steps);form.append(text(E('p'),'只更新這杯，不改原配方與其他紀錄。','Only this entry changes, not the recipe or other entries.'));const submit=text(E('button'),'儲存修改','Save changes');submit.type='submit';form.append(submit);button(editDialog,'取消','Cancel',()=>editDialog.close());form.onsubmit=e=>{e.preventDefault();if(!form.reportValidity())return;const n=copy(c);for(const spec of C)n.recipe[spec[0]]=spec[2]==='number'?Number(controls[spec[0]].value):controls[spec[0]].value.trim();n.recipe.steps=rows.map(stepValue);n.rating=Number(rating.value);n.strength=strength.value;n.taste=taste.value.trim();n.next=next.value.trim();n.seconds=seconds.value===''?NaN:Number(seconds.value);for(const k of S)n[k]=sc[k].value===''?null:Number(sc[k].value);n.yieldMass=mass.value===''?null:Number(mass.value);n.tds=tds.value===''?null:Number(tds.value);if(!vd({...db,cups:[n]})){msg(L('請確認數值、步驟與欄位長度','Check values, steps and field lengths'));return;}if(!same(n.recipe,c.recipe)){delete n.recipe.beanId;delete n.recipe.beanSnapshot;delete n.recipe[FLAVOR];}for(const t of ['dripper','grinder'])if(n.recipe[t]!==c.recipe[t]){delete n.recipe[t+'EquipmentId'];if(n.recipe.equipmentSnapshot)delete n.recipe.equipmentSnapshot[t];}if(n.recipe.grinder!==c.recipe.grinder)delete n.recipe.grindUnit;n.recipe.grindValue=n.recipe.grind.trim()!==''&&Number.isFinite(Number(n.recipe.grind))&&Number(n.recipe.grind)>=0?Number(n.recipe.grind):null;n.originalRecipe=n.originalRecipe||copy(c.recipe);if(JSON.stringify(n.recipe.steps)!==JSON.stringify(c.recipe.steps))for(const k of ['guideEvents','guideCursor','guideMode'])delete n.recipe[k];n.updatedAt=new Date().toISOString();const i=db.cups.findIndex(x=>x.id===c.id);if(i<0)return;db.cups[i]=n;if(!save()){db.cups[i]=c;msg(L('未能儲存修改，原紀錄保留；請先備份並檢查儲存狀態。','Could not save the edit. The original entry was kept; back up and check storage.'));return;}editDialog.close();logs();};editDialog.showModal();}
const shareDialog=modal();let activeCard=null,cardBlob=null,revision=0,shareBeanFlavor='';const canvas=E('canvas'),shareControls=E('div'),format=field(shareControls,'圖片版型','Image format','square',['square','story']),cardTheme=field(shareControls,'卡片風格','Card style','sumi',['sumi','washi']),publicNote=field(shareControls,'本杯風味筆記（分享用，可修改）','This cup’s tasting notes (editable for this card)','','textarea'),gearCheck=field(shareControls,'包含器材','Include equipment','','checkbox'),dateCheck=field(shareControls,'包含日期','Include date','','checkbox'),cardNotice=E('p');publicNote.maxLength=5000;publicNote.rows=3;publicNote.style.width='100%';text(format.children[0],'方形貼文','Square post');text(format.children[1],'直式限時動態','Portrait story');text(cardTheme.children[0],'深夜吧台（黑）','Sumi Dark');text(cardTheme.children[1],'和紙手札（白）','Washi Light');cardNotice.setAttribute('role','status');shareDialog.append(text(E('h2'),'沖煮參數分享卡','Brew parameter card'),shareControls,cardNotice,canvas);
function downloadCard(){if(!cardBlob)return;const u=URL.createObjectURL(cardBlob),a=E('a');a.href=u;a.download='coffee-brew.png';document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(u),15000);}
const downloadButton=button(shareDialog,'下載 PNG','Download PNG',downloadCard),shareButton=button(shareDialog,'分享／下載','Share / download',async()=>{if(!cardBlob)return;try{const f=new File([cardBlob],'coffee-brew.png',{type:'image/png'});if(navigator.canShare&&navigator.canShare({files:[f]})&&navigator.share)await navigator.share({files:[f]});else downloadCard();}catch(e){if(e.name!=='AbortError'){msg(L('無法直接分享，改為下載圖片','Sharing unavailable; downloading instead'));downloadCard();}}});button(shareDialog,'關閉','Close',()=>shareDialog.close());
let cardRendererPromise=null;
function loadCardRenderer(){if(window.CoffeeCardB&&window.CoffeeCardB.flavorSections===true&&window.CoffeeCardB.dualTheme===true&&typeof window.CoffeeCardB.draw==='function')return Promise.resolve(window.CoffeeCardB);if(!cardRendererPromise)cardRendererPromise=new Promise((resolve,reject)=>{const script=E('script');script.src=new URL('coffee-share-card-renderer.js?v=layout-c-dual-1',cardModuleBase).href;script.onload=()=>{if(window.CoffeeCardB&&window.CoffeeCardB.flavorSections===true&&window.CoffeeCardB.dualTheme===true&&typeof window.CoffeeCardB.draw==='function')resolve(window.CoffeeCardB);else{script.remove();reject(Error('Invalid card renderer'));}};script.onerror=()=>{script.remove();reject(Error('Card renderer could not load'));};document.head.append(script);}).catch(error=>{cardRendererPromise=null;throw error;});return cardRendererPromise;}
async function drawCard(){const rev=++revision;cardBlob=null;downloadButton.disabled=shareButton.disabled=true;if(!activeCard)return;try{const renderer=await loadCardRenderer();if(document.fonts){if(document.fonts.load)await document.fonts.load('30px Iansui','一隅咖啡').catch(()=>[]);await document.fonts.ready;}if(rev!==revision)return;canvas.width=1080;canvas.height=format.value==='story'?1920:1080;const ctx=canvas.getContext('2d');if(!ctx)throw Error('Canvas unavailable');const result=renderer.draw(ctx,activeCard,{story:format.value==='story',theme:cardTheme.value,lang:document.documentElement.lang,note:publicNote.value,beanFlavor:shareBeanFlavor,gear:gearCheck.checked,date:dateCheck.checked});cardNotice.textContent=result.fits?L('豆子風味自動取自豆庫，沒有就留空；本杯筆記可修改，原紀錄不變。','Bean flavor comes from the catalog or stays empty. Cup note edits do not change the original entry.'):L('內容超出版面，請縮短本杯筆記、取消器材欄位或改用直式；豆子風味請至豆庫調整。原紀錄不變。','Content exceeds the layout. Shorten cup notes, hide equipment or use portrait; edit bean flavor in the catalog. The original entry is unchanged.');if(!result.fits)return;canvas.toBlob(blob=>{if(rev===revision){cardBlob=blob;downloadButton.disabled=shareButton.disabled=!blob;if(!blob)cardNotice.textContent=L('圖片產生失敗，請重試。','Image generation failed; please retry.');}},'image/png');}catch(e){cardNotice.textContent=L('無法產生圖片，請重試；未匯出，也未修改原紀錄。','Could not generate the image. Retry; nothing was exported or changed.');}}

for(const x of [format,cardTheme,publicNote,gearCheck,dateCheck])x.oninput=drawCard;
function openShare(c){activeCard=copy(c);shareBeanFlavor=catalogFlavor(activeCard.recipe,beans());publicNote.value=String(c.taste||'');cardTheme.value=document.documentElement.dataset.theme==='washi'?'washi':'sumi';gearCheck.checked=dateCheck.checked=false;shareDialog.showModal();drawCard();}
let logSortDesc=true;
const sortButton=own(E('button'));sortButton.type='button';sortButton.id='logSortToggle';
function updateSortLabel(){sortButton.textContent=logSortDesc?L('時間：新 → 舊','Sort: Newest first'):L('時間：舊 → 新','Sort: Oldest first');}
sortButton.onclick=()=>{logSortDesc=!logSortDesc;updateSortLabel();logs();};
const compareBtn=$('compare');if(compareBtn){compareBtn.after(sortButton);const addCupBtn=own(E('button'));addCupBtn.type='button';addCupBtn.id='addCupEntry';text(addCupBtn,'＋補記紀錄','＋ Log past brew');addCupBtn.onclick=addCup;sortButton.after(addCupBtn);}updateSortLabel();
const oldLogs=logs;logs=function(){oldLogs();prune();const q=$('search').value.trim().toLowerCase(),list=db.cups.filter(c=>JSON.stringify(c).toLowerCase().includes(q)),entriesEl=$('entries'),pairs=Array.from(entriesEl.children).map((entry,i)=>({entry,c:list[i],i})).filter(x=>x.c);pairs.forEach(({entry,c})=>{entry.dataset.cupId=c.id;const bar=own(E('div'));bar.className='ws-cup-bar';button(bar,'編輯紀錄','Edit entry',()=>editCup(c));button(bar,'產生分享卡','Share card',()=>openShare(c));button(bar,'另存為配方','Save as recipe',()=>{if(run||db.recipes.length>=500){msg(L('請先重設計時，並確認配方數量上限','Reset the timer and check the recipe limit'));return;}const r=clean(c.recipe);r.id=uid();r.name=r.name.slice(0,250)+L('｜副本',' | Copy');db.recipes.push(r);selected=r.id;save();load();go('brew');});entry.append(bar);});pairs.sort((a,b)=>{const ta=Date.parse(a.c.date),tb=Date.parse(b.c.date),va=Number.isFinite(ta)?ta:0,vb=Number.isFinite(tb)?tb:0;if(va!==vb)return logSortDesc?vb-va:va-vb;return logSortDesc?a.i-b.i:b.i-a.i;});entriesEl.replaceChildren(...pairs.map(x=>x.entry));};
$('search').oninput=()=>logs();
const oldSaveCup=$('saveCup').onclick;$('saveCup').onclick=function(e){const n=db.cups.length;oldSaveCup.call(this,e);if(db.cups.length>n){for(const k of S)$(k).value='';showSub('records');go('history');openShare(db.cups[0]);}};
const oldSave=save;let queued=false;save=function(){const ok=oldSave();if(!queued){queued=true;queueMicrotask(()=>{queued=false;if(newGearIds){for(const x of db.equipment?.items||[])if(!newGearIds.has(x.id)){stampGear(prepared,x.type,x.id);newGearIds.add(x.id);}}refresh();});}return ok;};
const baseRender=render;let prepSummaryKey='';render=function(){if(bound!==db){beans();prepared=clean(db.recipes.find(r=>r.id===selected)||db.recipes[0]);preparedDoseBase=prepared.dose;refresh();}baseRender();const r=read(),x=m(r);totals.textContent=L('萃取注水 ','Brew water ')+x.water+' g'+additionText(r)+' · '+L('粉水比 1:','Ratio 1:')+(r.dose>0?(x.water/r.dose).toFixed(1):'—')+' · '+L('預計 ','Target ')+fmt(x.total*1000);const pm=m(prepared),guideText=grindGuideText(prepared),gearLine=[prepared.dripper,prepared.grinder,prepared.grind?L('刻度 ','Setting ')+prepared.grind+(prepared.grindUnit?' '+prepared.grindUnit:''):L('推薦研磨：','Grind: ')+guideText].filter(Boolean).join(' · '),addLine=additionText(prepared),pKey=JSON.stringify([prepared.name,prepared.dose,pm.water,prepared.temp,pm.total,gearLine,addLine,document.documentElement.lang]);if(pKey!==prepSummaryKey){prepSummaryKey=pKey;tweakGrindHint.textContent=L('推薦：','Recommended: ')+guideText;const h4=E('h4',prepared.name),grid=E('div');grid.className='flow-metrics';for(const [k,v]of [[L('粉量','Coffee'),(Number.isFinite(prepared.dose)?prepared.dose:'—')+' g'],[L('萃取水','Water'),pm.water+' g'],[L('水溫','Temp'),(Number.isFinite(prepared.temp)?prepared.temp:'—')+'°C'],[L('預計時間','Time'),fmt(pm.total*1000)]]){const box=E('div');box.className='flow-metric';box.append(E('span',k),E('strong',v));grid.append(box);}const gearP=E('p',gearLine+(addLine?addLine:''));gearP.className='flow-prepare-gear hint';prepInfo.replaceChildren(h4,grid,gearP);}for(const p of [recipePick,beanPick,dripperPick,grinderPick])p.disabled=!!run;};
let language=document.documentElement.lang;new MutationObserver(()=>{if(language===document.documentElement.lang)return;language=document.documentElement.lang;for(let i=labels.length-1;i>=0;i--){const [x,a,b]=labels[i];if(x.isConnected)x.textContent=L(a,b);else labels.splice(i,1);}updateSortLabel();refresh();if(shareDialog.open)drawCard();}).observe(document.documentElement,{attributes:true,attributeFilter:['lang']});
if(typeof window!=='undefined'&&typeof window.addEventListener==='function')window.addEventListener('coffee-grinder-change',()=>{prepSummaryKey='';render();});
const style=E('style');style.textContent=String.raw`.workspace-tabs{display:flex;gap:6px;margin:16px 0;padding:4px;border-radius:16px;background:#14110f;border:1px solid rgba(245,222,195,.1)}.workspace-tabs button{flex:1;min-width:0;margin:0!important;border-color:transparent!important;background:transparent!important}.workspace-tabs [aria-pressed=true]{background:linear-gradient(135deg,#e7b26f,#d3944b)!important;color:#140e09!important;font-weight:700!important}.workspace-dialog{width:min(720px,calc(100vw - 24px));max-height:90vh;overflow:auto}.workspace-dialog form{display:grid;gap:12px}.workspace-dialog input,.workspace-dialog select{width:100%}.workspace-dialog canvas{display:block;width:100%;height:auto;margin:18px auto;max-width:480px}.workspace-dialog input[type=checkbox]{width:24px}.bean-scan-box{margin:12px 0 16px;padding:12px;border:1px dashed rgba(226,168,99,.38);border-radius:14px;background:rgba(226,168,99,.05)}.bean-scan-actions{display:grid;grid-template-columns:1fr 1fr;gap:8px}.bean-scan-btn{margin:0!important;width:100%;font-size:15px}.bean-scan-hint{margin:8px 0 0;font-size:13px!important;line-height:1.5!important}.bean-scan-preview{display:block;max-width:100%;max-height:180px;margin:10px auto 0;border-radius:10px;border:1px solid rgba(245,222,195,.18);object-fit:contain}.bean-scan-status{margin:8px 0 0;font-size:14px!important}.bean-scan-status.is-ok{color:#86efac!important}.bean-scan-status.is-error{color:#fca5a5!important}.bean-scan-login{margin:8px 0 0!important;display:inline-block;padding:6px 12px!important;min-height:36px!important;font-size:14px!important}.ws-scale-prep-btn{width:100%;margin:6px 0 4px!important;background:rgba(226,168,99,.13)!important;border:1px solid rgba(226,168,99,.38)!important;color:#f3cfa0!important;font-weight:600!important}#history>div>h2:first-child{margin-top:20px}#coffeeWorkspace [hidden]{display:none!important}#coffeeWorkspace .box,#entries>.box{margin:14px 0}#entries .box h3{margin:6px 0 2px;font-size:1.15rem;color:#f5efe6}#entries .box small{color:#b5a899;display:inline-block;margin-bottom:6px}#guide #flowPrepare .fields{margin-bottom:18px}#guide #flowPrepare details{margin:12px 0}.flow-prepare-summary h4{margin:10px 0 8px;font-size:20px;color:#f5efe6}.flow-prepare-gear{margin:8px 0 0}.prep-countdown-dialog{text-align:center;max-width:420px!important}.prep-countdown-num{font-size:clamp(4.5rem,18vw,6.5rem);font-weight:700;line-height:1.1;margin:12px 0;color:#e2a863;text-shadow:0 0 28px rgba(226,168,99,.28);font-family:'JetBrains Mono',monospace;font-variant-numeric:tabular-nums}.prep-countdown-step{font-size:15px;color:#d6cbbd;margin:8px 0 16px}.prep-countdown-actions{display:grid;gap:8px}.prep-countdown-actions button{width:100%;margin:0!important}#coffeeReviewPanel>details label{margin:12px 0}nav .workspace-settings{font-size:.9em}@media(max-width:599px){nav{grid-template-columns:repeat(3,minmax(0,1fr))}nav .workspace-settings{grid-column:1/-1;min-height:40px}nav button{font-size:15px}.workspace-tabs button{font-size:15.5px;padding:10px 6px}.bean-scan-actions{grid-template-columns:1fr}}`;
document.head.append(style);refresh();showSub(location.hash==='#history'?'records':'beans');logs();render();
})();