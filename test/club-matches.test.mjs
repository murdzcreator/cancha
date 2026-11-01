import test from 'node:test';
import assert from 'node:assert/strict';
import '../dates.js';
import '../match-ui.js';
import '../club-matches.js';
const C=globalThis.CANCHA_CLUB_MATCHES,now=new Date('2026-11-01T12:00:00Z');
const event=(id,extra={})=>({id,home:'a',away:'b',homeName:'Local',awayName:'Visitante',league:'fra',provider:'ESPN',date:'2026-11-03T20:00:00Z',status:'PROGRAMADO',hs:null,as:null,...extra});
test('club: próximos vigentes y resultados ordenados, sin duplicar ni mezclar competiciones',()=>{
 const a=event('1'),result=event('2',{date:'2026-10-30T20:00:00Z',status:'FINAL',hs:1,as:5});
 const rows=[a,a,result,event('3',{date:'2026-10-29T20:00:00Z'}),event('4',{home:'c',away:'d'}),event('5',{date:'2026-02-30'}),event('1',{league:'ucl'})];
 const all=C.partition(rows,'a','todos',now);assert.deepEqual(all.next.map(m=>m.league),['fra','ucl']);assert.equal(all.results.length,1);
 assert.equal(C.partition(rows,'a','fra',now).next.length,1);
 assert.deepEqual(C.partition([result,event('6',{...result,id:'6',date:'2026-10-31T20:00:00Z'})],'a','todos',now).results.map(m=>m.id),['6','2']);
});
test('club: un directo vigente precede a los próximos; un directo sin actualizar no se presenta como vivo',()=>{
 const live=event('2',{status:'EN VIVO',date:'2026-11-01T11:30:00Z'}),stale=event('3',{...live,id:'3',stale:true});
 assert.deepEqual(C.partition([event('1'),live,stale],'a','todos',now).next.map(m=>m.id),['2','1']);
});
test('páginas independientes: todos los próximos son accesibles y el índice se ajusta al filtrar',()=>{
 const items=Array.from({length:30},(_,i)=>i),seen=[];for(let i=0;i<4;i++)seen.push(...C.paginate(items,i,8).items);
 assert.deepEqual(seen,items);assert.equal(C.paginate(items,0,5).items.length,5);
 const reduced=C.paginate([1,2],3,8);assert.equal(reduced.page,0);assert.equal(reduced.start,1);assert.equal(reduced.end,2);
 const empty=C.paginate([],0,5);assert.equal(empty.start,0);assert.equal(empty.end,0);assert.equal(C.navigation(empty,'next'),'');
});
test('resultado: victoria/derrota se interpreta desde el club elegido y no se deduce un marcador ausente',()=>{
 const m=event('1',{status:'FINAL',hs:1,as:5});assert.equal(C.outcome(m,'a').label,'Perdió');assert.equal(C.outcome(m,'b').label,'Ganó');
 assert.equal(C.outcome({...m,hs:0,as:0},'b').label,'Empate');assert.equal(C.outcome({...m,as:null},'b'),null);
});
test('filas: hora de Perú para próximos, fecha civil sin hora y enlaces de partido con texto escapado',()=>{
 const html=C.row(event('1',{homeName:'<img onerror=x>'}),'a');assert.ok(!html.includes('<img onerror'));assert.match(html,/&lt;img/);assert.match(html,/>15:00<\/b>/);assert.ok(!html.includes('– : –'));
 assert.match(C.row(event('2',{date:'2026-11-03'}),'a'),/is-tbd/);assert.match(C.row(event('2',{date:'2026-11-03'}),'a'),/Por confirmar/);
 assert.match(C.row(event('3',{status:'FINAL',hs:0,as:0}),'a'),/>0 – 0<\/b>/);
 assert.match(C.row(event('id/<>'),'a'),/#\/evento\/fra\/ESPN\/id%2F%3C%3E/);
 assert.match(C.briefDate('2026-11-04T03:00:00Z'),/3/);
});
