(() => {
 const canvas=document.getElementById('poster-canvas'),ctx=canvas.getContext('2d');
 const input=document.getElementById('poster-name'),status=document.getElementById('lab-status');
 const pageBackground=document.getElementById('page-background');
 const titleColor=document.getElementById('title-color'),titleWeight=document.getElementById('title-weight');
 const state={font:'Sora',textX:0,textY:0,textScale:100,textAngle:0,titleColor:'#171719',titleWeight:'700',background:'#ffffff'};
 let queued=false;
 function draw(){
  queued=false;
  const raw=input.value.trim(),title=raw.toLocaleUpperCase();
  const width=canvas.width,height=canvas.height;
  const background=state.background||'#ffffff';
  ctx.clearRect(0,0,width,height);
  ctx.fillStyle=background;ctx.fillRect(0,0,width,height);
  canvas.dataset.paletteForeground=state.titleColor;
  canvas.dataset.paletteAccent='#a42739';
  const boxes=[];
  if(title){
   let size=160;
   ctx.font=`${state.titleWeight} ${size}px "${state.font}",sans-serif`;
   while(ctx.measureText(title).width>920&&size>28){size-=2;ctx.font=`${state.titleWeight} ${size}px "${state.font}",sans-serif`;}
   size*=state.textScale/100;
   const x=width/2+state.textX,y=height/2+state.textY;
   ctx.save();ctx.translate(x,y);ctx.rotate(state.textAngle*Math.PI/180);
   ctx.font=`${state.titleWeight} ${size}px "${state.font}",sans-serif`;
   ctx.textAlign='center';ctx.textBaseline='alphabetic';ctx.fillStyle=state.titleColor;
   const textWidth=Math.min(980,ctx.measureText(title).width);
   ctx.fillText(title,0,0,980);ctx.restore();
   boxes.push({x,y,width:textWidth,height:size,align:'center',angle:state.textAngle});
  }
  canvas.dataset.textBoxes=JSON.stringify(boxes);
  canvas.dispatchEvent(new Event('poster:draw'));
  canvas.setAttribute('aria-label',title?title+' design canvas':'Blank white design canvas');
 }
 function render(){if(!queued){queued=true;requestAnimationFrame(draw);}}
 canvas.addEventListener('poster:render',render);
 canvas.addEventListener('poster:snapshot',event=>{event.detail.poster={...state,name:input.value};});
 canvas.addEventListener('poster:restore',event=>{
  const saved=event.detail.poster||{};
  input.value=saved.name||'';
  for(const key of Object.keys(state))if(key in saved)state[key]=saved[key];
  pageBackground.value=state.background;titleColor.value=state.titleColor;titleWeight.value=state.titleWeight;
  document.querySelectorAll('[data-font]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.font===state.font)));
  render();
 });
 canvas.addEventListener('poster:text-edit',event=>{Object.assign(state,event.detail);render();});
 input.addEventListener('input',()=>{status.textContent='';render();});
 pageBackground.addEventListener('input',()=>{state.background=pageBackground.value;render();});
 document.querySelectorAll('[data-font]').forEach(button=>button.addEventListener('click',()=>{
  state.font=button.dataset.font;
  document.querySelectorAll('[data-font]').forEach(item=>item.setAttribute('aria-pressed',String(item===button)));
  render();
 }));
 titleColor.addEventListener('input',()=>{state.titleColor=titleColor.value;render();});
 titleWeight.addEventListener('change',()=>{state.titleWeight=titleWeight.value;render();});
 document.querySelectorAll('button[data-theme]').forEach(button=>button.addEventListener('click',()=>{
  document.documentElement.dataset.theme=button.dataset.theme;
  try{localStorage.setItem('massyne:theme',button.dataset.theme)}catch{}
  document.querySelectorAll('button[data-theme]').forEach(item=>item.setAttribute('aria-pressed',String(item===button)));
 }));
 document.getElementById('reset-poster').addEventListener('click',()=>{
  input.value='';
  Object.assign(state,{font:'Sora',textX:0,textY:0,textScale:100,textAngle:0,titleColor:'#171719',titleWeight:'700',background:'#ffffff'});
  pageBackground.value=state.background;titleColor.value=state.titleColor;titleWeight.value=state.titleWeight;
  document.querySelectorAll('[data-font]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.font===state.font)));
  status.textContent='Blank white canvas ready.';render();
 });
 document.getElementById('download-poster').addEventListener('click',async()=>{
  const button=document.getElementById('download-poster');button.disabled=true;
  try{
   await document.fonts.ready;draw();
   const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/png'));
   if(!blob)throw Error('Export unavailable');
   const url=URL.createObjectURL(blob),a=document.createElement('a');
   a.href=url;a.download='massyne-lab-'+(input.value.trim().replace(/[^a-z0-9]+/gi,'-').slice(0,30)||'design')+'.png';
   document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
   status.textContent='Your 1080 × 1350 design is ready.';
  }catch{status.textContent='Export could not finish. Please try again.';}
  finally{button.disabled=false;}
 });

 const drawFieldset=document.querySelector('.freehand-controls');
 const strokes=[],inkCanvas=document.createElement('canvas');
 inkCanvas.width=canvas.width;inkCanvas.height=canvas.height;
 const inkCtx=inkCanvas.getContext('2d'),drawColor=document.getElementById('draw-color');
 const drawSize=document.getElementById('draw-size'),drawSizeValue=document.getElementById('draw-size-value');
 const drawToolButtons=[...drawFieldset.querySelectorAll('[data-draw-tool]')];
 let drawTool='select',activeStroke=null,activePointer=null;
 function setDrawTool(tool,announce=true){
  drawTool=tool;canvas.dataset.tool=tool;
  drawToolButtons.forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.drawTool===tool)));
  canvas.dispatchEvent(new CustomEvent('poster:toolchange',{detail:{tool}}));
  if(announce)status.textContent=tool==='select'?'Select mode: move text, images and shapes.':tool==='draw'?'Pen ready — draw on the canvas.':'Eraser ready — erase freehand marks.';
 }
 drawToolButtons.forEach(button=>button.addEventListener('click',()=>setDrawTool(button.dataset.drawTool)));
 drawSize.addEventListener('input',()=>{drawSizeValue.value=drawSize.value+' px';drawSizeValue.textContent=drawSizeValue.value;});
 function drawFreehand(){
  inkCtx.clearRect(0,0,inkCanvas.width,inkCanvas.height);
  for(const stroke of strokes){
   if(!stroke.points.length)continue;
   inkCtx.save();inkCtx.globalCompositeOperation=stroke.erase?'destination-out':'source-over';
   inkCtx.strokeStyle=stroke.color;inkCtx.fillStyle=stroke.color;inkCtx.lineWidth=stroke.size;inkCtx.lineCap='round';inkCtx.lineJoin='round';
   if(stroke.points.length===1){inkCtx.beginPath();inkCtx.arc(stroke.points[0].x,stroke.points[0].y,stroke.size/2,0,Math.PI*2);inkCtx.fill();}
   else{
    inkCtx.beginPath();inkCtx.moveTo(stroke.points[0].x,stroke.points[0].y);
    for(let i=1;i<stroke.points.length-1;i++){const a=stroke.points[i],b=stroke.points[i+1];inkCtx.quadraticCurveTo(a.x,a.y,(a.x+b.x)/2,(a.y+b.y)/2);}
    const last=stroke.points[stroke.points.length-1];inkCtx.lineTo(last.x,last.y);inkCtx.stroke();
   }
   inkCtx.restore();
  }
  ctx.drawImage(inkCanvas,0,0);
  canvas.dataset.freehandCount=strokes.length;
  if(Number(canvas.dataset.reportedStrokeCount)!==strokes.length){
   canvas.dataset.reportedStrokeCount=strokes.length;
   canvas.dispatchEvent(new CustomEvent('poster:freehandchange',{detail:{count:strokes.length}}));
  }
 }
 canvas.addEventListener('poster:draw',drawFreehand);
 canvas.addEventListener('poster:snapshot',event=>{event.detail.drawings=strokes.map(stroke=>({...stroke,points:stroke.points.map(point=>({...point}))}));});
 canvas.addEventListener('poster:restore',event=>{
  const saved=Array.isArray(event.detail.drawings)?event.detail.drawings:[];
  strokes.splice(0,strokes.length,...saved.map(stroke=>({...stroke,points:stroke.points.map(point=>({...point}))})));
  activeStroke=null;activePointer=null;render();
 });
 function canvasPoint(event){
  const rect=canvas.getBoundingClientRect();
  return{x:Math.max(0,Math.min(1080,(event.clientX-rect.left)/rect.width*1080)),y:Math.max(0,Math.min(1350,(event.clientY-rect.top)/rect.height*1350))};
 }
 canvas.addEventListener('pointerdown',event=>{
  if(drawTool==='select'||(event.button!==0&&event.pointerType==='mouse'))return;
  event.preventDefault();event.stopImmediatePropagation();
  activeStroke={color:drawColor.value,size:Number(drawSize.value),erase:drawTool==='erase',points:[canvasPoint(event)]};
  strokes.push(activeStroke);activePointer=event.pointerId;canvas.setPointerCapture(event.pointerId);render();
 },{capture:true});
 canvas.addEventListener('pointermove',event=>{
  if(!activeStroke||event.pointerId!==activePointer)return;
  event.preventDefault();event.stopImmediatePropagation();
  const events=event.getCoalescedEvents?.()||[event];
  for(const pointEvent of events)activeStroke.points.push(canvasPoint(pointEvent));
  render();
 },{capture:true});
 for(const type of ['pointerup','pointercancel','lostpointercapture'])canvas.addEventListener(type,event=>{
  if(!activeStroke||event.pointerId!==activePointer)return;
  event.preventDefault();event.stopImmediatePropagation();activePointer=null;activeStroke=null;render();
  status.textContent='Stroke added. Use Undo or keep creating.';
 },{capture:true});
 document.getElementById('clear-drawing').addEventListener('click',()=>{
  if(!strokes.length)return;strokes.length=0;render();status.textContent='Freehand marks cleared. Use Undo to bring them back.';
 });
 document.getElementById('reset-poster').addEventListener('click',()=>{
  strokes.length=0;activeStroke=null;activePointer=null;drawColor.value='#171719';drawSize.value='16';
  drawSizeValue.value='16 px';drawSizeValue.textContent='16 px';setDrawTool('select',false);
 });
 setDrawTool('select',false);
 document.querySelectorAll('button[data-theme]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.theme===document.documentElement.dataset.theme)));
 draw();
 Promise.all(['Sora','Manrope','DM Serif Display','Bebas Neue','Anton','Space Grotesk','Oswald','Playfair Display','Montserrat','Orbitron','IBM Plex Mono'].map(font=>document.fonts.load(`700 32px "${font}"`).catch(()=>{}))).then(render);
})();
