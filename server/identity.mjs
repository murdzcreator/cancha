export const clean = s => String(s || '').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/&/g,' and ').replace(/\b(fc|cf|sc|ac|cd|club|de|del|the|futbol|football)\b/g,' ').replace(/[^a-z0-9]+/g,' ').trim().replace(/\s+/g,' ');
export const aliases = {
 'alianza lima':['alianza lima'], 'universitario':['universitario de deportes','universitario'],
 'fc barcelona':['barcelona','fc barcelona'], 'paris saint germain':['paris sg','psg','paris saint germain'],
 'bayern munich':['bayern munich','bayern munchen'], 'inter de milan':['internazionale','inter milan','inter'],
 'as roma':['roma','as roma'], 'ac milan':['milan','ac milan'], 'atletico de madrid':['atletico madrid'],
 'fbc melgar':['melgar'], 'sporting cristal':['sporting cristal'], 'guadalajara':['chivas guadalajara','cd guadalajara'],
 'club america':['america mexico','club america'], 'liga deportiva universitaria':['ldu quito']
};
export function matchTeam(name, teams, ids=null){
  const needle=clean(name); if(!needle) return null;
  const candidates=[];
  for(const [id,t] of Object.entries(teams)){
    if(ids && !ids.includes(id))continue;
    const checks=[t.name,...(aliases[clean(t.name)]||[])].map(clean);
    if(checks.includes(needle))candidates.push(id);
  }
  return candidates.length===1?candidates[0]:null;
}
export const safeInt = v => v === undefined||v===null||v===''||v==='-'?null:(typeof v!=='boolean'&&String(v).trim()!==''&&Number.isSafeInteger(Number(v))?Number(v):null);
export const seasonStart = l => Number(String(l.season).slice(0,4));
export const daysISO = (plus=0) => {const d=new Date(); d.setUTCDate(d.getUTCDate()+plus);return d.toISOString().slice(0,10)};
