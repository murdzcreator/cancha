import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const raw=fs.readFileSync(new URL('../db.js',import.meta.url),'utf8');
const db=JSON.parse(raw.slice(raw.indexOf('=')+1).trim().replace(/;$/,''));
const context=vm.createContext({CANCHA_DB:db,CANCHA_BRAND:{teamHTML:id=>`<img src="assets/escudos/${id}.webp" alt="Escudo">`}});
for(const f of ['assets/club-avatar-themes.js','player-avatars.js'])vm.runInContext(fs.readFileSync(new URL('../'+f,import.meta.url),'utf8'),context);
const A=context.CANCHA_AVATARS;
test('todos los clubes tienen identidad local y el avatar no depende de fotografías externas',()=>{
 assert.deepEqual(Object.keys(context.CANCHA_AVATAR_THEMES).sort(),Object.keys(db.teams).sort());
 for(const id of Object.keys(db.teams)){
  const html=A.html(id,{name:'Futbolista',number:9,photo:'https://photo.example/athlete.png'});
  assert.match(html,new RegExp('data-avatar-team="'+id+'"'));
  assert.match(html,/assets\/escudos\//);assert.ok(!html.includes('photo.example'));
  for(const color of Object.values(A.theme(id)).slice(0,3))assert.match(color,/^#[\da-f]{6}$/i);
 }
});
test('la identidad cambia por club; el dorsal cero se conserva y las formas SVG tienen IDs únicos',()=>{
 const alianza=A.html('alianza-lima',{name:'Juan Pérez',number:0}),psg=A.html('paris-saint-germain',{name:'Juan Pérez',number:0});
 assert.match(alianza,/data-avatar-pattern="stripes"/);assert.match(psg,/data-avatar-pattern="band"/);
 assert.notEqual(A.theme('alianza-lima').primary,A.theme('paris-saint-germain').primary);
 assert.match(alianza,/>0<\/text>/);
 assert.notEqual(alianza.match(/clipPath id="([^"]+)/)[1],psg.match(/clipPath id="([^"]+)/)[1]);
});
test('sin dorsal o sin club conocido, las iniciales mantienen el avatar identificable y legible',()=>{
 assert.equal(A.initials('  José María Núñez  '),'JN');
 assert.match(A.html('club-inexistente',{name:'José Núñez',number:null}),/>JN<\/text>/);
 assert.ok(!A.html('club-inexistente',{}).includes('<img'));
 assert.match(A.html('real-madrid',{name:'Nombre',number:100}),/>100<\/text>/);
});
test('los campos del proveedor no pueden inyectar HTML, colores ni nombres de clase',()=>{
 const html=A.html('paris-saint-germain',{name:'<script>',number:'<img src=x>'},'" onmouseover="alert(1)');
 assert.ok(!html.includes('<script>'));assert.ok(!html.includes('<img src=x>'));assert.ok(!html.includes('onmouseover'));
 context.CANCHA_AVATAR_THEMES.test=['red; background:url(x)','#fff','" onload="x','<script>'];
 for(const color of Object.values(A.theme('test')).slice(0,3))assert.match(color,/^#[\da-f]{6}$/i);
});
