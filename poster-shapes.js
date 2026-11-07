/* Editable vector accents, shared by the live preview and PNG export. */
(() => {
 const canvas=document.getElementById('poster-canvas'),ctx=canvas.getContext('2d');
 const layers=document.getElementById('shape-layer'),size=document.getElementById('shape-size'),angle=document.getElementById('shape-angle'),color=document.getElementById('shape-color'),finish=document.getElementById('shape-finish'),opacity=document.getElementById('shape-opacity'),xControl=document.getElementById('shape-x'),yControl=document.getElementById('shape-y');
 const sizeValue=document.getElementById('shape-size-value'),angleValue=document.getElementById('shape-angle-value'),opacityValue=document.getElementById('shape-opacity-value');
 const shapes=[];let selected=-1,drag=null;
 const render=()=>canvas.dispatchEvent(new Event('poster:render'));
 function sync(emit=true){
  layers.replaceChildren();if(!shapes.length)layers.add(new Option('No shapes yet',''));
  shapes.forEach((s,i)=>layers.add(new Option((i+1)+' / '+s.type,i)));layers.value=selected<0?'':String(selected);
  [size,angle,color,finish,opacity,xControl,yControl,document.getElementById('remove-shape')].forEach(el=>el.disabled=selected<0);
  const s=shapes[selected];if(s){size.value=s.size;angle.value=s.angle;color.value=s.color;finish.value=s.finish;opacity.value=s.opacity;xControl.value=Math.round(s.x/1080*100);yControl.value=Math.round(s.y/1350*100);}
  sizeValue.value=(s?.size||180)+' px';sizeValue.textContent=sizeValue.value;angleValue.value=(s?.angle||0)+'°';angleValue.textContent=angleValue.value;opacityValue.value=(s?.opacity??100)+'%';opacityValue.textContent=opacityValue.value;
  document.getElementById('shape-count').textContent=shapes.length+' / 12';
  if(emit)canvas.dispatchEvent(new CustomEvent('poster:layerschange',{detail:{shapes:shapes.map(s=>({...s})),selected}}));
 }
 document.querySelectorAll('[data-add-shape]').forEach(b=>b.addEventListener('click',()=>{if(shapes.length>=12){document.getElementById('lab-status').textContent='Maximum 12 shapes. Remove one to add another.';return;}shapes.push({type:b.dataset.addShape,x:760-(shapes.length%3)*150,y:920-(shapes.length%3)*120,size:180,angle:0,color:'#f8faed',finish:'chrome',opacity:100});selected=shapes.length-1;sync();render();}));
 layers.addEventListener('change',()=>{selected=Number(layers.value);sync();});
 for(const [el,key] of [[size,'size'],[angle,'angle'],[color,'color'],[finish,'finish'],[opacity,'opacity']])el.addEventListener('input',()=>{if(selected<0)return;shapes[selected][key]=['size','angle','opacity'].includes(key)?Number(el.value):el.value;if(key==='size'){sizeValue.value=el.value+' px';sizeValue.textContent=sizeValue.value;}if(key==='angle'){angleValue.value=el.value+'°';angleValue.textContent=angleValue.value;}if(key==='opacity'){opacityValue.value=el.value+'%';opacityValue.textContent=opacityValue.value;}render();});
 xControl.addEventListener('input',()=>{if(selected>=0){shapes[selected].x=Number(xControl.value)/100*1080;render();}});
 yControl.addEventListener('input',()=>{if(selected>=0){shapes[selected].y=Number(yControl.value)/100*1350;render();}});
 document.getElementById('remove-shape').addEventListener('click',()=>{if(selected<0)return;shapes.splice(selected,1);selected=shapes.length-1;sync();render();});
 const clear=()=>{shapes.length=0;selected=-1;sync();render();};document.getElementById('clear-shapes').addEventListener('click',clear);document.getElementById('reset-poster').addEventListener('click',clear);
 canvas.addEventListener('poster:shape-select',e=>{selected=Number(e.detail.index);sync();render();});
 function point(e){const r=canvas.getBoundingClientRect();return{x:(e.clientX-r.left)/r.width*1080,y:(e.clientY-r.top)/r.height*1350};}
 canvas.addEventListener('pointerdown',e=>{const p=point(e);for(let i=shapes.length-1;i>=0;i--){const s=shapes[i];if(Math.hypot(p.x-s.x,p.y-s.y)<=s.size*.7){selected=i;drag={id:e.pointerId,dx:p.x-s.x,dy:p.y-s.y};canvas.setPointerCapture(e.pointerId);sync();e.preventDefault();break;}}},{capture:true});
 canvas.addEventListener('pointermove',e=>{if(!drag||e.pointerId!==drag.id)return;const p=point(e),s=shapes[selected];s.x=Math.max(s.size/2,Math.min(1080-s.size/2,p.x-drag.dx));s.y=Math.max(s.size/2,Math.min(1350-s.size/2,p.y-drag.dy));sync(false);render();});
 for(const type of ['pointerup','pointercancel','lostpointercapture'])canvas.addEventListener(type,()=>{drag=null;});
 canvas.addEventListener('poster:snapshot',e=>{e.detail.shapes=shapes.map(s=>({...s}));});
 canvas.addEventListener('poster:restore',e=>{shapes.splice(0,shapes.length,...(Array.isArray(e.detail.shapes)?e.detail.shapes:[]).map(s=>({...s,opacity:s.opacity??100})));selected=shapes.length-1;sync();});
 canvas.addEventListener('poster:draw',()=>{for(const s of shapes){ctx.save();ctx.translate(s.x,s.y);ctx.rotate(s.angle*Math.PI/180);ctx.globalAlpha=s.opacity/100;const r=s.size/2;let fill=s.color;if(s.finish==='chrome'){const g=ctx.createLinearGradient(-r,-r,r,r);g.addColorStop(0,'#292d35');g.addColorStop(.2,'#dce3ea');g.addColorStop(.43,'#fff');g.addColorStop(.48,'#626d7c');g.addColorStop(.68,'#edf2f6');g.addColorStop(1,'#5b6572');fill=g;}ctx.fillStyle=fill;ctx.strokeStyle=fill;ctx.lineWidth=Math.max(3,s.size*.035);ctx.beginPath();
 if(s.type==='Star'){for(let i=0;i<16;i++){const a=i*Math.PI/8-Math.PI/2,rad=i%2?r*.35:r,x=Math.cos(a)*rad,y=Math.sin(a)*rad;if(!i)ctx.moveTo(x,y);else ctx.lineTo(x,y);}ctx.closePath();ctx.fill();}
 else if(s.type==='Spark'){ctx.moveTo(0,-r);ctx.bezierCurveTo(r*.15,-r*.15,r*.15,-r*.15,r,0);ctx.bezierCurveTo(r*.15,r*.15,r*.15,r*.15,0,r);ctx.bezierCurveTo(-r*.15,r*.15,-r*.15,r*.15,-r,0);ctx.bezierCurveTo(-r*.15,-r*.15,-r*.15,-r*.15,0,-r);ctx.fill();}
 else if(s.type==='Orbit'){for(let i=0;i<3;i++){ctx.beginPath();ctx.ellipse(0,0,r,r*.3,i*Math.PI/3,0,Math.PI*2);ctx.stroke();}ctx.beginPath();ctx.arc(0,0,r*.12,0,Math.PI*2);ctx.fill();}
 else if(s.type==='Checker'){const cell=s.size/4;for(let row=0;row<4;row++)for(let col=0;col<4;col++)if((row+col)%2===0)ctx.fillRect(-r+col*cell,-r+row*cell,cell,cell);}
 ctx.restore();}
 canvas.dataset.shapeCount=shapes.length;});
 sync();
})();