/* Shared schematic garment panels. Artwork stays in panel space, while each
   photograph owns an independently calibrated piecewise affine mesh. */
const PANEL_W=500,PANEL_H=1200;
const PANEL_INFO={FR:{name:'右前裤片',mirror:false,pair:'FL'},FL:{name:'左前裤片',mirror:true,pair:'FR'},BL:{name:'左后裤片',mirror:false,pair:'BR'},BR:{name:'右后裤片',mirror:true,pair:'BL'}};
const PANEL_V=[0,.16,.30,.43,.68,1];
const PANEL_ROWS=['腰口','臀部','裆部','大腿','膝部','裤脚'];
const PANEL_PROFILES={front:'正面',side:'侧身',back:'背面',flat:'平铺',waist:'前腰细节',pocket:'后袋细节',full:'全身说明',street:'街拍'};
const row=(lx,ly,rx,ry)=>[[lx,ly],[rx,ry]];
const PANEL_MAPS={
 front:{
  FR:[row(.363,.135,.519,.146),row(.326,.26,.512,.277),row(.293,.36,.506,.347),row(.271,.50,.458,.49),row(.279,.70,.469,.69),row(.326,.913,.489,.908)],
  FL:[row(.519,.146,.680,.123),row(.518,.277,.727,.26),row(.514,.349,.721,.36),row(.51,.493,.714,.50),row(.512,.70,.693,.70),row(.50,.912,.66,.91)]},
 side:{
  FR:[row(.397,.15,.44,.16),row(.357,.30,.462,.30),row(.32,.40,.48,.34),row(.30,.50,.485,.48),row(.35,.72,.50,.70),row(.404,.90,.55,.904)],
  FL:[row(.439,.16,.635,.15),row(.45,.28,.643,.28),row(.48,.34,.640,.40),row(.484,.49,.637,.50),row(.50,.71,.648,.71),row(.55,.938,.647,.93)],
  BL:[row(.635,.15,.68,.145),row(.643,.28,.706,.28),row(.640,.40,.711,.40),row(.637,.50,.70,.50),row(.648,.71,.694,.72),row(.647,.93,.69,.922)]},
 back:{
  BL:[row(.36,.134,.50,.13),row(.322,.25,.499,.25),row(.30,.34,.492,.34),row(.30,.48,.485,.48),row(.297,.69,.48,.69),row(.35,.946,.451,.943)],
  BR:[row(.50,.13,.65,.135),row(.50,.25,.69,.25),row(.50,.34,.705,.34),row(.505,.48,.706,.48),row(.51,.69,.704,.69),row(.55,.947,.65,.946)]},
 flat:{
  FR:[row(.30,.075,.49,.086),row(.25,.22,.495,.22),row(.23,.35,.486,.35),row(.21,.49,.46,.49),row(.17,.70,.43,.70),row(.13,.905,.40,.92)],
  FL:[row(.49,.086,.71,.075),row(.50,.22,.75,.22),row(.514,.35,.78,.35),row(.535,.49,.806,.49),row(.57,.70,.84,.70),row(.609,.922,.88,.905)]},
 waist:{
  FR:[row(.278,.265,.81,.329),row(.14,.65,.83,.70),row(.07,1.20,.84,1.20),row(.04,1.65,.80,1.65),row(.03,2.4,.77,2.4),row(.05,3.4,.74,3.4)],
  FL:[row(.81,.329,1.15,.30),row(.83,.70,1.35,.65),row(.85,1.2,1.5,1.2),row(.86,1.65,1.5,1.65),row(.86,2.4,1.45,2.4),row(.86,3.4,1.4,3.4)]},
 pocket:{
  BL:[row(.28,.264,.55,.26),row(.22,.40,.56,.40),row(.15,.64,.535,.64),row(.15,.88,.49,.88),row(.15,1.30,.45,1.30),row(.16,1.90,.44,1.90)],
  BR:[row(.55,.26,.744,.266),row(.56,.40,.82,.40),row(.535,.64,.88,.64),row(.57,.88,.90,.88),row(.61,1.30,.9,1.30),row(.63,1.90,.88,1.90)]},
 full:{
  FR:[row(.527,.394,.628,.405),row(.50,.48,.628,.48),row(.475,.55,.622,.536),row(.448,.65,.572,.65),row(.46,.79,.571,.79),row(.49,.92,.60,.916)],
  FL:[row(.628,.405,.72,.383),row(.629,.48,.768,.48),row(.637,.536,.76,.55),row(.619,.65,.75,.65),row(.60,.79,.73,.79),row(.61,.92,.715,.925)]},
 street:{
  FR:[row(.438,.42,.532,.416),row(.405,.50,.532,.50),row(.389,.565,.524,.52),row(.379,.65,.512,.65),row(.377,.78,.49,.78),row(.388,.93,.477,.918)],
  FL:[row(.532,.416,.638,.410),row(.536,.50,.66,.50),row(.541,.52,.654,.565),row(.535,.65,.64,.65),row(.507,.78,.62,.78),row(.495,.909,.594,.893)]}
};
let patternInitialized=false,patternMode='pattern',patternRevision=0,patternAtlasRevision=-1;
let patternAtlases={},patternMapped=new Map(),patternPreviewTimer=null,patternPreviewRun=0,patternDrag=null;
let calibration=null,calibrationDrag=null;
const patternSelected=()=>{const p=state.pattern;return p?.layers[p.active]?.find(l=>l.id===p.selected)};
function ensurePatternState(){
 if(!state.pattern)state.pattern={version:1,enabled:true,active:'FR',selected:null,includeLegacy:false,layers:{FR:[],FL:[],BL:[],BR:[]}};
 const p=state.pattern;if(!PANEL_INFO[p.active])p.active='FR';
 for(const key of Object.keys(PANEL_INFO))if(!Array.isArray(p.layers[key]))p.layers[key]=[];
 for(const a of state.angles)if(!a.panelMapping){a.panelPreset=PANEL_MAPS[a.id]?a.id:'front';a.panelMapping=clone(PANEL_MAPS[a.panelPreset]);a.panelCalibrated=a.colorGuard!==false&&!!PANEL_MAPS[a.id]}
 return p;
}
async function ensurePatternImages(){if(!state.pattern)return;const layers=Object.values(state.pattern.layers).flat(),missing=layers.some(l=>!loaded.has(l.src));await Promise.all(layers.map(l=>imageReady(l.src)));if(missing)invalidatePattern()}

