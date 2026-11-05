(function(root){
const round=(n,d=0)=>Math.round((n+Number.EPSILON)*10**d)/10**d;
function densityCalculate(v,mode){
const keys=['before','after','wet','maximum','sandDensity','funnelMass',mode==='measured'?'dry':'moisture'];
if(keys.some(k=>v[k]===null||v[k]===undefined||String(v[k]).trim()===''||!Number.isFinite(Number(v[k]))))return {error:'必要な値をすべて入力してください。'};
const n=Object.fromEntries(keys.map(k=>[k,Number(v[k])]));
if(keys.some(k=>n[k]<0)||n.sandDensity<=0||n.maximum<=0||n.wet<=0)return {error:'砂の密度・最大乾燥密度・湿潤重量は0より大きい値、その他は0以上で入力してください。'};
const sandMass=n.before-n.after-n.funnelMass;
if(sandMass<=0)return {error:'試験前 − 試験後 − ロトの砂重量が0以下です。重量と検定値を確認してください。'};
const volume=round(sandMass/n.sandDensity);
if(volume<=0)return {error:'穴の容積が0になりました。入力値を確認してください。'};
const dry=mode==='measured'?n.dry:round(n.wet/(1+n.moisture/100));
if(dry<=0||dry>n.wet)return {error:'乾燥重量は0より大きく、湿潤重量以下になるように入力してください。'};
const dryDensity=round(dry/volume,3),compaction=round(dryDensity/n.maximum,3)*100;
return {sandMass,volume,dry,wetDensity:n.wet/volume,dryDensity,compaction,moisture:mode==='measured'?(n.wet/dry-1)*100:n.moisture};
}
root.densityCalculate=densityCalculate;
if(typeof module!=='undefined')module.exports={densityCalculate};
})(typeof globalThis!=='undefined'?globalThis:this);
