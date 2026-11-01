/* CANCHA V13 · ficha universal del partido: datos documentados, no jugadores ficticios. */
(()=>{'use strict';
const D=window.CANCHA_DB, facts=window.CANCHA_CLUB_FACTS||{};
const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const norm=x=>String(x||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]/g,'');
const team=id=>D.teams[id],tn=id=>team(id)?.name||id||'Equipo', league=id=>D.leagues.find(l=>l.id===id);
const icon=id=>team(id)?window.CANCHA_BRAND.teamHTML(id,'v13-crest'):'';
const dateShort=d=>window.CANCHA_DATES.format(d,{long:true});
const state={detail:null,selected:null,token:0,poll:null,tab:'resumen'};
function metricsFor(p){const s=p?.statistics?.[0]||p?.stats||{};let metric=(label,val)=>[label, val===null||val===undefined||val===''?'—':val];return [metric('Minutos',s.games?.minutes),metric('Nota',s.games?.rating),metric('Goles',s.goals?.total),metric('Asistencias',s.goals?.assists),metric('Remates',s.shots?.total),metric('Remates a puerta',s.shots?.on),metric('Precisión de pases (%)',s.passes?.accuracy),metric('Pases totales',s.passes?.total),metric('Regates acertados',s.dribbles?.success),metric('Intercepciones',s.tackles?.interceptions),metric('Entradas',s.tackles?.total),metric('Duelos ganados',s.duels?.won),metric('Tarjetas amarillas',s.cards?.yellow),metric('Tarjetas rojas',s.cards?.red),metric('Atajadas',s.goals?.saves),metric('Faltas cometidas',s.fouls?.committed),metric('Faltas recibidas',s.fouls?.drawn)];}
function clubInfoRows(id,t){const f=facts[id]||{},source=f.source||'',checked=Boolean(f.checked),unknown='Por verificar';let vals=[['Nombre',f.officialName||t.name],['País',t.country||unknown],['Ciudad',f.city||t.city||unknown],['Estadio',f.stadium||t.stadium||unknown],['Entrenador',f.coach||unknown]];
 if(f.founded)vals.push(['Fundación',f.founded]);
 vals.push(['Actualización',checked?'Comprobado · '+f.checked:'Referencia histórica / pendiente de verificación']);
 let html=vals.map(([k,v])=>`<div class="keyrow"><span>${esc(k)}</span><strong>${esc(v)}</strong></div>`).join('');
 if(source)html+=`<div class="v13-source-link"><a href="${esc(source)}" rel="noopener noreferrer" target="_blank">Fuente consultada ↗</a>${f.stadiumSource&&f.stadiumSource!==source?` · <a href="${esc(f.stadiumSource)}" rel="noopener noreferrer" target="_blank">Estadio ↗</a>`:''}</div>`;
 else html+='<div class="v13-provenance">Los datos no contrastados por temporada se señalan como referencia; falta comprobar entrenador y otros campos.</div>';
 html+=`<div class="v13-source-link v13-live-club-profile" data-team="${esc(id)}"></div>`;
 return html;}
function knownMatch(id){const m=D.matches.find(x=>x.id===id);if(!m)return null;
 const base={...m,homeName:tn(m.home),awayName:tn(m.away),date:m.date,status:m.status,scoreSource:'Catálogo documentado · 26/10/2026',events:[],stats:[],lineups:[],playerStats:[],verifiedLineups:false};
 if(id==='ucl-j3-7'){
 const psg=D.lineups.psg,barca=D.lineups.barca;
 base.lineups=[{team:tn(m.home),formation:psg.formation,starting:psg.players.map(x=>({...D.matchPlayers[x.id],x:x.x,y:x.y,playerId:x.id}))},{team:tn(m.away),formation:barca.formation,starting:barca.players.map(x=>({...D.matchPlayers[x.id],x:x.x,y:x.y,playerId:x.id}))}];
 base.events=[['38',m.home,'Désiré Doué'],['55',m.away,'Xavi Espart'],['72',m.home,'Lucas Hernández'],['79',m.away,'Lamine Yamal'],['81',m.home,'Vitinha'],['86',m.home,'Fabián Ruiz']].map(([minute,club,player])=>({minute,type:'Goal',team:tn(club),player,detail:'Gol'}));
 base.lineupWarning='Alineación de referencia del prototipo. La lista y las estadísticas individuales requieren acta o API contrastada.';
 }
 return base;
}
function remoteMatchShell(lid,source,id){return `<div class="v13-loading" id="v13-remote" data-league="${esc(lid)}" data-source="${esc(source)}" data-id="${esc(id)}"><div class="panel"><div class="pad">Consultando la ficha del partido en el proveedor…</div></div></div>`}
function staticMatch(id){let data=knownMatch(id);return data?matchHTML(data):'<section class="panel"><div class="pad">Partido no registrado en esta edición.</div></section>'}
function shortName(name){const s=String(name||'');const parts=s.split(' ');return parts.length>1?parts.slice(-1)[0]:s}
function mapLineup(lu,side){const arr=lu.starting||[];return arr.map((p,i)=>{
 let grid=p.grid||p.raw?.grid, x=p.x,y=p.y;
 if(x==null||y==null){if(grid&&/^\d+:\d+$/.test(grid)){
 const [row,col]=grid.split(':').map(Number);x=side===0?7+Math.min(4,row-1)*9:93-Math.min(4,row-1)*9;
 const same=arr.filter(a=>String(a.grid||'').startsWith(row+':')).length||4;
 y=(col/(same+1))*100;
 }else{
 // Only used to place actual published player names when provider has no coordinates.
 const bands=[[0],[1,2,3,4],[5,6,7],[8,9,10]];let band=bands.findIndex(list=>list.includes(i));if(band<0)band=3;
 const members=bands[band],pos=members.indexOf(i);
 x=side===0?9+band*11:91-band*11;y=(pos+1)/(members.length+1)*100;
 }}
 return {...p,playerId:p.playerId||p.id||String(i),name:p.name||'Jugador',number:p.number??'·',x,y,side};})}
function collectPlayers(data){let l=[data.homeName,data.awayName].map(name=>(data.lineups||[]).find(lu=>norm(lu.team)===norm(name)));let p=[];
 l.slice(0,2).forEach((lu,side)=>mapLineup(lu||{},side).forEach(x=>p.push({...x,side,teamName:lu?.team||[data.homeName,data.awayName][side]})));
 let datasets=(data.playerStats||[]);
 for(let item of p){let candidates=datasets.flatMap((t,side)=>((t.players||[]).map(v=>({v,side,team:t.team}))));const best=candidates.find(({v,side,team})=>norm(team)===norm(item.teamName)&&(v.id&&String(v.id)===String(item.playerId)||norm(v.name)===norm(item.name)));
 if(best){item.statistics=best.v.statistics;item.stats=best.v.stats;}
 }return p;
}
function benchPlayers(data){return [data.homeName,data.awayName].flatMap((name,side)=>(data.lineups||[]).find(l=>norm(l.team)===norm(name))?.substitutes?.map(p=>({...p,side,teamName:name,playerId:p.playerId||p.id}))||[])}
function allPlayers(data){return [...collectPlayers(data),...benchPlayers(data)]}
function benchHTML(data,offset){const players=benchPlayers(data);return players.length?`<section class="panel v17-bench"><div class="panel-title">Suplentes publicados</div><div class="v17-bench-list">${players.map((p,i)=>`<button class="btn btn-outline" data-v13-player="${offset+i}">${esc(p.number??'—')} · ${esc(p.name)} <small>${esc(p.teamName)}${p.subbedIn?' · Ingresó':''}</small></button>`).join('')}</div></section>`:''}
function pitch(data,players){const have=players.length>0, pl=have?players.map((p,i)=>`<button class="v13-player ${p.side?'side-away':'side-home'}" style="left:${Math.min(93,Math.max(7,Number(p.x)))}%;top:${Math.min(93,Math.max(7,Number(p.y)))}%" data-v13-player="${i}" title="${esc(p.name)}" aria-label="Ficha de ${esc(p.name)}"><span class="v13-shirt">${esc(p.number??'')}</span><span class="v13-pname">${esc(shortName(p.name))}</span>${p.statistics?.[0]?.games?.rating?`<span class="v13-grade">${esc(p.statistics[0].games.rating)}</span>`:''}</button>`).join(''): `<div class="v13-no-lineup"><div>${icon(data.home)} <strong>${esc(data.homeName)}</strong></div><p>Alineaciones no publicadas por la fuente para este encuentro.</p><div>${icon(data.away)} <strong>${esc(data.awayName)}</strong></div></div>`;
 return `<div class="v13-pitch-viewport"><div class="v13-pitch"><div class="v13-pitch-lines"><div class="v13-midline"></div><div class="v13-midcircle"></div><div class="v13-boxleft"></div><div class="v13-boxright"></div><div class="v13-center-dot"></div></div>${pl}</div></div><div class="v13-pitch-footer"><span>${esc(data.homeName)} · ${esc(data.lineups?.find(l=>norm(l.team)===norm(data.homeName))?.formation||'—')}</span><span>${esc(data.lineups?.find(l=>norm(l.team)===norm(data.awayName))?.formation||'—')} · ${esc(data.awayName)}</span></div>`;
}
function playerCard(data,players,index){if(index==null||!players[index])return `<div class="v13-side-empty"><span>♙</span><strong>Explora la alineación</strong><p>Selecciona una camiseta para consultar los datos de ese futbolista en el partido.</p></div>`;
 const p=players[index],metrics=metricsFor(p),hasReal=Boolean(p.statistics?.length);
 return `<div class="v13-side-heading">${window.CANCHA_AVATARS.html(p.side===0?data.home:data.away,p,'card')}<div><strong>${esc(p.name)}</strong><small>${esc(p.teamName)} · ${esc(p.position||p.pos||'Posición no indicada')}</small></div></div><div class="v13-metrics">${[['Participación',[0,1]],['Ataque',[2,3,4,5]],['Pases',[6,7]],['Defensa',[8,9,10,11,14]],['Disciplina',[12,13,15,16]]].map(([name,ids])=>{const fields=ids.map(i=>metrics[i]).filter(([,value])=>value!=='—');return fields.length?`<h3>${name}</h3>${fields.map(([k,v])=>`<div><span>${esc(k)}</span><b>${esc(v)}</b></div>`).join('')}`:''}).join('')||'<p class="m16-caption">No hay métricas individuales publicadas.</p>'}</div>${data.provider==='ESPN'?`<a class="btn btn-outline" href="#/perfil/${esc(p.side===0?data.home:data.away)}/${esc(p.playerId||p.id)}">Ver perfil y participaciones →</a>`:''}<p class="v13-side-note">${hasReal?'Datos publicados para este encuentro. Los campos ausentes no se estiman.':'El proveedor no ha aportado estadísticas individuales para este jugador. No se presentan números inventados.'}</p>`;
}
function eventIcon(e){const s=norm(e.type);return s.includes('goal')||s.includes('gol')?'⚽':s.includes('card')?'🟨':s.includes('subst')?'↗':'•'}
function relatedMatchHTML(data){
 const related=data.relatedMatches;if(!related)return '';
 const fixture=(m)=>`<a class="v14-related-match" href="#/evento/${encodeURIComponent(data.league)}/SoccerData/${encodeURIComponent(m.id)}"><span>${esc(dateShort(m.date))}</span><strong>${esc(m.homeName)} <em>${m.hs==null?'–':esc(m.hs)} : ${m.as==null?'–':esc(m.as)}</em> ${esc(m.awayName)}</strong><span>${esc(window.CANCHA_DATES.statusLabel(m))} ↗</span></a>`;
 const panels=[{name:data.homeName,club:related.home},{name:data.awayName,club:related.away}].map(x=>`<div class="v14-related-team"><h3>${esc(x.name)}</h3><h4>Antes de este partido</h4>${x.club.previous.length?x.club.previous.map(fixture).join(''):'<p class="v13-quiet">Sin encuentros anteriores publicados.</p>'}<h4>Después de este partido</h4>${x.club.next.length?x.club.next.map(fixture).join(''):'<p class="v13-quiet">Sin encuentros posteriores publicados.</p>'}</div>`).join('');
 return `<section class="panel v14-related"><div class="panel-title">Calendario de ambos equipos <small>Alrededor de la fecha del encuentro</small></div><div class="v14-related-grid">${panels}</div></section>`;
}
function statisticsHTML(data,limit=null){const rows=limit?(data.stats||[]).slice(0,limit):(data.stats||[]);return rows.length?rows.map(s=>{const a=Number.parseFloat(s.home),b=Number.parseFloat(s.away),bar=Number.isFinite(a)&&Number.isFinite(b)&&a>=0&&b>=0&&a+b>0;return `<div class="v13-statline m16-comparison"><div><strong>${esc(s.home??'—')}</strong><span>${esc(s.name||'Indicador')}</span><strong>${esc(s.away??'—')}</strong></div>${bar?`<div class="m16-comparison-bar" aria-hidden="true"><i style="width:${a/(a+b)*100}%"></i><i style="width:${b/(a+b)*100}%"></i></div>`:''}</div>`}).join(''):'<p class="v13-quiet">La fuente no ha publicado estadísticas verificadas de este encuentro.</p>'}
function eventsHTML(data,limit=null){const rows=limit?(data.events||[]).slice(-limit).reverse():(data.events||[]);return rows.length?rows.map(e=>`<div class="v13-event"><b class="v13-event-minute">${esc(e.minute??'—')}'</b><b>${eventIcon(e)} ${esc(e.player||e.detail||e.type||'Evento')}</b><span>${esc(e.team||'')}${e.detail&&e.player?' · '+esc(e.detail):''}</span></div>`).join(''):'<p class="v13-quiet">No hay cronología publicada para este encuentro.</p>'}
function rosterList(data,players){return `<div class="m16-lineup-list">${[data.homeName,data.awayName].map((name,side)=>`<section class="panel"><div class="panel-title"><span>${esc(name)}</span><small>${esc(data.lineups?.find(l=>norm(l.team)===norm(name))?.formation||'Formación no publicada')}</small></div>${players.filter(p=>p.side===side).map(p=>`<button type="button" data-v13-player="${players.indexOf(p)}"><span>${esc(p.number??'—')}</span><strong>${esc(p.name)}</strong><span aria-hidden="true">›</span></button>`).join('')||'<p class="v13-quiet">Sin titulares publicados.</p>'}</section>`).join('')}</div>`}
function matchHTML(data){const players=collectPlayers(data),has=players.length>0;
 if(state.detail?.id!==data.id||state.detail?.league!==data.league)state.tab='resumen';state.detail=data;const name=league(data.league)?.name||data.leagueName||'Partido',score=data.hs!=null&&data.as!=null?data.hs+' – '+data.as:'– : –',asof=data.updatedAt?dateShort(data.updatedAt):'Referencia fechada del catálogo';
 const tabs=[['resumen','Resumen','m16-match-summary'],['alineaciones','Alineaciones','v13-lineups'],['estadisticas','Estadísticas','v13-stats'],['historial','Historial','v13-events'],['informacion','Información','v13-match-facts']];
 const active=state.tab||'resumen',panel=(tab,id,html)=>`<div id="${id}" class="m16-match-panel" role="tabpanel" aria-labelledby="m16-tab-${tab}" ${active!==tab?'hidden':''}>${html}</div>`;
 return `<div class="eyebrow">${esc(name)} · CENTRO DEL PARTIDO</div><h1 class="v13-sr-only">${esc(data.homeName)} contra ${esc(data.awayName)}</h1><div class="v13-match-header"><a class="v13-score-team" href="#/equipo/${esc(data.home)}">${icon(data.home)}<strong>${esc(data.homeName)}</strong></a><div class="v13-main-score"><b>${esc(score)}</b><span>${esc(window.CANCHA_DATES.statusLabel(data))}</span><small>${esc(dateShort(data.date))}</small></div><a class="v13-score-team" href="#/equipo/${esc(data.away)}">${icon(data.away)}<strong>${esc(data.awayName)}</strong></a></div>
 <details class="v13-info-strip m16-provenance"><summary>${esc(data.source||data.scoreSource||'Catálogo')} · ${esc(asof)}</summary><p>${esc(data.note||'Datos de la fuente indicada para este encuentro.')}${data.lineupWarning?' '+esc(data.lineupWarning):''}</p></details><div class="m16-refresh-warning" role="status">${data.stale||data.cache?.state==='stale'?'No se pudo actualizar. Se conserva la última copia con su fecha.':''}</div>
 <div class="v13-match-tabs" role="tablist" aria-label="Información del partido">${tabs.map(([tab,label,id])=>`<button type="button" role="tab" id="m16-tab-${tab}" data-match-tab="${tab}" data-v14-jump="${id}" aria-controls="${id}" aria-selected="${active===tab}" tabindex="${active===tab?0:-1}">${label}${tab==='alineaciones'&&has?` <small>${players.length}</small>`:''}</button>`).join('')}</div>
 ${panel('resumen','m16-match-summary',`<div class="m16-match-overview"><section class="panel"><div class="panel-title">El partido en cifras <button class="m16-text-button" data-match-tab="estadisticas">Ver todas →</button></div>${statisticsHTML(data,5)}</section><section class="panel"><div class="panel-title">Últimos momentos <button class="m16-text-button" data-match-tab="historial">Ver cronología →</button></div>${eventsHTML(data,4)}</section></div>`)}
 ${panel('alineaciones','v13-lineups',`<h2 class="v13-section-h">Alineaciones <small>${has?players.length+' titulares publicados':'Sin once inicial disponible'}</small></h2>${data.lineupWarning?`<p class="m16-warning">${esc(data.lineupWarning)}</p>`:''}<p class="m16-caption">Selecciona un jugador para consultar sus datos del partido. La distribución de la cancha es esquemática.</p><div class="v13-match-grid"><div class="v13-pitch-wrap">${pitch(data,players)}</div><aside class="v13-player-panel" id="v13-side-panel">${playerCard(data,players,null)}</aside></div>${rosterList(data,players)}${benchHTML(data,players.length)}`)}
 ${panel('estadisticas','v13-stats',`<section class="panel"><div class="panel-title">Estadísticas del encuentro <small>${esc(data.homeName)} / ${esc(data.awayName)}</small></div>${statisticsHTML(data)}</section>`)}
 ${panel('historial','v13-events',`<section class="panel"><div class="panel-title">Cronología <small>${(data.events||[]).length} eventos publicados</small></div>${eventsHTML(data)}</section>${relatedMatchHTML(data)}${data.league?`<section class="panel" data-v18-match-history data-league="${esc(data.league)}" data-home="${esc(data.home)}" data-away="${esc(data.away)}" data-id="${esc(data.id)}" data-date="${esc(data.date)}"></section>`:''}`)}
 ${panel('informacion','v13-match-facts',`<section class="panel"><div class="panel-title">Información del partido</div><div class="v13-info-grid">${[['Competición',name],['Fecha',dateShort(data.date)],['Estado',window.CANCHA_DATES.statusLabel(data)],['Estadio',data.stadium||'Sin dato contrastado'],['Fuente',data.source||data.scoreSource||'Catálogo histórico'],['Alineaciones',has?'Disponibles / parciales':'No publicadas']].map(([k,v])=>`<div class="keyrow"><span>${esc(k)}</span><strong>${esc(v)}</strong></div>`).join('')}</div></section>`)}
 `;
}
function activateTab(tab,focus=false){const button=document.querySelector(`[role="tab"][data-match-tab="${tab}"]`);if(!button)return;state.tab=tab;document.querySelectorAll('.v13-match-tabs [role="tab"]').forEach(b=>{const selected=b===button;b.setAttribute('aria-selected',String(selected));b.tabIndex=selected?0:-1;const p=document.getElementById(b.getAttribute('aria-controls'));if(p)p.hidden=!selected});if(focus)button.focus()}
let sheet=null,sheetTrigger=null;
function playerSheet(data,players,index){if(!sheet){sheet=document.createElement('dialog');sheet.className='m16-player-sheet';sheet.setAttribute('aria-labelledby','m16-sheet-title');sheet.innerHTML='<div class="m16-sheet-heading"><h2 id="m16-sheet-title">Ficha del jugador</h2><button type="button" data-close-player-sheet aria-label="Cerrar ficha" autofocus>×</button></div><div class="m16-sheet-body"></div>';document.body.append(sheet);sheet.addEventListener('close',()=>{if(sheetTrigger?.isConnected)sheetTrigger.focus()});sheet.addEventListener('click',e=>{if(e.target===sheet){const r=sheet.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)sheet.close()}})}sheet.querySelector('.m16-sheet-body').innerHTML=playerCard(data,players,index);if(!sheet.open){sheetTrigger=document.activeElement;sheet.showModal()}}

