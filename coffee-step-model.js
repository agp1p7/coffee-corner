(function(root,factory){
'use strict';
const api=factory();
if(typeof module==='object'&&module.exports)module.exports=api;
else root.CoffeeSteps=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
// Indices 0-6 are part of existing shared links: never reorder them.
const TYPES=Object.freeze(['悶蒸注水','注水','等待／斷水','攪拌／繞圈','下壓','開關閥門','滴濾／等待完成','繞圈注水','中心注水','攪拌','後加水（bypass）','後加冰塊']);
const LEGACY_TYPES=Object.freeze(TYPES.slice(0,7));
const WATER_KINDS=Object.freeze(['cold','room','hot']);
const POUR=new Set([TYPES[0],TYPES[1],TYPES[7],TYPES[8]]);
const POST_WATER=TYPES[10],POST_ICE=TYPES[11];
const copy=x=>JSON.parse(JSON.stringify(x));
const isPour=s=>POUR.has(typeof s==='string'?s:s&&s.type);
const isManual=s=>[POST_WATER,POST_ICE].includes(typeof s==='string'?s:s&&s.type);
function fail(message){throw new Error(message);}
function finite(v,min,max){return typeof v==='number'&&Number.isFinite(v)&&v>=min&&v<=max;}
function validateStep(s){
 if(!s||typeof s!=='object'||Array.isArray(s)||!TYPES.includes(s.type))fail('Invalid step action');
 if(typeof s.note!=='string'||s.note.length>1000)fail('Invalid step note');
 if(!Number.isInteger(s.sec)||(isManual(s)?s.sec!==0:s.sec<1||s.sec>7200))fail('Invalid step duration');
 if(!finite(s.water,0,3000)||(isPour(s)||isManual(s)?s.water<=0:s.water!==0))fail('Invalid step amount');
 if(s.waterKind!==undefined&&(s.type!==POST_WATER||!WATER_KINDS.includes(s.waterKind)))fail('Invalid bypass water kind');
 return s;
}
function validateSteps(r){
 if(!r||!Array.isArray(r.steps)||r.steps.length<1||r.steps.length>60)fail('Invalid step count');
 const cold=r.cold===undefined?0:r.cold,ice=r.ice===undefined?0:r.ice;
 if(!finite(cold,0,3000)||!finite(ice,0,3000))fail('Invalid legacy additions');
 let water=0,postWater=0,postIce=0,hasWater=false,hasIce=false;
 for(const s of r.steps){validateStep(s);if(isPour(s))water+=s.water;else if(s.type===POST_WATER){hasWater=true;postWater+=s.water;}else if(s.type===POST_ICE){hasIce=true;postIce+=s.water;}}
 if(water<=0||water>10000)fail('Invalid extraction water total');
 if(hasWater&&cold>0)fail('Convert legacy cold water before adding bypass steps');
 if(hasIce&&ice>0)fail('Convert legacy ice before adding ice steps');
 if(postWater>3000||postIce>3000)fail('Invalid post-addition total');
 return r;
}
function summary(r){
 validateSteps(r);
 let water=0,pours=0,breaks=0,total=0,seen=false,gap=false,manualSteps=0;
 let postCold=r.cold||0,postRoom=0,postHot=0,postIce=r.ice||0;
 for(const s of r.steps){
  if(isManual(s)){manualSteps++;if(s.type===POST_ICE)postIce+=s.water;else if((s.waterKind||'cold')==='cold')postCold+=s.water;else if(s.waterKind==='room')postRoom+=s.water;else postHot+=s.water;continue;}
  total+=s.sec;
  if(isPour(s)){water+=s.water;if(seen&&gap)breaks++;seen=true;gap=false;pours++;}
  else if(seen&&s.sec>0)gap=true;
 }
 const postWater=postCold+postRoom+postHot;
 return{water,pours,breaks,total,postWater,postCold,postRoom,postHot,postIce,manualSteps,totalInput:water+postWater+postIce};
}
function cumulativeWater(steps,index){
 if(!Array.isArray(steps)||!Number.isInteger(index)||index<0||index>=steps.length)fail('Invalid step cursor');
 return steps.slice(0,index+1).reduce((n,s)=>{validateStep(s);return n+(isPour(s)?s.water:0);},0);
}
function convertLegacy(r,options){
 validateSteps(r);
 if(!options||typeof options!=='object'||Array.isArray(options)||Object.keys(options).some(k=>!['cold','ice'].includes(k))||Object.values(options).some(v=>typeof v!=='boolean'))fail('Explicit conversion options required');
 const n=copy(r);
 if(options.cold&&n.cold>0){n.steps.push({type:POST_WATER,sec:0,water:n.cold,note:'',waterKind:'cold'});n.cold=0;}
 if(options.ice&&n.ice>0){n.steps.push({type:POST_ICE,sec:0,water:n.ice,note:''});n.ice=0;}
 validateSteps(n);return n;
}
function packStep(s){
 validateStep(s);
 const a=[TYPES.indexOf(s.type),s.sec];
 if(s.water||s.note||s.waterKind&&s.waterKind!=='cold')a.push(s.water);
 if(s.note||s.waterKind&&s.waterKind!=='cold')a.push(s.note);
 if(s.type===POST_WATER&&s.waterKind&&s.waterKind!=='cold')a.push(WATER_KINDS.indexOf(s.waterKind));
 return a;
}
function unpackStep(a){
 if(!Array.isArray(a)||a.length<2||a.length>5||!Number.isInteger(a[0])||a[0]<0||a[0]>=TYPES.length)fail('Invalid compact step');
 const s={type:TYPES[a[0]],sec:a[1],water:a.length>2?a[2]:0,note:a.length>3?a[3]:''};
 if(a.length===5){if(s.type!==POST_WATER||!Number.isInteger(a[4])||a[4]<0||a[4]>=WATER_KINDS.length)fail('Invalid compact water kind');s.waterKind=WATER_KINDS[a[4]];}
 validateStep(s);return s;
}
function checkEngine(state,elapsed,steps){
 if(!state||!Array.isArray(steps)||!steps.length||!Number.isInteger(state.i)||state.i<0||state.i>=steps.length||!finite(state.start,0,Number.MAX_SAFE_INTEGER)||!finite(elapsed,state.start,Number.MAX_SAFE_INTEGER)||!['auto','manual'].includes(state.mode)||!Array.isArray(state.events))fail('Invalid timer state');
}
function advance(state,elapsed,steps,trigger='manual'){
 checkEngine(state,elapsed,steps);validateStep(steps[state.i]);
 if(!['manual','timer'].includes(trigger))fail('Invalid advance trigger');
 if(trigger==='timer'&&(state.mode!=='auto'||isManual(steps[state.i])||elapsed<state.start+steps[state.i].sec*1000))return false;
 if(state.i>=steps.length-1)return false;
 state.events.push({step:state.i,atMs:elapsed,trigger});state.i++;state.start=elapsed;return true;
}
function tick(state,elapsed,steps){
 checkEngine(state,elapsed,steps);let changed=false;
 if(state.mode==='auto')while(state.i<steps.length-1){const s=validateStep(steps[state.i]);if(isManual(s)||elapsed<state.start+s.sec*1000)break;const end=state.start+s.sec*1000;advance(state,end,steps,'timer');changed=true;}
 return changed;
}
return Object.freeze({TYPES,LEGACY_TYPES,WATER_KINDS,POST_WATER,POST_ICE,isPour,isManual,validateStep,validateSteps,summary,cumulativeWater,convertLegacy,packStep,unpackStep,advance,tick});
});
