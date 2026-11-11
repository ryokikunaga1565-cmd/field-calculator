const materialNames=['RC-10','RC-40','RM-40'];
const densityValues={before:'',after:'',wet:'',moisture:''};
let densitySettings={sandDensity:'',funnelMass:'',materials:Object.fromEntries(materialNames.map(name=>[name,{maximum:'',optimum:''}]))};
const scalar=v=>(typeof v==='string'||typeof v==='number')?String(v):'';
try{
 const saved=JSON.parse(localStorage.getItem('field-density-settings-v2')||localStorage.getItem('field-density-settings-v1'));
 if(saved&&typeof saved==='object'){
  for(const k of ['sandDensity','funnelMass'])densitySettings[k]=scalar(saved[k]);
  for(const name of materialNames)for(const k of ['maximum','optimum'])densitySettings.materials[name][k]=scalar(saved.materials?.[name]?.[k]);
 }
}catch{}
const numberFormat=(v,d=0)=>v.toLocaleString('ja-JP',{minimumFractionDigits:d,maximumFractionDigits:d});
const input=(id,label,unit,step='any')=>`<label>${label} <small>${unit}</small><input id="${id}" type="number" inputmode="decimal" min="0" step="${step}"></label>`;
document.getElementById('materialSettings').innerHTML=materialNames.map((name,i)=>`<section class="material-setting"><h3>${name}</h3><div class="fields">${input('maximum'+i,'最大乾燥密度','g/cm³')}${input('optimum'+i,'最適含水比（参考）','%','0.01')}</div></section>`).join('');
for(const k of ['sandDensity','funnelMass'])document.getElementById(k).value=densitySettings[k];
materialNames.forEach((name,i)=>{for(const k of ['maximum','optimum'])document.getElementById(k+i).value=densitySettings.materials[name][k]});
document.getElementById('densityFields').innerHTML='<div class="fields">'+[['before','試験前の重量','g'],['after','試験後の重量','g'],['wet','土の湿潤重量','g'],['moisture','予測含水比','%']].map(([id,label,unit])=>input(id,label,unit,id==='moisture'?'0.01':'any')).join('')+'</div>';
document.getElementById('modeHint').textContent='予測含水比による暫定結果です。最適含水比は参考値で、計算には使用しません。';
function readSettings(){return {sandDensity:document.getElementById('sandDensity').value,funnelMass:document.getElementById('funnelMass').value,materials:Object.fromEntries(materialNames.map((name,i)=>[name,{maximum:document.getElementById('maximum'+i).value,optimum:document.getElementById('optimum'+i).value}]))}}
function updateDensity(){
 const settings=readSettings(),name=document.getElementById('material').value,material=settings.materials[name];
 document.getElementById('settingsSummary').textContent=settings.sandDensity!==''&&settings.funnelMass!==''?`使用する検定値：砂 ${settings.sandDensity} g/cm³ ／ ロト ${settings.funnelMass} g`:'事前設定で砂とロトの検定値を入力してください。';
 const valid=v=>v!==''&&Number.isFinite(+v)&&+v>=0;
 document.getElementById('materialSummary').textContent=`最大乾燥密度：${valid(material.maximum)&&+material.maximum>0?numberFormat(+material.maximum,3)+' g/cm³':'未設定'} ／ 最適含水比（参考）：${valid(material.optimum)?numberFormat(+material.optimum,2)+' %':'未設定'}`;
 const result=densityCalculate({...densityValues,sandDensity:settings.sandDensity,funnelMass:settings.funnelMass,maximum:material.maximum}),el=document.getElementById('densityResults');
 if(result.error){el.innerHTML='<p class="muted" id="densityError"></p>';document.getElementById('densityError').textContent=result.error;return}
 el.innerHTML=`<span class="badge">予測含水比による暫定結果</span><p class="compaction-label">${name} ／ 締固め度</p><div class="big">${numberFormat(result.compaction,1)} <small>%</small></div>`;
}
function formatMoisture(el){if(el.value!==''&&Number.isFinite(+el.value)&&+el.value>=0)el.value=(Math.round((+el.value+Number.EPSILON)*100)/100).toFixed(2)}
for(const id of Object.keys(densityValues)){
 const el=document.getElementById(id);
 el.addEventListener('input',()=>{densityValues[id]=el.value;updateDensity()});
 if(id==='moisture')el.addEventListener('change',()=>{formatMoisture(el);densityValues[id]=el.value;updateDensity()});
}
document.querySelectorAll('#settings input').forEach(el=>{
 el.addEventListener('input',()=>{document.getElementById('settingsStatus').textContent='設定を変更中です。';updateDensity()});
 if(el.id.startsWith('optimum'))el.addEventListener('change',()=>{formatMoisture(el);updateDensity()});
});
document.getElementById('material').addEventListener('change',updateDensity);
document.getElementById('saveSettings').addEventListener('click',()=>{
 const v=readSettings(),status=document.getElementById('settingsStatus');
 const valid=(s,positive=false)=>s!==''&&Number.isFinite(+s)&&(positive?+s>0:+s>=0);
 if(!valid(v.sandDensity,true)||!valid(v.funnelMass)){status.textContent='砂の密度は0より大きい値、ロトの重量は0以上で入力してください。';return}
 for(const name of materialNames){const m=v.materials[name];if(!valid(m.maximum,true)||!valid(m.optimum)){status.textContent=`${name}の最大乾燥密度は0より大きい値、最適含水比は0以上で入力してください。`;return}}
 materialNames.forEach((_,i)=>formatMoisture(document.getElementById('optimum'+i)));
 try{densitySettings=readSettings();localStorage.setItem('field-density-settings-v2',JSON.stringify(densitySettings));status.textContent='保存しました。';document.getElementById('settings').open=false;updateDensity()}catch{status.textContent='保存できませんでした。この画面での計算はできます。'}
});
if(!densitySettings.sandDensity||!densitySettings.funnelMass||materialNames.some(n=>!densitySettings.materials[n].maximum||densitySettings.materials[n].optimum===''))document.getElementById('settings').open=true;
updateDensity();
