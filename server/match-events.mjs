import {safeInt} from './identity.mjs';
const name=x=>String(x??'').slice(0,200),plain=x=>name(x).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]/g,'');
const escape=s=>s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
const role=p=>String(p.role?.type||p.role?.name||p.role||p.type?.type||p.type?.name||p.type||'').toLowerCase().replace(/[^a-z]/g,'');
const label={goal:'Gol','own-goal':'Autogol','penalty---scored':'Gol de penal','yellow-card':'Amarilla','red-card':'Roja','yellow-red-card':'Segunda amarilla',substitution:'Cambio'};
function eventScore(e,teams,match){
 if(e.shootout)return null;
 let h=safeInt(e.homeScore?.value??e.homeScore),a=safeInt(e.awayScore?.value??e.awayScore);
 if(h===null||a===null){
  // Solo leer un marcador escrito por la fuente; nunca reconstruirlo contando goles.
  const m=String(e.text||'').match(/^Goal!\s*(.+?)\s+(\d{1,2})\s*,\s*(.+?)\s+(\d{1,2})(?:\.\s|$)/i);
  if(!m||!teams[0].names.some(n=>plain(n)===plain(m[1]))||!teams[1].names.some(n=>plain(n)===plain(m[3])))return null;
  h=Number(m[2]);a=Number(m[4]);
 }
 if(h<0||a<0||h>99||a>99||Number.isInteger(match.hs)&&h>match.hs||Number.isInteger(match.as)&&a>match.as)return null;
 return {home:h,away:a};
}
export function normalizeMatchEvents(rows,{teams,match}){
 return (rows||[]).filter(e=>Object.hasOwn(label,e.type?.type)||e.scoringPlay).map(e=>{
  const kind=e.type?.type||'',goal=/goal|penalty/.test(kind)&&e.scoringPlay!==false||e.scoringPlay===true;
  const people=(e.participants||[]).map(p=>({name:name(p.athlete?.displayName),role:role(p)})).filter(p=>p.name),unique=[...new Set(people.map(p=>p.name))];
  const short=String(e.shortText||'').slice(0,1000),comment=String(e.text||'').slice(0,4000);
  let scorer=people.find(p=>['scorer','goalscorer','scoringplayer','owngoalscorer'].includes(p.role))?.name||null;
  const fromShort=unique.filter(n=>new RegExp('^'+escape(n)+'\\s+(?:Goal|Penalty|Own Goal)\\b','i').test(short));
  if(!scorer&&fromShort.length===1)scorer=fromShort[0];
  const fromComment=unique.filter(n=>new RegExp('(?:^|[.!]\\s+)'+escape(n)+'\\s*\\(','i').test(comment));
  if(!scorer&&fromComment.length===1)scorer=fromComment[0];
  let assist=people.find(p=>['assist','assister','assistingplayer'].includes(p.role))?.name||null;
  const fromAssist=unique.filter(n=>new RegExp('Assisted by\\s+'+escape(n)+'(?![\\p{L}\\p{N}])','iu').test(comment));
  if(!assist&&fromAssist.length===1)assist=fromAssist[0];if(assist===scorer)assist=null;
  const club=teams.find(t=>String(t.sourceId)===String(e.team?.id));
  return {id:name(e.id),minute:name(e.clock?.displayValue).replace(/'/g,''),type:goal?'Goal':kind==='substitution'?'subst':'Card',
   detail:e.shootout&&goal?'Penal de tanda':label[kind]||name(e.type?.text),team:club?.name||'',teamId:club?.id||null,
   player:goal&&scorer?scorer:unique.join(' / '),...(goal?{scorer,assist,participants:unique,scoreAfter:eventScore(e,teams,match),shootout:!!e.shootout}:{}),
   ...(kind==='own-goal'?{ownGoal:true}:{})};
 });
}
