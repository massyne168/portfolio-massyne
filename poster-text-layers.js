/* Editable text layers for the live canvas, chrome finish styles, and PNG export. */
(() => {
 const canvas=document.getElementById('poster-canvas'),ctx=canvas.getContext('2d'),items=[];let selected=null,nextId=1,drag=null;
 const clone=()=>items.map(item=>({...item})),render=()=>canvas.dispatchEvent(new Event('poster:render'));
 const publish=()=>canvas.dispatchEvent(new CustomEvent('poster:textlayerschange',{detail:{layers:clone(),selectedId:selected}}));

 function add(){
  const item={
   id:nextId++,
   text:'Your idea',
   font:'Sora',
   weight:'700',
   color:canvas.dataset.paletteForeground||'#ffffff',
   align:'center',
   size:96,
   angle:0,
   x:50,
   y:55,
   finish:'none',
   blendMode:'source-over',
   visible:true
  };
  items.push(item);selected=item.id;publish();render();
  canvas.dispatchEvent(new CustomEvent('poster:layerselect',{detail:{type:'text',id:selected}}));
 }
 canvas.addEventListener('poster:text-add',add);

 // Set text layers en-masse (used by templates)
 canvas.addEventListener('poster:text-layers-set', e => {
  const newLayers = Array.isArray(e.detail?.layers) ? e.detail.layers : [];
  items.length = 0;
  newLayers.forEach(l => {
   items.push({
    id: nextId++,
    text: l.text || 'Text',
    font: l.font || 'Sora',
    weight: l.weight || '700',
    color: l.color || '#ffffff',
    align: l.align || 'center',
    size: l.size || 64,
    angle: l.angle || 0,
    x: l.x ?? 50,
    y: l.y ?? 50,
    finish: l.finish || 'none',
    blendMode: l.blendMode || 'source-over',
    visible: l.visible !== false
   });
  });
  selected = items.length ? items[0].id : null;
  publish();
  render();
 });

 canvas.addEventListener('poster:text-update',e=>{
  const item=items.find(x=>x.id===e.detail.id);
  if(item){Object.assign(item,e.detail.updates);publish();render();}
 });

 canvas.addEventListener('poster:text-delete',e=>{
  const i=items.findIndex(x=>x.id===e.detail.id);
  if(i<0)return;items.splice(i,1);
  selected=items.length?items[items.length-1].id:null;
  publish();render();
  canvas.dispatchEvent(new CustomEvent('poster:layerselect',{detail:selected===null?{type:'main'}:{type:'text',id:selected}}));
 });

 canvas.addEventListener('poster:text-reorder',e=>{
  const i=items.findIndex(x=>x.id===e.detail.id),j=i+Number(e.detail.direction);
  if(i<0||j<0||j>=items.length)return;
  const [item]=items.splice(i,1);items.splice(j,0,item);selected=item.id;publish();render();
 });

 canvas.addEventListener('poster:text-visibility',e=>{
  const item=items.find(x=>x.id===e.detail.id);
  if(item){item.visible=!item.visible;publish();render();}
 });

 canvas.addEventListener('poster:layerselect',e=>{
  selected=e.detail.type==='text'?e.detail.id:null;
  publish();
 });

 // Apply 1-click text presets to selected text layer
 canvas.addEventListener('poster:text-preset-apply', e => {
  const preset = e.detail?.preset || 'none';
  if (selected !== null) {
   const item = items.find(x => x.id === selected);
   if (item) {
    item.finish = preset;
    if (preset === 'condensed-streetwear') {
     item.font = 'Anton';
     item.weight = '700';
    } else if (preset === 'crimson-glow') {
     item.color = '#ff2a4b';
    }
    publish();
    render();
   }
  }
 });

 canvas.addEventListener('poster:snapshot',e=>{
  e.detail.textLayers=clone();
  e.detail.selectedTextLayer=selected;
  e.detail.nextTextLayerId=nextId;
 });

 canvas.addEventListener('poster:restore',e=>{
  items.splice(0,items.length,...(Array.isArray(e.detail.textLayers)?e.detail.textLayers.map(x=>({...x})):[]));
  selected=e.detail.selectedTextLayer??null;
  nextId=Math.max(e.detail.nextTextLayerId||1,...items.map(x=>x.id+1));
  publish();
  canvas.dispatchEvent(new CustomEvent('poster:layerselect',{detail:selected===null?{type:'main'}:{type:'text',id:selected}}));
 });

 document.getElementById('reset-poster').addEventListener('click',()=>{
  items.length=0;selected=null;nextId=1;publish();render();
 });

 function wrap(value,max){
  const lines=[];
  for(const paragraph of String(value||'').split('\n')){
   const words=paragraph.split(/\s+/).filter(Boolean);
   if(!words.length){lines.push('');continue;}
   let line='';
   for(const word of words){
    const next=line?line+' '+word:word;
    if(line&&ctx.measureText(next).width>max){lines.push(line);line=word;}
    else line=next;
   }
   lines.push(line);
  }
  return lines;
 }

 canvas.addEventListener('poster:draw',()=>{
  const boxes=[];
  for(const item of items){
   if(!item.visible||!item.text.trim())continue;
   ctx.save();
   ctx.font=item.weight+' '+item.size+'px "'+item.font+'",sans-serif';
   ctx.globalCompositeOperation = item.blendMode || 'source-over';

   const lines=wrap(item.text,900);
   const step=item.size*1.12;
   const x=item.x/100*canvas.width;
   const y=item.y/100*canvas.height;
   ctx.translate(x,y);
   ctx.rotate(item.angle*Math.PI/180);
   ctx.textAlign=item.align;
   ctx.textBaseline='alphabetic';

   const maxLineW = Math.max(1,...lines.map(line=>ctx.measureText(line).width));

   // Apply Text Finish Styles
   if (item.finish === 'liquid-chrome' && window.MASSYNE_FX) {
    const chromeGrad = window.MASSYNE_FX.createLiquidChromeGradient(ctx, 0, 0, maxLineW, step * lines.length);
    ctx.fillStyle = chromeGrad;
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.2;
    lines.forEach((line,i)=>{
     ctx.fillText(line,0,i*step,900);
     ctx.strokeText(line,0,i*step,900);
    });
   } else if (item.finish === 'brushed-silver' && window.MASSYNE_FX) {
    const silverGrad = window.MASSYNE_FX.createBrushedSilverGradient(ctx, 0, 0, maxLineW, step * lines.length);
    ctx.fillStyle = silverGrad;
    lines.forEach((line,i)=>ctx.fillText(line,0,i*step,900));
   } else if (item.finish === 'crimson-glow') {
    ctx.shadowColor = '#c81024';
    ctx.shadowBlur = 28;
    ctx.fillStyle = item.color || '#ff2a4b';
    lines.forEach((line,i)=>ctx.fillText(line,0,i*step,900));
    ctx.shadowBlur = 0;
   } else if (item.finish === 'brutalist-outline') {
    ctx.strokeStyle = item.color || '#ffffff';
    ctx.lineWidth = 3;
    lines.forEach((line,i)=>ctx.strokeText(line,0,i*step,900));
   } else if (item.finish === 'condensed-streetwear') {
    ctx.shadowColor = '#000000';
    ctx.shadowBlur = 12;
    ctx.shadowOffsetY = 5;
    ctx.fillStyle = item.color || '#ffffff';
    lines.forEach((line,i)=>ctx.fillText(line,0,i*step,900));
   } else {
    ctx.fillStyle=item.color;
    lines.forEach((line,i)=>ctx.fillText(line,0,i*step,900));
   }

   boxes.push({
    id:item.id,
    x,
    y,
    width:maxLineW,
    height:Math.max(item.size,lines.length*step),
    align:item.align,
    angle:item.angle
   });
   ctx.restore();
  }
  canvas.dataset.textLayerBoxes=JSON.stringify(boxes);
 });

 function point(e){
  const r=canvas.getBoundingClientRect();
  return{x:(e.clientX-r.left)/r.width*canvas.width,y:(e.clientY-r.top)/r.height*canvas.height};
 }

 canvas.addEventListener('pointerdown',e=>{
  if(e.defaultPrevented)return;
  const p=point(e),boxes=JSON.parse(canvas.dataset.textLayerBoxes||'[]');
  for(let i=boxes.length-1;i>=0;i--){
   const b=boxes[i],a=-b.angle*Math.PI/180,dx=p.x-b.x,dy=p.y-b.y,lx=dx*Math.cos(a)-dy*Math.sin(a),ly=dx*Math.sin(a)+dy*Math.cos(a),left=b.align==='center'?-b.width/2:b.align==='right'?-b.width:0;
   if(lx<left-12||lx>left+b.width+12||ly>-b.height*.9||ly>b.height*.28)continue;
   const item=items.find(x=>x.id===b.id);
   if(!item)continue;
   selected=item.id;
   drag={id:e.pointerId,x:p.x,y:p.y,itemX:item.x,itemY:item.y};
   canvas.setPointerCapture(e.pointerId);
   e.preventDefault();e.stopImmediatePropagation();
   publish();
   canvas.dispatchEvent(new CustomEvent('poster:layerselect',{detail:{type:'text',id:selected}}));
   break;
  }
 },{capture:true});

 canvas.addEventListener('pointermove',e=>{
  if(!drag||drag.id!==e.pointerId)return;
  const p=point(e),item=items.find(x=>x.id===selected);
  if(!item)return;

  let rawX = (drag.itemX / 100 * canvas.width) + (p.x - drag.x);
  let rawY = (drag.itemY / 100 * canvas.height) + (p.y - drag.y);

  // Magnetic snap guides integration
  if (window.MASSYNE_SNAP) {
   rawX = window.MASSYNE_SNAP.checkSnapX(rawX, 100);
   rawY = window.MASSYNE_SNAP.checkSnapY(rawY, 100);
  }

  item.x = Math.max(0, Math.min(100, (rawX / canvas.width) * 100));
  item.y = Math.max(3, Math.min(100, (rawY / canvas.height) * 100));
  render();
 });

 for(const t of ['pointerup','pointercancel','lostpointercapture'])canvas.addEventListener(t,e=>{
  if(drag&&drag.id===e.pointerId){
   drag=null;
   if(window.MASSYNE_SNAP) window.MASSYNE_SNAP.clearGuides();
   publish();
   render();
  }
 });

 publish();
})();
