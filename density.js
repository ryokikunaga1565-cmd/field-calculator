let densityMode='estimate';
const densityValues={before:'',after:'',wet:'',moisture:'',maximum:'',dry:''};
let densitySettings={sandDensity:'',funnelMass:''};
try{const v=JSON.parse(localStorage.getItem('field-density-settings-v1'));if(v&&typeof v==='object')for(const k of Object.keys(densitySettings))if(typeof v[k]==='string'||typeof v[k]==='number')densitySettings[k]=String(v[k]);}catch{}
for(const key of Object.keys(densitySettings))document.getElementById(key).value=densitySettings[key];
const numberFormat=(v,d=0)=>v.toLocaleString('ja-JP',{minimumFractionDigits:d,maximumFractionDigits:d});
function renderDensityFields(){
const fields=[['before','試験前の重量','g'],['after','試験後の重量','g'],['wet','土の湿潤重量','g'],densityMode==='estimate'?['moisture','予測含水比','%']:['dry','土の実測乾燥重量','g'],['maximum','材料の最大乾燥密度','g/cm³']];
document.getElementById('densityFields').innerHTML='<div class="fields">'+fields.map(([id,label,unit])=>`<label>${label} <small>${unit}</small><input id="${id}" type="number" inputmode="decimal" min="0" step="any" value="${densityValues[id]}"></label>`).join('')+'</div>';
document.getElementById('modeHint').textContent=densityMode==='estimate'?'予測含水比による暫定結果です。試験後に実測乾燥重量へ切り替えて確認してください。':'掘り出した土全体に対応する実測乾燥重量を入力してください。';
for(const [id] of fields)document.getElementById(id).addEventListener('input',e=>{densityValues[id]=e.target.value;updateDensity()});updateDensity();
}
function updateDensity(){
const settings=Object.fromEntries(Object.keys(densitySettings).map(k=>[k,document.getElementById(k).value]));
document.getElementById('settingsSummary').textContent=settings.sandDensity!==''&&settings.funnelMass!==''?`使用する検定値：砂 ${settings.sandDensity} g/cm³ ／ ロト ${settings.funnelMass} g`:'事前設定で砂とロトの検定値を入力してください。';
const result=densityCalculate({...densityValues,...settings},densityMode),el=document.getElementById('densityResults');
if(result.error){el.innerHTML='<p class="muted" id="densityError"></p>';document.getElementById('densityError').textContent=result.error;return}
const final=densityMode==='measured';
el.innerHTML=`<span class="badge ${final?'final':''}">${final?'実測乾燥重量による確定結果':'予測含水比による暫定結果'}</span><p class="muted">締固め度</p><div class="big">${numberFormat(result.compaction,1)} <small>%</small></div><dl class="facts"><dt>乾燥密度</dt><dd>${numberFormat(result.dryDensity,3)} g/cm³</dd><dt>${final?'実測乾燥重量':'推定乾燥重量'}</dt><dd>${numberFormat(result.dry,final?Math.min((String(densityValues.dry).split('.')[1]||'').length,3):0)} g</dd><dt>置換した砂重量</dt><dd>${numberFormat(result.sandMass,1)} g</dd><dt>穴の容積</dt><dd>${numberFormat(result.volume)} cm³</dd><dt>湿潤密度</dt><dd>${numberFormat(result.wetDensity,3)} g/cm³</dd><dt>${final?'実測重量からの含水比':'予測含水比'}</dt><dd>${numberFormat(result.moisture,1)} %</dd></dl>`;
}
for(const key of Object.keys(densitySettings))document.getElementById(key).addEventListener('input',()=>{document.getElementById('settingsStatus').textContent='検定値を変更中です。保存すると次回も使用できます。';updateDensity()});
document.getElementById('saveSettings').addEventListener('click',()=>{const v=Object.fromEntries(Object.keys(densitySettings).map(k=>[k,document.getElementById(k).value]));const status=document.getElementById('settingsStatus');if(v.sandDensity===''||v.funnelMass===''||!Number.isFinite(+v.sandDensity)||!Number.isFinite(+v.funnelMass)||+v.sandDensity<=0||+v.funnelMass<0){status.textContent='砂の密度は0より大きい値、ロトの重量は0以上で入力してください。';return}try{localStorage.setItem('field-density-settings-v1',JSON.stringify(v));densitySettings=v;status.textContent='この端末のブラウザに保存しました。';document.getElementById('settings').open=false}catch{status.textContent='保存できませんでした。この画面での計算はできます。'}});
document.querySelectorAll('nav button').forEach(btn=>btn.addEventListener('click',()=>{densityMode=btn.dataset.mode;document.querySelectorAll('nav button').forEach(b=>b.setAttribute('aria-selected',String(b===btn)));renderDensityFields()}));
if(!densitySettings.sandDensity||!densitySettings.funnelMass)document.getElementById('settings').open=true;
renderDensityFields();
