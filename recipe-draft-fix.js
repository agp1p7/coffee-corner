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
  const update=()=>{badge.textContent=(phone.matches?'手機窄螢幕':tablet.matches?'平板／中型視窗':'寬螢幕')+' · '+(portrait.matches?'直向':'橫向');};
  for(const media of [phone,tablet,portrait]){
   if(media.addEventListener)media.addEventListener('change',update);else if(media.addListener)media.addListener(update);
  }
  update();
 }
}
})();
(function(){
'use strict';
if(typeof document==='undefined'||document.getElementById('guide'))return;
const main=document.querySelector('main'),brew=document.getElementById('brew'),grid=document.querySelector('#brew>.grid'),nav=document.querySelector('nav');
const recipe=document.getElementById('coffeeRecipePanel'),timer=document.getElementById('coffeeTimerPanel');
if(!main||!brew||!grid||!nav||!recipe||!timer)return;
function make(tag,text){const x=document.createElement(tag);if(text!==undefined)x.textContent=text;return x;}
const guide=make('section');guide.id='guide';guide.hidden=true;
const heading=make('h2','引導沖煮');heading.tabIndex=-1;
const summary=make('p');summary.id='coffeeGuideRecipe';summary.className='box';
const back=make('button','← 返回配方');back.type='button';
const note=make('p','返回配方不會停止計時；若要修改沖煮中的參數，請先重設。');note.className='hint';
const panels=make('div');panels.className='coffee-guide-grid';
const review=make('article');review.id='coffeeReviewPanel';review.className='card';
const tasteHeading=Array.from(timer.children).find(x=>x.tagName==='H2'&&x.textContent.includes('這杯'));
if(tasteHeading){let item=tasteHeading;while(item){const next=item.nextSibling;review.append(item);item=next;}}
panels.append(timer);if(review.children.length)panels.append(review);
guide.append(back,heading,summary,note,panels);brew.after(guide);
const oldJumps=document.querySelector('.coffee-jumps');if(oldJumps)oldJumps.remove();
const entry=make('div');entry.className='coffee-guide-entry';
const enter=make('button','進入沖煮 →');enter.type='button';enter.id='coffeeEnterGuide';
const entryNote=make('p','選好或調整配方後進入。草稿也能沖煮；進入頁面不會自動開始計時，也不會自動儲存配方。');entryNote.className='hint';entry.append(enter,entryNote);
const picker=document.getElementById('recipePicker');if(picker)picker.after(entry);else recipe.append(entry);
const guideTab=make('button','引導沖煮');guideTab.type='button';guideTab.dataset.tab='guide';
const recipeTab=Array.from(nav.querySelectorAll('button')).find(x=>x.dataset.tab==='brew');
if(recipeTab){recipeTab.textContent='配方';recipeTab.after(guideTab);}else nav.append(guideTab);
const live=document.getElementById('live');if(live&&timer.contains(live)){const d=make('details');d.id='coffeeGuideSteps';d.append(make('summary','完整沖煮步驟'));live.before(d);d.append(live);}
const statsNode=document.getElementById('stats');if(statsNode&&timer.contains(statsNode)){const d=make('details');d.id='coffeeGuideStats';d.append(make('summary','配方摘要與粉水比'));statsNode.before(d);d.append(statsNode);}
const allowed=new Set(['brew','guide','history','settings']);
function go(id,push=true){
 if(!allowed.has(id))id='brew';
 if(id==='guide'&&!run){
  const form=document.getElementById('form');
  if(!form.checkValidity()||!vr(read())){go('brew',push);valid();return;}
 }
 if(id==='guide'){
  const r=run||read(),x=m(r);
  summary.textContent=r.name+' · '+(r.dripper||r.method)+'\n'+r.dose+' g 粉 · '+x.water+' g 萃取水 · '+r.temp+'°C';
  statsUpdate();
 }
 document.querySelectorAll('main>section').forEach(x=>x.hidden=x.id!==id);
 nav.querySelectorAll('button').forEach(x=>{const current=x.dataset.tab===id;x.classList.toggle('coffee-current-tab',current);if(current)x.setAttribute('aria-current','page');else x.removeAttribute('aria-current');});
 if(id==='history')logs();
 if(typeof window!=='undefined'){
  if(push&&window.history&&window.location.hash!=='#'+id){try{window.history.pushState({coffeePage:id},'','#'+id);}catch(error){}}
 }
}
function statsUpdate(){stats();render();}
enter.onclick=()=>{go('guide');if(!guide.hidden){heading.focus({preventScroll:true});guide.scrollIntoView({block:'start'});}};
back.onclick=()=>go('brew');
nav.querySelectorAll('button').forEach(x=>x.onclick=()=>go(x.dataset.tab));
const originalSaveCup=document.getElementById('saveCup').onclick;
document.getElementById('saveCup').onclick=function(event){const before=db.cups.length;originalSaveCup.call(this,event);if(db.cups.length>before&&store)go('history');};
const style=make('style');style.id='coffeeGuidePageStyle';
style.textContent=String.raw`html{scroll-padding-top:var(--coffeeNavHeight,132px)}
#brew>.grid{display:block!important;max-width:1100px;margin:0 auto}
#guide,#coffeeRecipePanel,#coffeeTimerPanel,#coffeeReviewPanel{scroll-margin-top:var(--coffeeNavHeight,132px)}
#guide .coffee-guide-grid{display:grid;grid-template-columns:minmax(0,1fr);gap:20px;align-items:start}
#guide .coffee-guide-grid>#coffeeTimerPanel{position:static;max-height:none;overflow:visible;order:0}
#coffeeReviewPanel{min-width:0;order:1}
#coffeeGuideRecipe{margin:12px 0;font-size:18px;white-space:pre-wrap}
.coffee-guide-entry{margin:14px 0 20px}
#coffeeEnterGuide{width:100%;margin:0;background:#fff;color:#111;min-height:54px}
nav{display:grid;grid-template-columns:repeat(4,minmax(0,1fr))}
nav button{min-width:0!important;width:100%;white-space:normal}
nav button.coffee-current-tab{background:#fff;color:#111}
#guide #timer{font-size:clamp(4.5rem,12vw,8rem)}
#coffeeGuideSteps,#coffeeGuideStats{padding:8px 0}
@media(min-width:1024px){#guide .coffee-guide-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}
@media(max-width:599px){
 nav{grid-template-columns:repeat(2,minmax(0,1fr))}
 #guide .coffee-guide-grid{gap:14px}
 #coffeeEnterGuide,#guide #saveCup{width:100%}
 #comparison tr:first-child{display:none}
 #comparison td::before{display:block;color:#bbb;font-size:14px;margin-bottom:8px}
 #comparison td:nth-of-type(1)::before{content:'第一杯'}
 #comparison td:nth-of-type(2)::before{content:'第二杯'}
}`;
document.head.append(style);
const version=document.querySelector('small');if(version&&version.textContent.includes('網站測試版'))version.textContent='2.4.0 網站測試版 · 黑白芫荽';
function navSize(){document.documentElement.style.setProperty('--coffeeNavHeight',(nav.getBoundingClientRect().height+12)+'px');}
navSize();
if(typeof ResizeObserver!=='undefined'){const observer=new ResizeObserver(navSize);observer.observe(nav);}
else if(typeof window!=='undefined')window.addEventListener('resize',navSize,{passive:true});
function fromHash(){return typeof window!=='undefined'?window.location.hash.slice(1):'brew';}
if(typeof window!=='undefined'){window.addEventListener('popstate',()=>go(fromHash(),false));window.addEventListener('hashchange',()=>go(fromHash(),false));}
go(fromHash()||'brew',false);
})();
(function(){
'use strict';
if(typeof window==='undefined'||typeof document==='undefined'||document.getElementById('coffeeNavScrollStyle'))return;
const nav=document.querySelector('nav');if(!nav)return;
const style=document.createElement('style');style.id='coffeeNavScrollStyle';style.textContent='nav.coffee-auto-hide-nav{transform:translateY(0);opacity:1;transition:transform 180ms ease,opacity 180ms ease}nav.coffee-auto-hide-nav.coffee-nav-hidden{transform:translateY(calc(-100% - 16px));opacity:0;pointer-events:none}@media(prefers-reduced-motion:reduce){nav.coffee-auto-hide-nav{transition:none}}';document.head.append(style);nav.classList.add('coffee-auto-hide-nav');
function position(){const max=Math.max(0,document.documentElement.scrollHeight-window.innerHeight);return Math.max(0,Math.min(max,window.scrollY||0));}
let last=position(),distance=0,hidden=false,pending=false,keyboard=false,holdUntil=0;
function hide(value){if(hidden===value)return;hidden=value;nav.classList.toggle('coffee-nav-hidden',value);}
function reveal(){hide(false);last=position();distance=0;holdUntil=performance.now()+300;}
function update(){pending=false;const y=position(),delta=y-last;last=y;
 if(y<=32||performance.now()<holdUntil||(keyboard&&nav.contains(document.activeElement))){distance=0;hide(false);return;}
 if(Math.abs(delta)<1)return;
 if(!hidden&&nav.getBoundingClientRect().top>1){distance=0;return;}
 distance=Math.sign(delta)===Math.sign(distance)?distance+delta:delta;
 if(distance>=24){hide(true);distance=0;}else if(distance<=-10){hide(false);distance=0;}
}
function queue(){if(!pending){pending=true;window.requestAnimationFrame(update);}}
window.addEventListener('scroll',queue,{passive:true});
nav.addEventListener('focusin',reveal);nav.addEventListener('click',reveal,true);
document.addEventListener('keydown',event=>{if(event.key==='Tab'||nav.contains(document.activeElement)){keyboard=true;if(nav.contains(document.activeElement))reveal();}},true);
document.addEventListener('pointerdown',()=>{keyboard=false;},{capture:true,passive:true});
window.addEventListener('resize',reveal,{passive:true});window.addEventListener('orientationchange',reveal,{passive:true});
window.addEventListener('popstate',reveal,true);window.addEventListener('hashchange',reveal,true);
document.addEventListener('visibilitychange',()=>{if(!document.hidden)reveal();});
})();