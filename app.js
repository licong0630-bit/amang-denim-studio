'use strict';
const $=id=>document.getElementById(id), W=1000,H=1500;
const svg=(body)=>'data:image/svg+xml;charset=utf-8,'+encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400">${body}</svg>`);
const flower=(x,y,r,c)=>`<g transform="translate(${x} ${y})">${Array.from({length:8},(_,i)=>`<ellipse cx="0" cy="-${r*.56}" rx="${r*.22}" ry="${r*.43}" fill="${c}" transform="rotate(${i*45})"/>`).join('')}<circle r="${r*.22}" fill="#d4a648"/></g>`;
const library=[
 {name:'雏菊花簇',src:svg(`<path d="M194 350Q205 235 160 130M195 310Q262 207 291 176" stroke="#77835b" stroke-width="8" fill="none"/><path d="M195 285Q130 280 143 235Q195 244 195 285M218 264Q276 269 269 224Q225 224 218 264" fill="#8e9a70"/>${flower(155,122,91,'#f6efd8')}${flower(290,163,62,'#fbf5e5')}`)},
 {name:'蝴蝶标本',src:svg('<path d="M198 195C105 44 32 67 54 175C61 209 108 233 178 220C85 225 68 333 133 322C181 315 196 269 200 233C205 280 225 323 270 321C330 318 308 226 222 220C300 237 343 199 347 154C356 56 271 62 204 197" fill="#843f46"/><path d="M94 115Q145 123 178 191M307 114Q254 120 221 190M118 277Q146 237 180 233M281 277Q254 237 222 233" fill="none" stroke="#e6cab1" stroke-width="5"/><path d="M194 166Q175 127 168 138M205 166Q223 126 230 138" fill="none" stroke="#593b34" stroke-width="4"/><ellipse cx="200" cy="211" rx="8" ry="61" fill="#593b34"/>')},
 {name:'星光轨迹',src:svg('<g fill="#d8bf78"><path d="M180 42L207 159L324 185L207 211L180 329L153 211L36 185L153 159Z"/><path d="M303 267L315 309L358 321L315 333L303 376L291 333L248 321L291 309Z"/><path d="M310 25L319 56L350 65L319 74L310 105L301 74L270 65L301 56Z"/></g>')},
 {name:'丝带蝴蝶结',src:svg('<g fill="none" stroke="#8c4050" stroke-width="13" stroke-linecap="round" stroke-linejoin="round"><path d="M197 181C98 48 30 130 91 191C123 214 162 201 197 181C295 48 370 130 310 191C278 216 236 200 197 181Z"/><path d="M194 192C156 221 118 303 147 347M208 192C243 238 272 284 289 329"/><ellipse cx="201" cy="184" rx="19" ry="15"/></g>')},
 {name:'BLOOM 字标',src:svg('<g fill="#f1e9d4" text-anchor="middle" font-family="Georgia,serif"><text x="200" y="185" font-size="69" font-style="italic">bloom</text><text x="200" y="234" font-family="sans-serif" font-size="13" letter-spacing="7">IN YOUR OWN WAY</text></g><path d="M100 261Q200 294 300 261" stroke="#f1e9d4" stroke-width="3" fill="none"/>')},
 {name:'涂鸦爱心',src:svg('<path d="M200 329C181 312 51 218 57 140C65 39 165 60 199 125C238 54 346 45 348 141C350 211 242 303 200 329Z" fill="none" stroke="#8d3c3f" stroke-width="15" stroke-linecap="round"/><path d="M93 139Q99 95 137 112" fill="none" stroke="#8d3c3f" stroke-width="7" stroke-linecap="round"/>')}
];
const defaults=[
 {id:'front',name:'正面',src:'assets/1.jpg',place:[.40,.43],mask:[[.363,.132],[.518,.145],[.682,.123],[.712,.235],[.729,.333],[.702,.622],[.66,.909],[.501,.913],[.483,.832],[.513,.349],[.5,.348],[.455,.57],[.471,.833],[.489,.909],[.324,.917],[.281,.75],[.259,.567],[.292,.369],[.326,.247]]},
 {id:'side',name:'侧身',src:'assets/4.jpg',place:[.59,.44],mask:[[.401,.146],[.566,.134],[.651,.132],[.702,.248],[.71,.31],[.699,.537],[.69,.922],[.552,.938],[.402,.901],[.34,.71],[.295,.494],[.306,.384],[.343,.303],[.371,.218]]},
 {id:'back',name:'背面',src:'assets/3.jpg',place:[.394,.28],mask:[[.36,.134],[.494,.13],[.65,.135],[.681,.211],[.705,.337],[.706,.76],[.699,.898],[.65,.946],[.55,.947],[.51,.873],[.498,.34],[.489,.336],[.484,.854],[.452,.943],[.353,.947],[.304,.894],[.296,.691],[.301,.337],[.325,.22]]},
 {id:'flat',name:'平铺',src:'assets/6.jpg',place:[.355,.40],mask:[[.298,.075],[.49,.087],[.709,.075],[.751,.184],[.792,.431],[.88,.904],[.609,.922],[.512,.381],[.502,.352],[.487,.352],[.4,.921],[.131,.904],[.208,.45],[.251,.207]]},
 {id:'waist',name:'前腰细节',src:'assets/5.jpg',place:[.40,.72],mask:[[.278,.265],[.513,.309],[.792,.329],[1,.309],[1,1],[.066,1],[.103,.734],[.128,.622],[.203,.452]]},
 {id:'pocket',name:'后袋细节',src:'assets/7.jpg',place:[.385,.47],mask:[[.28,.264],[.53,.259],[.744,.266],[.784,.336],[.843,.537],[.881,.72],[.909,1],[.591,1],[.535,.641],[.526,.636],[.473,1],[.143,1],[.151,.738],[.193,.516],[.232,.366]]},
 {id:'full',name:'全身说明',src:'assets/2-2.jpg',place:[.535,.62],mask:[[.527,.393],[.72,.382],[.75,.444],[.77,.507],[.75,.743],[.715,.926],[.609,.92],[.598,.852],[.632,.537],[.619,.536],[.575,.655],[.567,.796],[.601,.916],[.488,.924],[.445,.724],[.447,.639],[.482,.539],[.503,.453]]},
 {id:'street',name:'街拍',src:'assets/8.jpg',place:[.459,.59],mask:[[.438,.42],[.525,.413],[.638,.41],[.663,.448],[.661,.581],[.624,.748],[.594,.893],[.495,.909],[.485,.814],[.538,.514],[.525,.51],[.48,.686],[.477,.918],[.388,.93],[.373,.871],[.376,.682],[.386,.58],[.422,.485]]}
];
let state={version:1,name:'蓝调 · 桶型牛仔裤',active:'front',selected:null,angles:defaults.map(a=>({...a,layers:[]}))};
let images=new Map(),baseCache=new Map(),history=[],future=[],maskPoints=null,compare=false,drag=null,saveTimer,toastTimer,db=null,storageAvailable=true;
const canvas=$('mockup'),ctx=canvas.getContext('2d'),sel=$('selection'),sc=sel.getContext('2d');
const current=()=>state.angles.find(a=>a.id===state.active)||state.angles[0];
const selected=()=>current().layers.find(l=>l.id===state.selected);
const clone=x=>JSON.parse(JSON.stringify(x));
const uid=()=>crypto.randomUUID?.()||'id'+Date.now()+Math.random().toString(36).slice(2);
function toast(msg){$('toast').textContent=msg;$('toast').classList.add('visible');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('toast').classList.remove('visible'),3300)}
function loadImage(src){if(images.has(src))return images.get(src);const p=new Promise((resolve,reject)=>{let im=new Image();im.onload=()=>resolve(im);im.onerror=()=>{images.delete(src);reject(new Error('图片无法读取'))};im.src=src});images.set(src,p);return p}
const loaded=new Map();
async function imageReady(src){if(loaded.has(src))return loaded.get(src);let im=await loadImage(src);loaded.set(src,im);return im}
function path(c,points){c.beginPath();points.forEach(([x,y],i)=>i?c.lineTo(x*W,y*H):c.moveTo(x*W,y*H));c.closePath()}
async function prepare(a){const cached=baseCache.get(a.id),maskKey=JSON.stringify(a.mask);if(cached&&cached.src===a.src&&cached.maskKey===maskKey&&cached.colorGuard===a.colorGuard)return cached;const im=await imageReady(a.src);const c=document.createElement('canvas');c.width=W;c.height=H;const cctx=c.getContext('2d',{willReadFrequently:true});cctx.fillStyle='#f2f3f5';cctx.fillRect(0,0,W,H);let scale=Math.min(W/im.width,H/im.height);cctx.drawImage(im,(W-im.width*scale)/2,(H-im.height*scale)/2,im.width*scale,im.height*scale);const base=cctx.getImageData(0,0,W,H).data;const m=document.createElement('canvas');m.width=W;m.height=H;let mc=m.getContext('2d',{willReadFrequently:true});mc.fillStyle='white';if(a.mask?.length){path(mc,a.mask);mc.fill()}else mc.fillRect(0,0,W,H);const pixels=mc.getImageData(0,0,W,H);if(a.mask?.length&&a.colorGuard!==false){for(let i=0;i<base.length;i+=4){let blue=base[i+2]-base[i];let denim=Math.min(1,Math.max(0,(blue-5)/12));pixels.data[i+3]*=denim;}}mc.putImageData(pixels,0,0);const result={canvas:c,base,mask:m,src:a.src,maskKey,colorGuard:a.colorGuard};baseCache.set(a.id,result);return result}
const overlay=document.createElement('canvas');overlay.width=W;overlay.height=H;const oc=overlay.getContext('2d',{willReadFrequently:true});
function dimensions(l){let im=loaded.get(l.src);let w=l.size/100*W;return [w,w*(im?im.height/im.width:1)]}
function drawLayer(target,l,base){
 let im=loaded.get(l.src);if(!im)return;
 const [w,h]=dimensions(l),rad=Math.hypot(w,h)/2+25;
 const x=Math.max(0,Math.floor(l.x*W-rad)),y=Math.max(0,Math.floor(l.y*H-rad));
 const bw=Math.max(0,Math.min(W-x,Math.ceil(rad*2+2))),bh=Math.max(0,Math.min(H-y,Math.ceil(rad*2+2)));
 if(!bw||!bh)return;
 oc.clearRect(0,0,W,H);oc.save();oc.translate(l.x*W,l.y*H);oc.rotate(l.rotation*Math.PI/180);oc.scale(l.flip?-1:1,1);oc.globalAlpha=l.opacity/100;oc.drawImage(im,-w/2,-h/2,w,h);oc.restore();
 const curve=(l.curve??45)/100,perspective=(l.perspective??0)/100;
 if(l.texture||curve||perspective){
  const src=oc.getImageData(x,y,bw,bh),out=oc.createImageData(bw,bh),sd=src.data,od=out.data;
  const angle=l.rotation*Math.PI/180,cos=Math.cos(angle),sin=Math.sin(angle),theta=curve*1.9;
  for(let j=0;j<bh;j++)for(let k=0;k<bw;k++){
   const px=x+k,py=y+j,dx=px-l.x*W,dy=py-l.y*H;
   let u=(dx*cos+dy*sin)/w,v=(-dx*sin+dy*cos)/h;
   v/=Math.max(.6,1+u*perspective);
   if(theta){const t=u*theta;if(Math.abs(t)>=.98)continue;u=Math.asin(t)/theta;}
   let sx=l.x*W+u*w*cos-v*h*sin-x,sy=l.y*H+u*w*sin+v*h*cos-y;
   const b=(py*W+px)*4;
   if(l.texture){
    const lumAt=(xx,yy)=>{const i=(Math.max(0,Math.min(H-1,yy))*W+Math.max(0,Math.min(W-1,xx)))*4;return .2126*base.base[i]+.7152*base.base[i+1]+.0722*base.base[i+2]};
    sx+=(lumAt(px+4,py)-lumAt(px-4,py))*.035;
    sy+=(lumAt(px,py+4)-lumAt(px,py-4))*.055;
   }
   if(sx<0||sy<0||sx>=bw-1||sy>=bh-1)continue;
   const ix=Math.floor(sx),iy=Math.floor(sy),fx=sx-ix,fy=sy-iy;
   const idx=(iy*bw+ix)*4,di=(j*bw+k)*4;
   const weights=[(1-fx)*(1-fy),fx*(1-fy),(1-fx)*fy,fx*fy],offsets=[idx,idx+4,idx+bw*4,idx+bw*4+4];
   let a=0,r=0,g=0,bl=0;
   for(let n=0;n<4;n++){const si=offsets[n],aw=weights[n]*sd[si+3];a+=aw;r+=sd[si]*aw;g+=sd[si+1]*aw;bl+=sd[si+2]*aw}
   if(!a)continue;
   let shade=1,coverage=1;
   if(l.texture){const lum=.2126*base.base[b]+.7152*base.base[b+1]+.0722*base.base[b+2];shade=Math.max(.42,Math.min(1.08,.27+lum/245));coverage=Math.max(.72,Math.min(.98,.75+lum/850))}
   od[di]=r/a*shade;od[di+1]=g/a*shade;od[di+2]=bl/a*shade;od[di+3]=a*coverage;
  }
  oc.clearRect(0,0,W,H);oc.putImageData(out,x,y);
 }
 if(l.clip){oc.globalCompositeOperation='destination-in';oc.drawImage(base.mask,0,0);oc.globalCompositeOperation='source-over'}
 target.save();target.globalCompositeOperation=l.blend;target.drawImage(overlay,0,0);target.restore()
}
function paint(a=current(),target=ctx,original=compare){const base=baseCache.get(a.id);if(!base)return;target.clearRect(0,0,W,H);target.drawImage(base.canvas,0,0);if(!original)for(const l of a.layers)drawLayer(target,l,base);if(target===ctx)drawSelection()}
function drawSelection(){sc.clearRect(0,0,W,H);if(maskPoints){sc.fillStyle='#effad020';if(maskPoints.length>2){path(sc,maskPoints);sc.fill()}sc.strokeStyle='#819852';sc.lineWidth=3;sc.setLineDash([9,7]);sc.beginPath();maskPoints.forEach(([x,y],i)=>i?sc.lineTo(x*W,y*H):sc.moveTo(x*W,y*H));sc.stroke();sc.setLineDash([]);for(let [x,y]of maskPoints){sc.beginPath();sc.arc(x*W,y*H,7,0,Math.PI*2);sc.fillStyle='#fff';sc.fill();sc.stroke()}return}let l=selected();if(!l||compare)return;let [w,h]=dimensions(l);sc.save();sc.translate(l.x*W,l.y*H);sc.rotate(l.rotation*Math.PI/180);sc.strokeStyle='#879d64';sc.lineWidth=2;sc.setLineDash([7,5]);sc.strokeRect(-w/2-7,-h/2-7,w+14,h+14);sc.setLineDash([]);for(let [x,y]of [[-w/2-7,-h/2-7],[w/2+7,-h/2-7],[w/2+7,h/2+7],[-w/2-7,h/2+7]]){sc.fillStyle='#fff';sc.fillRect(x-5,y-5,10,10);sc.strokeRect(x-5,y-5,10,10)}sc.restore()}
function checkpoint(){history.push(JSON.stringify(state));if(history.length>35)history.shift();future=[];updateUndo()}
function updateUndo(){$('undoBtn').disabled=!history.length;$('redoBtn').disabled=!future.length}
function markDirty(){clearTimeout(saveTimer);$('saveStatus').textContent='保存中…';saveTimer=setTimeout(saveDraft,650)}
async function openDB(){return new Promise((resolve,reject)=>{let req=indexedDB.open('amang-denim-studio',1);req.onupgradeneeded=()=>req.result.createObjectStore('drafts');req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error)})}
async function saveDraft(){if(!db){$('saveStatus').textContent='请保存工程';return}try{await new Promise((resolve,reject)=>{let tx=db.transaction('drafts','readwrite');tx.objectStore('drafts').put(clone(state),'current');tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error)});$('saveStatus').textContent='✓ 已保存到本机'}catch{$('saveStatus').textContent='请保存工程';if(storageAvailable){toast('浏览器存储空间不足，请下载工程保存设计');storageAvailable=false}}}
function text(el,s){el.textContent=s;return el}
function node(tag,cls){let e=document.createElement(tag);if(cls)e.className=cls;return e}
function thumb(src,alt){let im=node('img');im.src=src;im.alt=alt;im.loading='lazy';return im}
function renderLibraries(){const lib=$('artworkLibrary');lib.replaceChildren();library.forEach(item=>{let b=node('button','art-card');b.title='添加'+item.name;let wrap=node('div','art-image');wrap.append(thumb(item.src,item.name));let label=node('div','art-label');label.append(text(node('strong'),item.name),text(node('span'),'＋'));b.append(wrap,label);b.onclick=()=>addLayer(item);lib.append(b)})}
function renderAngles(){let film=$('filmstrip'),lib=$('angleLibrary');film.replaceChildren();lib.replaceChildren();state.angles.forEach((a,i)=>{let b=node('button','film-item'+(a.id===state.active?' active':''));b.title=a.name;b.setAttribute('aria-label','切换到'+a.name);b.setAttribute('aria-pressed',String(a.id===state.active));b.append(thumb(a.src,a.name),text(node('span'),a.name));if(a.layers.length)b.append(node('i'));b.onclick=()=>switchAngle(a.id);film.append(b);let card=node('div','angle-card'+(a.id===state.active?' active':''));let choose=node('button','angle-choose');choose.setAttribute('aria-label','选择底图 '+a.name);choose.append(thumb(a.src,a.name),text(node('span'),String(i+1).padStart(2,'0')+' / '+a.name));choose.onclick=()=>switchAngle(a.id);let actions=node('div','angle-card-actions'),replace=text(node('button'),'替换'),exp=text(node('button'),'导出单张');replace.setAttribute('aria-label','替换底图 '+a.name);replace.onclick=()=>chooseReplacement(a.id);exp.setAttribute('aria-label','导出单张 '+a.name);exp.onclick=()=>exportSingle(a.id);actions.append(replace,exp);card.append(choose,actions);lib.append(card)});$('currentAngleLabel').textContent=String(state.angles.findIndex(a=>a.id===state.active)+1).padStart(2,'0')+' / '+current().name;document.querySelector('.project-tag').textContent=state.angles.length+' 个角度';document.querySelector('[data-tab=angles] span').textContent=state.angles.length;renderExportChoices();$('maskNotice').hidden=!!current().mask;$('angleNameInput').value=current().name}
function renderLayers(){let list=$('layerList');list.replaceChildren();$('layerCount').textContent=current().layers.length;current().layers.slice().reverse().forEach(l=>{let b=node('button','layer-item'+(state.selected===l.id?' active':''));b.append(thumb(l.src,l.name),text(node('strong'),l.name),text(node('span'),'◈'));b.onclick=()=>{state.selected=l.id;renderLayers();renderProperties();drawSelection()};list.append(b)});if(!current().layers.length)list.append(text(node('p','empty-layer'),'还没有图案，点击左侧素材添加'))}
function renderProperties(){let l=selected();$('properties').hidden=!l;$('noSelection').hidden=!!l;if(!l)return;$('selectedName').textContent=l.name;$('selectedPreview').replaceChildren(thumb(l.src,l.name));$('posX').value=(l.x*100).toFixed(1);$('posY').value=(l.y*100).toFixed(1);$('sizeRange').value=l.size;$('sizeValue').textContent=l.size.toFixed(1)+'%';$('rotateRange').value=l.rotation;$('rotateValue').textContent=l.rotation+'°';$('opacityRange').value=l.opacity;$('opacityValue').textContent=l.opacity+'%';$('curveRange').value=l.curve??45;$('curveValue').textContent=(l.curve??45)+'%';$('perspectiveRange').value=l.perspective??0;$('perspectiveValue').textContent=(l.perspective??0)+'°';$('blendMode').value=l.blend;$('textureToggle').checked=l.texture;$('clipToggle').checked=l.clip}
function refresh(){renderAngles();renderLayers();renderProperties();paint();updateUndo();$('projectName').value=state.name}
async function switchAngle(id){if(maskPoints)cancelMask();state.active=id;state.selected=current().layers.at(-1)?.id||null;compare=false;$('compareBtn').setAttribute('aria-pressed','false');document.body.classList.add('loading');try{await prepare(current());refresh();markDirty()}catch{toast('底图读取失败，请重新导入图片')}finally{document.body.classList.remove('loading')}}
async function addLayer(item){try{await imageReady(item.src);checkpoint();let p=current().place||[.5,.55];let l={id:uid(),name:item.name,src:item.src,x:p[0],y:p[1],size:19,rotation:0,opacity:100,curve:45,perspective:0,texture:true,clip:true,flip:false,blend:'source-over'};current().layers.push(l);state.selected=l.id;refresh();markDirty()}catch{toast('无法读取图案，请使用有效的图片文件')}}
function changeLayer(fn,save=true){let l=selected();if(!l)return;if(save)checkpoint();fn(l);renderProperties();paint();if(save)markDirty()}
function point(e){let r=sel.getBoundingClientRect();return [(e.clientX-r.left)/r.width,(e.clientY-r.top)/r.height]}
function hit(l,p){let [w,h]=dimensions(l),dx=(p[0]-l.x)*W,dy=(p[1]-l.y)*H,rad=-l.rotation*Math.PI/180;let x=dx*Math.cos(rad)-dy*Math.sin(rad),y=dx*Math.sin(rad)+dy*Math.cos(rad);return Math.abs(x)<=w/2+15&&Math.abs(y)<=h/2+15}
sel.addEventListener('pointerdown',e=>{if(compare)return;const p=point(e);if(maskPoints){maskPoints.push(p);drawSelection();return}let l=current().layers.slice().reverse().find(l=>hit(l,p));if(!l){state.selected=null;renderLayers();renderProperties();drawSelection();return}state.selected=l.id;renderLayers();renderProperties();drawSelection();checkpoint();drag={x:p[0]-l.x,y:p[1]-l.y};sel.setPointerCapture(e.pointerId)});
sel.addEventListener('pointermove',e=>{if(!drag)return;let l=selected();if(!l)return;let p=point(e);l.x=Math.max(0,Math.min(1,p[0]-drag.x));l.y=Math.max(0,Math.min(1,p[1]-drag.y));paint();renderProperties()});
function endDrag(){if(drag){drag=null;markDirty()}}sel.addEventListener('pointerup',endDrag);sel.addEventListener('pointercancel',endDrag);
let wheelTimer;sel.addEventListener('wheel',e=>{if(!selected()||maskPoints||compare)return;e.preventDefault();if(!wheelTimer)checkpoint();let l=selected();l.size=Math.max(3,Math.min(95,l.size+(e.deltaY>0?-1:1)));renderProperties();paint();clearTimeout(wheelTimer);wheelTimer=setTimeout(()=>{wheelTimer=null;markDirty()},200)},{passive:false});
for(const [id,key,convert]of [['curveRange','curve',Number],['perspectiveRange','perspective',Number],['sizeRange','size',Number],['rotateRange','rotation',Number],['opacityRange','opacity',Number]]){let before=null;$(id).addEventListener('pointerdown',()=>{before=JSON.stringify(state)});$(id).addEventListener('keydown',()=>{if(!before)before=JSON.stringify(state)});$(id).addEventListener('input',()=>{let l=selected();if(l){l[key]=convert($(id).value);paint();renderProperties()}});$(id).addEventListener('change',()=>{if(before){history.push(before);future=[];before=null;updateUndo()}markDirty()})}
for(const [id,key]of [['posX','x'],['posY','y']])$(id).addEventListener('change',()=>{let value=Number($(id).value);if(Number.isFinite(value))changeLayer(l=>l[key]=Math.max(0,Math.min(1,value/100)))});
for(const [id,key,checkbox]of [['blendMode','blend',false],['textureToggle','texture',true],['clipToggle','clip',true]])$(id).addEventListener('change',()=>changeLayer(l=>l[key]=checkbox?$(id).checked:$(id).value));
$('flipXBtn').onclick=()=>changeLayer(l=>l.flip=!l.flip);
$('resetTransform').onclick=()=>changeLayer(l=>{let p=current().place||[.5,.55];Object.assign(l,{x:p[0],y:p[1],size:19,rotation:0,flip:false,curve:45,perspective:0})});
$('duplicateBtn').onclick=()=>{let l=selected();if(!l)return;checkpoint();let n={...l,id:uid(),x:Math.min(.95,l.x+.04),y:Math.min(.95,l.y+.04),name:l.name+' 副本'};current().layers.push(n);state.selected=n.id;refresh();markDirty()};
function removeSelected(){if(!selected())return;checkpoint();current().layers=current().layers.filter(l=>l.id!==state.selected);state.selected=current().layers.at(-1)?.id||null;refresh();markDirty()}
$('deleteLayerBtn').onclick=removeSelected;
$('copyAllBtn').onclick=()=>{let l=selected();if(!l)return;checkpoint();let count=0;for(let a of state.angles){if(a.id===state.active)continue;let p=a.place||[.5,.55];a.layers.push({...l,id:uid(),x:p[0],y:p[1]});count++}refresh();markDirty();toast('已添加到 '+count+' 个角度，请逐个微调位置与大小')};
$('undoBtn').onclick=async()=>{if(!history.length)return;future.push(JSON.stringify(state));state=JSON.parse(history.pop());baseCache.clear();await prepare(current());refresh();markDirty()};
$('redoBtn').onclick=async()=>{if(!future.length)return;history.push(JSON.stringify(state));state=JSON.parse(future.pop());baseCache.clear();await prepare(current());refresh();markDirty()};
$('compareBtn').onclick=()=>{compare=!compare;$('compareBtn').setAttribute('aria-pressed',String(compare));paint()};
$('maskBtn').onclick=()=>{if(maskPoints){cancelMask();return}maskPoints=[];$('maskActions').hidden=false;$('maskBtn').setAttribute('aria-pressed','true');sel.style.cursor='crosshair';drawSelection();toast('沿裤装轮廓依次点击；可重新圈定区域')};
function cancelMask(){maskPoints=null;$('maskActions').hidden=true;$('maskBtn').setAttribute('aria-pressed','false');sel.style.cursor='move';drawSelection()}
$('cancelMask').onclick=cancelMask;
$('finishMask').onclick=async()=>{if(maskPoints.length<3){toast('至少点击 3 个点以围成裤装区域');return}checkpoint();current().mask=clone(maskPoints);current().colorGuard=false;baseCache.delete(current().id);cancelMask();await prepare(current());paint();$('maskNotice').hidden=true;markDirty();toast('裤装区域已更新')};
$('zoomBtn').onclick=()=>{let zoom=$('canvasWrap').classList.toggle('zoomed');$('zoomBtn').textContent=zoom?'缩小画布 ⤡':'适应画布 ⤢'};
document.querySelectorAll('[data-tab]').forEach(b=>b.onclick=()=>{document.querySelectorAll('[data-tab]').forEach(x=>x.classList.toggle('active',x===b));$('artworkTab').hidden=b.dataset.tab!=='artwork';$('anglesTab').hidden=b.dataset.tab!=='angles'});
$('projectName').addEventListener('change',()=>{checkpoint();state.name=$('projectName').value.trim()||'未命名设计';markDirty()});
function fileData(file){return new Promise((resolve,reject)=>{let r=new FileReader();r.onload=()=>resolve(r.result);r.onerror=reject;r.readAsDataURL(file)})}
async function safeFile(file,svgAllowed=false){if(file.size>20*1024*1024)throw Error('单张图片请小于 20 MB');if(!/^image\/(png|jpeg|webp|svg\+xml)$/.test(file.type))throw Error('请选择 PNG、JPG、WEBP 或 SVG 图片');if(file.type==='image/svg+xml'){if(!svgAllowed)throw Error('底图请使用 PNG、JPG 或 WEBP');let raw=await file.text();const doc=new DOMParser().parseFromString(raw,'image/svg+xml');if(doc.querySelector('parsererror')||doc.documentElement.localName!=='svg')throw Error('SVG 文件格式无效');for(const el of doc.querySelectorAll('*')){if(['script','foreignobject','iframe','image','use','animate','animatetransform','animatemotion','set','style'].includes(el.localName.toLowerCase())){el.remove();continue}for(const attr of [...el.attributes])if(/^on/i.test(attr.name)||/href/i.test(attr.name)||/url\s*\(/i.test(attr.value))el.removeAttribute(attr.name)}return 'data:image/svg+xml;charset=utf-8,'+encodeURIComponent(new XMLSerializer().serializeToString(doc.documentElement))}let data=await fileData(file);let im=await imageReady(data);if(im.width*im.height>40000000)throw Error('图片像素过大，请缩小后导入');return data}
async function uploadArt(files){for(let f of files){try{let src=await safeFile(f,true);await addLayer({src,name:f.name.replace(/\.[^.]+$/,'').slice(0,35)})}catch(e){toast(e.message)}}$('artworkInput').value=''}
$('uploadArtworkBtn').onclick=()=>$('artworkInput').click();$('artworkInput').onchange=e=>uploadArt(e.target.files);
$('uploadArtworkBtn').ondragover=e=>{e.preventDefault();$('uploadArtworkBtn').classList.add('dragover')};$('uploadArtworkBtn').ondragleave=()=>$('uploadArtworkBtn').classList.remove('dragover');$('uploadArtworkBtn').ondrop=e=>{e.preventDefault();$('uploadArtworkBtn').classList.remove('dragover');uploadArt(e.dataTransfer.files)};
$('uploadAngleBtn').onclick=()=>$('angleInput').click();$('angleInput').onchange=async e=>{for(let f of e.target.files){try{let src=await safeFile(f);checkpoint();let a={id:uid(),name:f.name.replace(/\.[^.]+$/,'').slice(0,20),src,place:[.5,.55],mask:null,colorGuard:false,layers:[]};state.angles.push(a);await switchAngle(a.id);toast('底图已添加，建议使用“裤装区域”圈定可印花范围')}catch(err){toast(err.message)}}$('angleInput').value=''};
function download(blob,name){let url=URL.createObjectURL(blob);let a=node('a');a.href=url;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),30000)}
function png(c){return new Promise((resolve,reject)=>c.toBlob(b=>b?resolve(b):reject(Error('导出失败，请重试')),'image/png'))}
let exportURL=null,batchURLs=[],exportRequest=0,pendingReplaceId=null;
function fileName(s){return s.replace(/[\\/:*?"<>|]/g,'_').slice(0,60)}
function renderExportChoices(){
 for(const id of ['singleAngleSelect','exportAngleSelect']){
  const select=$(id),previous=select.value;select.replaceChildren();
  for(const [i,a]of state.angles.entries()){const option=node('option');option.value=a.id;option.textContent=String(i+1).padStart(2,'0')+' / '+a.name;select.append(option)}
  select.value=id==='singleAngleSelect'?state.active:(state.angles.some(a=>a.id===previous)?previous:state.active);
 }
}
function clearExportURLs(){if(exportURL)URL.revokeObjectURL(exportURL);exportURL=null;batchURLs.forEach(url=>URL.revokeObjectURL(url));batchURLs=[];$('exportFiles').replaceChildren()}
async function angleCanvas(a,scale=Number($('exportScale').value)){
 await prepare(a);await Promise.all(a.layers.map(l=>imageReady(l.src)));
 const c=document.createElement('canvas');c.width=W*scale;c.height=H*scale;const cc=c.getContext('2d');cc.scale(scale,scale);paint(a,cc,false);return c;
}
async function showExport(c,name,mode='single',id=state.active,request=null){
 const blob=await png(c);if(request!==null&&request!==exportRequest)return;
 clearExportURLs();exportURL=URL.createObjectURL(blob);
 $('exportImage').src=exportURL;$('exportImage').hidden=false;$('exportFiles').hidden=true;
 $('exportAngleControl').hidden=mode!=='single';$('exportAngleSelect').value=id;
 const a=state.angles.find(a=>a.id===id);
 $('exportTitle').textContent=mode==='single'?(a?.name||'当前角度')+' · 单张效果图':'多角度拼图';
 $('downloadExport').href=exportURL;$('downloadExport').download=name;$('downloadExport').textContent=mode==='single'?'↓ 保存这张 PNG':'↓ 保存拼图 PNG';
 $('downloadExport').setAttribute('aria-disabled','false');
 if(!$('exportDialog').open)$('exportDialog').showModal();
}
$('closeExport').onclick=()=>{exportRequest++;$('exportBtn').disabled=false;$('exportSelectedBtn').disabled=false;$('exportDialog').close()};
async function exportSingle(id=state.active){
 const a=state.angles.find(a=>a.id===id);if(!a)return;
 const request=++exportRequest;
 $('exportBtn').disabled=true;$('exportSelectedBtn').disabled=true;
 if($('exportDialog').open)$('downloadExport').setAttribute('aria-disabled','true');
 try{const c=await angleCanvas(a);await showExport(c,fileName(state.name)+'_'+fileName(a.name)+'.png','single',a.id,request)}
 catch(e){toast(e.message);$('downloadExport').setAttribute('aria-disabled','false')}
 finally{if(request===exportRequest){$('exportBtn').disabled=false;$('exportSelectedBtn').disabled=false}}
}
$('exportBtn').onclick=()=>exportSingle(state.active);
$('exportSelectedBtn').onclick=()=>exportSingle($('singleAngleSelect').value);
$('exportAngleSelect').onchange=()=>exportSingle($('exportAngleSelect').value);

// Store each PNG as an independent UTF-8-named entry in a standard ZIP archive.
const zipCRC=Uint32Array.from({length:256},(_,n)=>{for(let i=0;i<8;i++)n=n&1?0xedb88320^(n>>>1):n>>>1;return n>>>0});
function crc32(data){let crc=0xffffffff;for(const b of data)crc=zipCRC[(crc^b)&255]^(crc>>>8);return (crc^0xffffffff)>>>0}
async function makeZip(entries){
 const parts=[],central=[],encoder=new TextEncoder();let offset=0,centralSize=0;
 for(const entry of entries){
  const name=encoder.encode(entry.name),data=new Uint8Array(await entry.blob.arrayBuffer()),crc=crc32(data);
  const local=new Uint8Array(30+name.length),lv=new DataView(local.buffer);
  lv.setUint32(0,0x04034b50,true);lv.setUint16(4,20,true);lv.setUint16(6,0x800,true);lv.setUint16(12,33,true);lv.setUint32(14,crc,true);lv.setUint32(18,data.length,true);lv.setUint32(22,data.length,true);lv.setUint16(26,name.length,true);local.set(name,30);
  parts.push(local,data);
  const dir=new Uint8Array(46+name.length),dv=new DataView(dir.buffer);
  dv.setUint32(0,0x02014b50,true);dv.setUint16(4,20,true);dv.setUint16(6,20,true);dv.setUint16(8,0x800,true);dv.setUint16(14,33,true);dv.setUint32(16,crc,true);dv.setUint32(20,data.length,true);dv.setUint32(24,data.length,true);dv.setUint16(28,name.length,true);dv.setUint32(42,offset,true);dir.set(name,46);
  central.push(dir);centralSize+=dir.length;offset+=local.length+data.length;
 }
 const end=new Uint8Array(22),ev=new DataView(end.buffer);ev.setUint32(0,0x06054b50,true);ev.setUint16(8,entries.length,true);ev.setUint16(10,entries.length,true);ev.setUint32(12,centralSize,true);ev.setUint32(16,offset,true);
 return new Blob([...parts,...central,end],{type:'application/zip'});
}
$('exportAllBtn').onclick=async()=>{
 const button=$('exportAllBtn');button.disabled=true;const entries=[];
 try{
  for(const [i,a]of state.angles.entries()){button.textContent='正在导出 '+(i+1)+' / '+state.angles.length+'…';const c=await angleCanvas(a);entries.push({name:String(i+1).padStart(2,'0')+'_'+fileName(a.name)+'.png',blob:await png(c)});await new Promise(resolve=>setTimeout(resolve,0))}
  const zip=await makeZip(entries);exportRequest++;clearExportURLs();
  $('exportTitle').textContent=entries.length+' 张独立图片已准备好';$('exportAngleControl').hidden=true;$('exportImage').hidden=true;$('exportFiles').hidden=false;
  for(const entry of entries){const url=URL.createObjectURL(entry.blob);batchURLs.push(url);const a=node('a','export-file');a.href=url;a.download=entry.name;a.append(thumb(url,entry.name));const label=node('div');label.append(text(node('span'),entry.name),text(node('small'),'↓ 单独保存 PNG'));a.append(label);$('exportFiles').append(a)}
  exportURL=URL.createObjectURL(zip);$('downloadExport').href=exportURL;$('downloadExport').download=fileName(state.name)+'_全部单张.zip';$('downloadExport').textContent='↓ 下载全部单张 ZIP';$('downloadExport').setAttribute('aria-disabled','false');
  if(!$('exportDialog').open)$('exportDialog').showModal();
 }catch(e){toast('导出失败：'+e.message)}finally{button.disabled=false;button.textContent='↓ 全部单张打包 ZIP'}
};
$('exportSheetBtn').onclick=async()=>{
 const b=$('exportSheetBtn');b.disabled=true;b.textContent='正在准备拼图…';
 try{const cols=Math.min(4,state.angles.length),rows=Math.ceil(state.angles.length/cols),cw=500,ch=790,pad=25,c=document.createElement('canvas');c.width=cols*cw+pad*2;c.height=rows*ch+pad*2+70;const cc=c.getContext('2d');cc.fillStyle='#f7f7f2';cc.fillRect(0,0,c.width,c.height);cc.fillStyle='#333c29';cc.font='25px sans-serif';cc.fillText(state.name,pad,48);
  for(const [i,a]of state.angles.entries()){const one=await angleCanvas(a,1),x=pad+i%cols*cw,y=85+Math.floor(i/cols)*ch;cc.drawImage(one,x+7,y,cw-14,729);cc.fillStyle='#68735d';cc.font='16px sans-serif';cc.fillText(a.name,x+15,y+760)}
  await showExport(c,fileName(state.name)+'_多角度拼图.png','sheet');
 }catch(e){toast(e.message)}finally{b.disabled=false;b.textContent='另存多角度拼图 ↗'}
};

function chooseReplacement(id){pendingReplaceId=id;$('replaceAngleInput').click()}
$('angleNameInput').onchange=()=>{const name=$('angleNameInput').value.trim();if(!name){$('angleNameInput').value=current().name;return}checkpoint();current().name=name;refresh();markDirty()};
$('replaceCurrentBtn').onclick=()=>chooseReplacement(state.active);
$('replaceSetBtn').onclick=()=>$('replaceSetInput').click();
$('setNewMaskBtn').onclick=()=>$('maskBtn').click();
async function replaceBase(id,file){
 const src=await safeFile(file);await imageReady(src);
 const a=state.angles.find(a=>a.id===id);if(!a)throw Error('这个角度已不存在，请重新选择');
 checkpoint();Object.assign(a,{src,mask:null,colorGuard:false,sourceName:file.name});baseCache.delete(id);
 await switchAngle(id);toast('底图已替换，图案已保留。请重新圈定裤装区域');
}
$('replaceAngleInput').onchange=async e=>{const file=e.target.files[0],id=pendingReplaceId;pendingReplaceId=null;if(!file)return;try{await replaceBase(id,file)}catch(err){toast(err.message)}finally{e.target.value=''}};
$('replaceSetInput').onchange=async e=>{
 const files=Array.from(e.target.files).sort((a,b)=>a.name.localeCompare(b.name,undefined,{numeric:true}));if(!files.length)return;
 const button=$('replaceSetBtn');button.disabled=true;
 try{
  if(files.length>40)throw Error('一套底图最多 40 张');
  const replacements=[];
  for(const [i,file]of files.entries()){button.textContent='正在读取 '+(i+1)+' / '+files.length+'…';const src=await safeFile(file);await imageReady(src);replacements.push({src,file})}
  checkpoint();
  state.angles=replacements.map(({src,file},i)=>{const old=state.angles[i];return {id:old?.id||uid(),name:old?.name||file.name.replace(/\.[^.]+$/,'').slice(0,20),src,sourceName:file.name,place:old?.place||[.5,.55],mask:null,colorGuard:false,layers:old?.layers||[]}});
  baseCache.clear();state.active=state.angles[0].id;await switchAngle(state.active);toast('已换为 '+files.length+' 张新底图。图案已保留，请重新设置区域；可撤销恢复');
 }catch(err){toast(err.message)}finally{button.disabled=false;button.textContent='↻ 整套换款 / 批量替换';e.target.value=''}
};

async function portableState(){let p=clone(state);for(let a of p.angles)if(!a.src.startsWith('data:')){let blob=await(await fetch(a.src)).blob();a.src=await fileData(blob)}return p}
$('saveProjectBtn').onclick=async()=>{let b=$('saveProjectBtn');b.disabled=true;try{let p=await portableState();download(new Blob([JSON.stringify(p)],{type:'application/json'}),fileName(state.name)+'.denim.json');toast('工程已保存，可从“角度底图”重新导入')}catch{toast('工程保存失败，请重试')}finally{b.disabled=false}};
$('importProjectBtn').onclick=()=>$('projectInput').click();
function validateProject(p){if(p.version!==1||!Array.isArray(p.angles)||!p.angles.length||p.angles.length>40)throw Error('不是有效的 Denim Studio 工程');const safeData=s=>typeof s==='string'&&/^data:image\/(png|jpeg|webp|svg\+xml)[;,]/i.test(s);for(let a of p.angles){if(typeof a.id!=='string'||!safeData(a.src)||!Array.isArray(a.layers)||a.layers.length>150)throw Error('工程中的图片或图层无效');a.name=String(a.name||'底图').slice(0,40);if(a.mask!==null&&(!Array.isArray(a.mask)||a.mask.length<3||a.mask.length>500||a.mask.some(point=>!Array.isArray(point)||point.length!==2||point.some(n=>!Number.isFinite(n)||n<0||n>1))))throw Error('裤装区域数据无效');for(let l of a.layers){if(!safeData(l.src)||['x','y','size','rotation','opacity'].some(k=>!Number.isFinite(l[k])))throw Error('图案数据无效');l.x=Math.max(0,Math.min(1,l.x));l.y=Math.max(0,Math.min(1,l.y));l.size=Math.max(3,Math.min(95,l.size));l.opacity=Math.max(5,Math.min(100,l.opacity));l.rotation=Math.max(-180,Math.min(180,l.rotation));if(!['source-over','multiply','screen'].includes(l.blend))l.blend='source-over';l.name=String(l.name||'图案').slice(0,40)}}p.name=String(p.name||'导入的设计').slice(0,70);if(!p.angles.some(a=>a.id===p.active))p.active=p.angles[0].id;return p}
$('projectInput').onchange=async e=>{let file=e.target.files[0];if(!file)return;try{if(file.size>150*1024*1024)throw Error('工程文件过大');let p=validateProject(JSON.parse(await file.text()));await Promise.all(p.angles.flatMap(a=>[imageReady(a.src),...a.layers.map(l=>imageReady(l.src))]));checkpoint();state=p;baseCache.clear();await switchAngle(p.active);toast('工程已导入，所有角度与图案可以继续编辑')}catch(err){toast(err instanceof SyntaxError?'无法识别工程文件':err.message)}$('projectInput').value=''};
$('helpBtn').onclick=()=>$('helpDialog').showModal();$('closeHelp').onclick=$('startDesign').onclick=()=>$('helpDialog').close();$('helpDialog').addEventListener('click',e=>{if(e.target===$('helpDialog')){let r=$('helpDialog').getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)$('helpDialog').close()}});
document.addEventListener('keydown',e=>{if(/INPUT|TEXTAREA|SELECT/.test(e.target.tagName)||$('helpDialog').open||$('exportDialog').open)return;if(e.key==='Escape'){if(maskPoints)cancelMask();else{state.selected=null;renderLayers();renderProperties();drawSelection()}return}if((e.metaKey||e.ctrlKey)&&e.key.toLowerCase()==='z'){e.preventDefault();(e.shiftKey?$('redoBtn'):$('undoBtn')).click();return}if(e.key==='Delete'||e.key==='Backspace'){e.preventDefault();removeSelected();return}if(selected()&&['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.key)){e.preventDefault();let n=e.shiftKey?.01:.002;changeLayer(l=>{if(e.key==='ArrowUp')l.y=Math.max(0,l.y-n);if(e.key==='ArrowDown')l.y=Math.min(1,l.y+n);if(e.key==='ArrowLeft')l.x=Math.max(0,l.x-n);if(e.key==='ArrowRight')l.x=Math.min(1,l.x+n)})}});
async function init(){document.body.classList.add('loading');renderLibraries();try{try{db=await openDB();let saved=await new Promise((resolve,reject)=>{let req=db.transaction('drafts').objectStore('drafts').get('current');req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error)});if(saved?.version===1&&saved.angles?.length)state=saved}catch{$('saveStatus').textContent='请保存工程'}await Promise.all([prepare(current()),...state.angles.flatMap(a=>a.layers.map(l=>imageReady(l.src)))]);if(!state.demoInitialized&&!state.angles.some(a=>a.layers.length)){await imageReady(library[0].src);let a=state.angles.find(a=>a.id==='front')||current();let p=a.place||[.5,.55];let l={id:uid(),name:'雏菊花簇 · 示例',src:library[0].src,x:p[0],y:p[1],size:21,rotation:-8,opacity:100,curve:45,perspective:0,texture:true,clip:true,flip:false,blend:'source-over'};a.layers.push(l);if(a.id===state.active)state.selected=l.id}state.demoInitialized=true;refresh();if(db)$('saveStatus').textContent='✓ 已保存到本机';markDirty();for(let a of state.angles)if(a.id!==state.active)prepare(a).catch(()=>{})}catch(e){toast('图片加载失败，请刷新页面重试');console.error(e)}finally{document.body.classList.remove('loading')}}
init();
