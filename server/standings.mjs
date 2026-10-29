// Conserva la cifra declarada para auditarla, pero calcula DG a partir de GF y GC.
export function reconcileStandings(data){
 const warnings=[...(data.warnings||[])];
 const groups=(data.groups||[]).map(g=>({...g,rows:(g.rows||[]).map(r=>{
  if(Number.isInteger(r.gf)&&Number.isInteger(r.gc)&&r.dg!==r.gf-r.gc){
   warnings.push(`${r.name||r.teamId}: DG calculada como GF − GC (${r.gf-r.gc}); la fuente registraba ${r.dg??'sin dato'}. No se modifica la posición ni los puntos.`);
   return {...r,reportedDg:r.dg,dg:r.gf-r.gc};
  }
  return r;
 })}));
 return {...data,groups,warnings:[...new Set(warnings)]};
}
