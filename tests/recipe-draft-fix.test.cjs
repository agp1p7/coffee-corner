'use strict';
const vm=require('node:vm'),fs=require('node:fs');
const mock=String.raw`
const elements=new Map();function $(id){if(!elements.has(id))elements.set(id,{onclick:()=>{},onchange:null,textContent:'',value:'',children:[],replaceChildren(){this.children=[];},append(x){this.children.push(x);}});return elements.get(id);}
const cp=x=>JSON.parse(JSON.stringify(x));let seq=0;const uid=()=>String(++seq);let db={recipes:[{id:'saved',name:'saved',method:'手沖',favorite:false}],cups:[]},selected='saved',run=null,current=cp(db.recipes[0]);
function read(){return {...cp(current),id:selected};}function e(tag,text){return {textContent:text,value:''};}function fill(r){current=cp(r);}function sample(a=false){return {id:uid(),name:a?'愛樂壓示範':'手沖示範',method:a?'愛樂壓':'手沖',favorite:false};}function noUndo(){}function reset(){}function msg(){}function save(){return true;}function valid(){return read();}function ask(t,f){f();}function load(){}
`;
const tests=String.raw`
const initial=db.recipes.length;
$('add').onclick();const first=selected;if(db.recipes.length!==initial)throw Error('creation persisted draft');
current.name='自訂草稿';$('add').onclick();if(selected!==first||current.name!=='自訂草稿'||db.recipes.length!==initial)throw Error('repeated click');
$('aero').onclick();if(db.recipes.length!==initial||selected===first)throw Error('aero');$('add').onclick();if(selected!==first||current.name!=='自訂草稿')throw Error('restore');
$('form').onsubmit({preventDefault(){}});if(db.recipes.length!==initial+1||db.recipes.at(-1).name!=='自訂草稿')throw Error('save once');
$('form').onsubmit({preventDefault(){}});if(db.recipes.length!==initial+1)throw Error('double submit');
$('aero').onclick();$('fav').onclick();if(!current.favorite||db.recipes.length!==initial+1)throw Error('draft favorite');
$('deleteRecipe').onclick();if(db.recipes.length!==initial+1||db.cups.length!==0)throw Error('delete draft');
console.log('Draft regression tests passed');
`;
vm.runInNewContext(mock+fs.readFileSync('recipe-draft-fix.js','utf8')+tests,{console});
