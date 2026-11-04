import test from 'node:test';
import assert from 'node:assert/strict';
import {normalizeMatchEvents} from '../server/match-events.mjs';
const context={teams:[{id:'villarreal',sourceId:'102',name:'Villarreal',names:['Villarreal']},{id:'paris-saint-germain',sourceId:'160',name:'Paris Saint-Germain',names:['Paris Saint-Germain']}],match:{hs:0,as:6}};
const goal=(extra={})=>({id:'1',type:{type:'goal'},scoringPlay:true,clock:{displayValue:"78'"},team:{id:'160'},participants:[{athlete:{displayName:'João Neves'}},{athlete:{displayName:'David Boly'}}],shortText:'David Boly Goal',text:'Goal! Villarreal 0, Paris Saint Germain 6. David Boly (Paris Saint Germain) right footed shot. Assisted by João Neves.',...extra});
test('un gol distingue autor y asistencia por el contenido publicado, sin depender del orden de participantes',()=>{
 const [e]=normalizeMatchEvents([goal()],context);assert.equal(e.scorer,'David Boly');assert.equal(e.assist,'João Neves');assert.equal(e.player,'David Boly');assert.equal(e.teamId,'paris-saint-germain');assert.deepEqual(e.scoreAfter,{home:0,away:6});assert.equal(e.minute,'78');
});
test('sin funciones o texto inequívoco no asigna goleador/asistente ni inventa el marcador',()=>{
 const [e]=normalizeMatchEvents([goal({shortText:'Gol',text:'Sin descripción adicional'})],context);assert.equal(e.scorer,null);assert.equal(e.assist,null);assert.equal(e.scoreAfter,null);assert.deepEqual(e.participants,['João Neves','David Boly']);
});
test('un goleador publicado sin asistencia no atribuye una por estar otro participante en la lista',()=>{
 const [e]=normalizeMatchEvents([goal({text:'Goal! Villarreal 0, Paris Saint Germain 6. David Boly (Paris Saint Germain) scores.'})],context);assert.equal(e.scorer,'David Boly');assert.equal(e.assist,null);
});
test('los papeles explícitos de la fuente identifican goleador y asistente aunque no haya comentario',()=>{
 const [e]=normalizeMatchEvents([goal({shortText:'',text:'',participants:[{role:'assist',athlete:{displayName:'Asistente'}},{type:'scorer',athlete:{displayName:'Goleador'}}],homeScore:0,awayScore:1})],context);assert.equal(e.scorer,'Goleador');assert.equal(e.assist,'Asistente');assert.deepEqual(e.scoreAfter,{home:0,away:1});
});
test('no acepta un marcador con rivales distintos, superior al publicado o incompleto',()=>{
 for(const extra of [{text:'Goal! Otro equipo 0, Paris Saint Germain 6.'},{text:'Goal! Villarreal 0, Paris Saint Germain 8.'},{text:'Gol sin cifras',homeScore:0}])assert.equal(normalizeMatchEvents([goal(extra)],context)[0].scoreAfter,null);
});
test('los penales de tanda no se presentan como marcador del partido y los autogoles se identifican',()=>{
 const [pen]=normalizeMatchEvents([goal({type:{type:'penalty---scored'},shootout:true,homeScore:0,awayScore:6})],context);assert.equal(pen.detail,'Penal de tanda');assert.equal(pen.scoreAfter,null);const [own]=normalizeMatchEvents([goal({type:{type:'own-goal'}})],context);assert.equal(own.detail,'Autogol');assert.equal(own.ownGoal,true);
});
test('tarjetas y sustituciones conservan su información y un equipo ajeno no recibe el escudo de un rival',()=>{
 const rows=normalizeMatchEvents([{id:'2',type:{type:'red-card'},clock:{displayValue:"45'+2'"},team:{id:'102'},participants:[{athlete:{displayName:'Jugador'}}]},goal({team:{id:'999'}})],context);assert.equal(rows[0].detail,'Roja');assert.equal(rows[0].teamId,'villarreal');assert.equal(rows[0].player,'Jugador');assert.equal(rows[1].teamId,null);
});