const patternSourcePoints=new Map();
function cubicPoint(segment,t){const q=1-t;return [0,1].map(axis=>q*q*q*segment[0][axis]+3*q*q*t*segment[1][axis]+3*q*t*t*segment[2][axis]+t*t*t*segment[3][axis])}
function curveAtY(segments,y){let segment=segments.find(s=>y>=s[0][1]-.001&&y<=s[3][1]+.001)||segments.at(-1);let lo=0,hi=1;for(let i=0;i<30;i++){const mid=(lo+hi)/2;if(cubicPoint(segment,mid)[1]<y)lo=mid;else hi=mid}return cubicPoint(segment,(lo+hi)/2)}
function panelPoint(panel,t,v){
 const key=panel+':'+t.toFixed(7)+':'+v.toFixed(7);if(patternSourcePoints.has(key))return patternSourcePoints.get(key);
 const model=DENIM_PATTERN_SPEC.pieces[panel[0]==='F'?'F':'B'],construction=DENIM_PATTERN_SPEC.construction,ys=[0,construction.hip_y_cm,construction.body_crotch_y_cm,construction.body_crotch_y_cm+15,construction.knee_y_cm,construction.body_hem_y_cm];
 let i=0;while(i<PANEL_V.length-2&&v>PANEL_V[i+1])i++;const f=(v-PANEL_V[i])/(PANEL_V[i+1]-PANEL_V[i]);const outerY=ys[i]*(1-f)+ys[i+1]*f;
 const innerStart=i===0?model.center[0][0][1]:ys[i],innerY=innerStart*(1-f)+ys[i+1]*f;
 const a=curveAtY(model.outer,outerY),b=curveAtY(v<=.30?model.center:model.inner,innerY);
 const u=PANEL_INFO[panel].mirror?1-t:t;let x=70+(a[0]*(1-u)+b[0]*u)*9.2,y=140+(a[1]*(1-u)+b[1]*u)*9.2;if(PANEL_INFO[panel].mirror)x=PANEL_W-x;const result=[x,y];patternSourcePoints.set(key,result);return result;
}
// Photo anchors use measured knee placement, rather than a generic leg fraction.
for(const mapping of Object.values(PANEL_MAPS))for(const rows of Object.values(mapping))for(const [index,distance]of [[3,15],[4,30]])for(let edge=0;edge<2;edge++)rows[index][edge][1]=rows[2][edge][1]+(rows[5][edge][1]-rows[2][edge][1])*distance/76;
function panelOutline(c,panel){c.beginPath();for(let i=0;i<=40;i++){const p=panelPoint(panel,0,i/40);i?c.lineTo(...p):c.moveTo(...p)}for(let i=40;i>=0;i--)c.lineTo(...panelPoint(panel,1,i/40));c.closePath()}
function drawPatternLayer(c,l){const im=loaded.get(l.src);if(!im)return;const w=l.size/100*PANEL_W,h=w*im.height/im.width;c.save();c.globalAlpha=l.opacity/100;
 if(l.repeat){c.translate(l.x*PANEL_W,l.y*PANEL_H);c.rotate(l.rotation*Math.PI/180);const tile=document.createElement('canvas');tile.width=Math.max(12,Math.ceil(w+8));tile.height=Math.max(12,Math.min(2400,Math.ceil(h+8)));tile.getContext('2d').drawImage(im,0,0,w,Math.min(h,2392));c.fillStyle=c.createPattern(tile,'repeat');c.fillRect(-1800,-1800,3600,3600)}
 else{c.translate(l.x*PANEL_W,l.y*PANEL_H);c.rotate(l.rotation*Math.PI/180);c.drawImage(im,-w/2,-h/2,w,h)}c.restore();
}
function getPatternAtlases(){
 if(patternAtlasRevision===patternRevision)return patternAtlases;
 patternAtlases={};for(const panel of Object.keys(PANEL_INFO)){const c=document.createElement('canvas');c.width=PANEL_W;c.height=PANEL_H;const cc=c.getContext('2d');cc.save();panelOutline(cc,panel);cc.clip();for(const l of state.pattern.layers[panel])drawPatternLayer(cc,l);cc.restore();patternAtlases[panel]=c}patternAtlasRevision=patternRevision;return patternAtlases;
}
function mappedPoint(rows,t,v,base){let i=0;while(i<PANEL_V.length-2&&v>PANEL_V[i+1])i++;const f=(v-PANEL_V[i])/(PANEL_V[i+1]-PANEL_V[i]),p=[0,0];for(let axis=0;axis<2;axis++)p[axis]=((rows[i][0][axis]*(1-t)+rows[i][1][axis]*t)*(1-f)+(rows[i+1][0][axis]*(1-t)+rows[i+1][1][axis]*t)*f)*(axis?H:W);
 if(base&&p[0]>8&&p[0]<W-8&&p[1]>8&&p[1]<H-8){const x=Math.round(p[0]),y=Math.round(p[1]),lum=(xx,yy)=>{const k=(yy*W+xx)*4;return (base.base[k]+base.base[k+1]+base.base[k+2])/3},weight=Math.sin(Math.PI*t);p[0]+=(lum(x+6,y)-lum(x-6,y))*.025*weight;p[1]+=(lum(x,y+6)-lum(x,y-6))*.04*weight}return p;
}
function drawMappedTriangle(c,image,s,d){
 const [s0,s1,s2]=s,[d0,d1,d2]=d,ux=s1[0]-s0[0],uy=s1[1]-s0[1],vx=s2[0]-s0[0],vy=s2[1]-s0[1],det=ux*vy-vx*uy;if(Math.abs(det)<.0001)return;
 const dx=d1[0]-d0[0],dy=d1[1]-d0[1],ex=d2[0]-d0[0],ey=d2[1]-d0[1];
 const a=(dx*vy-ex*uy)/det,b=(dy*vy-ey*uy)/det,cc=(ex*ux-dx*vx)/det,dd=(ey*ux-dy*vx)/det;
 c.save();c.beginPath();c.moveTo(...d0);c.lineTo(...d1);c.lineTo(...d2);c.closePath();c.clip();c.transform(a,b,cc,dd,d0[0]-a*s0[0]-cc*s0[1],d0[1]-b*s0[0]-dd*s0[1]);c.drawImage(image,0,0);c.restore();
}
function paintPattern(a,target,base){
 if(!state.pattern?.enabled||!a.panelCalibrated)return;
 let cache=patternMapped.get(a.id);if(cache?.revision===patternRevision&&cache.base===base&&cache.mapping===a.panelMapping){target.drawImage(cache.canvas,0,0);return}
 const atlas=getPatternAtlases(),out=document.createElement('canvas');out.width=W;out.height=H;const c=out.getContext('2d',{willReadFrequently:true});
 for(const [panel,rows]of Object.entries(a.panelMapping||{})){
  if(!state.pattern.layers[panel]?.length)continue;
  const columns=7,lines=32;
  for(let y=0;y<lines;y++)for(let x=0;x<columns;x++){
   const uv=[[x/columns,y/lines],[(x+1)/columns,y/lines],[x/columns,(y+1)/lines],[(x+1)/columns,(y+1)/lines]],s=uv.map(([t,v])=>panelPoint(panel,t,v)),d=uv.map(([t,v])=>mappedPoint(rows,t,v,base));
   if(d.every(p=>p[1]<0)||d.every(p=>p[1]>H)||d.every(p=>p[0]<0)||d.every(p=>p[0]>W))continue;
   drawMappedTriangle(c,atlas[panel],[s[0],s[1],s[2]],[d[0],d[1],d[2]]);drawMappedTriangle(c,atlas[panel],[s[1],s[3],s[2]],[d[1],d[3],d[2]]);
  }
 }
 const data=c.getImageData(0,0,W,H),pixels=data.data;for(let i=0;i<pixels.length;i+=4){if(!pixels[i+3])continue;const lum=.2126*base.base[i]+.7152*base.base[i+1]+.0722*base.base[i+2],shade=Math.max(.42,Math.min(1.08,.27+lum/245));pixels[i]*=shade;pixels[i+1]*=shade;pixels[i+2]*=shade;pixels[i+3]*=Math.max(.72,Math.min(.98,.75+lum/850))}c.putImageData(data,0,0);c.globalCompositeOperation='destination-in';c.drawImage(base.mask,0,0);c.globalCompositeOperation='source-over';
 patternMapped.set(a.id,{revision:patternRevision,base,mapping:a.panelMapping,canvas:out});target.drawImage(out,0,0);
}
function invalidatePattern(){patternRevision++;patternMapped.clear();patternAtlasRevision=-1}
function drawPatternEditor(){
 if(!patternInitialized)return;const c=$('patternCanvas'),cc=c.getContext('2d'),p=ensurePatternState(),panel=p.active;
 cc.clearRect(0,0,PANEL_W,PANEL_H);cc.fillStyle='#f3f3ed';cc.fillRect(0,0,PANEL_W,PANEL_H);cc.save();panelOutline(cc,panel);cc.fillStyle='#e5e2d6';cc.shadowColor='#39452a18';cc.shadowBlur=16;cc.shadowOffsetY=8;cc.fill();cc.shadowColor='transparent';cc.strokeStyle='#9ea88d';cc.lineWidth=2;cc.stroke();cc.clip();cc.drawImage(getPatternAtlases()[panel],0,0);cc.restore();
 cc.save();cc.strokeStyle='#89967c88';cc.lineWidth=1.5;cc.setLineDash([8,8]);for(const v of [.16,.30,.68]){const l=panelPoint(panel,0,v),r=panelPoint(panel,1,v);cc.beginPath();cc.moveTo(...l);cc.lineTo(...r);cc.stroke()}const top=panelPoint(panel,.5,.05),bottom=panelPoint(panel,.5,.96);cc.beginPath();cc.moveTo(...top);cc.lineTo(...bottom);cc.stroke();cc.restore();
 cc.font='25px sans-serif';cc.fillStyle='#738367';cc.textAlign='center';cc.fillText('腰口',PANEL_W/2,44);cc.fillText('裤脚',PANEL_W/2,PANEL_H-12);cc.font='21px sans-serif';cc.fillText(PANEL_INFO[panel].mirror?'内侧 ← → 外侧':'外侧 ← → 内侧',PANEL_W/2,PANEL_H-49);
 const l=patternSelected();if(l&&!l.repeat){const im=loaded.get(l.src),w=l.size/100*PANEL_W,h=w*(im?im.height/im.width:1);cc.save();cc.translate(l.x*PANEL_W,l.y*PANEL_H);cc.rotate(l.rotation*Math.PI/180);cc.strokeStyle='#667d46';cc.lineWidth=2;cc.setLineDash([7,5]);cc.strokeRect(-w/2-5,-h/2-5,w+10,h+10);cc.restore()}
}
function queuePatternPreviews(){if(!patternInitialized||patternMode!=='pattern')return;clearTimeout(patternPreviewTimer);patternPreviewTimer=setTimeout(renderPatternPreviews,90)}
async function renderPatternPreviews(){
 const run=++patternPreviewRun;$('patternSyncStatus').textContent='正在同步…';
 try{await ensurePatternImages();for(const a of state.angles){if(run!==patternPreviewRun)return;await prepare(a);const small=document.querySelector('[data-preview-id="'+CSS.escape(a.id)+'"] canvas');if(!small)continue;const one=document.createElement('canvas');one.width=W;one.height=H;paint(a,one.getContext('2d'),false);small.getContext('2d').clearRect(0,0,small.width,small.height);small.getContext('2d').drawImage(one,0,0,small.width,small.height);await new Promise(resolve=>setTimeout(resolve,0))}if(run===patternPreviewRun)$('patternSyncStatus').textContent='✓ 所有角度已同步'}catch(e){$('patternSyncStatus').textContent='部分预览未完成';toast(e.message)}
}
function renderPatternCards(){const grid=$('patternPreviewGrid');grid.replaceChildren();for(const [i,a]of state.angles.entries()){const card=node('article','pattern-preview-card');card.dataset.previewId=a.id;const c=node('canvas');c.width=260;c.height=390;c.setAttribute('aria-label',a.name+'同步效果图');c.onclick=()=>{state.active=a.id;renderExportChoices();toast('已选择 '+a.name+'，可从顶部导出单张')};const title=node('div','pattern-preview-title');title.append(text(node('strong'),String(i+1).padStart(2,'0')+' / '+a.name),text(node('span',a.panelCalibrated?'mapped-label':'pending-label'),a.panelCalibrated?'已对应':'待校准'));const actions=node('div','pattern-preview-actions'),exp=text(node('button'),'导出单张'),cal=text(node('button'),'校准对应');exp.onclick=()=>exportSingle(a.id);cal.onclick=()=>openPanelCalibration(a.id);actions.append(exp,cal);card.append(c,title,actions);grid.append(card)}}
function refreshPatternUI(){
 if(!patternInitialized)return;const p=ensurePatternState();invalidatePattern();
 $('patternPanelName').textContent=PANEL_INFO[p.active].name;$('patternAngleCount').textContent=state.angles.length;
 document.querySelectorAll('[data-panel]').forEach(b=>b.classList.toggle('active',b.dataset.panel===p.active));
 $('patternLegacyToggle').checked=!!p.includeLegacy;const oldCount=state.angles.reduce((n,a)=>n+a.layers.length,0);$('patternLegacyCount').textContent=oldCount;
 const list=$('patternLayerList');list.replaceChildren();for(const l of p.layers[p.active].slice().reverse()){const b=node('button','layer-item'+(l.id===p.selected?' active':''));b.append(thumb(l.src,l.name),text(node('strong'),l.name));b.onclick=()=>{p.selected=l.id;refreshPatternProperties();drawPatternEditor()};list.append(b)}if(!list.children.length)list.append(text(node('p','empty-layer'),'这块裤片还没有图案'));
 refreshPatternProperties();drawPatternEditor();renderPatternCards();queuePatternPreviews();updateUndo();
}
function refreshPatternProperties(){const l=patternSelected();$('patternProperties').hidden=!l;$('patternSelectionHint').hidden=!!l;if(!l)return;$('patternX').value=(l.x*100).toFixed(1);$('patternY').value=(l.y*100).toFixed(1);$('patternSize').value=l.size;$('patternSizeValue').textContent=l.size+'%';$('patternRotation').value=l.rotation;$('patternRotationValue').textContent=l.rotation+'°';$('patternOpacity').value=l.opacity;$('patternOpacityValue').textContent=l.opacity+'%';$('patternRepeat').checked=!!l.repeat}
function patternChanged(){invalidatePattern();drawPatternEditor();refreshPatternProperties();queuePatternPreviews();markDirty()}
async function addPatternArtwork(item){try{await imageReady(item.src);checkpoint();const p=ensurePatternState(),l={id:uid(),name:item.name,src:item.src,x:.5,y:.48,size:38,rotation:0,opacity:100,repeat:false};p.layers[p.active].push(l);p.selected=l.id;p.enabled=true;refreshPatternUI();markDirty()}catch(e){toast('图案读取失败：'+e.message)}}
function patternBaseReplaced(a){a.panelMapping=clone(PANEL_MAPS[a.panelPreset||a.id]||PANEL_MAPS.front);a.panelPreset=PANEL_MAPS[a.id]?a.id:'front';a.panelCalibrated=false;invalidatePattern()}
function setStudioMode(mode){patternMode=mode;document.querySelector('.workspace').hidden=mode!=='photo';$('patternWorkspace').hidden=mode!=='pattern';$('patternModeBtn').classList.toggle('active',mode==='pattern');$('photoModeBtn').classList.toggle('active',mode==='photo');if(mode==='pattern')refreshPatternUI();else{state.pattern.includeLegacy=true;paint();markDirty()}}
function bindPatternEditing(){
 const c=$('patternCanvas'),point=e=>{const r=c.getBoundingClientRect();return [(e.clientX-r.left)/r.width,(e.clientY-r.top)/r.height]};
 c.onpointerdown=e=>{const p=point(e),s=state.pattern;const l=s.layers[s.active].slice().reverse().find(l=>{if(l.repeat)return false;const im=loaded.get(l.src),dx=(p[0]-l.x)*PANEL_W,dy=(p[1]-l.y)*PANEL_H,rad=-l.rotation*Math.PI/180,w=l.size/100*PANEL_W,h=w*(im?im.height/im.width:1);return Math.abs(dx*Math.cos(rad)-dy*Math.sin(rad))<w/2+10&&Math.abs(dx*Math.sin(rad)+dy*Math.cos(rad))<h/2+10});if(!l){s.selected=null;refreshPatternProperties();drawPatternEditor();return}s.selected=l.id;checkpoint();patternDrag={x:p[0]-l.x,y:p[1]-l.y};c.setPointerCapture(e.pointerId);refreshPatternProperties();drawPatternEditor()};
 c.onpointermove=e=>{if(!patternDrag)return;const l=patternSelected(),p=point(e);if(!l)return;l.x=Math.max(0,Math.min(1,p[0]-patternDrag.x));l.y=Math.max(0,Math.min(1,p[1]-patternDrag.y));patternChanged()};c.onpointerup=c.onpointercancel=()=>{if(patternDrag){patternDrag=null;patternChanged()}};
 for(const [id,key]of [['patternSize','size'],['patternRotation','rotation'],['patternOpacity','opacity']]){let saved=null;$(id).onpointerdown=()=>saved=JSON.stringify(state);$(id).onkeydown=()=>{if(!saved)saved=JSON.stringify(state)};$(id).oninput=()=>{const l=patternSelected();if(l){l[key]=Number($(id).value);patternChanged()}};$(id).onchange=()=>{if(saved){history.push(saved);future=[];saved=null;updateUndo()}markDirty()}}
 for(const [id,key]of [['patternX','x'],['patternY','y']]){let before=null;$(id).onfocus=()=>before=JSON.stringify(state);$(id).oninput=()=>{const l=patternSelected(),value=Number($(id).value);if(!l||$(id).value===''||!Number.isFinite(value))return;l[key]=Math.max(0,Math.min(1,value/100));invalidatePattern();drawPatternEditor();queuePatternPreviews();markDirty()};$(id).onchange=$(id).onblur=()=>{const l=patternSelected(),value=Number($(id).value);if(l&&$(id).value!==''&&Number.isFinite(value)){l[key]=Math.max(0,Math.min(1,value/100));invalidatePattern();drawPatternEditor();queuePatternPreviews();markDirty()}if(before&&before!==JSON.stringify(state)){history.push(before);future=[];updateUndo()}before=null;refreshPatternProperties()}};
 $('patternRepeat').onchange=()=>{const l=patternSelected();if(!l)return;checkpoint();l.repeat=$('patternRepeat').checked;patternChanged()};
 $('patternDelete').onclick=()=>{const p=state.pattern;if(!patternSelected())return;checkpoint();p.layers[p.active]=p.layers[p.active].filter(l=>l.id!==p.selected);p.selected=p.layers[p.active].at(-1)?.id||null;refreshPatternUI();markDirty()};
 $('patternMirror').onclick=()=>{const l=patternSelected(),p=state.pattern;if(!l)return;checkpoint();p.layers[PANEL_INFO[p.active].pair].push({...l,id:uid(),x:1-l.x,rotation:-l.rotation});refreshPatternUI();markDirty();toast('已复制到 '+PANEL_INFO[PANEL_INFO[p.active].pair].name+'，图案朝向保留')};
}
async function initPatternStudio(){
 ensurePatternState();patternInitialized=true;
 // Offer a small demonstration for a new project; existing individual artwork remains intact.
 if(!state.pattern.demoInitialized){state.pattern.demoInitialized=true;const old=state.angles.flatMap(a=>a.layers);if(old.length===1&&old[0].name.includes('示例')){const l={id:uid(),name:'雏菊花簇 · 示例',src:old[0].src,x:.50,y:.48,size:38,rotation:0,opacity:100,repeat:false};state.pattern.layers.FR.push(l);state.pattern.selected=l.id}}
 await ensurePatternImages();
 $('patternModeBtn').onclick=()=>setStudioMode('pattern');$('photoModeBtn').onclick=()=>setStudioMode('photo');
 document.querySelectorAll('[data-panel]').forEach(b=>b.onclick=()=>{state.pattern.active=b.dataset.panel;state.pattern.selected=state.pattern.layers[b.dataset.panel].at(-1)?.id||null;refreshPatternUI();markDirty()});
 const assets=$('patternAssets');for(const item of library){const b=node('button','art-card');const image=node('div','art-image');image.append(thumb(item.src,item.name));b.append(image,text(node('div','art-label'),item.name));b.onclick=()=>addPatternArtwork(item);assets.append(b)}
 const existing=new Map();state.angles.flatMap(a=>a.layers).forEach(l=>existing.set(l.src,l));if(existing.size){$('patternExisting').hidden=false;for(const l of existing.values()){const b=node('button','layer-item');b.append(thumb(l.src,l.name),text(node('span'),l.name));b.onclick=()=>addPatternArtwork(l);$('patternExistingList').append(b)}}
 $('patternUploadBtn').onclick=()=>$('patternArtInput').click();$('patternArtInput').onchange=async e=>{for(const f of e.target.files){try{await addPatternArtwork({name:f.name.replace(/\.[^.]+$/,'').slice(0,40),src:await safeFile(f,true)})}catch(error){toast(error.message)}}e.target.value=''};
 $('patternLegacyToggle').onchange=()=>{checkpoint();state.pattern.includeLegacy=$('patternLegacyToggle').checked;refreshPatternUI();markDirty()};
 $('patternUndo').onclick=()=>$('undoBtn').click();$('patternRedo').onclick=()=>$('redoBtn').click();
 $('patternExportAll').onclick=()=>$('exportAllBtn').click();$('patternReplaceSet').onclick=()=>$('replaceSetInput').click();
 $('patternExportScale').onchange=()=>$('exportScale').value=$('patternExportScale').value;$('exportScale').onchange=()=>$('patternExportScale').value=$('exportScale').value;
 bindPatternEditing();bindPanelCalibration();setStudioMode('pattern');markDirty();
}