async function hydrateRemote(lid,source,id){const box=document.getElementById('v13-remote')||document.getElementById('v13-match-content');if(!box)return;const token=state.token;
 try{const r=await fetch(`/api/match-detail?league=${encodeURIComponent(lid)}&source=${encodeURIComponent(source)}&id=${encodeURIComponent(id)}`,{signal:AbortSignal.timeout(15000)});const d=await r.json();if(!r.ok)throw Error(d.detail||d.error||'No disponible');if(token!==state.token||!document.contains(box))return;const selected=state.selected;d.league=lid;d.source=d.source||source;box.outerHTML=`<div id="v13-match-content">${matchHTML(d)}</div>`;
 window.CANCHA_INSIGHTS?.afterDraw('evento');
 if(selected){const players=allPlayers(d),index=players.findIndex(p=>String(p.playerId)===String(selected));if(index>=0){state.selected=selected;document.getElementById('v13-side-panel').innerHTML=playerCard(d,players,index);if(sheet?.open)sheet.querySelector('.m16-sheet-body').innerHTML=playerCard(d,players,index);}}
 }
 catch(e){if(token!==state.token||!document.contains(box))return;if(box.id==='v13-match-content'){const warning=box.querySelector('.m16-refresh-warning');if(warning)warning.textContent='No se pudo actualizar. Se conserva la última respuesta con su fecha.';return}box.innerHTML=`<section class="panel"><div class="pad">No se pudieron obtener detalles del partido: ${esc(e.message)}.</div></section>`;}
}
async function loadClub(id){const boxes=[...document.querySelectorAll('.v13-live-club-profile')].filter(el=>el.dataset.team===id);if(!boxes.length||location.protocol==='file:')return;
 try{const r=await fetch('/api/club-profile?team='+encodeURIComponent(id));if(!r.ok)return;const info=await r.json();if(!boxes.some(box=>document.contains(box)))return;
 const facts=factsGlobal(id);const data={};for(const k of ['city','stadium','coach','founded','website'])if(info[k]&&!facts[k])data[k]=info[k];
 if(Object.keys(data).length){const names={city:'Ciudad',stadium:'Estadio',coach:'Entrenador',founded:'Fundación',website:'Sitio web'};
 const view=`<div class="v13-enrichment-note">Información complementaria: ${esc(info.source||'fuente externa')} · ${esc(dateShort(info.updatedAt||''))}</div>`+Object.entries(data).map(([k,v])=>`<div class="keyrow"><span>${names[k]}</span><strong>${esc(v)}</strong></div>`).join(''); boxes.forEach(box=>{if(document.contains(box))box.innerHTML=view});}
 }catch{ /* el usuario conserva los hechos documentados */ }
}
function factsGlobal(id){return facts[id]||{}}
async function loadTeamFixtures(id){
 const box=document.getElementById('v13-team-schedule'),results=document.getElementById('v15-team-results');
 if(!box||location.protocol==='file:')return;
 const loaded=await Promise.allSettled((team(id)?.leagues||[]).map(async l=>{
  const r=await fetch('/api/fixtures?league='+encodeURIComponent(l));if(!r.ok)throw Error('Sin calendario');
  const data=await r.json();return {...data,league:l};
 }));
 if(!document.contains(box))return;
 const datasets=loaded.filter(x=>x.status==='fulfilled').map(x=>x.value);
 const matches=datasets.flatMap(d=>(d.events||[]).filter(m=>m.home===id||m.away===id).map(m=>({...m,league:d.league,source:d.source})));
 const {next,previous}=window.CANCHA_DATES.nearby(matches,16);
 const nextCount=document.getElementById('v17-team-next-count'),resultCount=document.getElementById('v17-team-results-count');
 if(nextCount)nextCount.textContent=next.length+' mostrados · '+matches.filter(m=>window.CANCHA_DATES.upcoming(m)).length+' publicados';
 if(resultCount)resultCount.textContent=previous.length+' mostrados · '+matches.filter(m=>m.status==='FINAL').length+' publicados';
 const rows=arr=>arr.map(m=>`<a class="v13-provider-row" href="#/evento/${encodeURIComponent(m.league)}/${encodeURIComponent(m.provider)}/${encodeURIComponent(m.id)}"><span>${esc(dateShort(m.date))}</span><strong>${esc(m.homeName)} ${esc(m.hs??'–')} : ${esc(m.as??'–')} ${esc(m.awayName)}</strong><span>${esc(window.CANCHA_DATES.statusLabel(m))} · ${esc(league(m.league)?.name)} ↗</span></a>`).join('');
 const note=`<div class="v13-provenance">${datasets.map(d=>esc(d.source)+' · '+esc(dateShort(d.updatedAt))).join('<br>')}${loaded.some(x=>x.status==='rejected')?'<br>Cobertura parcial: alguna competición no respondió.':''}</div>`;
 if(datasets.length){box.innerHTML=note+(next.length?rows(next):'<p class="v13-quiet">Sin próximos partidos con fecha vigente en las fuentes disponibles.</p>');
 if(results)results.innerHTML=previous.length?rows(previous):'<p class="v13-quiet">Sin resultados en las fuentes disponibles.</p>';
 }else box.insertAdjacentHTML('afterbegin','<p class="v13-quiet">No se pudo actualizar el calendario. Se conserva el catálogo fechado.</p>');
}

