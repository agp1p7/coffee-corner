'use strict';
const A=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),M=require('../coffee-share-card-renderer.js');
let passed=0;function test(name,f){f();passed++;console.log('PASS '+name);}
const step=(type,sec,water)=>({type,sec,water,note:''});
function cup(){return{date:'2026-10-27T03:00:00Z',seconds:180,taste:'柑橘、蜂蜜，尾韻乾淨',next:'PRIVATE NEXT',recipe:{name:'三段示範',bean:'衣索比亞・水洗',roaster:'示範烘豆所',origin:'耶加雪菲',process:'水洗',roast:'淺焙',roastDate:'2026-10-20',dose:20,temp:92,cold:0,ice:0,dripper:'V60',grinder:'G',grind:'5',notes:'PRIVATE NOTES',steps:[step('繞圈注水',30,210),step('後加水（bypass）',0,30),step('後加冰塊',0,60)]}};}
function canvas(){const calls=[];return{calls,font:'20px serif',fillRect(){},strokeRect(){},beginPath(){},moveTo(){},lineTo(){},stroke(){},measureText(s){return{width:[...String(s)].length*parseFloat(this.font)*.65};},fillText(text,x,y){calls.push({text:String(text),x,y,size:parseFloat(this.font),align:this.textAlign});}};}
function render(c=cup(),opts={}){const ctx=canvas(),result=M.draw(ctx,c,opts);return{ctx,result,text:ctx.calls.map(x=>x.text).join('\n')};}
test('square and story fit typical content',()=>{for(const story of [false,true]){const r=render(cup(),{story});A.equal(r.result.fits,true);A.equal(r.result.width,1080);A.equal(r.result.height,story?1920:1080);}});
test('bean fields occupy two aligned columns',()=>{const r=render(),a=r.ctx.calls.find(x=>x.text==='耶加雪菲'),b=r.ctx.calls.find(x=>x.text==='水洗');A.equal(a.x,96);A.equal(b.x,560);A.equal(a.y,b.y);});
test('post additions never inflate brew water',()=>{const r=render();A.equal(r.result.totals.water,210);A.equal(r.result.totals.postWater,30);A.equal(r.result.totals.postIce,60);A.match(r.text,/後加冷水 30 g/);A.match(r.text,/後加冰 60 g/);A.doesNotMatch(r.text,/300 g 萃取水/);});
test('missing bean metadata is omitted',()=>{const c=cup();Object.assign(c.recipe,{origin:'',process:'',roast:'未填',roastDate:'',roaster:''});const r=render(c);A.equal(r.result.fits,true);for(const label of ['產地','處理法','焙度','烘焙日'])A.equal(r.ctx.calls.some(x=>x.text===label),false);});
test('overflow title disables export eligibility',()=>{const c=cup();c.recipe.bean='豆'.repeat(5000);const r=render(c);A.equal(r.result.fits,false);A.doesNotMatch(r.text,/…/);});
test('overflow notes never silently truncate',()=>{for(const story of [false,true])A.equal(render(cup(),{story,note:'x'.repeat(5000)}).result.fits,false);});
test('overflow roaster is detected',()=>{const c=cup();c.recipe.roaster='x'.repeat(5000);A.equal(render(c).result.fits,false);});
test('optional equipment can be omitted or overflow-checked',()=>{const c=cup();c.recipe.dripper='x'.repeat(5000);A.equal(render(c).result.fits,true);A.equal(render(c,{gear:true}).result.fits,false);});
test('share text is independent of original notes',()=>{const c=cup(),before=JSON.stringify(c),r=render(c,{note:'分享用風味'});A.match(r.text,/分享用風味/);A.doesNotMatch(r.text,/PRIVATE|柑橘/);A.equal(JSON.stringify(c),before);});
test('legacy additions retain their original meaning',()=>{const c=cup();c.recipe.steps=c.recipe.steps.slice(0,1);c.recipe.cold=30;c.recipe.ice=60;A.deepEqual(M.totals(c.recipe),{water:210,postCold:30,postRoom:0,postHot:0,postIce:60,postWater:30});});
test('ambiguous old and new sources are rejected',()=>{const c=cup();c.recipe.cold=30;A.throws(()=>render(c));c.recipe.cold=0;c.recipe.ice=60;A.throws(()=>render(c));});
test('hot and room-temperature bypass remain distinct',()=>{const c=cup();c.recipe.steps[1].waterKind='room';c.recipe.steps.push({...step('後加水（bypass）',0,20),waterKind:'hot'});const r=render(c);A.equal(r.result.totals.postRoom,30);A.equal(r.result.totals.postHot,20);});
test('invalid measured and recipe values fail',()=>{const c=cup();c.seconds=NaN;A.throws(()=>render(c));c.seconds=180;c.recipe.steps[0].water=Infinity;A.throws(()=>render(c));});
test('English labels and date render without private fields',()=>{const r=render(cup(),{lang:'en',date:true,gear:true});A.equal(r.result.fits,true);A.match(r.text,/Origin/);A.match(r.text,/Cold bypass/);A.doesNotMatch(r.text,/PRIVATE/);});
test('all fitted text stays inside the card border in metric simulation',()=>{for(const story of [false,true])for(const c of render(cup(),{story,gear:true,date:true}).ctx.calls){const width=[...c.text].length*c.size*.65,left=c.align==='right'?c.x-width:c.x;A.ok(left>=36&&left+width<=1044);A.ok(c.y>=36&&c.y+c.size*1.28<=(story?1884:1044));}});
test('unfittable single glyph is rejected',()=>{const ctx=canvas();A.equal(M.block(ctx,'字',0,0,1,50,30,20),false);A.equal(ctx.calls.length,0);});
test('browser module export has no DOM or storage effects',()=>{const ctx={};vm.runInNewContext(fs.readFileSync(require.resolve('../coffee-share-card-renderer.js'),'utf8'),ctx);A.deepEqual(Object.keys(ctx),['CoffeeCardB']);A.equal(typeof ctx.CoffeeCardB.draw,'function');});
console.log(JSON.stringify({passed,failed:0}));
