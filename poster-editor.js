/* Text transforms and bounded undo history, including all sticker edits. */
(() => {
 const canvas=document.getElementById('poster-canvas'),undo=document.getElementById('poster-undo'),redo=document.getElementById('poster-redo');
 const fields={textX:document.getElementById('text-x'),textY:document.getElementById('text-y'),textScale:document.getElementById('text-scale'),textAngle:document.getElementById('text-angle')};
 const history=[];let index=-1,timer=null,restoring=false,drag=null;
 const snapshot=()=>{const data={};canvas.dispatchEvent(new CustomEvent('poster:snapshot',{detail:data}));return data;};
 const sync=()=>{undo.disabled=index<=0;redo.disabled=index>=history.length-1;const data=snapshot().poster;for(const [key,field] of Object.entries(fields))field.value=data[key];};
 function commit(){clearTimeout(timer);timer=null;if(restoring)return;const next=JSON.stringify(snapshot());if(next===history[index]){sync();return;}history.splice(index+1);history.push(next);if(history.length>60)history.shift();index=history.length-1;sync();}
 function later(){if(!restoring){clearTimeout(timer);timer=setTimeout(commit,180);}}
 function go(direction){commit();const next=index+direction;if(next<0||next>=history.length)return;restoring=true;index=next;canvas.dispatchEvent(new CustomEvent('poster:restore',{detail:JSON.parse(history[index])}));restoring=false;sync();document.getElementById('lab-status').textContent=direction<0?'Change undone.':'Change restored.';}
 undo.addEventListener('click',()=>go(-1));redo.addEventListener('click',()=>go(1));
 document.querySelector('.controls').addEventListener('input',later);document.querySelector('.controls').addEventListener('change',later);document.querySelector('.controls').addEventListener('click',e=>{if(!e.target.closest('[data-history],#download-poster'))later();});
 canvas.addEventListener('poster:render',later);
 for(const [key,field] of Object.entries(fields))field.addEventListener('input',()=>canvas.dispatchEvent(new CustomEvent('poster:text-edit',{detail:{[key]:Number(field.value)}})));
 function point(e){const r=canvas.getBoundingClientRect();return{x:(e.clientX-r.left)/r.width*1080,y:(e.clientY-r.top)/r.height*1350};}
 canvas.addEventListener('pointerdown',e=>{if(e.defaultPrevented)return;const p=point(e);const boxes=JSON.parse(canvas.dataset.textBoxes||'[]');const hit=boxes.some(b=>{const angle=-b.angle*Math.PI/180,dx=p.x-b.x,dy=p.y-b.y,x=dx*Math.cos(angle)-dy*Math.sin(angle),y=dx*Math.sin(angle)+dy*Math.cos(angle);const left=b.align==='center'?-b.width/2:b.align==='right'?-b.width:0;return x>=left-12&&x<=left+b.width+12&&y>=-b.height&&y<=b.height*.15;});if(!hit)return;commit();const data=snapshot().poster;drag={id:e.pointerId,x:p.x,y:p.y,textX:data.textX,textY:data.textY};canvas.setPointerCapture(e.pointerId);e.preventDefault();});
 canvas.addEventListener('pointermove',e=>{if(!drag||drag.id!==e.pointerId)return;const p=point(e);canvas.dispatchEvent(new CustomEvent('poster:text-edit',{detail:{textX:Math.round(Math.max(-400,Math.min(400,drag.textX+p.x-drag.x))),textY:Math.round(Math.max(-400,Math.min(400,drag.textY+p.y-drag.y)))}}));sync();});
 for(const type of ['pointerup','pointercancel','lostpointercapture'])canvas.addEventListener(type,()=>{if(drag){drag=null;commit();}else later();});
 canvas.addEventListener('keydown',e=>{if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key))return;e.preventDefault();const p=snapshot().poster,step=e.shiftKey?10:2;const key=e.key==='ArrowLeft'||e.key==='ArrowRight'?'textX':'textY';const delta=e.key==='ArrowLeft'||e.key==='ArrowUp'?-step:step;canvas.dispatchEvent(new CustomEvent('poster:text-edit',{detail:{[key]:Math.max(-400,Math.min(400,p[key]+delta))}}));sync();later();});
 document.addEventListener('keydown',e=>{if(!(e.ctrlKey||e.metaKey)||e.target.closest('input,textarea,[contenteditable=true]'))return;const key=e.key.toLowerCase();if(key==='z'||key==='y'){e.preventDefault();go(key==='y'||e.shiftKey?1:-1);}});
 document.addEventListener('DOMContentLoaded',commit,{once:true});
})();
