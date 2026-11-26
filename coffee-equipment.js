(function(){
'use strict';
const SH=['錐形','平底','梯形','浸泡／閥門式','其他／不適用'],MA=['樹脂／塑膠','陶瓷','玻璃','金屬','其他／未填'];
const copy=x=>JSON.parse(JSON.stringify(x)),id=()=>Date.now().toString(36)+Math.random().toString(36).slice(2);
function number(v){const s=String(v??'').trim();return s!==''&&/^(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?$/.test(s)&&Number.isFinite(Number(s))&&Number(s)>=0?Number(s):null;}
function itemOK(x){return x&&typeof x.id==='string'&&x.id.length>0&&x.id.length<160&&['dripper','grinder'].includes(x.type)&&['name','brand','model','shape','material','unit'].every(k=>typeof x[k]==='string'&&x[k].length<=160)&&x.name.trim()&&typeof x.active==='boolean'&&(x.review===undefined||typeof x.review==='boolean');}
function catalogOK(c){return c&&c.version===1&&(c.legacyImported===undefined||typeof c.legacyImported==='boolean')&&Array.isArray(c.items)&&c.items.length<=1000&&c.items.every(itemOK)&&new Set(c.items.map(x=>x.id)).size===c.items.length;}
function key(x){return JSON.stringify([x.type,x.name,x.type==='dripper'?x.shape:'',x.type==='dripper'?x.material:'']);}
function snapshot(r,type){return {id:typeof r[type+'EquipmentId']==='string'?r[type+'EquipmentId']:'',type,name:String(r[type]||''),brand:'',model:'',shape:type==='dripper'?String(r.shape||SH[4]):'',material:type==='dripper'?String(r.material||MA[4]):'',unit:type==='grinder'?String(r.grindUnit||''):'',active:true,review:true};}
function str160(v,fallback=''){return typeof v==='string'?v.trim().slice(0,160):v===null||v===undefined?fallback:String(v).trim().slice(0,160);}
function normalizeItem(raw,seenIds){
 if(!raw||typeof raw!=='object'||Array.isArray(raw))return null;
 const name=str160(raw.name);if(!name)return null;
 const type=raw.type==='grinder'||raw.type==='dripper'?raw.type:(str160(raw.unit)?'grinder':'dripper');
 let itemId=str160(raw.id);if(!itemId||itemId.length>=160||seenIds.has(itemId))itemId=id();
 seenIds.add(itemId);
 const shapeRaw=str160(raw.shape,SH[4]),matRaw=str160(raw.material,MA[4]);
 const out={id:itemId,type,name,brand:str160(raw.brand),model:str160(raw.model),shape:type==='dripper'?(SH.includes(shapeRaw)?shapeRaw:SH[4]):'',material:type==='dripper'?(MA.includes(matRaw)?matRaw:MA[4]):'',unit:type==='grinder'?str160(raw.unit):'',active:typeof raw.active==='boolean'?raw.active:true};
 if(typeof raw.review==='boolean')out.review=raw.review;
 return itemOK(out)?out:null;
}
function normalizeCatalog(data){
 const raw=data&&data.equipment;
 if(!raw||typeof raw!=='object'||Array.isArray(raw)){data.equipment={version:1,items:[]};return data.equipment;}
 const seenIds=new Set(),items=[];
 if(Array.isArray(raw.items))for(const x of raw.items){if(items.length>=1000)break;const clean=normalizeItem(x,seenIds);if(clean)items.push(clean);}
 const out={version:1,items};if(typeof raw.legacyImported==='boolean')out.legacyImported=raw.legacyImported;
 data.equipment=out;return out;
}
function seed(data){const had=data.equipment!==undefined,prev=had?JSON.stringify(data.equipment):'';if(!had)data.equipment={version:1,items:[]};else normalizeCatalog(data);if(!catalogOK(data.equipment))throw Error('Invalid equipment catalog');const c=data.equipment;c.legacyImported=true;if(had&&prev!==JSON.stringify(c)&&typeof save==='function')try{save();}catch(e){}return c;}
if(typeof module!=='undefined'&&module.exports)module.exports={number,itemOK,catalogOK,key,snapshot,seed};
if(typeof document==='undefined'||document.getElementById('coffeeEquipmentManager'))return;
const $=x=>document.getElementById(x),en=()=>document.documentElement.lang==='en',L=(a,b)=>en()?b:a;
let bound=null,catalog,legacy='',busy=false,choice={dripper:null,grinder:null},target=null,editingId=null;
function ensure(){if(bound!==db){catalog=seed(db);bound=db;}return catalog;}
try{ensure();}catch(error){msg(L('器材資料格式不正確，原資料未更動；請先備份。','Invalid equipment data. Existing data was not changed; back up first.'));return;}
const oldRead=read,oldFill=fill,oldLock=lock,oldMigrate=migrate;
migrate=function(data){const next=oldMigrate(data);if(next.equipment!==undefined){normalizeCatalog(next);if(!catalogOK(next.equipment))throw Error('Invalid equipment catalog');}return next;};
function E(tag,text){const x=document.createElement(tag);if(text!==undefined)x.textContent=text;return x;}
const labels=[],fields=[],buttons=[];
function label(parent,a,b,input){const w=E('label'),s=E('span');labels.push([s,a,b]);w.append(s,input);parent.append(w);return w;}
function button(parent,a,b,fn){const x=E('button');x.type='button';buttons.push([x,a,b]);x.onclick=fn;parent.append(x);return x;}
function fixed(v,kind){const a=kind==='shape'?SH:MA,b=kind==='shape'?['Conical','Flat-bottom','Trapezoid','Immersion / valve','Other / N/A']:['Resin / plastic','Ceramic','Glass','Metal','Other / unspecified'],i=a.indexOf(v);return en()&&i>=0?b[i]:v;}
const picker={},addButtons={},summaries={};
for(const t of ['dripper','grinder']){
 const old=$(t),oldLabel=old.closest('label'),box=E('div'),select=E('select'),line=E('div'),small=E('p');box.className='equipment-field';line.className='equipment-line';small.className='hint';select.id='equipment-'+t;select.setAttribute('data-coffee-user-text','true');small.setAttribute('data-coffee-user-text','true');
 old.type='hidden';oldLabel.hidden=true;label(box,t==='dripper'?'濾杯／沖煮器材':'磨豆機',t==='dripper'?'Dripper / brewer':'Grinder',select);box.append(line,small);oldLabel.after(box);
 addButtons[t]=button(line,'＋新增','＋ Add',()=>openForm(null,t,t));picker[t]=select;summaries[t]=small;
 select.onchange=()=>{choice[t]=select.value==='__snapshot'?choice[t]:copy(ensure().items.find(x=>x.id===select.value)||null);const x=choice[t];$(t).value=x?x.name:'';if(t==='dripper'){$('shape').value=x?x.shape:SH[4];$('material').value=x?x.material:MA[4];}else{legacy='';$('grind').value='';}syncDescription();const fn=$(t).oninput;if(fn)fn.call($(t),new Event('input',{bubbles:true}));};
}
for(const k of ['shape','material'])$(k).closest('label').hidden=true;
const grind=$('grind'),grindNote=E('p');grindNote.className='hint';grindNote.setAttribute('data-coffee-user-text','true');grind.closest('label').append(grindNote);grind.type='number';grind.min='0';grind.step='any';grind.inputMode='decimal';grind.removeAttribute('max');grind.required=false;
const grindInput=grind.oninput;grind.oninput=function(event){legacy='';syncDescription();if(grindInput)grindInput.call(this,event);};
let guide={zh:'',en:'',minUm:null,maxUm:null,levelZh:'',levelEn:''};
const methodEl=$('method');if(methodEl)methodEl.addEventListener('change',()=>syncDescription());
function recommendedGrind(){const m=$('method')?$('method').value:'',sh=choice.dripper?choice.dripper.shape:($('shape')?$('shape').value:''),api=typeof window!=='undefined'?window.CoffeeGrinderGuide:null;if(api){const notesVal=$('notes')?$('notes').value:'';const ctx={method:m,shape:sh,grinder:choice.grinder?[choice.grinder.brand,choice.grinder.model,choice.grinder.name].filter(Boolean).join(' '):'',grindGuide:guide.zh,grindGuideEn:guide.en,grindMinUm:guide.minUm,grindMaxUm:guide.maxUm,grindLevel:guide.levelZh,grindLevelEn:guide.levelEn,notes:notesVal};return api.formatGrindGuide(ctx,{lang:document.documentElement.lang});}if(guide.zh||guide.en)return L(guide.zh||guide.en,guide.en||guide.zh);if(m==='愛樂壓')return L('中研磨（C5 Pro 刻度 11–15.2）','Medium (C5 Pro dial 11–15.2)');if(m==='浸泡式')return L('中粗研磨（C5 Pro 刻度 1圈+4.2–1圈+12）','Medium-coarse (C5 Pro dial 1r+4.2–1r+12)');if(m==='越南滴濾壺')return L('中細研磨（C5 Pro 刻度 12.1–1圈+1.2）','Medium-fine (C5 Pro dial 12.1–1r+1.2)');if(m==='手沖'&&sh==='平底')return L('中研磨（C5 Pro 刻度 1圈+1.2–1圈+8.1）','Medium (C5 Pro dial 1r+1.2–1r+8.1)');if(m==='手沖')return L('中細至中研磨（C5 Pro 刻度 14.2–1圈+5.2）','Medium-fine to medium (C5 Pro dial 14.2–1r+5.2)');return L('中研磨（C5 Pro 刻度 1圈+0.2–1圈+8.1）','Medium (C5 Pro dial 1r+0.2–1r+8.1)');}
function options(type,r){const s=picker[type],raw=snapshot(r,type),saved=r.equipmentSnapshot&&r.equipmentSnapshot[type];if(itemOK(saved)&&saved.name===raw.name&&(type!=='dripper'||saved.shape===raw.shape&&saved.material===raw.material)){raw.brand=saved.brand;raw.model=saved.model;raw.unit=saved.unit;}
 const match=ensure().items.find(x=>x.id===raw.id&&key(x)===key(raw))||ensure().items.find(x=>key(x)===key(raw));
 choice[type]=raw.name?copy(match&&key(match)===key(raw)?{...raw,id:match.id}:raw):null;s.replaceChildren();let o=E('option',L('請選擇器材','Choose equipment'));o.value='';s.append(o);
 for(const x of ensure().items.filter(x=>x.type===type&&(x.active||choice[type]&&x.id===choice[type].id&&key(x)===key(choice[type])))){
  o=E('option',x.name+(type==='dripper'?' · '+fixed(x.material,'material'):'')+(!x.active?L('（已停用）',' (inactive)'):''));o.value=x.id;s.append(o);
 }
 if(choice[type]){const exact=match&&key(match)===key(raw);if(exact)s.value=match.id;else{o=E('option',raw.name+L('（配方快照）',' (recipe snapshot)'));o.value='__snapshot';s.append(o);s.value='__snapshot';}}else s.value='';
}
function syncDescription(){const d=choice.dripper,g=choice.grinder,rec=recommendedGrind();summaries.dripper.textContent=d?fixed(d.shape,'shape')+' · '+fixed(d.material,'material'):'';summaries.grinder.textContent=g?[g.brand,g.model,g.unit].filter(Boolean).join(' · '):'';grindNote.textContent=(legacy?L('舊版文字刻度：','Legacy setting: ')+legacy+L('（輸入數字可覆蓋）',' (enter number to replace)'):(g&&g.unit?L('單位：','Unit: ')+g.unit+' · ':''))+(rec?L('推薦：','Recommended: ')+rec:'');}
function sync(r){ensure();options('dripper',r);options('grinder',r);guide={zh:String(r.grindGuide||''),en:String(r.grindGuideEn||''),minUm:Number.isFinite(Number(r.grindMinUm))?Number(r.grindMinUm):null,maxUm:Number.isFinite(Number(r.grindMaxUm))?Number(r.grindMaxUm):null,levelZh:String(r.grindLevel||''),levelEn:String(r.grindLevelEn||'')};legacy=String(r.grind||'').trim()!==''&&number(r.grind)===null?String(r.grind):'';grind.value=legacy?'':String(r.grind||'');const cl=$('convertLegacy');if(cl)cl.hidden=!(Number(r.cold)>0||Number(r.ice)>0);syncDescription();}
read=function(){const r=oldRead();if(busy)return r;for(const t of ['dripper','grinder']){const x=choice[t];r[t]=x?x.name:'';r[t+'EquipmentId']=x?x.id:'';if(t==='dripper'){r.shape=x?x.shape:SH[4];r.material=x?x.material:MA[4];}}r.grind=grind.value===''&&legacy?legacy:grind.value.trim();r.grindValue=number(r.grind);r.grindUnit=choice.grinder?choice.grinder.unit:'';if(guide.zh)r.grindGuide=guide.zh;if(guide.en)r.grindGuideEn=guide.en;if(Number.isFinite(guide.minUm)&&Number.isFinite(guide.maxUm)){r.grindMinUm=guide.minUm;r.grindMaxUm=guide.maxUm;}if(guide.levelZh)r.grindLevel=guide.levelZh;if(guide.levelEn)r.grindLevelEn=guide.levelEn;r.equipmentSnapshot={dripper:copy(choice.dripper),grinder:copy(choice.grinder)};return r;};
fill=function(r){busy=true;try{oldFill(r);}finally{busy=false;}sync(r);stats();live();render();};
lock=function(v){oldLock(v);for(const t of ['dripper','grinder']){picker[t].disabled=v;addButtons[t].disabled=v;}};
const COMMON_PRESETS=[
 {type:'dripper',name:'HARIO V60 01',brand:'HARIO',model:'VD-01T',shape:'錐形',material:'樹脂／塑膠'},
 {type:'dripper',name:'HARIO V60 02',brand:'HARIO',model:'VD-02T',shape:'錐形',material:'樹脂／塑膠'},
 {type:'dripper',name:'HARIO V60 02 陶瓷',brand:'HARIO',model:'VDC-02',shape:'錐形',material:'陶瓷'},
 {type:'dripper',name:'HARIO Switch 02',brand:'HARIO',model:'SSD-200-B',shape:'浸泡／閥門式',material:'玻璃'},
 {type:'dripper',name:'HARIO Mugen 無限濾杯',brand:'HARIO',model:'VDMU-02',shape:'錐形',material:'樹脂／塑膠'},
 {type:'dripper',name:'ORIGAMI S 摺紙濾杯',brand:'ORIGAMI',model:'S',shape:'錐形',material:'陶瓷'},
 {type:'dripper',name:'ORIGAMI Air S',brand:'ORIGAMI',model:'Air S',shape:'錐形',material:'樹脂／塑膠'},
 {type:'dripper',name:'Kalita Wave 155',brand:'Kalita',model:'Wave 155',shape:'平底',material:'金屬'},
 {type:'dripper',name:'Kalita Wave 185',brand:'Kalita',model:'Wave 185',shape:'平底',material:'金屬'},
 {type:'dripper',name:'OREA V4',brand:'OREA',model:'V4',shape:'平底',material:'樹脂／塑膠'},
 {type:'dripper',name:'Timemore B75 冰瞳平底',brand:'Timemore',model:'B75',shape:'平底',material:'樹脂／塑膠'},
 {type:'dripper',name:'April Brewer',brand:'April',model:'Plastic',shape:'平底',material:'樹脂／塑膠'},
 {type:'dripper',name:'CAFEC Flower 花瓣濾杯',brand:'CAFEC',model:'Deep 27 / Flower',shape:'錐形',material:'樹脂／塑膠'},
 {type:'dripper',name:'KONO 名門濾杯',brand:'KONO',model:'MDN-21',shape:'錐形',material:'樹脂／塑膠'},
 {type:'dripper',name:'Clever 聰明濾杯',brand:'Mr. Clever',model:'L-500',shape:'浸泡／閥門式',material:'樹脂／塑膠'},
 {type:'dripper',name:'AeroPress 愛樂壓',brand:'AeroPress',model:'Standard',shape:'其他／不適用',material:'樹脂／塑膠'},
 {type:'dripper',name:'Melitta 梯形濾杯',brand:'Melitta',model:'102',shape:'梯形',material:'陶瓷'},
 {type:'dripper',name:'越南滴濾壺 Phin',brand:'Phin',model:'傳統越式',shape:'平底',material:'金屬'},
 {type:'grinder',name:'Timemore C5 Pro',brand:'Timemore',model:'Chestnut C5 Pro',unit:'圈數+大格.小格（0–15，每圈48響）'},
 {type:'grinder',name:'Timemore C5 ESP Pro',brand:'Timemore',model:'Chestnut C5 ESP Pro',unit:'格 (clicks)'},
 {type:'grinder',name:'Timemore C3 / C3 Pro',brand:'Timemore',model:'Chestnut C3',unit:'格 (clicks)'},
 {type:'grinder',name:'Comandante C40 MK4',brand:'Comandante',model:'C40 MK4',unit:'格 (clicks)'},
 {type:'grinder',name:'1Zpresso ZP6 Special',brand:'1Zpresso',model:'ZP6 Special',unit:'刻度 (號.小格)'},
 {type:'grinder',name:'1Zpresso K-Ultra',brand:'1Zpresso',model:'K-Ultra',unit:'刻度 (號.小格)'},
 {type:'grinder',name:'1Zpresso X-Ultra',brand:'1Zpresso',model:'X-Ultra',unit:'圈.號.小格'},
 {type:'grinder',name:'1Zpresso Q Air / Q2',brand:'1Zpresso',model:'Q Air',unit:'圈.號.小格'},
 {type:'grinder',name:'KINGrinder K6',brand:'KINGrinder',model:'K6',unit:'總響數 (clicks)'},
 {type:'grinder',name:'Fellow Ode Gen 2',brand:'Fellow',model:'Ode Gen 2',unit:'刻度 (1–11)'},
 {type:'grinder',name:'Baratza Encore ESP',brand:'Baratza',model:'Encore ESP',unit:'刻度 (1–40)'},
 {type:'grinder',name:'小飛馬 600N',brand:'楊家 Feima',model:'600N',unit:'刻度 (1–8)'},
 {type:'grinder',name:'Niche Zero',brand:'Niche',model:'Zero',unit:'刻度 (0–50)'}
];
const toolbar=E('div');toolbar.id='coffeeEquipmentManager';$('coffeeRecipePanel').querySelector('h2').after(toolbar);const manage=button(toolbar,'我的器材／新增器材','My equipment / Add equipment',()=>{presetPanel.hidden=ensure().items.length>0;renderPresets();renderList();dialog.showModal();});
const dialog=E('dialog');dialog.id='coffeeEquipmentDialog';dialog.setAttribute('data-equipment-ui','true');const title=E('h2');labels.push([title,'我的器材','My equipment']);const notice=E('div'),presetPanel=E('div'),presetTabs=E('div'),presetGrid=E('div'),list=E('div'),form=E('form');presetPanel.id='coffeeEquipmentPresets';presetPanel.className='equip-presets';presetTabs.className='equip-preset-tabs';presetGrid.className='equip-preset-grid';presetPanel.append(presetTabs,presetGrid);form.className='equipment-edit';dialog.append(title,notice,presetPanel,list,form);document.body.append(dialog);
let presetType='dripper';
function addPresetItem(p){
 const c=ensure();
 if(c.items.length>=1000){notice.textContent=L('器材已達上限','Equipment limit reached');return;}
 if(c.items.some(y=>y.type===p.type&&y.name.trim().toLowerCase()===p.name.toLowerCase())){notice.textContent=L('此器材已在清單中：','Already in your equipment: ')+p.name;return;}
 const item={id:id(),type:p.type,name:p.name,brand:p.brand,model:p.model,shape:p.type==='dripper'?p.shape:'',material:p.type==='dripper'?p.material:'',unit:p.type==='grinder'?p.unit:'',active:true,review:false};
 c.items.push(item);
 const r=read(),ok=save();sync(r);
 if(!run&&target===p.type&&picker[target]){picker[target].value=item.id;picker[target].onchange();}
 renderPresets();renderList();
 notice.textContent=ok?L('已一鍵加入「'+item.name+'」','Added "'+item.name+'"'):L('器材僅暫存於記憶體，請備份','Equipment is only in memory; export a JSON backup.');
}
function renderPresets(){
 const items=ensure().items;
 presetTabs.replaceChildren();
 const dCount=COMMON_PRESETS.filter(p=>p.type==='dripper').length;
 const gCount=COMMON_PRESETS.filter(p=>p.type==='grinder').length;
 for(const [t,zh,enLbl] of [['dripper',`常見濾杯／器具 (${dCount})`,`Common Drippers (${dCount})`],['grinder',`常見磨豆機 (${gCount})`,`Common Grinders (${gCount})`]]){
  const tab=E('button',L(zh,enLbl));tab.type='button';tab.className='champ-pill';tab.setAttribute('aria-pressed',String(presetType===t));
  tab.onclick=()=>{presetType=t;renderPresets();};
  presetTabs.append(tab);
 }
 presetGrid.replaceChildren();
 for(const p of COMMON_PRESETS.filter(x=>x.type===presetType)){
  const exists=items.some(y=>y.type===p.type&&y.name.trim().toLowerCase()===p.name.toLowerCase());
  const btn=E('button');btn.type='button';btn.className='equip-preset-btn';btn.disabled=exists;
  const sub=p.type==='dripper'?fixed(p.shape,'shape')+' · '+fixed(p.material,'material'):p.unit;
  const top=E('strong',(exists?'✓ ':'＋ ')+p.name),bot=E('span',sub);
  btn.append(top,bot);
  btn.onclick=()=>addPresetItem(p);
  presetGrid.append(btn);
 }
}
const togglePresetBtn=button(dialog,'⚡ 常見器材快速加入','⚡ Quick-add common gear',()=>{presetPanel.hidden=!presetPanel.hidden;if(!presetPanel.hidden)renderPresets();});
button(dialog,'＋手動新增器材','＋ Add custom',()=>openForm());const clearReviewBtn=button(dialog,'一鍵全部確認','Confirm all',()=>{const r=read();for(const item of ensure().items)if(item.review)item.review=false;const ok=save();sync(r);renderList();if(ok)msg(L('已清除全部待確認標記','Cleared all review tags'));});clearReviewBtn.hidden=true;button(dialog,'關閉','Close',()=>dialog.close());
const controls={};function input(k,a,b,type='text'){const x=E('input');x.type=type;x.id='equipment-form-'+k;x.maxLength=160;controls[k]=x;label(form,a,b,x);return x;}function select(k,a,b,values){const x=E('select');x.id='equipment-form-'+k;for(const [v,z,e] of values){const o=E('option',z);o.value=v;labels.push([o,z,e]);x.append(o);}controls[k]=x;return label(form,a,b,x);}
select('type','器材類別','Equipment category',[['dripper','濾杯／沖煮器材','Dripper / brewer'],['grinder','磨豆機','Grinder']]);input('name','名稱／暱稱','Name / nickname').required=true;input('brand','品牌（選填）','Brand (optional)');input('model','型號（選填）','Model (optional)');const shapeLabel=select('shape','類型','Shape',SH.map((x,i)=>[x,x,['Conical','Flat-bottom','Trapezoid','Immersion / valve','Other / N/A'][i]]));const materialLabel=select('material','材質','Material',MA.map((x,i)=>[x,x,['Resin / plastic','Ceramic','Glass','Metal','Other / unspecified'][i]]));const unitLabel=input('unit','刻度單位（例如格、點；選填）','Setting unit, e.g. clicks (optional)').parentElement;
function typeUI(){shapeLabel.hidden=materialLabel.hidden=controls.type.value!=='dripper';unitLabel.hidden=controls.type.value!=='grinder';}controls.type.onchange=typeUI;
const submit=E('button');submit.type='submit';buttons.push([submit,'儲存器材','Save equipment']);form.append(submit);form.hidden=true;
function confirmLocal(text,action,host=null){dialog.querySelectorAll('.equipment-confirm').forEach(el=>el.remove());notice.replaceChildren();if(host){const wrap=E('div');wrap.className='equipment-confirm';wrap.append(E('p',text));button(wrap,'確定','Confirm',()=>{wrap.remove();action();});button(wrap,'取消','Cancel',()=>wrap.remove());host.append(wrap);localize(false);return;}notice.append(E('p',text));button(notice,'確定','Confirm',()=>{notice.replaceChildren();action();});button(notice,'取消','Cancel',()=>notice.replaceChildren());localize(false);}
function renderList(){const items=ensure().items;clearReviewBtn.hidden=!items.some(x=>x.review);list.replaceChildren();for(const x of items){const box=E('div');box.className='box';const name=E('h3',x.name),description=E('p',(x.type==='dripper'?fixed(x.shape,'shape')+' · '+fixed(x.material,'material'):[x.brand,x.model,x.unit].filter(Boolean).join(' · '))+(x.review?L('（由舊配方匯入，請確認）',' (imported from old records; review)'):''));name.setAttribute('data-coffee-user-text','true');description.setAttribute('data-coffee-user-text','true');box.append(name,description);button(box,'編輯','Edit',()=>openForm(x));button(box,x.active?'停用':'啟用',x.active?'Deactivate':'Activate',()=>confirmLocal(L('切換器材狀態？過去紀錄不變。','Change equipment availability? Past records are unchanged.'),()=>{const r=read();x.active=!x.active;const ok=save();sync(r);renderList();if(ok)msg(L('器材狀態已更新','Equipment status updated'));},box));const delBtn=button(box,'刪除','Delete',()=>confirmLocal(L('刪除此器材？過去的配方與沖煮紀錄不受影響。','Delete this equipment? Past recipes and brew entries are unchanged.'),()=>{const curItems=ensure().items,idx=curItems.indexOf(x);if(idx<0)return;curItems.splice(idx,1);const r=read(),ok=save();if(!ok){curItems.splice(idx,0,x);msg(L('未能刪除器材，原資料保留；請先備份並檢查儲存狀態。','Could not delete equipment; original data kept.'));return;}sync(r);renderList();msg(L('已刪除器材','Equipment deleted'));},box));delBtn.className='cv-icon-danger';list.append(box);}localize(false);}
function openForm(x=null,type='dripper',pick=null){if(run&&pick){msg(L('請先重設計時','Reset the timer first'));return;}target=pick;editingId=x?x.id:null;for(const k of Object.keys(controls))controls[k].value=x?x[k]:(k==='type'?type:k==='shape'?SH[0]:k==='material'?MA[0]:'');controls.type.disabled=!!x;typeUI();form.hidden=false;notice.replaceChildren();if(!x){presetType=type==='grinder'?'grinder':'dripper';presetPanel.hidden=false;renderPresets();}else{presetPanel.hidden=true;}if(!dialog.open){renderList();dialog.showModal();}localize(false);controls.name.focus();}
form.onsubmit=event=>{event.preventDefault();if(!form.reportValidity())return;const c=ensure(),previous=c.items.find(x=>x.id===editingId),x={id:previous?previous.id:id(),active:previous?previous.active:true,review:false};for(const k of Object.keys(controls))x[k]=controls[k].value.trim();if(x.type==='grinder'){x.shape='';x.material='';}else x.unit='';if(!itemOK(x)||!x.name.trim()){msg(L('請確認器材資料','Check equipment data'));return;}if(c.items.some(y=>y.id!==x.id&&y.type===x.type&&y.name.trim().toLowerCase()===x.name.toLowerCase())){msg(L('同類器材名稱已存在，請使用不同暱稱。','That name already exists in this category. Use a different nickname.'));return;}if(!previous&&c.items.length>=1000){msg(L('器材已達上限','Equipment limit reached'));return;}const r=read();if(previous)c.items[c.items.indexOf(previous)]=x;else c.items.push(x);const ok=save();sync(r);if(!run&&target){picker[target].value=x.id;picker[target].onchange();}form.hidden=true;renderPresets();renderList();notice.textContent=ok?L('器材已儲存；配方若有變更，請另按儲存配方。','Equipment saved. Save the recipe separately if you changed it.'):L('器材僅暫存於記憶體，請匯出JSON備份。','Equipment is only in memory; export a JSON backup.');};
function localize(refresh=true){for(const group of [labels,buttons])for(let i=group.length-1;i>=0;i--)if(!group[i][0].isConnected)group.splice(i,1);for(const [x,a,b]of [...labels,...buttons])x.textContent=L(a,b);syncDescription();if(refresh&&dialog.open){renderPresets();renderList();}}
let lastLanguage=document.documentElement.lang;const languageObserver=new MutationObserver(()=>{const next=document.documentElement.lang;if(next!==lastLanguage){lastLanguage=next;const r=read();options('dripper',r);options('grinder',r);localize();}});languageObserver.observe(document.documentElement,{attributes:true,attributeFilter:['lang']});
const style=E('style');style.textContent='.equipment-line{display:flex;gap:8px}.equipment-field{min-width:0}#coffeeEquipmentDialog{width:min(760px,calc(100vw - 24px));max-height:88vh;overflow:auto}#coffeeEquipmentDialog input,#coffeeEquipmentDialog select{width:100%}.equipment-edit{display:grid;gap:12px;margin:20px 0}#coffeeEquipmentManager{margin:12px 0}.equipment-confirm{margin-top:10px;padding:10px 12px;border-radius:10px;border:1px solid rgba(226,168,99,.38);background:rgba(226,168,99,.08)}.equipment-confirm p{margin:0 0 8px;font-size:14px}.equip-presets{margin:12px 0 16px;padding:12px;border-radius:6px;border:1px solid var(--rule,rgba(245,222,195,.16));background:var(--surface,rgba(245,222,195,.04))}.equip-preset-tabs{display:flex;flex-wrap:wrap;gap:6px;margin-bottom:10px}.equip-preset-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(190px,1fr));gap:8px}.equip-preset-btn{display:flex;flex-direction:column;align-items:flex-start;text-align:left;gap:2px;margin:0!important;padding:8px 10px!important;min-height:48px!important;border-radius:4px!important;background:var(--bg,#161311)!important;border:1px solid var(--rule-strong,rgba(245,222,195,.18))!important}.equip-preset-btn strong{font-size:13.5px;color:var(--ink,#f5efe6)}.equip-preset-btn span{font-size:11.5px;color:var(--ink-2,#b5a899)}.equip-preset-btn:hover:not(:disabled){border-color:var(--accent,#d98a4e)!important;background:var(--accent-soft,rgba(217,138,78,.14))!important}.equip-preset-btn:disabled{opacity:.55}';document.head.append(style);
const r=db.recipes.find(x=>x.id===selected)||db.recipes[0];sync(r);localize(false);
if(typeof window!=='undefined'){if(typeof window.addEventListener==='function')window.addEventListener('coffee-grinder-change',()=>syncDescription());window.CoffeeEquipment={openManager:()=>manage.click(),openPresets:(type='dripper')=>{presetType=type==='grinder'?'grinder':'dripper';presetPanel.hidden=false;renderPresets();renderList();if(!dialog.open)dialog.showModal();}};}
})();