// Calibration is a one-time relationship between a photograph and its visible panels.
function openPanelCalibration(id){const a=state.angles.find(a=>a.id===id);if(!a)return;calibration={id,preset:a.panelPreset||'front',mapping:clone(a.panelMapping||PANEL_MAPS.front),panel:Object.keys(a.panelMapping||PANEL_MAPS.front)[0]};$('calibrationTitle').textContent=a.name+' · 裤片对应校准';$('calibrationProfile').value=calibration.preset;renderCalibrationSelectors();$('calibrationDialog').showModal();drawPanelCalibration()}
function renderCalibrationSelectors(){const select=$('calibrationPanel');select.replaceChildren();$('calibrationVisiblePanels').replaceChildren();for(const [key,info]of Object.entries(PANEL_INFO)){const label=node('label'),input=node('input');input.type='checkbox';input.checked=!!calibration.mapping[key];input.onchange=()=>{if(input.checked)calibration.mapping[key]=clone((PANEL_MAPS[calibration.preset]||PANEL_MAPS.front)[key]||PANEL_MAPS[key[0]==='B'?'back':'front'][key]);else{if(Object.keys(calibration.mapping).length===1){input.checked=true;toast('至少保留一块可见裤片');return}delete calibration.mapping[key]}if(!calibration.mapping[calibration.panel])calibration.panel=Object.keys(calibration.mapping)[0];renderCalibrationSelectors();drawPanelCalibration()};label.append(input,document.createTextNode(info.name));$('calibrationVisiblePanels').append(label);if(calibration.mapping[key]){const option=node('option');option.value=key;option.textContent=info.name;select.append(option)}}select.value=calibration.panel}
async function drawPanelCalibration(){if(!calibration)return;const a=state.angles.find(a=>a.id===calibration.id);await prepare(a);const c=$('calibrationCanvas'),cc=c.getContext('2d');cc.clearRect(0,0,W,H);cc.drawImage(baseCache.get(a.id).canvas,0,0);for(const [key,rows]of Object.entries(calibration.mapping)){cc.save();cc.lineWidth=key===calibration.panel?4:2;cc.strokeStyle=key===calibration.panel?'#648838':'#aeaa9c';cc.fillStyle='#f2fae8';for(let i=0;i<rows.length;i++){cc.beginPath();cc.moveTo(rows[i][0][0]*W,rows[i][0][1]*H);cc.lineTo(rows[i][1][0]*W,rows[i][1][1]*H);cc.stroke();if(i)for(let edge=0;edge<2;edge++){cc.beginPath();cc.moveTo(rows[i-1][edge][0]*W,rows[i-1][edge][1]*H);cc.lineTo(rows[i][edge][0]*W,rows[i][edge][1]*H);cc.stroke()}if(key===calibration.panel){for(const p of rows[i]){cc.beginPath();cc.arc(p[0]*W,p[1]*H,11,0,Math.PI*2);cc.fill();cc.stroke()}const x=(rows[i][0][0]+rows[i][1][0])*W/2,y=(rows[i][0][1]+rows[i][1][1])*H/2;cc.font='40px sans-serif';cc.lineWidth=5;cc.strokeStyle='white';cc.strokeText(PANEL_ROWS[i],x+12,y-15);cc.fillStyle='#3d5d28';cc.fillText(PANEL_ROWS[i],x+12,y-15);cc.fillStyle='#f2fae8'}}cc.restore()}}
function bindPanelCalibration(){
 const profile=$('calibrationProfile');for(const [id,name]of Object.entries(PANEL_PROFILES)){const o=node('option');o.value=id;o.textContent=name;profile.append(o)}
 profile.onchange=()=>{calibration.preset=profile.value;calibration.mapping=clone(PANEL_MAPS[profile.value]);calibration.panel=Object.keys(calibration.mapping)[0];renderCalibrationSelectors();drawPanelCalibration()};$('calibrationPanel').onchange=()=>{calibration.panel=$('calibrationPanel').value;drawPanelCalibration()};
 const c=$('calibrationCanvas'),point=e=>{const r=c.getBoundingClientRect();return [(e.clientX-r.left)/r.width,(e.clientY-r.top)/r.height]};
 c.onpointerdown=e=>{if(!calibration)return;const p=point(e),rows=calibration.mapping[calibration.panel];let best=null,distance=Infinity;for(let i=0;i<rows.length;i++)for(let edge=0;edge<2;edge++){const d=Math.hypot((rows[i][edge][0]-p[0])*W,(rows[i][edge][1]-p[1])*H);if(d<distance){best={row:i,edge};distance=d}}if(distance<65){calibrationDrag=best;c.setPointerCapture(e.pointerId)}};
 c.onpointermove=e=>{if(!calibrationDrag)return;const p=point(e);calibration.mapping[calibration.panel][calibrationDrag.row][calibrationDrag.edge]=p.map(v=>Math.max(-4,Math.min(5,v)));drawPanelCalibration()};c.onpointerup=c.onpointercancel=()=>calibrationDrag=null;
 $('cancelCalibration').onclick=()=>{$('calibrationDialog').close();calibration=null};
 $('saveCalibration').onclick=()=>{if(!calibration)return;const a=state.angles.find(a=>a.id===calibration.id);checkpoint();a.panelMapping=clone(calibration.mapping);a.panelPreset=calibration.preset;a.panelCalibrated=true;$('calibrationDialog').close();calibration=null;refreshPatternUI();paint();markDirty();toast('对应关系已保存，以后改刀版图案会自动更新这张照片')};
}
function validatePatternProject(p){
 if(!p.pattern)return p;const master=p.pattern;if(master.version!==1||!master.layers)throw Error('示意裤片工程数据无效');
 for(const key of Object.keys(PANEL_INFO)){if(!Array.isArray(master.layers[key])||master.layers[key].length>100)throw Error('裤片图层数据无效');for(const l of master.layers[key]){if(typeof l.src!=='string'||!/^data:image\/(png|jpeg|webp|svg\+xml)[;,]/i.test(l.src)||['x','y','size','rotation','opacity'].some(k=>!Number.isFinite(l[k])))throw Error('裤片图案数据无效');l.size=Math.max(5,Math.min(150,l.size));l.opacity=Math.max(5,Math.min(100,l.opacity));l.x=Math.max(0,Math.min(1,l.x));l.y=Math.max(0,Math.min(1,l.y));l.rotation=Math.max(-180,Math.min(180,l.rotation))}}
 for(const a of p.angles)if(a.panelMapping){for(const [key,rows]of Object.entries(a.panelMapping)){if(!PANEL_INFO[key]||!Array.isArray(rows)||rows.length!==6||rows.some(r=>!Array.isArray(r)||r.length!==2||r.some(pt=>!Array.isArray(pt)||pt.length!==2||pt.some(n=>!Number.isFinite(n)||n< -4||n>5))))throw Error('照片裤片对应数据无效')}}return p;
}
