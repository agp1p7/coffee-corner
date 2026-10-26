(function(){
'use strict';
const D=Object.fromEntries(String.raw`一隅・咖啡角|Coffee Corner
配方|Recipes
配方工作室|Recipe studio
引導沖煮|Guided brewing
日記與比較|Journal & comparison
備份與說明|Backup & help
手沖草稿|Pour-over draft
愛樂壓草稿|AeroPress draft
新手沖|New pour-over
新愛樂壓|New AeroPress
複製|Duplicate
☆ 收藏|☆ Favorite
★ 已收藏|★ Favorited
☆收藏|☆ Favorite
★已收藏|★ Favorited
已存配方|Saved recipes
刪除|Delete
刪除配方|Delete recipe
儲存配方|Save recipe
儲存為新配方|Save as new recipe
器材與配方|Equipment & recipe
配方名稱|Recipe name
方式|Brew method
沖煮方式|Brew method
手沖|Pour-over
愛樂壓|AeroPress
浸泡式|Immersion
越南滴濾壺|Vietnamese phin
其他|Other
濾杯／器具型號|Dripper / brewer model
類型|Dripper shape
錐形|Conical
平底|Flat-bottom
梯形|Trapezoid
浸泡／閥門式|Immersion / valve brewer
其他／不適用|Other / not applicable
材質|Material
樹脂／塑膠|Resin / plastic
陶瓷|Ceramic
玻璃|Glass
金屬|Metal
其他／未填|Other / not specified
濾紙／濾網|Paper / filter
磨豆機|Grinder
刻度|Grind setting
粉量g|Coffee dose (g)
水溫°C|Water temperature (°C)
水源／水配方|Water source / recipe
後加冷水g|Added cold water (g)
冰塊g|Ice (g)
咖啡豆資料|Coffee details
豆名|Coffee name
烘豆商|Roaster
產地／莊園|Origin / farm
處理法|Processing
焙度|Roast level
未填|Not specified
淺焙|Light
中淺焙|Medium-light
中焙|Medium
中深焙|Medium-dark
深焙|Dark
烘焙日|Roast date
開封日|Opened on
分段注水與斷水|Pour stages & pauses
＋步驟|＋ Add step
移除|Remove
動作|Action
秒數|Duration (s)
新增水量g|Water added (g)
提示|Instruction
悶蒸注水|Bloom pour
注水|Pour
等待／斷水|Wait / pause pouring
攪拌／繞圈|Stir / swirl
下壓|Press
開關閥門|Operate valve
滴濾／等待完成|Drawdown / finish
水量等比例縮放|Scale recipe water
新粉量g|New coffee dose (g)
縮放水量|Scale water
操作備註|Brewing notes
進入沖煮 →|Enter brewing →
← 返回配方|← Back to recipes
完整沖煮步驟|All brewing steps
配方摘要與粉水比|Recipe summary & ratios
開始|Start
暫停|Pause
繼續|Resume
提前結束|Finish early
重設|Reset
復原|Undo
記一次實際斷水|Log a pouring pause
減一次|Remove last pause
準備開始|Ready to brew
沖煮已結束|Brewing finished
已結束|Finished
記下成品與風味|Record the result & tasting notes
本段不加水|No water added in this step
這杯的味道|How did this cup taste?
濃淡|Strength
剛好|Just right
太淡|Too weak
太濃|Too strong
喜歡程度|Enjoyment
酸感1–5|Acidity 1–5
甜感1–5|Sweetness 1–5
苦感1–5|Bitterness 1–5
厚實度1–5|Body 1–5
TDS%（選填）|TDS % (optional)
成品重g（選填）|Beverage mass, g (optional)
未測量TDS請留空。|Leave TDS blank if it was not measured.
風味筆記|Tasting notes
下次只改一件事|Change one thing next time
儲存這杯|Save this cup
搜尋豆名、器材或風味|Search coffee, equipment or tasting notes
比較兩杯|Compare two cups
加入比較|Include in comparison
完整紀錄|Full record
刪除紀錄|Delete entry
項目|Field
第一杯|Cup 1
第二杯|Cup 2
日期|Date
基本參數|Brew summary
完整參數／步驟|Full parameters / steps
風味|Tasting notes
下次調整|Next adjustment
JSON備份|Export JSON backup
CSV匯出|Export CSV
匯入JSON|Import JSON
固定芫荽|Fixed Iansui font
階段提示音|Step notification sound
嘗試保持亮屏|Try keeping the screen on
取消保持亮屏|Stop keeping screen on
本機模式 · 請定期備份|Local storage · Back up regularly
目前僅暫存於記憶體，請備份|Temporarily stored in memory; export a backup
僅暫存於記憶體，請備份|Stored only in memory; export a backup
讀取失敗，目前僅暫存，請備份。|Could not load local data. Export a backup before closing.
儲存失敗，請備份。|Local save failed. Export a backup.
儲存失敗，請備份|Save failed; export a backup
請先重設計時|Reset the timer first
請先開始|Start brewing first
請在沖煮中記錄|Log pauses while a brew is active
最多60段|A recipe can have up to 60 steps
配方已達上限|Recipe limit reached
至少保留一個配方|Keep at least one saved recipe
請先暫停或結束|Pause or finish the brew first
紀錄已達上限，請備份清理|Entry limit reached; back up before removing entries
請確認秒數、至少一段注水與數值範圍|Check durations, water ranges and at least one pour step
配方已儲存|Recipe saved
新配方已儲存|New recipe saved
配方已更新|Recipe updated
這杯已記錄|Cup saved
已放棄草稿|Draft discarded
收藏設定會隨草稿一起儲存|Favorite status will be saved with the draft
縮放後超出範圍|Scaled water amounts are outside the allowed range
已縮放水量，請試沖後儲存|Water scaled. Test the recipe, then save it.
已重設，配方與筆記保留|Timer reset; recipe and notes preserved
最多選兩杯|Select at most two cups
請勾選兩杯|Select two cups to compare
已送出下載，請確認瀏覽器下載項目|Download requested; check your browser downloads
已匯入，請確認儲存狀態|Imported; check local storage status
刪除這筆紀錄？|Delete this journal entry?
刪除此配方？舊紀錄不受影響。|Delete this recipe? Past journal entries will be kept.
放棄目前草稿？已存配方和沖煮紀錄不受影響。|Discard this draft? Saved recipes and journal entries will be kept.
刪除目前選取的配方，不刪除沖煮紀錄|Delete the selected recipe, not its journal entries
刪除目前選取的配方|Delete the selected recipe
目前是草稿，按「儲存為新配方」才會加入清單；關閉頁面不保留草稿。|This is a draft. Use Save as new recipe to keep it; drafts are lost when this page closes.
返回配方不會停止計時；若要修改沖煮中的參數，請先重設。|Going back does not stop the timer. Reset before changing an active brew.
選好或調整配方後進入。草稿也能沖煮；進入頁面不會自動開始計時，也不會自動儲存配方。|Choose or adjust a recipe, then enter. Drafts can be used. Entering does not start the timer or save the recipe.
範本為流程示範；切換配方前請儲存。|Templates demonstrate the workflow. Save edits before switching recipes.
填每段新增水量。悶蒸算注水；兩次注水間有非加水步驟算一次斷水，末段滴濾不算。|Enter water added per step. Blooming counts as a pour. Non-pouring steps between pours count as one planned pause; final drawdown does not.
只改水量、冷水與冰，不改時間、水溫或研磨。|Scales water and ice only, not time, temperature or grind setting.
含冰總投入比假設冰全部融化，不是杯中重量；流速為目標，非實測。|Total input ratio assumes all ice melts; it is not beverage mass. Flow rate is a target, not a measurement.
重設不刪配方和筆記，8秒內可復原。|Reset preserves recipe and notes. Undo is available for 8 seconds.
停注且之後還會注水時記一次，不暫停計時。|Log once when you stop pouring and will pour again. This does not pause the timer.
TDS需測量；成品重與TDS須屬同一份無未融冰、混合均勻的飲品。|TDS must be measured. Mass and TDS must refer to the same mixed beverage with no unmelted ice.
紀錄只存在目前瀏覽器，不上傳給網站擁有者。請定期備份；清除資料、更換網站或瀏覽器可能無法讀取舊紀錄。JSON支援v1、v2的recipes＋cups，匯入取代全部資料；CSV用於分析，不作完整還原。|Records stay in this browser and are not sent to the site owner. Back up regularly. Clearing site data or changing browsers may make records unavailable. JSON restores v1/v2 recipes and cups and replaces existing data. CSV is for analysis, not full restoration.
全介面固定Iansui，無換字型功能。字型由Google Fonts載入，未內嵌；離線且無快取時使用備援字型。|The interface uses Iansui with no font switcher. Google Fonts supplies the font; a fallback is used offline if it is not cached.
需瀏覽器支援。背景或鎖屏可能延後提示音。|Browser support is required. Sounds may be delayed in the background or on a locked screen.
保持亮屏中；切換App可能解除。|Keeping screen on. Switching apps may release it.
保持亮屏已解除。|Screen wake lock released.
目前不支援，請調整系統螢幕逾時。|Not supported here. Adjust the system screen timeout.
依對話2.1功能重整，未在所有裝置實測。請測試儲存後重開、計時、重設復原及匯入匯出。回報附裝置、瀏覽器、步驟和截圖。末段到時停止，可設定較長再提前結束。暫停App不會停止咖啡萃取。沒有藍牙秤、雲端同步或豆量自動扣除。|Test build: check saving, reopening, timing, reset/undo and backups. Report device, browser, steps and screenshots. Timing stops after the final step; extend it if needed and finish early. Pausing the app does not stop extraction. No Bluetooth scale, cloud sync or automatic bean inventory.
編輯配方|Edit recipe
沖煮計時|Brew timer
風味紀錄|Tasting record`.split('\n').map(line=>line.split('|')));
const scoreKeys=['acidity','sweetness','bitterness','body'];
function tr(s){return D[s]||s;}
function translate(raw,id=''){
 const lead=(raw.match(/^\s*/)||[''])[0],tail=(raw.match(/\s*$/)||[''])[0];let s=raw.trim();if(!s)return raw;
 if(id==='recipes')return raw.replace(/^〔未儲存草稿〕 /,'[Unsaved draft] ');
 if(id==='target'&&!/^＋[\d.]+g／累計[\d.]+g／目標[\d.]+g\/s$/.test(s)&&s!=='本段不加水')return raw;
 if(D[s])return lead+D[s]+tail;
 if(id==='stats')return s.replace(/萃取水/g,'Brew water ').replace(/ · 粉/g,' · Coffee ').replace(/萃取比1:/g,'Brew ratio 1:').replace(/含冰總投入比1:/g,'Total input ratio 1:').replace(/(\d+)段注水 · 預定斷水(\d+)次/g,'$1 pours · $2 planned pauses');
 let m=s.match(/^(\d+)\/(\d+) (.+) · 剩(\d+)秒$/);if(id==='phase'&&m)return `${m[1]}/${m[2]} · ${tr(m[3])} · ${m[4]} s remaining`;
 m=s.match(/^＋([\d.]+)g／累計([\d.]+)g／目標([\d.]+)g\/s$/);if(id==='target'&&m)return `+${m[1]} g / Total ${m[2]} g / Target ${m[3]} g/s`;
 m=s.match(/^(\d+)次$/);if(id==='actual'&&m)return m[1]+' pauses';
 m=s.match(/^共(\d+)杯 · 已選(\d+)$/);if(m)return `${m[1]} cups · ${m[2]} selected`;
 m=s.match(/^估算萃取率([\d.]+)%＝成品重×TDS%÷粉量$/);if(m)return `Estimated extraction yield ${m[1]}% = Beverage mass × TDS% ÷ Coffee dose`;
 m=s.match(/^(\d+)\.(悶蒸注水|注水|等待／斷水|攪拌／繞圈|下壓|開關閥門|滴濾／等待完成) (\d+)秒(?: ＋([\d.]+)g → 累計([\d.]+)g)?(.*)$/s);if(id==='live'&&m)return `${m[1]}. ${tr(m[2])} · ${m[3]} s${m[4]?' · +'+m[4]+' g → Total '+m[5]+' g':''}${m[6]}`;
 m=s.match(/^(手機窄螢幕|平板／中型視窗|寬螢幕(?:雙欄)?) · (直向|橫向)$/);if(m)return ({'手機窄螢幕':'Narrow / mobile','平板／中型視窗':'Medium / tablet','寬螢幕':'Wide screen','寬螢幕雙欄':'Wide / two columns'}[m[1]])+' · '+(m[2]==='直向'?'Portrait':'Landscape');
 m=s.match(/^以\s*(\d+)\s*個配方、\s*(\d+)\s*筆紀錄取代現有資料？請先備份。$/);if(m)return `Replace current data with ${m[1]} recipes and ${m[2]} entries? Back up first.`;
 if(s.startsWith('匯入失敗：'))return 'Import failed: '+tr(s.slice(5));
 return raw;
}
function formatInfo(c){const r=c.recipe;let water=0,pours=0,pauses=0,seen=false,gap=false;for(const s of r.steps){water+=s.water;if(s.water>0){if(seen&&gap)pauses++;pours++;seen=true;gap=false;}else if(seen&&s.sec>0)gap=true;}return `${r.bean||'Coffee not specified'} · ${r.dripper||tr(r.method)}\n${r.dose} g coffee · ${water} g water · ${r.temp}°C\n${pours} pours · ${pauses} planned pauses · ${c.breaks} logged pauses\nTimed ${c.seconds} s · Enjoyment ${c.rating}/5 · ${tr(c.strength)}`;}
function formatDetail(c){const r=c.recipe;return `${tr(r.shape)} · ${tr(r.material)} · Filter: ${r.filter}\nGrinder: ${r.grinder} · Setting: ${r.grind} · Water: ${r.waterSource}\n${r.roaster} ${r.origin} ${r.process} ${tr(r.roast)}\nRoasted: ${r.roastDate} · Opened: ${r.openDate}\nCold water: ${r.cold} g · Ice: ${r.ice} g\nAcidity / Sweetness / Bitterness / Body: ${scoreKeys.map(k=>c[k]??'—').join(' / ')}\nBeverage: ${c.yieldMass??'—'} g · TDS: ${c.tds??'—'}%\nPause times: ${c.markers.join(', ')||'Not logged'} s\n${r.notes}\n${r.steps.map(s=>tr(s.type)+' '+s.sec+' s +'+s.water+' g '+s.note).join('\n')}`;}
if(typeof module!=='undefined'&&module.exports)module.exports={translate,formatInfo,formatDetail};
if(typeof document==='undefined'||document.getElementById('coffeeLanguageSwitch'))return;
const KEY='coffee-corner-language';let language='zh-Hant';try{if(localStorage.getItem(KEY)==='en')language='en';}catch(error){}
const memory=new WeakMap(),attributeMemory=new WeakMap();let observer=null,scheduled=false;const dirty=new Set();
const version=document.querySelector('body>small')||document.querySelector('small');
const bar=document.createElement('div');bar.id='coffeeLanguageSwitch';bar.setAttribute('role','group');bar.setAttribute('aria-label','Language / 語言');
const zh=document.createElement('button'),en=document.createElement('button');zh.type=en.type='button';zh.textContent='繁體中文';en.textContent='English';bar.append(zh,en);
const nav=document.querySelector('nav');if(nav)nav.before(bar);else document.body.prepend(bar);
const style=document.createElement('style');style.textContent='#coffeeLanguageSwitch{display:flex;gap:8px;justify-content:flex-end;margin:8px 0 14px}#coffeeLanguageSwitch button{min-height:44px}#coffeeLanguageSwitch button[aria-pressed="true"]{background:white;color:black}html[lang="en"] label,html[lang="en"] button{overflow-wrap:anywhere}';document.head.append(style);
const originalInfo=typeof info==='function'?info:null,originalDetail=typeof detail==='function'?detail:null,originalLogs=typeof logs==='function'?logs:null;
if(originalInfo)info=function(c){return language==='en'?formatInfo(c):originalInfo(c);};
if(originalDetail)detail=function(c){return language==='en'?formatDetail(c):originalDetail(c);};
function diary(){if(typeof db==='undefined')return;const root=document.getElementById('entries'),search=document.getElementById('search');if(!root)return;const q=(search?search.value:'').trim().toLowerCase(),list=db.cups.filter(c=>JSON.stringify(c).toLowerCase().includes(q));Array.from(root.children).forEach((entry,i)=>{const c=list[i];if(!c)return;const date=entry.querySelector('small');if(date)date.textContent=new Date(c.date).toLocaleString(language==='en'?'en-US':'zh-TW');const ps=Array.from(entry.children).filter(x=>x.tagName==='P');if(ps[2])ps[2].textContent=(language==='en'?'Next change: ':'下次只改：')+c.next;});}
if(originalLogs)logs=function(){originalLogs();diary();};
function context(parent){for(const id of ['recipes','stats','phase','target','actual','ey','count','live','coffeeLayoutStatus'])if(parent.closest('#'+id))return id;return '';}
function skip(parent){if(!parent||parent===version||parent.closest('script,style,textarea,input,pre,code,datalist,#coffeeLanguageSwitch,#coffeeGuideRecipe'))return true;if(parent.closest('#comparison td'))return true;if(parent.closest('#entries')&&!parent.closest('button,label,summary,small'))return true;return false;}
function text(node){const parent=node.parentElement;if(skip(parent))return;let item=memory.get(node);if(!item||node.nodeValue!==item.output&&node.nodeValue!==item.source)item={source:node.nodeValue,output:node.nodeValue};const id=context(parent);if(parent.tagName==='OPTION'&&!parent.hasAttribute('value'))parent.setAttribute('value',parent.value);item.output=language==='en'?translate(item.source,id):item.source;if(node.nodeValue!==item.output)node.nodeValue=item.output;memory.set(node,item);}
function attrs(root){const elements=root.nodeType===1?[root,...root.querySelectorAll('[title],[placeholder],[aria-label]')]:[];for(const element of elements){if(element.closest('#coffeeLanguageSwitch'))continue;let saved=attributeMemory.get(element)||{};for(const name of ['title','placeholder','aria-label']){const value=element.getAttribute(name);if(value===null)continue;let item=saved[name];if(!item||value!==item.output&&value!==item.source)item={source:value,output:value};item.output=language==='en'?translate(item.source):item.source;if(value!==item.output)element.setAttribute(name,item.output);saved[name]=item;}attributeMemory.set(element,saved);}}
function guideSummary(){const element=document.getElementById('coffeeGuideRecipe');if(!element||typeof read!=='function'||typeof m!=='function')return;const r=typeof run!=='undefined'&&run?run:read(),x=m(r);const value=language==='en'?`${r.name} · ${r.dripper||tr(r.method)}\n${r.dose} g coffee · ${x.water} g brew water · ${r.temp}°C`:`${r.name} · ${r.dripper||r.method}\n${r.dose} g 粉 · ${x.water} g 萃取水 · ${r.temp}°C`;if(element.textContent!==value)element.textContent=value;}
function apply(roots){if(observer)observer.disconnect();try{document.documentElement.lang=language;document.title=language==='en'?'Coffee Corner':'一隅・咖啡角';if(version)version.textContent=language==='en'?'2.5.0 Test build · Monochrome / Iansui':'2.5.0 網站測試版 · 黑白芫荽';for(const root of roots){if(!root||!root.isConnected)continue;if(root.nodeType===3)text(root);else{const walker=document.createTreeWalker(root,4);let n;while(n=walker.nextNode())text(n);attrs(root);}}guideSummary();zh.setAttribute('aria-pressed',String(language==='zh-Hant'));en.setAttribute('aria-pressed',String(language==='en'));}finally{if(observer)observer.observe(document.body,{childList:true,characterData:true,subtree:true});}}
function setLanguage(value,persist=true){language=value==='en'?'en':'zh-Hant';if(persist)try{localStorage.setItem(KEY,language);}catch(error){}if(originalLogs)logs();const table=document.getElementById('comparison');if(table&&table.children.length&&typeof chosen!=='undefined'&&chosen.size===2){const button=document.getElementById('compare');if(button&&button.onclick)button.onclick();}apply([document.body]);}
zh.onclick=()=>setLanguage('zh-Hant');en.onclick=()=>setLanguage('en');
setLanguage(language,false);
if(typeof MutationObserver!=='undefined'){observer=new MutationObserver(records=>{for(const record of records)dirty.add(record.target.nodeType===3?record.target.parentElement:record.target);if(scheduled)return;scheduled=true;queueMicrotask(()=>{scheduled=false;const roots=[...dirty];dirty.clear();apply(roots);});});observer.observe(document.body,{childList:true,characterData:true,subtree:true});}
if(typeof window!=='undefined')window.CoffeeI18n={setLanguage,get language(){return language;}};
})();