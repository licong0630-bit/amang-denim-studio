/* User-owned cut-panel templates, stored in the local project with artwork. */
let panelTemplateDraft=null,panelTemplateDrag=null,panelTemplateUploadTarget='FR';
function customPanelTemplate(panel){return typeof state!=='undefined'?state.pattern?.customPanels?.[panel]:null}
function customPanelPoint(panel,t,v){const custom=customPanelTemplate(panel);if(!custom)return null;let i=0;while(i<PANEL_V.length-2&&v>PANEL_V[i+1])i++;const f=(v-PANEL_V[i])/(PANEL_V[i+1]-PANEL_V[i]);return [0,1].map(axis=>((custom.rows[i][0][axis]*(1-t)+custom.rows[i][1][axis]*t)*(1-f)+(custom.rows[i+1][0][axis]*(1-t)+custom.rows[i+1][1][axis]*t)*f)*(axis?PANEL_H:PANEL_W))}
function panelRowsPath(c,rows){c.beginPath();rows.forEach((r,i)=>i?c.lineTo(r[0][0]*PANEL_W,r[0][1]*PANEL_H):c.moveTo(r[0][0]*PANEL_W,r[0][1]*PANEL_H));for(let i=rows.length-1;i>=0;i--)c.lineTo(rows[i][1][0]*PANEL_W,rows[i][1][1]*PANEL_H);c.closePath()}
function validateCustomPanels(project){
 const panels=project.pattern?.customPanels;if(!panels)return;
 const image=s=>typeof s==='string'&&/^data:image\/(png|jpeg|webp|svg\+xml)[;,]/i.test(s);
 for(const [panel,p]of Object.entries(panels)){if(!PANEL_INFO[panel]||!p||!image(p.originalSrc)||!image(p.fittedSrc)||!image(p.maskSrc)||!Array.isArray(p.rows)||p.rows.length!==6||p.rows.some(r=>!Array.isArray(r)||r.length!==2||r.some(pt=>!Array.isArray(pt)||pt.length!==2||pt.some(n=>!Number.isFinite(n)||n<0||n>1))))throw Error('自定义刀版数据无效');if(p.contourMaskSrc&&!image(p.contourMaskSrc))throw Error('刀版轮廓数据无效');p.name=String(p.name||'自定义刀版').slice(0,80)}
}
function updatePanelTemplateLabels(){
 if(!state.pattern)return;const active=state.pattern.active,custom=customPanelTemplate(active),count=Object.keys(state.pattern.customPanels||{}).length;
 $('patternModelBadge').textContent=count?'自定义刀版 · '+count+' / 4 块已替换':'M 码 · 水后尺寸约束草稿';
 const note=document.querySelector('.pattern-spec-note');note.querySelector('strong').textContent=custom?'当前为自定义裤片':'尺寸来自你的 M 码表';
 note.querySelector('p').textContent=custom?custom.name:'腰 73 · 臀 101 · 大腿 64 / 膝 55 · 脚口周长 49.5 cm';
 note.querySelector('a').textContent=custom?'查看默认 M 码参考 ↗':'查看刀版与假设说明 ↗';
 document.querySelector('.pattern-draft-caption').textContent=custom?'自定义轮廓 · 源文件比例 / 用于贴图预览，请核对照片对应':'推算净线 · 不含缝份及缩水放量 / 用于贴图预览，尚非生产裁剪版';
 document.querySelectorAll('[data-template-panel]').forEach(button=>button.title='管理 / 替换'+PANEL_INFO[button.dataset.templatePanel].name);
}
function renderPanelTemplateManager(active=state.pattern.active){
 const list=$('panelTemplateList');list.replaceChildren();
 for(const [panel,info]of Object.entries(PANEL_INFO)){
  const custom=customPanelTemplate(panel),row=node('section','panel-template-row'+(panel===active?' selected':'')),heading=node('div','panel-template-label');heading.append(text(node('strong'),info.name),text(node('span'),custom?custom.name:'默认 M 码尺寸草稿'));
  const actions=node('div','panel-template-actions'),upload=text(node('button','button'),custom?'替换刀版':'上传刀版');upload.setAttribute('aria-label','上传或替换 '+info.name);upload.onclick=()=>{panelTemplateUploadTarget=panel;$('panelTemplateInput').click()};actions.append(upload);
  const adjust=text(node('button','button'),'调整贴图范围');adjust.disabled=!custom;adjust.onclick=()=>editPanelTemplate(panel);actions.append(adjust);
  const restore=text(node('button','button'),'恢复默认');restore.disabled=!custom;restore.onclick=()=>{checkpoint();delete state.pattern.customPanels[panel];for(const a of state.angles)if(a.panelMapping?.[panel])a.panelCalibrated=false;invalidatePattern();refreshPatternUI();markDirty();renderPanelTemplateManager(panel);toast(info.name+'已恢复默认，原图案保留；相关照片需确认一次对应关系')};actions.append(restore);row.append(heading,actions);list.append(row);
 }
}
function openPanelTemplateManager(panel=state.pattern.active){ensurePatternState();renderPanelTemplateManager(panel);if(!$('panelTemplateDialog').open)$('panelTemplateDialog').showModal()}

