(function(){
'use strict';
const drafts=new Map(),draftKinds=new Map();let sourceDB=db;
const originalRead=read,originalFavorite=$('fav').onclick,originalDelete=$('deleteRecipe').onclick;
read=function(){const r=originalRead();if(drafts.has(selected))r.favorite=!!drafts.get(selected).favorite;return r;};
function stash(){if(drafts.has(selected))drafts.set(selected,read());}
load=function(){
 if(sourceDB!==db){drafts.clear();draftKinds.clear();sourceDB=db;}
 const all=[...db.recipes,...drafts.values()];const r=all.find(x=>x.id===selected)||db.recipes[0];selected=r.id;
 $('recipes').replaceChildren();all.sort((a,b)=>Number(!!b.favorite)-Number(!!a.favorite)).forEach(x=>{const o=e('option',(drafts.has(x.id)?'〔未儲存草稿〕 ':'')+(x.favorite?'★ ':'')+x.name);o.value=x.id;$('recipes').append(o);});
 $('recipes').value=selected;fill(r);$('saveRecipe').textContent=drafts.has(selected)?'儲存為新配方':'儲存配方';
};
function stage(r,kind){
 if(run){msg('請先重設計時');return;}noUndo();stash();
 let id=draftKinds.get(kind);
 if(!drafts.has(id)){if(db.recipes.length>=500){msg('配方已達上限');return;}r.id=uid();id=r.id;drafts.set(id,cp(r));draftKinds.set(kind,id);}
 selected=id;reset();load();msg('目前是草稿，按「儲存為新配方」才會加入清單；關閉頁面不保留草稿。');
}
$('add').onclick=()=>stage(sample(),'pour');$('aero').onclick=()=>stage(sample(true),'aero');
$('copy').onclick=()=>{const r=valid();if(!r)return;r.name+='｜副本';stage(r,'copy');};
$('recipes').onchange=x=>{noUndo();stash();selected=x.target.value;reset();load();};
$('form').onsubmit=x=>{
 x.preventDefault();const r=valid();if(!r)return;noUndo();const i=db.recipes.findIndex(x=>x.id===selected);
 if(i<0){if(db.recipes.length>=500){msg('配方已達上限');return;}db.recipes.push(r);}else db.recipes[i]=r;
 drafts.delete(selected);for(const [k,id]of draftKinds)if(id===selected)draftKinds.delete(k);
 const ok=save();load();if(ok)msg(i<0?'新配方已儲存':'配方已更新');
};
$('fav').onclick=()=>{if(!drafts.has(selected)){originalFavorite();return;}const r=read();r.favorite=!r.favorite;drafts.set(selected,r);load();msg('收藏設定會隨草稿一起儲存');};
$('deleteRecipe').onclick=()=>{if(!drafts.has(selected)){originalDelete();return;}ask('放棄目前草稿？已存配方和沖煮紀錄不受影響。',()=>{const id=selected;drafts.delete(id);for(const [k,v]of draftKinds)if(v===id)draftKinds.delete(k);selected=db.recipes[0].id;reset();load();msg('已放棄草稿');});};
$('add').textContent='手沖草稿';$('aero').textContent='愛樂壓草稿';
load();
})();
(function(){
'use strict';
if(typeof document==='undefined')return;
const select=document.getElementById('recipes'),button=document.getElementById('deleteRecipe');
if(!select||!button||document.getElementById('recipePicker'))return;
const label=select.parentElement;
if(!label||label.tagName!=='LABEL')return;
const row=document.createElement('div');row.id='recipePicker';
row.style.cssText='display:grid;grid-template-columns:minmax(0,1fr) auto;gap:10px;align-items:stretch;margin:8px 0 16px;';
label.after(row);row.append(select,button);
label.textContent='已存配方';label.htmlFor='recipes';
select.style.minWidth='0';
button.type='button';button.textContent='刪除';
button.title='刪除目前選取的配方，不刪除沖煮紀錄';
button.setAttribute('aria-label','刪除目前選取的配方');
button.style.margin='0';button.style.whiteSpace='nowrap';
const version=document.querySelector('small');
if(version&&version.textContent.includes('網站測試版'))version.textContent='2.2.2 網站測試版 · 黑白芫荽';
})();
(function(){
'use strict';
if(typeof document==='undefined'||document.getElementById('coffeeResponsiveStyle'))return;
const grid=document.querySelector('#brew>.grid');
if(!grid||grid.children.length<2)return;
const style=document.createElement('style');style.id='coffeeResponsiveStyle';
style.textContent=String.raw`html{scroll-padding-top:92px}
body{font-size:18px}
main,main section,.grid,.card,.fields,.fields>label,.fields>div{min-width:0}
#brew>.grid{display:grid;grid-template-columns:minmax(0,1fr);gap:20px;align-items:start}
#brew>.grid>.card{min-width:0}
.fields{grid-template-columns:repeat(2,minmax(0,1fr))}
input,select,textarea{max-width:100%;min-width:0;font-size:1rem}
button{touch-action:manipulation}
nav{position:sticky;top:0;z-index:30;background:#111;border-bottom:1px solid #444;display:flex;flex-wrap:wrap;gap:8px;padding:12px 0}
nav button{flex:1 1 120px;margin:0;white-space:nowrap}
#recipePicker{grid-template-columns:minmax(0,1fr) auto!important}
#recipes{min-width:0;text-overflow:ellipsis}
#deleteRecipe{min-width:72px;min-height:48px}
#timer{font-size:clamp(4rem,12vw,7rem);line-height:1.35;font-variant-numeric:tabular-nums}
#phase,#target{overflow-wrap:anywhere;line-height:1.6}
#coffeeRecipePanel,#coffeeTimerPanel{scroll-margin-top:92px}
.coffee-jumps{display:flex;gap:10px;margin:14px 0}
.coffee-jumps a{flex:1;text-align:center;padding:12px;border:1px solid #777;border-radius:10px;color:#fff;text-decoration:none;min-height:48px}
#coffeeLayoutStatus{display:block;margin:4px 0 12px;color:#bbb;font-size:14px}
#entries{display:grid;grid-template-columns:minmax(0,1fr);gap:16px}
#entries>.box{margin:0;min-width:0}
#entries p,#comparison td,#comparison th{overflow-wrap:anywhere}
#comparison{max-width:100%;overscroll-behavior-x:contain}
#comparison table{min-width:620px;table-layout:fixed}
#comparison th:first-child{width:24%}
dialog{max-width:min(540px,calc(100vw - 32px));box-sizing:border-box}
#toast{max-width:calc(100vw - 24px);box-sizing:border-box}
@media (max-width:599px){
 body{padding:12px;font-size:17px}h1{font-size:clamp(1.8rem,8vw,2.6rem)}
 nav{gap:6px}nav button{flex:1 1 0;padding:10px 5px;font-size:16px;min-height:48px}
 #brew>.grid{gap:14px}#coffeeTimerPanel{order:-1}
 .card{padding:16px}.fields{grid-template-columns:minmax(0,1fr)}
 button{min-height:48px}input,select,textarea{font-size:17px}
 #start,#finish,#resetTimer{min-width:calc(33.333% - 12px);padding:11px 7px}
 #saveCup,#saveRecipe{width:100%;margin:12px 0}
 #compare{width:100%;margin:12px 0}
 #comparison table,#comparison tbody{display:block;min-width:0;width:100%}
 #comparison tr{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));border:1px solid #555;border-radius:12px;margin:12px 0;overflow:hidden}
 #comparison tr>th:first-child{grid-column:1/-1;width:auto;background:#222}
 #comparison td,#comparison th{min-width:0;padding:12px;font-size:16px;border-bottom:0}
 #comparison td+td{border-left:1px solid #444}
}
@media (min-width:600px) and (max-width:1023px){
 body{padding:20px}.fields{grid-template-columns:repeat(2,minmax(0,1fr))}
 .card{padding:22px}#timer{font-size:clamp(5rem,12vw,7rem)}
}
@media (min-width:1024px){
 #brew>.grid{grid-template-columns:minmax(0,1.08fr) minmax(0,1fr);gap:24px}
 .coffee-jumps{display:none}#entries{grid-template-columns:repeat(2,minmax(0,1fr))}
 nav{justify-content:flex-start}nav button{flex:0 1 auto;min-width:140px}
}
@media (min-width:1024px) and (min-height:600px){
 #coffeeTimerPanel{position:sticky;top:90px;max-height:calc(100vh - 110px);max-height:calc(100dvh - 110px);overflow:auto;overscroll-behavior:contain}
}
@media (pointer:coarse){button,input,select,.coffee-jumps a{min-height:52px}button{padding-left:16px;padding-right:16px}#deleteRecipe{min-width:80px}}
@media (prefers-reduced-motion:reduce){html{scroll-behavior:auto}*{animation:none!important;transition:none!important}}`;
document.head.append(style);
const recipe=grid.children[0],timer=grid.children[1];
recipe.id='coffeeRecipePanel';timer.id='coffeeTimerPanel';
const jumps=document.createElement('div');jumps.className='coffee-jumps';
for(const [text,id]of [['編輯配方','coffeeRecipePanel'],['沖煮計時','coffeeTimerPanel']]){
 const link=document.createElement('a');link.textContent=text;link.href='#'+id;jumps.append(link);
}
grid.before(jumps);
const version=document.querySelector('small');
if(version&&version.textContent.includes('網站測試版')){
 version.textContent='2.3.0 網站測試版 · 黑白芫荽';
 const badge=document.createElement('span');badge.id='coffeeLayoutStatus';version.after(badge);
 if(typeof window!=='undefined'&&window.matchMedia){
  const phone=window.matchMedia('(max-width:599px)'),tablet=window.matchMedia('(max-width:1023px)'),portrait=window.matchMedia('(orientation:portrait)');
  const update=()=>{badge.textContent=(phone.matches?'手機窄螢幕':tablet.matches?'平板／中型視窗':'寬螢幕雙欄')+' · '+(portrait.matches?'直向':'橫向');};
  for(const media of [phone,tablet,portrait]){
   if(media.addEventListener)media.addEventListener('change',update);else if(media.addListener)media.addListener(update);
  }
  update();
 }
}
})();