function afterDraw(route,id,params){state.selected=null;state.tab='resumen';state.token++;if(sheet?.open)sheet.close();if(state.poll){clearInterval(state.poll);state.poll=null}
 if(route==='evento'){hydrateRemote(id,params[0],params[1]);if(params[0]==='ESPN')state.poll=setInterval(()=>{if(document.visibilityState!=='hidden')hydrateRemote(id,params[0],params[1]);},45000);}
 if(route==='equipo'){loadClub(id);if(document.getElementById('v13-team-schedule'))loadTeamFixtures(id)};
}
document.addEventListener('click',e=>{
 if(e.target.closest('[data-close-player-sheet]')){sheet?.close();return}const tab=e.target.closest('[data-match-tab]');if(tab){activateTab(tab.dataset.matchTab);return}
 const b=e.target.closest('[data-v13-player]');if(!b)return;const data=state.detail,players=data?allPlayers(data):[];let n=Number(b.dataset.v13Player);if(!Number.isInteger(n)||!players[n])return;state.selected=players[n].playerId;
 document.querySelectorAll('.v13-player').forEach(q=>q.classList.toggle('selected',q===b));const panel=document.getElementById('v13-side-panel');if(panel)panel.innerHTML=playerCard(data,players,n);if(window.matchMedia('(max-width:760px)').matches)playerSheet(data,players,n);
});
document.addEventListener('keydown',e=>{const tab=e.target.closest?.('.v13-match-tabs [role="tab"]');if(!tab||!['ArrowLeft','ArrowRight','Home','End'].includes(e.key))return;const all=[...document.querySelectorAll('.v13-match-tabs [role="tab"]')],index=all.indexOf(tab),next=e.key==='Home'?0:e.key==='End'?all.length-1:(index+(e.key==='ArrowRight'?1:-1)+all.length)%all.length;e.preventDefault();activateTab(all[next].dataset.matchTab,true)});
window.CANCHA_UNIVERSAL={clubInfoRows,staticMatch,remoteMatchShell,afterDraw,matchHTML,knownMatch};
})();
