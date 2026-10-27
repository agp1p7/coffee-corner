(function(root,factory){'use strict';const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.CoffeeCardB=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const POUR=['悶蒸注水','注水','繞圈注水','中心注水'],POST='後加水（bypass）',ICE='後加冰塊';
function totals(r){let water=0,postCold=r.cold||0,postRoom=0,postHot=0,postIce=r.ice||0;const kinds=['cold','room','hot'];if(!Array.isArray(r.steps))throw Error('Invalid steps');for(const s of r.steps){if(!Number.isFinite(s.water)||s.water<0)throw Error('Invalid amount');if(POUR.includes(s.type))water+=s.water;else if(s.type===ICE)postIce+=s.water;else if(s.type===POST){if(s.waterKind!==undefined&&!kinds.includes(s.waterKind))throw Error('Invalid water kind');if((s.waterKind||'cold')==='cold')postCold+=s.water;else if(s.waterKind==='room')postRoom+=s.water;else postHot+=s.water;}}if(r.cold>0&&r.steps.some(s=>s.type===POST)||r.ice>0&&r.steps.some(s=>s.type===ICE))throw Error('Ambiguous additions');if(![water,postCold,postRoom,postHot,postIce].every(v=>Number.isFinite(v)&&v>=0)||water<=0)throw Error('Invalid totals');return{water,postCold,postRoom,postHot,postIce,postWater:postCold+postRoom+postHot};}
function lines(ctx,value,width,size){ctx.font=size+'px Iansui, serif';const result=[];let row='';for(const ch of String(value).replace(/\r/g,'')){if(ch==='\n'){result.push(row);row='';}else if(ctx.measureText(row+ch).width>width&&row){result.push(row);row=ch;}else row+=ch;}if(row||!result.length)result.push(row);return result;}
function block(ctx,value,x,y,width,height,max,min){for(let size=max;size>=min;size--){const a=lines(ctx,value,width,size),lineHeight=size*1.28;if(a.length*lineHeight<=height&&a.every(v=>ctx.measureText(v).width<=width)){a.forEach((v,i)=>ctx.fillText(v,x,y+i*lineHeight));return true;}}return false;}
function draw(ctx,c,options={}){
const r=c.recipe,x=totals(r),story=options.story===true,h=story?1920:1080,L=(a,b)=>options.lang==='en'?b:a;
if(!Number.isFinite(r.dose)||r.dose<=0||!Number.isFinite(r.temp)||!Number.isFinite(c.seconds)||c.seconds<0)throw Error('Invalid brew parameters');
const clock=v=>{const n=Math.floor(v);return String(Math.floor(n/60)).padStart(2,'0')+':'+String(n%60).padStart(2,'0');};
let fits=true;ctx.fillStyle='#111';ctx.fillRect(0,0,1080,h);ctx.strokeStyle='#777';ctx.lineWidth=1;ctx.strokeRect(36,36,1008,h-72);ctx.fillStyle='#fff';ctx.textBaseline='top';ctx.textAlign='left';
function put(value,xx,y,w,height,max,min){if(!block(ctx,value,xx,y,w,height,max,min))fits=false;}
function rule(y){ctx.strokeStyle='#666';ctx.beginPath();ctx.moveTo(64,y);ctx.lineTo(1016,y);ctx.stroke();}
ctx.font='44px Iansui, serif';ctx.textAlign='right';ctx.fillText(L('一隅・咖啡角','Coffee Corner'),984,story?92:76);ctx.textAlign='left';
put(r.bean||L('未指定咖啡豆','Coffee not specified'),96,story?190:154,888,story?180:76,story?68:56,story?40:28);
if(String(r.roaster||'').trim())put(r.roaster,96,story?402:244,888,story?90:40,story?40:28,story?26:18);
const beanFlavor=options.beanFlavor===undefined?(typeof r.beanFlavor==='string'?r.beanFlavor:r.beanSnapshot&&typeof r.beanSnapshot.beanFlavor==='string'?r.beanSnapshot.beanFlavor:''):String(options.beanFlavor);
const fields=[['產地','Origin',r.origin],['處理法','Process',r.process],['焙度','Roast',['未填','Not specified'].includes(r.roast)?'':r.roast],['風味描述','Flavor description',beanFlavor]].filter(a=>String(a[2]||'').trim());
const top=story?550:300,rowHeight=story?240:144,pad=32;
if(fields.length){rule(top);fields.forEach((f,i)=>{const right=i%2,xx=right?560:96,yy=top+Math.floor(i/2)*rowHeight,w=right?424:400;put(L(f[0],f[1]),xx,yy+pad,w,story?44:32,story?30:22,story?24:18);put(f[2],xx,yy+(story?96:76),w,rowHeight-(story?96:76)-pad,story?38:28,story?24:18);});const bottom=top+Math.ceil(fields.length/2)*rowHeight;rule(bottom);if(fields.length>2)rule(top+rowHeight);if(fields.length>1){ctx.beginPath();ctx.moveTo(528,top);ctx.lineTo(528,bottom);ctx.stroke();}}
if(r.name)put(r.name,96,story?1090:620,888,story?60:36,story?36:26,story?24:18);
const parameters=r.dose+' g '+L('粉','coffee')+' · '+x.water+' g '+L('萃取水','brew water')+' · '+r.temp+'°C\n'+L('粉水比 1:','Brew ratio 1:')+(x.water/r.dose).toFixed(1)+' · '+L('實際計時 ','Actual time ')+clock(c.seconds);
put(parameters,96,story?1190:680,888,story?150:80,story?44:28,story?28:20);
const additions=[[x.postCold,'後加冷水','Cold bypass'],[x.postRoom,'後加常溫水','Room-temperature bypass'],[x.postHot,'後加熱水','Hot bypass'],[x.postIce,'後加冰','Ice added']].filter(a=>a[0]>0).map(a=>L(a[1],a[2])+' '+a[0]+' g');
if(additions.length)put(additions.join(' · '),96,story?1370:784,888,story?96:40,story?34:24,story?22:16);
const extra=[];if(options.gear)extra.push([r.dripper,r.grinder,r.grind?L('刻度 ','Setting ')+r.grind+(r.grindUnit?' '+r.grindUnit:''):''].filter(Boolean).join(' · '));if(options.date){const d=new Date(c.date);if(Number.isFinite(d.getTime()))extra.push(d.toLocaleDateString(options.lang==='en'?'en':'zh-TW'));}
const note=options.note===undefined?String(c.taste||''):String(options.note);
if(note.trim()){rule(story?1500:852);put(L('本杯風味筆記','This cup’s tasting notes'),96,story?1540:884,888,story?44:36,story?30:24,story?24:18);put(note.trim(),96,story?1616:936,888,story?(extra.length?160:220):(extra.length?32:76),story?36:26,story?22:16);}
if(extra.length)put(extra.join(' · '),96,story?1810:984,888,story?78:28,story?28:20,story?18:14);
return{fits,width:1080,height:h,totals:x};}
return Object.freeze({draw,totals,block,flavorSections:true});
});
