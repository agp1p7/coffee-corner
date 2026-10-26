async function drawCard(){
 const rev=++revision;cardBlob=null;downloadButton.disabled=shareButton.disabled=true;if(!activeCard)return;
 try{
  if(document.fonts)await document.fonts.ready;if(rev!==revision)return;
  const c=activeCard,r=c.recipe,x=m(r),story=format.value==='story',h=story?1920:1080;
  canvas.width=1080;canvas.height=h;const ctx=canvas.getContext('2d');if(!ctx)throw Error('Canvas unavailable');
  ctx.fillStyle='#111';ctx.fillRect(0,0,1080,h);ctx.strokeStyle='#aaa';ctx.strokeRect(36,36,1008,h-72);ctx.fillStyle='#fff';
  function line(s,x,y,size){ctx.font=size+'px Iansui, serif';ctx.fillText(String(s),x,y);}
  function wrap(s,y,size,max){ctx.font=size+'px Iansui, serif';let row='',lines=[];for(const ch of String(s).replace(/\r/g,'')){if(ch==='\n'){lines.push(row);row='';}else if(ctx.measureText(row+ch).width>880){lines.push(row);row=ch;}else row+=ch;}if(row)lines.push(row);for(let i=0;i<Math.min(max,lines.length);i++)line(lines[i]+(i===max-1&&lines.length>max?'…':''),96,y+i*(size+10),size);}
  line(L('一隅・咖啡角','Coffee Corner'),96,story?120:80,28);
  wrap(r.bean||L('未指定咖啡豆','Coffee not specified'),story?230:150,story?64:46,2);
  wrap(r.name,story?430:295,story?40:28,1);
  const beanInfo=[['烘豆商','Roaster',r.roaster],['產地','Origin',r.origin],['處理法','Process',r.process],['焙度','Roast',r.roast==='未填'?'':r.roast],['烘焙日','Roasted',r.roastDate]].filter(a=>String(a[2]||'').trim()).map(a=>L(a[0],a[1])+'：'+a[2]).join(' · ');
  if(beanInfo)wrap(beanInfo,story?530:350,story?32:23,story?6:4);
  const y=story?940:525,row=story?240:150;
  for(const [i,v]of [[r.dose+' g',L('咖啡粉','Coffee')],[x.water+' g',L('萃取水目標','Target brew water')],[r.temp+'°C',L('水溫','Temperature')],[fmt(c.seconds*1000),L('實際計時','Actual timed duration')]].entries()){
   const xx=i%2?570:96,yy=y+Math.floor(i/2)*row;line(v[0],xx,yy,story?64:58);line(v[1],xx,yy+44,story?30:26);
  }
  line(L('粉水比 1:','Brew ratio 1:')+(x.water/r.dose).toFixed(1),96,story?1320:770,30);
  line(L('風味描述','Tasting description'),96,story?1410:825,28);
  wrap(publicNote.value.trim()||L('尚未填寫，可於分享前補上','Add a description before sharing'),story?1470:870,story?34:26,story?7:3);
  const extra=[];if(gearCheck.checked)extra.push([r.dripper,r.grinder,r.grind?L('刻度 ','Setting ')+r.grind+(r.grindUnit?' '+r.grindUnit:''):''].filter(Boolean).join(' · '));if(dateCheck.checked)extra.push(new Date(c.date).toLocaleDateString());
  if(extra.length)wrap(extra.join(' · '),story?1820:980,story?24:19,story?2:1);
  line(L('配方目標水量，非電子秤實測','Recipe water target, not a scale measurement'),96,h-52,18);
  canvas.toBlob(blob=>{if(rev===revision){cardBlob=blob;downloadButton.disabled=shareButton.disabled=!blob;}},'image/png');
 }catch(e){msg(L('無法產生圖片，請改用支援Canvas的瀏覽器。','Could not create the image; a Canvas-capable browser is required.'));}
}