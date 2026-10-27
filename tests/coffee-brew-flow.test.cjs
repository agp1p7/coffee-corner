'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const source=fs.readFileSync(require.resolve('../coffee-brew-flow.js'),'utf8');
const F=require('../coffee-brew-flow.js');
let passed=0;
function test(name,f){f();passed++;console.log('PASS '+name);}
const s=(type,sec,water=0,note='')=>({type,sec,water,note});
const pour=()=>s('繞圈注水',10,100);
const additions=()=>[pour(),s('後加水（bypass）',0,30),s('後加冰塊',0,60)];
const state=mode=>({i:0,start:0,mode,events:[]});
class Node{
 constructor(tag,doc){this.tagName=tag.toUpperCase();this.doc=doc;this.children=[];this.attributes={};this.className='';this.hidden=false;this.disabled=false;this._text='';}
 set id(v){this._id=v;this.doc.ids[v]=this;}get id(){return this._id;}
 get classList(){const n=this;return{contains:v=>n.className.split(' ').includes(v),toggle(v,on){const a=new Set(n.className.split(' ').filter(Boolean));const next=on===undefined?!a.has(v):on;if(next)a.add(v);else a.delete(v);n.className=[...a].join(' ');return next;}};}
 set textContent(v){this._text=String(v);for(const c of this.children)c.parent=null;this.children=[];}get textContent(){return this._text+this.children.map(c=>c.textContent).join('');}
 append(...nodes){for(const n of nodes){if(n.parent)n.parent.children=n.parent.children.filter(c=>c!==n);n.parent=this;this.children.push(n);}}
 prepend(...nodes){for(const n of nodes){if(n.parent)n.parent.children=n.parent.children.filter(c=>c!==n);n.parent=this;}this.children.unshift(...nodes);}
 replaceChildren(...nodes){for(const c of this.children)c.parent=null;this.children=[];this._text='';this.append(...nodes);}
 setAttribute(k,v){this.attributes[k]=String(v);}removeAttribute(k){delete this.attributes[k];}
 querySelector(q){for(const c of this.children){if(q[0]==='.'?c.classList.contains(q.slice(1)):q==='[role=list]'?c.attributes.role==='list':c.tagName===q.toUpperCase())return c;const nested=c.querySelector(q);if(nested)return nested;}return null;}
 focus(){this.focused=true;}scrollIntoView(){this.scrolled=true;}
}
function boot(steps=additions(),shared=null){
 const doc={ids:{},createElement(tag){return new Node(tag,this);},getElementById(id){return this.ids[id]||null;},baseURI:'https://example.test/coffee/',currentScript:{src:'https://example.test/coffee/coffee-brew-flow.js'}};
 doc.documentElement=doc.createElement('html');doc.documentElement.lang='zh-Hant';doc.head=doc.createElement('head');
 const make=(id,tag='div')=>{const n=doc.createElement(tag);n.id=id;return n;};
 const guide=make('guide'),grid=doc.createElement('div');grid.className='coffee-guide-grid';guide.append(grid);
 const timer=make('coffeeTimerPanel'),review=make('coffeeReviewPanel');review.append(doc.createElement('h2'));grid.append(timer,review);
 for(const id of ['start','finish','resetTimer','mark','unmark'])timer.append(make(id,'button'));
 for(const id of ['actual','phase','target','timer','coffeeGuideSteps','coffeeGuideRecipe'])timer.append(make(id));
 const recipe={id:'fixture',name:'test',dose:20,temp:92,dripper:'V60',grinder:'G',grind:'5',steps};
 const ctx={document:doc,URL,Date:{now:()=>ctx.clock},MutationObserver:class{observe(){}},clock:0,run:null,running:false,ms:0,startAt:0,done:false,selected:'fixture',marks:[],undo:null,beeps:0,render(){},read:()=>JSON.parse(JSON.stringify(recipe)),m:r=>({water:r.steps.reduce((n,x)=>n+(F.isPour(x)?x.water:0),0),total:r.steps.reduce((n,x)=>n+x.sec,0)}),beep:()=>ctx.beeps++,noUndo:()=>{ctx.undo=null;},msg:(text,undo)=>{ctx.undo=undo;},fill:r=>{ctx.filled=r;},lock:v=>{ctx.locked=v;}};
 ctx.window=ctx;if(shared)ctx.CoffeeSteps=shared;
 ctx.reset=()=>{ctx.run=null;ctx.running=false;ctx.ms=0;ctx.startAt=0;ctx.done=false;ctx.marks=[];ctx.render();};
 doc.ids.start.onclick=()=>{if(!ctx.run)ctx.run=JSON.parse(JSON.stringify(recipe));if(ctx.running){ctx.ms=ctx.clock-ctx.startAt;ctx.running=false;}else{ctx.startAt=ctx.clock-ctx.ms;ctx.running=true;}ctx.render();};
 vm.createContext(ctx);vm.runInContext(source,ctx);
 return{ctx,doc,recipe,start(){doc.ids.flowBegin.onclick({});},at(time){ctx.clock=time;ctx.render();}};
}
test('legacy actions remain classified correctly',()=>{for(const type of ['悶蒸注水','注水'])assert.equal(F.isPour(s(type,10,30)),true);for(const type of ['等待／斷水','攪拌／繞圈','下壓','開關閥門','滴濾／等待完成']){assert.equal(F.isPour(s(type,10)),false);assert.equal(F.isPost(s(type,10)),false);}});
test('circle and centre are pours but stir is not',()=>{assert.equal(F.isPour(s('繞圈注水',10,30)),true);assert.equal(F.isPour(s('中心注水',10,30)),true);assert.equal(F.isPour(s('攪拌',10)),false);});
test('target extraction excludes both additions',()=>assert.equal(F.targetWater(additions(),2),100));
test('automatic timer stops at bypass even after a long delay',()=>{const st=state('auto');F.tick(st,900000,additions());assert.equal(st.i,1);assert.equal(st.start,10000);assert.equal(F.tick(st,999999,additions()),false);});
test('timer trigger cannot confirm bypass or ice',()=>{for(const type of ['後加水（bypass）','後加冰塊']){const steps=[s(type,0,30),pour()],st=state('auto');assert.equal(F.advance(st,20000,steps,'timer'),false);assert.equal(st.i,0);}});
test('manual step change preserves actual elapsed time',()=>{const st=state('auto');F.tick(st,10000,additions());F.advance(st,23567,additions());assert.deepEqual([st.i,st.start,st.events.at(-1).atMs],[2,23567,23567]);});
test('last step is not automatically finished',()=>{const st=state('auto'),steps=[pour(),s('滴濾／等待完成',20)];F.tick(st,999999,steps);assert.equal(st.i,1);assert.equal(F.advance(st,999999,steps),false);});
test('manual progression never advances on tick',()=>{const st=state('manual');assert.equal(F.tick(st,900000,additions()),false);assert.equal(st.i,0);});
test('automatic progression preserves legacy target boundaries',()=>{const st=state('auto'),steps=[s('注水',10,100),s('等待／斷水',5),s('注水',10,100),s('滴濾／等待完成',60)];F.tick(st,18000,steps);assert.equal(st.i,2);assert.equal(st.start,15000);});
test('browser mount preserves three stages and original start node',()=>{const b=boot();assert.ok(b.doc.ids.coffeeBrewFlow);assert.equal(b.doc.ids.flowPrepare.hidden,false);assert.equal(b.doc.ids.flowBrewing.hidden,true);b.start();assert.equal(b.doc.ids.flowBrewing.hidden,false);assert.equal(b.doc.ids.start.parent.className,'flow-focus');});
test('bypass screen shows addition not cumulative brew target',()=>{const b=boot();b.start();b.at(10000);assert.equal(b.doc.ids.flowTarget.textContent,'30 g');assert.match(b.doc.ids.flowRemaining.textContent,/手動確認/);assert.doesNotMatch(b.doc.ids.flowRemaining.textContent,/剩餘|超過/);assert.match(b.doc.ids.flowNext.textContent,/確認本段/);});
test('post-addition UI does not move forward by itself',()=>{const b=boot();b.start();b.at(900000);assert.equal(b.ctx.run.guideCursor.i,1);assert.equal(b.doc.ids.flowTarget.textContent,'30 g');assert.equal(b.ctx.done,false);});
test('confirmation advances to ice and keeps real total timer',()=>{const b=boot();b.start();b.at(10000);b.ctx.clock=23567;b.doc.ids.flowNext.onclick();assert.equal(b.ctx.run.guideCursor.i,2);assert.equal(b.doc.ids.flowTarget.textContent,'60 g');assert.equal(b.doc.ids.timer.textContent,'00:23');assert.match(b.doc.ids.flowNext.textContent,/完成沖煮/);});
test('last ice confirmation finishes at actual duration',()=>{const b=boot();b.start();b.at(10000);b.ctx.clock=23567;b.doc.ids.flowNext.onclick();b.ctx.clock=33456;b.doc.ids.flowNext.onclick();assert.equal(b.ctx.done,true);assert.equal(b.ctx.ms,33456);assert.equal(b.doc.ids.coffeeReviewPanel.hidden,false);assert.equal(b.doc.ids.start.disabled,true);});
test('paused confirmation is disabled and cannot advance',()=>{const b=boot();b.start();b.at(10000);b.doc.ids.start.onclick();const i=b.ctx.run.guideCursor.i;b.ctx.clock=90000;b.ctx.render();assert.equal(b.doc.ids.flowNext.disabled,true);b.doc.ids.flowNext.onclick();assert.equal(b.ctx.run.guideCursor.i,i);assert.equal(b.doc.ids.timer.textContent,'00:10');});
test('resume does not count wall time spent paused',()=>{const b=boot();b.start();b.at(10000);b.doc.ids.start.onclick();b.ctx.clock=90000;b.doc.ids.start.onclick();assert.equal(b.doc.ids.timer.textContent,'00:10');assert.equal(b.ctx.run.guideCursor.i,1);});
test('reset undo restores manual cursor marks and elapsed paused',()=>{const b=boot();b.start();b.at(10000);b.ctx.marks=[5];b.doc.ids.resetTimer.onclick();assert.equal(b.ctx.run,null);const undo=b.ctx.undo;assert.equal(typeof undo,'function');b.ctx.clock=90000;undo();assert.equal(b.ctx.running,false);assert.equal(b.ctx.ms,10000);assert.equal(b.ctx.run.guideCursor.i,1);assert.equal(b.ctx.marks[0],5);assert.equal(b.doc.ids.flowTarget.textContent,'30 g');});
test('English labels include centre bypass and ice',()=>{const b=boot([s('中心注水',10,100),s('後加水（bypass）',0,30),s('後加冰塊',0,60)]);b.doc.documentElement.lang='en';b.start();assert.match(b.doc.ids.flowBrewing.textContent,/Center pour/);b.at(10000);assert.match(b.doc.ids.flowBrewing.textContent,/Bypass water/);assert.match(b.doc.ids.flowRemaining.textContent,/no countdown/);b.doc.ids.flowNext.onclick();assert.match(b.doc.ids.flowBrewing.textContent,/Add ice/);});
test('timeline never adds post amounts to extraction target',()=>{const b=boot();b.start();const text=b.doc.ids.flowBrewing.querySelector('[role=list]').textContent;assert.match(text,/→ 100 g/);assert.doesNotMatch(text,/→ 130 g|→ 190 g/);assert.match(text,/手動確認/);});
test('timeline uses relative times after manual steps',()=>{const b=boot([pour(),s('後加水（bypass）',0,30),s('等待／斷水',20),s('中心注水',10,50)]);b.start();const text=b.doc.ids.flowBrewing.querySelector('[role=list]').textContent;assert.match(text,/確認後 \+00:00/);assert.match(text,/確認後 \+00:20/);});
test('restored auto mode is not changed by current selector',()=>{const b=boot();b.doc.ids.flowMode.value='manual';b.ctx.run={...b.recipe,guideMode:'auto',guideCursor:{i:0,start:0},guideEvents:[]};b.ctx.running=true;b.at(10000);assert.equal(b.ctx.run.guideCursor.i,1);});
test('restored paused timed step does not auto-advance',()=>{const b=boot([pour(),s('等待／斷水',20)]);b.ctx.run={...b.recipe,guideMode:'auto',guideCursor:{i:0,start:0},guideEvents:[]};b.ctx.ms=15000;b.ctx.running=false;b.ctx.render();assert.equal(b.ctx.run.guideCursor.i,0);});
test('invalid cursor start is clamped to a valid time',()=>{const b=boot();b.ctx.run={...b.recipe,guideCursor:{i:0,start:999999}};b.ctx.render();assert.equal(b.ctx.run.guideCursor.start,0);});
test('finish early does not synthesize unseen timer transitions',()=>{const b=boot([pour(),s('等待／斷水',20),s('滴濾／等待完成',60)]);b.start();b.ctx.clock=900000;b.doc.ids.finish.onclick();assert.equal(b.ctx.run.guideEvents.length,1);assert.equal(b.ctx.run.guideEvents[0].trigger,'finish');assert.equal(b.ctx.run.guideEvents[0].step,0);assert.equal(b.ctx.ms,900000);});
test('repeated module evaluation does not duplicate flow or loader',()=>{const b=boot(),before=b.doc.head.children.length;vm.runInContext(source,b.ctx);assert.equal(b.doc.head.children.length,before);});
test('shared model delegates advance and tick when already loaded',()=>{let calls=0;const shared={isManual:F.isPost,isPour:F.isPour,advance(...a){calls++;return F.advance(...a);},tick(...a){calls++;return F.tick(...a);}};const b=boot(additions(),shared);b.start();b.at(10000);b.doc.ids.flowNext.onclick();assert.ok(calls>=3);assert.equal(b.ctx.run.guideCursor.i,2);});
console.log(JSON.stringify({passed,failed:0}));
