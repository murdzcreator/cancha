/* CANCHA V13: escudos locales elegidos por identidad, nunca por búsqueda ciega. */
(function(){'use strict';
 const db=window.CANCHA_DB||{teams:{},leagues:[]};
 const manifest=window.CANCHA_BRANDING_DATA||{teams:{},leagues:{}};
 const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const valid=s=>typeof s==='string'&&(/^https:\/\//.test(s)||/^assets\/(?:escudos|competiciones)\/[a-z0-9-]+\.(?:svg|png|webp)$/i.test(s));
 const unique=xs=>[...new Set(xs.filter(valid))];
 let failedCount=0;
 function options(kind,id){
  if(kind==='league'){
   let l=db.leagues.find(x=>x.id===id);if(!l)return [];
   return unique([manifest.leagues?.[id]?.curatedLocal,l.logo?.svg,l.logo?.png]);
  }
  const t=db.teams[id];if(!t)return [];
  return unique([manifest.teams?.[id]?.curatedLocal,t.logo,t.png,t.fallback]);
 }
 function html(kind,id,cls=''){
  let entry=kind==='league'?db.leagues.find(x=>x.id===id):db.teams[id];
  if(!entry)return '<span class="initial-mark" aria-label="Escudo no disponible">◈</span>';
  const images=options(kind,id),title=(kind==='league'?'Logo de ':'Escudo de ')+entry.name;
  const initial=kind==='team'?entry.name.split(' ').map(w=>w[0]).slice(0,2).join('').toUpperCase():'◈';
  if(!images.length)return `<span class="initial-mark" title="${esc(title)} sin imagen">${esc(initial)}</span>`;
  return `<img class="${esc(cls)}" src="${esc(images[0])}" data-brand-kind="${kind}" data-brand-id="${esc(id)}" data-brand-next="1" alt="${esc(title)}" loading="lazy" decoding="async" onerror="CANCHA_BRAND.failed(this)"><span class="initial-mark" style="display:none" aria-hidden="true">${esc(initial)}</span>`;
 }
 function failed(el){failedCount++;const opts=options(el.dataset.brandKind,el.dataset.brandId),n=Number(el.dataset.brandNext)||1;
  if(n<opts.length){el.dataset.brandNext=String(n+1);el.src=opts[n];return}
  el.onerror=null;el.style.display='none';if(el.nextElementSibling?.classList.contains('initial-mark'))el.nextElementSibling.style.display='grid';
 }
 function counts(){const ids=Object.keys(db.teams),local=ids.filter(id=>!!manifest.teams?.[id]?.curatedLocal).length;
  const r=ids.filter(id=>options('team',id).length).length;return {clubs:ids.length,local,remote:r-local,missing:ids.length-r,brokenOnPage:failedCount,competitions:db.leagues.length,competitionsLocal:db.leagues.filter(l=>!!manifest.leagues?.[l.id]?.curatedLocal).length};
 }
 function auditHTML(){const c=counts();return `<div class="source-card"><h3>Escudos integrados · CANCHA V13</h3><p><strong>${c.local} / ${c.clubs} equipos con escudo local</strong> y ${c.competitionsLocal} / ${c.competitions} competiciones con logo local. Las imágenes se incluyen en el ZIP y no se descargan al iniciar. Los equipos pendientes conservan sus enlaces anteriores como respaldo, cuando existen.</p><p>El catálogo procede del ZIP proporcionado por el usuario. Identidad y fuente documentadas; <strong>los derechos para redistribución pública de las marcas no se han verificado</strong>. No se incluyen galerías para elegir manualmente.</p></div>`;}
 window.CANCHA_BRAND={teamHTML:(id,cls='')=>html('team',id,cls),leagueHTML:(id,cls='')=>html('league',id,cls),options,failed,counts,auditHTML};
})();
