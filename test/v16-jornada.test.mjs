import test from 'node:test';
import assert from 'node:assert/strict';
import '../dates.js';
import '../match-ui.js';

const M=globalThis.CANCHA_MATCHES;
const now=new Date('2026-10-31T16:00:00Z');
const event=(id,date,status='PROGRAMADO',extra={})=>({id,home:'a',away:'b',homeName:'Local',awayName:'Visitante',date,status,...extra});

test('jornada: agrupa instantes por Perú, conserva fechas sin hora y rechaza fechas inválidas',()=>{
 assert.equal(M.dayKey('2026-11-01T04:59:00Z'),'2026-10-31');
 assert.equal(M.dayKey('2026-11-01T05:00:00Z'),'2026-11-01');
 assert.equal(M.dayKey('2026-10-31'),'2026-10-31');
 assert.equal(M.dayKey('2026-02-30'),null);
 const events=[event(1,'2026-10-31'),event(2,'2026-11-01T04:59:00Z'),event(3,'2026-11-01T05:00:00Z'),event(4,'2026-10-30'),event(5,'2026-02-30'),event(6,'2026-10-31','FINAL',{away:'a'})];
 assert.deepEqual(M.onDay(events,'2026-10-31').map(x=>x.id),[1,2]);
});

test('destacado: directo vigente, próximo o último final; nunca un programado vencido',()=>{
 const expired=event('vencido','2026-10-31T15:00:00Z');
 const next=event('proximo','2026-10-31T17:00:00Z');
 const live=event('vivo','2026-10-31T16:00:00Z','EN VIVO');
 const final=event('final','2026-10-31T14:00:00Z','FINAL');
 assert.equal(M.featured([expired,final,next,live],now).id,'vivo');
 assert.equal(M.featured([expired,final,next],now).id,'proximo');
 assert.equal(M.featured([expired,final,event('anterior','2026-10-31T12:00:00Z','FINAL')],now).id,'final');
 assert.equal(M.featured([expired],now),null);
 assert.equal(M.featured([],now),null);
});

test('filtros y estados: un directo guardado no se anuncia como en vivo ni un horario vencido como próximo',()=>{
 const stale=event(1,'2026-10-31T16:00:00Z','EN VIVO',{stale:true});
 assert.equal(M.accepts(stale,'vivo',now),false);
 assert.equal(M.status(stale,now),'Sin actualizar');
 assert.equal(M.featured([stale],now),null);
 assert.equal(M.accepts(event(2,'2026-10-31T15:00:00Z'),'proximos',now),false);
 assert.equal(M.accepts(event(3,'2026-10-31'),'proximos',now),true);
 assert.equal(M.accepts(event(4,'2026-10-31','FINAL'),'resultados',now),true);
 assert.equal(M.clock('2026-10-31'),'Por confirmar');
 assert.equal(M.clock('2026-11-01T02:30:00Z'),'21:30');
});

test('filas compartidas: escapan nombres, preservan el cero y no rompen ante fecha ausente',()=>{
 const row=M.row(event('id/<','2026-10-31','FINAL',{provider:'ESPN',homeName:'<img onerror="x">',hs:0,as:2}),'per');
 assert.ok(!row.includes('<img'));
 assert.match(row,/&lt;img/);
 assert.match(row,/class="m16-home-score">0</);
 assert.match(row,/#\/evento\/per\/ESPN\/id%2F%3C/);
 assert.match(M.row(event(1,null),'per'),/Por confirmar/);
});
