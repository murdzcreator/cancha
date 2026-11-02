import {compare,normalize} from './dates.mjs';
export function qualification(note){
 const value=typeof note?.description==='string'?note.description.trim().slice(0,150):'';if(!value)return null;
 const types=[[/relegation.*play|relegation.*qual/i,'relegation-playoff','Promoción de permanencia'],[/relegation/i,'relegation','Descenso'],[/champions.*qual/i,'champions-qualifier','Previa de Champions League'],[/champions league/i,'champions','Champions League'],[/europa league/i,'europa','Europa League'],[/conference/i,'conference','Conference League'],[/libertadores/i,'libertadores','Copa Libertadores'],[/sudamericana/i,'sudamericana','Copa Sudamericana'],[/promotion.*play|promotion.*qual/i,'promotion-playoff','Eliminatoria de ascenso'],[/promotion/i,'promotion','Ascenso']];
 const found=types.find(([re])=>re.test(value));return found?{key:found[1],label:found[2],publishedLabel:value,source:'ESPN'}:null;
}
export function recentForm(events,team,limit=5){
 const seen=new Set();return events.filter(m=>{
  if(![m.home,m.away].includes(team)||m.status!=='FINAL'||![m.hs,m.as].every(n=>Number.isInteger(n)&&n>=0&&n<=99)||!normalize(m.date))return false;
  const key=[m.provider,m.id].join(':');if(seen.has(key))return false;seen.add(key);return true;
 }).sort((a,b)=>compare(b,a)).slice(0,limit).reverse().map(m=>({id:m.id,provider:m.provider,home:m.home,away:m.away,homeName:m.homeName,awayName:m.awayName,date:m.date,hs:m.hs,as:m.as,result:m.hs===m.as?'E':((m.home===team?m.hs:m.as)>(m.home===team?m.as:m.hs)?'V':'D')}));
}
