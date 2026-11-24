/* Local image & sticker layers with position, scale, opacity, rotation, blend mode, and snap guides. */
(() => {
 const canvas=document.getElementById('poster-canvas'),ctx=canvas.getContext('2d'),items=[],cache=new Map();let selected=null,drag=null,nextId=1;
 const render=()=>canvas.dispatchEvent(new Event('poster:render')),clone=()=>items.map(({image,...item})=>({...item}));
 function publish(){canvas.dispatchEvent(new CustomEvent('poster:imagelayerschange',{detail:{layers:clone(),selectedId:selected}}));}
 function normalizeUrl(url) {
  if (!url) return '';
  if ((window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') && url.includes('r2.dev/images/')) {
    return url.replace(/^https:\/\/[^/]+\.r2\.dev\/images\//, 'images/');
  }
  return url;
 }

 function loadImage(item){
  if(cache.has(item.id))return cache.get(item.id);
  const image=new Image();
  image.crossOrigin="anonymous";
  cache.set(item.id,image);
  image.onload=render;
  image.onerror=()=>{
    if(image.src.includes('r2.dev/images/')){
      image.src=image.src.replace(/^https:\/\/[^/]+\.r2\.dev\/images\//,'images/');
    }
  };
  image.src=normalizeUrl(item.src);
  return image;
 }
 function select(id){selected=id;publish();canvas.dispatchEvent(new CustomEvent('poster:layerselect',{detail:{type:'image',id}}));render();}

 // Direct add method for stickers and portfolio artworks
 canvas.addEventListener('poster:image-add-direct', e => {
  const d = e.detail;
  if (!d || !d.src) return;
  const safeSrc = normalizeUrl(d.src);
  const image = new Image();
  image.crossOrigin = 'anonymous';
  image.onload = () => {
   const item = {
    id: nextId++,
    name: d.name || 'Artwork',
    src: safeSrc,
    x: d.x ?? (canvas.width / 2),
    y: d.y ?? (canvas.height / 2),
    width: d.width || 480,
    height: d.height || (d.width ? d.width * (image.naturalHeight / image.naturalWidth) : 480),
    angle: d.angle || 0,
    opacity: d.opacity ?? 100,
    blendMode: d.blendMode || 'source-over',
    visible: d.visible !== false
   };
   items.push(item);
   cache.set(item.id, image);
   select(item.id);
   render();
  };
  image.onerror=()=>{
    if(image.src.includes('r2.dev/images/')){
      image.src=image.src.replace(/^https:\/\/[^/]+\.r2\.dev\/images\//,'images/');
    }
  };
  image.src = safeSrc;
 });

 canvas.addEventListener('poster:images-clear', () => {
  items.length = 0;
  cache.clear();
  selected = null;
  publish();
  render();
 });

 document.getElementById('image-upload').addEventListener('change',event=>{
  const file=event.target.files?.[0];event.target.value='';if(!file)return;
  const status=document.getElementById('lab-status');
  if(file.size>20*1024*1024){status.textContent='Choose an image under 20 MB.';return;}
  if(!['image/png','image/jpeg','image/webp'].includes(file.type)){status.textContent='Choose a PNG, JPEG or WebP image.';return;}
  const src=URL.createObjectURL(file),image=new Image();
  image.crossOrigin="anonymous";
  image.onload=()=>{
   const scale=Math.min(1,720/image.naturalWidth,920/image.naturalHeight),width=image.naturalWidth*scale,height=image.naturalHeight*scale;
   const item={id:nextId++,name:file.name.replace(/\.[^.]+$/,'').slice(0,48)||'Image',src,x:canvas.width/2,y:canvas.height/2,width,height,angle:0,opacity:100,blendMode:'source-over',visible:true};
   items.push(item);cache.set(item.id,image);select(item.id);
   document.getElementById('layers-tab').click();
   status.textContent='Image added. Drag it or adjust its properties.';
  };
  image.onerror=()=>{URL.revokeObjectURL(src);status.textContent='This image could not be opened.';};
  image.src=src;
 });

 canvas.addEventListener('poster:draw',()=>{
  for(const item of items){
   if(!item.visible)continue;
   const image=cache.get(item.id)||loadImage(item);
   if(!image.complete||!image.naturalWidth)continue;
   const height=item.width*image.naturalHeight/image.naturalWidth;
   item.height=height;
   ctx.save();
   ctx.translate(item.x,item.y);
   ctx.rotate(item.angle*Math.PI/180);
   ctx.globalAlpha=item.opacity/100;
   ctx.globalCompositeOperation = item.blendMode || 'source-over';
   ctx.drawImage(image,-item.width/2,-height/2,item.width,height);
   ctx.restore();
  }
 });

 canvas.addEventListener('poster:layerselect',event=>{selected=event.detail.type==='image'?event.detail.id:null;publish();});
 canvas.addEventListener('poster:image-update',event=>{const item=items.find(x=>x.id===event.detail.id);if(!item)return;Object.assign(item,event.detail.updates);publish();render();});
 canvas.addEventListener('poster:image-delete',event=>{const i=items.findIndex(x=>x.id===event.detail.id);if(i<0)return;items.splice(i,1);cache.delete(event.detail.id);selected=items.length?items[items.length-1].id:null;publish();render();canvas.dispatchEvent(new CustomEvent('poster:layerselect',{detail:selected===null?{type:'main'}:{type:'image',id:selected}}));});
 canvas.addEventListener('poster:image-visibility',event=>{const item=items.find(x=>x.id===event.detail.id);if(item){item.visible=!item.visible;publish();render();}});
 canvas.addEventListener('poster:image-reorder',event=>{const i=items.findIndex(x=>x.id===event.detail.id),j=i+Number(event.detail.direction);if(i<0||j<0||j>=items.length)return;const [item]=items.splice(i,1);items.splice(j,0,item);selected=item.id;publish();render();});
 canvas.addEventListener('poster:snapshot',event=>{event.detail.imageLayers=clone();event.detail.selectedImageLayer=selected;event.detail.nextImageLayerId=nextId;});
 canvas.addEventListener('poster:restore',event=>{items.splice(0,items.length,...(Array.isArray(event.detail.imageLayers)?event.detail.imageLayers.map(x=>({...x})):[]));selected=event.detail.selectedImageLayer??null;nextId=Math.max(event.detail.nextImageLayerId||1,...items.map(x=>x.id+1));items.forEach(loadImage);publish();canvas.dispatchEvent(new CustomEvent('poster:layerselect',{detail:selected===null?{type:'main'}:{type:'image',id:selected}}));});

 function point(e){const r=canvas.getBoundingClientRect();return{x:(e.clientX-r.left)/r.width*canvas.width,y:(e.clientY-r.top)/r.height*canvas.height};}

 canvas.addEventListener('pointerdown',event=>{
  if(event.defaultPrevented)return;
  const p=point(event);
  for(let i=items.length-1;i>=0;i--){
   const item=items[i];if(!item.visible)continue;
   const a=-item.angle*Math.PI/180,dx=p.x-item.x,dy=p.y-item.y,lx=dx*Math.cos(a)-dy*Math.sin(a),ly=dx*Math.sin(a)+dy*Math.cos(a);
   if(Math.abs(lx)<=item.width/2&&Math.abs(ly)<=item.height/2){
    selected=item.id;drag={id:event.pointerId,x:p.x,y:p.y,itemX:item.x,itemY:item.y};
    canvas.setPointerCapture(event.pointerId);
    event.preventDefault();event.stopImmediatePropagation();
    publish();
    canvas.dispatchEvent(new CustomEvent('poster:layerselect',{detail:{type:'image',id:selected}}));
    break;
   }
  }
 },{capture:true});

 canvas.addEventListener('pointermove',event=>{
  if(!drag||drag.id!==event.pointerId)return;
  const item=items.find(x=>x.id===selected);if(!item)return;
  const p=point(event);
  let rawX = drag.itemX + p.x - drag.x;
  let rawY = drag.itemY + p.y - drag.y;

  // Magnetic snap guides integration
  if (window.MASSYNE_SNAP) {
   rawX = window.MASSYNE_SNAP.checkSnapX(rawX, item.width);
   rawY = window.MASSYNE_SNAP.checkSnapY(rawY, item.height);
  }

  item.x=Math.max(item.width/2,Math.min(canvas.width-item.width/2,rawX));
  item.y=Math.max(item.height/2,Math.min(canvas.height-item.height/2,rawY));
  render();
 });

 for(const type of ['pointerup','pointercancel','lostpointercapture'])canvas.addEventListener(type,event=>{
  if(drag&&drag.id===event.pointerId){
   drag=null;
   if(window.MASSYNE_SNAP) window.MASSYNE_SNAP.clearGuides();
   publish();
   render();
  }
 });

 document.getElementById('reset-poster').addEventListener('click',()=>{items.length=0;cache.clear();selected=null;nextId=1;publish();render();});
 publish();
})();
