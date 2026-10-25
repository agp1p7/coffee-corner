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