// Detect the largest closed cut-piece region. White/transparent paper outside
// the contour is flooded from the edges; annotations are not used as UV edges.
async function prepareUploadedPanel(file){
 const originalSrc=await safeFile(file,true),im=await imageReady(originalSrc),c=document.createElement('canvas');c.width=PANEL_W;c.height=PANEL_H;const cc=c.getContext('2d',{willReadFrequently:true});
 const scale=Math.min((PANEL_W-40)/im.width,(PANEL_H-40)/im.height),iw=im.width*scale,ih=im.height*scale,left=(PANEL_W-iw)/2,top=(PANEL_H-ih)/2;cc.drawImage(im,left,top,iw,ih);
 const image=cc.getImageData(0,0,PANEL_W,PANEL_H),d=image.data,N=PANEL_W*PANEL_H;let transparent=0,total=0;
 for(let y=Math.ceil(top);y<top+ih;y+=3)for(let x=Math.ceil(left);x<left+iw;x+=3){total++;if(d[(y*PANEL_W+x)*4+3]<32)transparent++}
 const alphaMode=transparent/Math.max(1,total)>.02,outside=new Uint8Array(N),queue=new Int32Array(N);
 const pass=i=>{const k=i*4;return d[k+3]<32||(!alphaMode&&d[k]>238&&d[k+1]>238&&d[k+2]>238)};
 let head=0,tail=0;function floodPush(i){if(!outside[i]&&pass(i)){outside[i]=1;queue[tail++]=i}}
 for(let x=0;x<PANEL_W;x++){floodPush(x);floodPush((PANEL_H-1)*PANEL_W+x)}for(let y=0;y<PANEL_H;y++){floodPush(y*PANEL_W);floodPush(y*PANEL_W+PANEL_W-1)}
 while(head<tail){const i=queue[head++],x=i%PANEL_W;if(x)floodPush(i-1);if(x<PANEL_W-1)floodPush(i+1);if(i>=PANEL_W)floodPush(i-PANEL_W);if(i<N-PANEL_W)floodPush(i+PANEL_W)}
 const seen=new Uint8Array(N);let best=-1,bestCount=0;
 for(let seed=0;seed<N;seed++){if(outside[seed]||seen[seed])continue;head=0;tail=0;queue[tail++]=seed;seen[seed]=1;
  while(head<tail){const i=queue[head++],x=i%PANEL_W;const add=n=>{if(!outside[n]&&!seen[n]){seen[n]=1;queue[tail++]=n}};if(x)add(i-1);if(x<PANEL_W-1)add(i+1);if(i>=PANEL_W)add(i-PANEL_W);if(i<N-PANEL_W)add(i+PANEL_W)}
  if(tail>bestCount){best=seed;bestCount=tail}
 }
 const mask=new Uint8Array(N);let detected=best>=0&&bestCount>N*.015;
 if(detected){head=0;tail=0;queue[tail++]=best;mask[best]=1;while(head<tail){const i=queue[head++],x=i%PANEL_W;const add=n=>{if(!outside[n]&&!mask[n]){mask[n]=1;queue[tail++]=n}};if(x)add(i-1);if(x<PANEL_W-1)add(i+1);if(i>=PANEL_W)add(i-PANEL_W);if(i<N-PANEL_W)add(i+PANEL_W)}}
 else for(let y=Math.ceil(top);y<top+ih;y++)for(let x=Math.ceil(left);x<left+iw;x++)mask[y*PANEL_W+x]=1;
 let minX=PANEL_W,maxX=0,minY=PANEL_H,maxY=0;for(let i=0;i<N;i++)if(mask[i]){const x=i%PANEL_W,y=Math.floor(i/PANEL_W);minX=Math.min(minX,x);maxX=Math.max(maxX,x);minY=Math.min(minY,y);maxY=Math.max(maxY,y)}
 const rows=[.025,.17,.29,.44,.60,.975].map(f=>{const y=Math.max(0,Math.min(PANEL_H-1,Math.round(minY+(maxY-minY)*f)));let l=PANEL_W,r=0;for(let x=0;x<PANEL_W;x++)if(mask[y*PANEL_W+x]){l=Math.min(l,x);r=Math.max(r,x)}if(r-l<8){l=minX;r=maxX}return [[l/PANEL_W,y/PANEL_H],[r/PANEL_W,y/PANEL_H]]});
 const mc=document.createElement('canvas');mc.width=PANEL_W;mc.height=PANEL_H;const mctx=mc.getContext('2d'),md=mctx.createImageData(PANEL_W,PANEL_H);for(let i=0;i<N;i++){md.data[i*4]=md.data[i*4+1]=md.data[i*4+2]=255;md.data[i*4+3]=mask[i]?255:0}mctx.putImageData(md,0,0);
 const maskSrc=mc.toDataURL('image/png');return {name:file.name.slice(0,80),originalSrc,fittedSrc:c.toDataURL('image/png'),maskSrc,contourMaskSrc:maskSrc,rows,detected,useContour:detected};
}
async function editPanelTemplate(panel,draft=customPanelTemplate(panel)){
 if(!draft)return;panelTemplateDrag=null;panelTemplateDraft={panel,data:clone(draft)};await Promise.all([imageReady(draft.fittedSrc),imageReady(draft.maskSrc),imageReady(draft.contourMaskSrc||draft.maskSrc)]);
 $('panelTemplateEditTitle').textContent=PANEL_INFO[panel].name+' · 校准刀版范围';$('panelTemplateFileName').textContent=draft.name;
 $('panelTemplateUseContour').checked=!!draft.useContour;$('panelTemplateDetection').textContent=draft.detected?'已识别闭合轮廓，请检查并调整关键线。':'未识别可靠的闭合轮廓，请按网格外缘圈定裤片。';
 if(!$('panelTemplateEditDialog').open)$('panelTemplateEditDialog').showModal();drawPanelTemplateDraft();
}
function drawPanelTemplateDraft(){
 if(!panelTemplateDraft)return;const {data}=panelTemplateDraft,c=$('panelTemplateCanvas'),cc=c.getContext('2d');cc.clearRect(0,0,PANEL_W,PANEL_H);cc.fillStyle='#f1f3ec';cc.fillRect(0,0,PANEL_W,PANEL_H);cc.drawImage(loaded.get(data.fittedSrc),0,0);
 const overlay=document.createElement('canvas');overlay.width=PANEL_W;overlay.height=PANEL_H;const oc=overlay.getContext('2d');oc.fillStyle='#7ca353';oc.fillRect(0,0,PANEL_W,PANEL_H);oc.globalCompositeOperation='destination-in';if(data.useContour)oc.drawImage(loaded.get(data.contourMaskSrc||data.maskSrc),0,0);else{oc.globalCompositeOperation='destination-in';oc.fillStyle='#7ca353';oc.clearRect(0,0,PANEL_W,PANEL_H);oc.globalCompositeOperation='source-over';panelRowsPath(oc,data.rows);oc.fill()}
 cc.save();cc.globalAlpha=.15;cc.drawImage(overlay,0,0);cc.restore();cc.lineWidth=2;cc.strokeStyle='#4b7635';cc.fillStyle='#fbfff5';
 for(let i=0;i<data.rows.length;i++){const row=data.rows[i];cc.beginPath();cc.moveTo(row[0][0]*PANEL_W,row[0][1]*PANEL_H);cc.lineTo(row[1][0]*PANEL_W,row[1][1]*PANEL_H);cc.stroke();if(i)for(let edge=0;edge<2;edge++){cc.beginPath();cc.moveTo(data.rows[i-1][edge][0]*PANEL_W,data.rows[i-1][edge][1]*PANEL_H);cc.lineTo(row[edge][0]*PANEL_W,row[edge][1]*PANEL_H);cc.stroke()}for(const p of row){cc.beginPath();cc.arc(p[0]*PANEL_W,p[1]*PANEL_H,7,0,Math.PI*2);cc.fill();cc.stroke()}const x=(row[0][0]+row[1][0])*PANEL_W/2,y=(row[0][1]+row[1][1])*PANEL_H/2;cc.font='36px sans-serif';cc.lineWidth=5;cc.strokeStyle='white';cc.strokeText(PANEL_ROWS[i],x+7,y-9);cc.fillStyle='#3f602d';cc.fillText(PANEL_ROWS[i],x+7,y-9);cc.fillStyle='#fbfff5';cc.lineWidth=2;cc.strokeStyle='#4b7635'}
}
function initPanelTemplateManager(){
 $('patternManagerBtn').onclick=()=>openPanelTemplateManager();document.querySelectorAll('[data-template-panel]').forEach(b=>b.onclick=()=>openPanelTemplateManager(b.dataset.templatePanel));
 $('panelTemplateClose').onclick=()=>$('panelTemplateDialog').close();
 $('panelTemplateInput').onchange=async e=>{const file=e.target.files[0],target=panelTemplateUploadTarget;if(!file)return;$('panelTemplateBusy').hidden=false;try{const draft=await prepareUploadedPanel(file);await editPanelTemplate(target,draft)}catch(error){toast(error.message)}finally{$('panelTemplateBusy').hidden=true;e.target.value=''}};
 $('panelTemplateUseContour').onchange=()=>{if(panelTemplateDraft){panelTemplateDraft.data.useContour=$('panelTemplateUseContour').checked;drawPanelTemplateDraft()}};
 $('panelTemplateCancel').onclick=()=>{$('panelTemplateEditDialog').close();panelTemplateDraft=null};
 const c=$('panelTemplateCanvas'),point=e=>{const r=c.getBoundingClientRect();return [Math.max(0,Math.min(1,(e.clientX-r.left)/r.width)),Math.max(0,Math.min(1,(e.clientY-r.top)/r.height))]};
 c.onpointerdown=e=>{if(!panelTemplateDraft)return;const p=point(e);let distance=Infinity,best=null;panelTemplateDraft.data.rows.forEach((row,i)=>row.forEach((pt,edge)=>{const d=Math.hypot((pt[0]-p[0])*PANEL_W,(pt[1]-p[1])*PANEL_H);if(d<distance){distance=d;best={row:i,edge}}}));if(distance<45){panelTemplateDrag=best;c.setPointerCapture(e.pointerId)}};
 c.onpointermove=e=>{if(!panelTemplateDrag||!panelTemplateDraft)return;panelTemplateDraft.data.rows[panelTemplateDrag.row][panelTemplateDrag.edge]=point(e);drawPanelTemplateDraft()};c.onpointerup=c.onpointercancel=()=>panelTemplateDrag=null;
 $('panelTemplateApply').onclick=async()=>{
  if(!panelTemplateDraft)return;const {panel,data}=panelTemplateDraft;
  for(let i=0;i<data.rows.length;i++){if(data.rows[i][0][0]>=data.rows[i][1][0]-.005||(i&&data.rows[i].some((p,edge)=>p[1]<=data.rows[i-1][edge][1]+.002))){toast('请保持左右端点不交叉，六条关键线从腰口到裤脚依次向下');return}}
  const mask=document.createElement('canvas');mask.width=PANEL_W;mask.height=PANEL_H;const mc=mask.getContext('2d');if(data.useContour)mc.drawImage(loaded.get(data.contourMaskSrc||data.maskSrc),0,0);else{mc.fillStyle='white';panelRowsPath(mc,data.rows);mc.fill()}const applied={...clone(data),maskSrc:mask.toDataURL('image/png')};await imageReady(applied.maskSrc);
  checkpoint();state.pattern.customPanels||={};state.pattern.customPanels[panel]=applied;state.pattern.active=panel;state.pattern.selected=state.pattern.layers[panel].at(-1)?.id||null;for(const a of state.angles)if(a.panelMapping?.[panel])a.panelCalibrated=false;
  $('panelTemplateEditDialog').close();panelTemplateDraft=null;invalidatePattern();refreshPatternUI();renderPanelTemplateManager(panel);markDirty();toast('刀版已替换，图案已保留。相关照片请确认一次对应关系');
 };
}
document.addEventListener('DOMContentLoaded',initPanelTemplateManager,{once:true});
