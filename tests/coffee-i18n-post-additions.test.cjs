'use strict';
const A=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),M=require('../coffee-i18n.js');
let passed=0;function test(name,f){f();passed++;console.log('PASS '+name);}
const step=(type,sec,water=0,note='')=>({type,sec,water,note});
function cup(){return{recipe:{name:'test',bean:'我的咖啡',method:'手沖',dripper:'V60',shape:'錐形',material:'玻璃',filter:'paper',grinder:'G',grind:'5',waterSource:'water',roaster:'R',origin:'O',process:'P',roast:'淺焙',roastDate:'',openDate:'',notes:'原始備註',dose:20,temp:92,cold:0,ice:0,steps:[step('悶蒸注水',10,40),step('等待／斷水',20),step('繞圈注水',30,100),step('中心注水',30,70),step('滴濾／等待完成',60),step('後加水（bypass）',0,30),step('後加冰塊',0,60)]},seconds:180,breaks:1,markers:[10],rating:4,strength:'剛好',acidity:null,sweetness:null,bitterness:null,body:null,yieldMass:null,tds:null};}
test('new actions have distinct English labels',()=>{for(const [a,b]of [['繞圈注水','Circle pour'],['中心注水','Center pour'],['攪拌','Stir'],['後加水（bypass）','Bypass water'],['後加冰塊','Add ice']])A.equal(M.translate(a),b);});
test('legacy combined action keeps its meaning',()=>A.equal(M.translate('攪拌／繞圈'),'Stir / swirl'));
test('English summary excludes bypass and ice from extraction',()=>{const t=M.formatInfo(cup());A.match(t,/210 g water/);A.doesNotMatch(t,/300 g water/);A.match(t,/3 pours · 1 planned pauses/);A.match(t,/Cold bypass: 30 g/);A.match(t,/Ice added: 60 g/);});
test('recipe target duration excludes manual additions',()=>A.equal(M.recordAmounts(cup().recipe).total,150));
test('English detail keeps post additions separate',()=>{const t=M.formatDetail(cup());A.match(t,/Cold water: 30 g · Ice: 60 g/);A.match(t,/Bypass water · confirm manually · \+30 g/);A.match(t,/Add ice · confirm manually · \+60 g/);A.doesNotMatch(t,/Bypass water 0 s|Add ice 0 s/);});
test('legacy cold and ice fields still display',()=>{const c=cup();c.recipe.steps=c.recipe.steps.slice(0,5);c.recipe.cold=30;c.recipe.ice=60;A.match(M.formatDetail(c),/Cold water: 30 g · Ice: 60 g/);A.equal(M.recordAmounts(c.recipe).water,210);});
test('hot and room-temperature additions remain distinct',()=>{const c=cup();c.recipe.steps[5].waterKind='room';c.recipe.steps.push({...step('後加水（bypass）',0,20),waterKind:'hot'});const t=M.formatDetail(c);A.match(t,/Room-temperature bypass: 30 g/);A.match(t,/Hot bypass: 20 g/);A.match(t,/room-temperature water/);});
test('stats translate separate amounts and manual counts',()=>{const t=M.translate('萃取水210g · 粉20g\n後加冷水30g · 後加常溫水10g · 後加熱水20g · 後加冰60g · 另有2段手動確認','stats');for(const text of ['Brew water 210g','Cold bypass 30g','Room-temperature bypass 10g','Hot bypass 20g','Ice added 60g','2 manual confirmations'])A.ok(t.includes(text));});
test('new timed action hints translate without changing note',()=>{A.equal(M.translate('2.繞圈注水 30秒 ＋100g → 累計140g 我的提示','live'),'2. Circle pour · 30 s · +100 g → Total 140 g 我的提示');});
test('manual hints are not displayed as zero-second pours',()=>{const t=M.translate('6.後加水（bypass） 手動確認 ＋30g 原筆記','live');A.equal(t,'6. Bypass water · confirm manually · +30 g 原筆記');});
test('new action phase labels translate',()=>A.equal(M.translate('2/7 中心注水 · 剩10秒','phase'),'2/7 · Center pour · 10 s remaining'));
test('user instructions in target remain protected',()=>A.equal(M.translate('攪拌','target'),'攪拌'));
test('formatting does not mutate notes steps or snapshots',()=>{const c=cup(),before=JSON.stringify(c);M.formatInfo(c);M.formatDetail(c);M.recordAmounts(c.recipe);A.equal(JSON.stringify(c),before);});
test('legacy labels and numeric contexts remain available',()=>{A.equal(M.translate('等待／斷水'),'Wait / pause pouring');A.equal(M.translate('3次','actual'),'3 pauses');A.equal(M.translate('共8杯 · 已選2'),'8 cups · 2 selected');});
test('conversion and kind controls have English labels',()=>{A.equal(M.translate('舊冷水／冰轉為步驟'),'Convert legacy cold water / ice to steps');A.equal(M.translate('後加水種類'),'Bypass water kind');A.equal(M.translate('常溫水'),'Room-temperature water');});
test('old stir steps remain non-pouring gaps',()=>{const r=cup().recipe;r.steps=[step('注水',10,100),step('攪拌／繞圈',5),step('注水',10,100)];const x=M.recordAmounts(r);A.deepEqual([x.water,x.pours,x.breaks],[200,2,1]);});
test('unknown user text and surrounding whitespace are preserved',()=>{A.equal(M.translate(' 自訂名稱 '),' 自訂名稱 ');A.equal(M.translate(' 中心注水 '),' Center pour ');});
test('shared model summary is used when present',()=>{let calls=0;const expected={water:210,pours:3,breaks:1,total:150,postCold:30,postRoom:0,postHot:0,postIce:60},ctx={module:{exports:{}},CoffeeSteps:{summary(){calls++;return expected;}}};vm.runInNewContext(fs.readFileSync(require.resolve('../coffee-i18n.js'),'utf8'),ctx);A.equal(ctx.module.exports.recordAmounts(cup().recipe),expected);A.equal(calls,1);});
console.log(JSON.stringify({passed,failed:0}));
