const angles=[45,22.5,11.25,5.625];
const angleLabels={45:'45°',22.5:'22°1/2',11.25:'11°1/4',5.625:'5°5/8'};
const fieldColor=id=>['newDepth','oldDepth'].includes(id)?'a':id==='ell'?'ell':'b';
function calculate(a,b,l){const ell=l??Math.hypot(a,b);return {ell,rows:angles.map(deg=>{const t=deg*Math.PI/180;return {deg,y:ell/Math.sin(t),x:ell/Math.tan(t)}})}}
let mode='position';const values={newDepth:'750',oldDepth:'1200',newPos:'1300',oldPos:'2600',gap:'1300',ell:'1376'};
const specs={position:[['newDepth','新設 土被り'],['oldDepth','既設 土被り'],['newPos','新設 占用位置'],['oldPos','既設 占用位置']],direct:[['ell','斜辺のずれ ℓ']],offset:[['newDepth','新設 土被り'],['oldDepth','既設 土被り'],['gap','平面の離れ b']]};
function render(){document.getElementById('fields').innerHTML='<div class="fields">'+specs[mode].map(([id,label])=>`<label class="dim-${fieldColor(id)}">${label} <small>mm</small><input id="${id}" type="number" inputmode="decimal" min="0" step="10" value="${values[id]}"></label>`).join('')+'</div>';document.getElementById('hint').textContent=mode==='position'?'占用位置は同じ基準線からの寸法を入力。':mode==='direct'?'図の BC（ℓ）を直接入力します。':'平面の離れは図の CD（b）です。';document.querySelectorAll('#fields input').forEach(el=>el.addEventListener('input',()=>{values[el.id]=el.value;update()}));update()}
const fmt=n=>Math.round(n).toLocaleString('ja-JP');
function update(){const invalid=specs[mode].some(([id])=>values[id].trim()===''||!Number.isFinite(Number(values[id]))||Number(values[id])<0);const out=document.getElementById('results'),off=document.getElementById('offsetResult');if(invalid){off.innerHTML='<span class="error">0以上の寸法をすべて入力してください。</span>';out.textContent='入力待ち';updateEffective(null);return}const a=Math.abs(+values.oldDepth- +values.newDepth),b=mode==='position'?Math.abs(+values.oldPos- +values.newPos):+values.gap;const r=calculate(a,b,mode==='direct'?+values.ell:undefined);off.innerHTML=`<span class="dim-ell">斜辺のずれ ℓ</span><br><b class="dim-ell">${fmt(r.ell)}</b> <span>mm</span>`+(mode==='direct'?'':`<br><span class="dim-a">高低差 a = ${fmt(a)}</span><br><span class="dim-b">離れ b = ${fmt(b)}</span>`);if(r.ell===0){off.innerHTML+='<br><span>ずれが0のため、ひねり配管は不要です。</span>'}out.innerHTML='<table><thead><tr><th>曲管 θ</th><th class="dim-y">長さ y (mm)</th><th class="dim-x">距離 x (mm)</th></tr></thead><tbody>'+r.rows.map(v=>`<tr><td>${angleLabels[v.deg]}</td><td class="dim-y">${fmt(v.y)}</td><td class="dim-x">${fmt(v.x)}</td></tr>`).join('')+'</tbody></table>';updateEffective(r)}
function updateEffective(r){
 const out=document.getElementById('effectiveResults'),detail=document.getElementById('effectiveDetails');
 if(!r||r.ell===0){document.getElementById('selectedResult').textContent=r?'ずれが0のため、中間管の有効長を算出しません。':'寸法を入力してください。';out.textContent=r?'ずれが0のため、中間管の有効長を算出しません。':'寸法を入力してください。';detail.textContent='';return}
 const dn=document.getElementById('pipeDiameter').value;
 const first={type:document.getElementById('firstType').value,face:document.getElementById('firstFace').value};
 const last={type:document.getElementById('lastType').value,face:document.getElementById('lastFace').value};
 const extraInput=document.getElementById('extraEffective').value;
 const extra=extraInput.trim()===''?NaN:Number(extraInput);
 const rows=r.rows.map(v=>({...v,...pipeEffectiveLength(v.y,String(v.deg),dn,first,last,extra)}));
 const chosenAngle=Number(document.getElementById('selectedAngle').value);
 const chosen=rows.find(v=>v.deg===chosenAngle);
 document.getElementById('selectedResult').innerHTML=`<div class="selected-angle">φ${dn} ／ ${angleLabels[chosenAngle]}</div><div class="dim-effective">中間管の有効長 L</div>${chosen.error?`<p class="error">${chosen.error}</p>`:`<div class="selected-number dim-effective">${fmt(chosen.length)} <small>mm</small></div><p class="selected-expression">${fmt(chosen.y)} − ${fmt(chosen.firstLength)} − ${fmt(chosen.lastLength)}${extra?' − '+fmt(extra):''} ＝ ${fmt(chosen.length)} mm</p>`}<div class="selected-facts"><div class="dim-y">折れ点間 y：${fmt(chosen.y)} mm</div><div class="dim-x">進行方向 x：${fmt(chosen.x)} mm</div></div>`;

 out.innerHTML='<table><thead><tr><th>曲管 θ</th><th class="dim-y">折れ点間 y</th><th class="dim-effective">中間管 有効長 L</th></tr></thead><tbody>'+rows.map(v=>`<tr><td>${angleLabels[v.deg]}</td><td class="dim-y">${fmt(v.y)} mm</td><td class="${v.error?'error':'dim-effective'}">${v.error||fmt(v.length)+' mm'}</td></tr>`).join('')+'</tbody></table>';
 detail.innerHTML='<table><thead><tr><th>曲管 θ</th><th>① '+first.face+'</th><th>② '+last.face+'</th><th>差引合計</th></tr></thead><tbody>'+rows.map(v=>`<tr><td>${angleLabels[v.deg]}</td><td>${v.firstLength==null?'—':fmt(v.firstLength)+' mm'}</td><td>${v.lastLength==null?'—':fmt(v.lastLength)+' mm'}</td><td>${v.firstLength==null||v.lastLength==null||!Number.isFinite(extra)?'—':fmt(v.firstLength+v.lastLength+extra)+' mm'}</td></tr>`).join('')+'</tbody></table>';
}
for(const prefix of ['first','last'])document.getElementById(prefix+'Type').addEventListener('change',()=>{
 const face=document.getElementById(prefix+'Face'),double=document.getElementById(prefix+'Type').value==='GX_DOUBLE';
 face.querySelector('option[value="L2"]').disabled=double;
 if(double)face.value='L1';update();
});
for(const id of ['pipeDiameter','firstFace','lastFace','selectedAngle'])document.getElementById(id).addEventListener('change',update);
document.getElementById('extraEffective').addEventListener('input',update);
document.querySelectorAll('nav button').forEach(btn=>btn.addEventListener('click',()=>{mode=btn.dataset.mode;document.querySelectorAll('nav button').forEach(b=>b.setAttribute('aria-selected',String(b===btn)));render()}));render();
