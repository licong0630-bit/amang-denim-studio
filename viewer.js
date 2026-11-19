/* Render the full composited photograph, rather than enlarging its thumbnail. */
let imageViewer={id:null,request:0,scale:1,fit:1,x:0,y:0,focus:null,pointers:new Map(),gesture:null};
function viewerAngle(){return state.angles.find(a=>a.id===imageViewer.id)}
function viewerFit(){const r=$('imageViewerStage').getBoundingClientRect();return Math.max(.05,Math.min(1,(r.width-32)/W,(r.height-32)/H))}
function applyViewerTransform(){
 const stage=$('imageViewerStage'),v=imageViewer;
 const limitX=Math.max(0,(W*v.scale-stage.clientWidth)/2+16),limitY=Math.max(0,(H*v.scale-stage.clientHeight)/2+16);
 v.x=Math.max(-limitX,Math.min(limitX,v.x));v.y=Math.max(-limitY,Math.min(limitY,v.y));
 $('imageViewerCanvas').style.transform=`translate(-50%, -50%) translate(${v.x}px, ${v.y}px) scale(${v.scale})`;
 $('imageViewerZoomValue').textContent=Math.round(v.scale*100)+'%';
 $('imageViewerZoomOut').disabled=v.scale<=v.fit+.001;$('imageViewerZoomIn').disabled=v.scale>=4-.001;
}
function fitViewerImage(){imageViewer.fit=viewerFit();imageViewer.scale=imageViewer.fit;imageViewer.x=0;imageViewer.y=0;applyViewerTransform()}
function zoomViewer(scale,clientX,clientY){
 const v=imageViewer,r=$('imageViewerStage').getBoundingClientRect();
 const x=clientX===undefined?0:clientX-r.left-r.width/2,y=clientY===undefined?0:clientY-r.top-r.height/2;
 const next=Math.max(v.fit,Math.min(4,scale)),ratio=next/v.scale;
 v.x=x-(x-v.x)*ratio;v.y=y-(y-v.y)*ratio;v.scale=next;applyViewerTransform();
}
async function openImageViewer(id){
 const a=state.angles.find(a=>a.id===id);if(!a)return;
 const dialog=$('imageViewerDialog'),v=imageViewer;
 if(!dialog.open){v.focus=document.activeElement;dialog.showModal()}
 v.id=id;const request=++v.request;state.active=id;renderExportChoices();
 const index=state.angles.indexOf(a);
 $('imageViewerTitle').textContent=String(index+1).padStart(2,'0')+' / '+a.name;
 $('imageViewerCount').textContent=(index+1)+' / '+state.angles.length;
 $('imageViewerPrev').disabled=$('imageViewerNext').disabled=state.angles.length<2;
 $('imageViewerStatus').textContent='正在准备高清预览…';$('imageViewerStatus').hidden=false;
 $('imageViewerCanvas').style.visibility='hidden';$('imageViewerStage').setAttribute('aria-busy','true');
 $('imageViewerExport').disabled=true;v.pointers.clear();v.gesture=null;fitViewerImage();
 try{
  const full=await angleCanvas(a,1);if(request!==v.request||!dialog.open)return;
  const canvas=$('imageViewerCanvas');canvas.getContext('2d').clearRect(0,0,W,H);canvas.getContext('2d').drawImage(full,0,0);
  canvas.setAttribute('aria-label',a.name+'完整贴图效果放大预览');canvas.style.visibility='visible';
  $('imageViewerStatus').hidden=true;$('imageViewerStage').setAttribute('aria-busy','false');$('imageViewerExport').disabled=false;
 }catch(error){if(request!==v.request)return;$('imageViewerStatus').textContent='这张图片读取失败，请切换后重试';$('imageViewerStage').setAttribute('aria-busy','false');toast(error.message)}
}
function stepViewer(direction){const index=state.angles.findIndex(a=>a.id===imageViewer.id),next=(index+direction+state.angles.length)%state.angles.length;openImageViewer(state.angles[next].id)}
function initImageViewer(){
 const dialog=$('imageViewerDialog'),stage=$('imageViewerStage'),v=imageViewer;
 $('imageViewerClose').onclick=()=>dialog.close();
 $('imageViewerPrev').onclick=()=>stepViewer(-1);$('imageViewerNext').onclick=()=>stepViewer(1);
 $('imageViewerZoomIn').onclick=()=>zoomViewer(v.scale*1.25);$('imageViewerZoomOut').onclick=()=>zoomViewer(v.scale/1.25);
 $('imageViewerFit').onclick=fitViewerImage;$('imageViewerActual').onclick=()=>zoomViewer(1);
 $('imageViewerExport').onclick=()=>{if(viewerAngle())exportSingle(v.id)};
 dialog.addEventListener('close',()=>{v.request++;v.pointers.clear();v.gesture=null;stage.classList.remove('is-dragging');if(v.focus?.isConnected)v.focus.focus({preventScroll:true})});
 dialog.addEventListener('click',e=>{if(e.target!==dialog)return;const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dialog.close()});
 dialog.addEventListener('keydown',e=>{
  e.stopPropagation();if($('exportDialog').open)return;
  if(e.key==='ArrowLeft'){e.preventDefault();stepViewer(-1)}
  else if(e.key==='ArrowRight'){e.preventDefault();stepViewer(1)}
  else if(e.key==='+'||e.key==='='){e.preventDefault();zoomViewer(v.scale*1.25)}
  else if(e.key==='-'||e.key==='_'){e.preventDefault();zoomViewer(v.scale/1.25)}
  else if(e.key==='0'){e.preventDefault();fitViewerImage()}
 });
 stage.addEventListener('wheel',e=>{e.preventDefault();zoomViewer(v.scale*Math.exp(-e.deltaY*.0015),e.clientX,e.clientY)},{passive:false});
 stage.addEventListener('dblclick',e=>zoomViewer(v.scale>v.fit+.01?v.fit:Math.max(1,v.fit*2),e.clientX,e.clientY));
 function resetGesture(){
  const p=[...v.pointers.values()];
  if(p.length>=2){v.gesture={type:'pinch',distance:Math.max(1,Math.hypot(p[1].x-p[0].x,p[1].y-p[0].y)),midX:(p[0].x+p[1].x)/2,midY:(p[0].y+p[1].y)/2,scale:v.scale,x:v.x,y:v.y}}
  else if(p.length===1)v.gesture={type:'pan',startX:p[0].x,startY:p[0].y,x:v.x,y:v.y};else v.gesture=null;
 }
 stage.addEventListener('pointerdown',e=>{if(e.pointerType==='mouse'&&e.button!==0)return;e.preventDefault();stage.setPointerCapture(e.pointerId);v.pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});resetGesture();stage.classList.add('is-dragging')});
 stage.addEventListener('pointermove',e=>{
  if(!v.pointers.has(e.pointerId)||!v.gesture)return;v.pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});const g=v.gesture,p=[...v.pointers.values()];
  if(g.type==='pan'&&p.length===1){v.x=g.x+p[0].x-g.startX;v.y=g.y+p[0].y-g.startY;applyViewerTransform()}
  else if(g.type==='pinch'&&p.length>=2){const r=stage.getBoundingClientRect(),distance=Math.hypot(p[1].x-p[0].x,p[1].y-p[0].y);v.scale=Math.max(v.fit,Math.min(4,g.scale*distance/g.distance));const ratio=v.scale/g.scale,mx=(p[0].x+p[1].x)/2-r.left-r.width/2,my=(p[0].y+p[1].y)/2-r.top-r.height/2;v.x=mx-(g.midX-r.left-r.width/2-g.x)*ratio;v.y=my-(g.midY-r.top-r.height/2-g.y)*ratio;applyViewerTransform()}
 });
 const end=e=>{v.pointers.delete(e.pointerId);resetGesture();if(!v.pointers.size)stage.classList.remove('is-dragging')};
 stage.addEventListener('pointerup',end);stage.addEventListener('pointercancel',end);stage.addEventListener('lostpointercapture',end);
 new ResizeObserver(()=>{if(!dialog.open)return;const wasFit=Math.abs(v.scale-v.fit)<.01;v.fit=viewerFit();if(wasFit){v.scale=v.fit;v.x=0;v.y=0}else v.scale=Math.max(v.fit,v.scale);applyViewerTransform()}).observe(stage);
}
document.addEventListener('DOMContentLoaded',initImageViewer,{once:true});
