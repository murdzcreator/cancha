/* Reglas compartidas de fechas y páginas para las vistas V18. */
(()=>{'use strict';
 const normalize=value=>String(value??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase('es').trim();
 const shift=(day,n)=>new Date(Date.parse(day+'T12:00:00Z')+n*864e5).toISOString().slice(0,10);
 function range(mode,selected,now=new Date()){
  const today=globalThis.CANCHA_DATES.dayInPeru(now),valid=globalThis.CANCHA_DATES.normalize(selected)===selected&&selected?.length===10;
  const from=mode==='custom'&&valid?selected:mode==='tomorrow'?shift(today,1):today;
  return {from,to:mode==='week'?shift(from,6):from};
 }
 function page(items,index=0,size=25){index=Number.isInteger(index)?index:0;const pages=Math.max(1,Math.ceil(items.length/size));index=Math.max(0,Math.min(pages-1,index));return {items:items.slice(index*size,(index+1)*size),index,pages,total:items.length,start:items.length?index*size+1:0,end:Math.min(items.length,(index+1)*size)};}
 const escape=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 function pagination(p,kind){return p.pages<=1?'':`<nav class="c-directory-pages" aria-label="Páginas del listado"><button type="button" data-view-page="${kind}" data-page-index="${p.index-1}" ${p.index===0?'disabled':''}>← Anteriores</button><span>${p.start}–${p.end} de ${p.total}</span><button type="button" data-view-page="${kind}" data-page-index="${p.index+1}" ${p.index===p.pages-1?'disabled':''}>Siguientes →</button></nav>`;}
 function coverage(d,kind,id,player){
  if(kind==='team'){const team=d.teamCoverage?.[id]||{results:d.rows?.find(r=>r.team===id)?.total.played||0,details:null};return {title:'Muestra del equipo',label:`${team.results} ${team.results===1?'resultado':'resultados'} del club${team.details!=null?' · '+team.details+(team.details===1?' acta':' actas'):''}`};}
  if(kind==='player'){const p=d.players?.find(p=>p.id===player&&p.team===id);return {title:'Participaciones observadas',label:p?`${p.played} ${p.played===1?'partido':'partidos'} · goles publicados en ${p.known?.goals||0}`:'Sin actas disponibles de este jugador'};}
  return {title:'Muestra de la competición',label:`${d.coverage.results} resultados · ${d.coverage.details} actas`};
 }
 globalThis.CANCHA_VIEW={normalize,shift,range,page,escape,pagination,coverage};
})();
