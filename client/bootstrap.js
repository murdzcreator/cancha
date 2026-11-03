import './bundles/core.js';
const loaded=new Map();
function load(name){if(!loaded.has(name)){const task=import('./bundles/'+name+'.js').catch(error=>{loaded.delete(name);throw error});loaded.set(name,task);}return loaded.get(name);}
const pages={
 inicio:['home'],liga:['competition','insights'],equipos:['directory'],
 jugadores:['avatars','directory'],jugador:['avatars'],perfil:['avatars','insights'],
 equipo:['avatars','universal','insights'],partidos:['calendar'],
 partido:['avatars','universal','insights'],encuentro:['avatars','universal','insights'],
 evento:['avatars','universal','insights'],buscar:['avatars','insights']
};
globalThis.CANCHA_LOAD_PAGE=async route=>{for(const name of pages[route]||[])await load(name)};
await import('./bundles/app.js');
