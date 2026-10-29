// CANCHA V12: reconciliación conservadora entre proveedores, nunca mezcla temporadas incompatibles.
import {clean} from './identity.mjs';
const aliases={'goalkeeper':'Portero','defender':'Defensa','midfielder':'Mediocampista','attacker':'Delantero'};
export const cleanPlayer=s=>clean(s).replace(/\b(jr|junior|ii|iii)\b/g,'').replace(/\s+/g,' ').trim();
function years(s){let x=String(s||'').match(/\d{4}/);return x?x[0]:null}
export function mergeRosters(items,{team,season}={}){
 if(!items.length)throw Error('No se recibieron plantillas');
 const ranked=[...items].filter(x=>(x.players||[]).length).filter(x=>!season||!x.season||x.season===season);
 if(!ranked.length)throw Error('Los datos no pertenecen a la temporada solicitada');
 const provenance=[],players=[],index=new Map();
 for(const source of ranked){
  provenance.push({source:source.source,count:source.players.length,season:source.season||null,updatedAt:source.updatedAt||null});
  for(const p of source.players){
   if(!p?.name)continue;
   const n=cleanPlayer(p.name);if(n.length<3)continue;
   const birth=years(p.birth),duplicate=players.findIndex(q=>cleanPlayer(q.name)===n && (!birth||!years(q.birth)||birth===years(q.birth)));
   if(duplicate>=0){
    const old=players[duplicate];
    // Preference is the first provider; fill ONLY missing fields, do not overwrite.
    for(const field of ['number','age','country','birth','height','photo','position'])if((old[field]===null||old[field]===undefined||old[field]===''||old[field]==='Sin especificar')&&p[field])old[field]=p[field];
    old.sources=[...new Set([...(old.sources||[old.provider||source.source]),p.provider||source.source])];
   } else {
    players.push({...p,id:String(p.id),provider:p.provider||source.source,sources:[source.source]});
   }
  }
 }
 const distinct=provenance.map(x=>x.source);
 return {team:team||ranked[0].team,season:season||ranked[0].season||null,
  source:distinct.join(' + '),sources:provenance,updatedAt:new Date().toISOString(),players,
  coach:ranked.map(r=>r.coach).find(Boolean)||null,complete:false,
  coverage:`${players.length} nombres únicos recuperados de ${distinct.length} fuente(s). La pertenencia al club y la cobertura del plantel dependen de cada proveedor.`};
}
export function selectStandings(candidates,league){
 if(!candidates.length)throw Error('Ninguna fuente suministró una tabla');
 const scored=candidates.map(d=>({data:d,coverage:d.quality?.found??0,complete:!!d.quality?.complete}));
 scored.sort((a,b)=>Number(b.complete)-Number(a.complete)||b.coverage-a.coverage);
 const best=scored[0];
 return {...best.data,alternatives:scored.slice(1).map(s=>({source:s.data.source,clubs:s.coverage,complete:s.complete})),
   partial:!best.complete,quality:{...best.data.quality,expected:league.teams.length},
   warnings:best.complete?[]:[`Tabla incompleta (${best.coverage}/${league.teams.length}). No se asignan posiciones a equipos sin información.`]};
}
