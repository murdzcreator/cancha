// Juegos de la primera jornada directamente de las fuentes abiertas (CC0). Incluidos para que
// CANCHA abra con resultados documentados sin conexión; NO son clasificaciones actuales.
import fs from 'node:fs';import path from 'node:path';import {fileURLToPath} from 'node:url';
import {convertOpenFootball} from '../server/openfootball.mjs';
const root=path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const src=fs.readFileSync(path.join(root,'db.js'),'utf8');const db=JSON.parse(src.slice(src.indexOf('=')+1).trim().replace(/;\s*$/,''));
// fecha | equipo local | equipo visitante | GF | GC | hora local
const rounds={
 eng:[
 ['2026-08-21','Arsenal FC','Coventry City FC',3,0,'20:00'],
 ['2026-08-22','Hull City AFC','Manchester United FC',2,0,'12:30'],
 ['2026-08-22','Ipswich Town FC','Sunderland AFC',2,1,'15:00'],
 ['2026-08-22','Nottingham Forest FC','Leeds United FC',0,1,'15:00'],
 ['2026-08-22','Everton FC','Crystal Palace FC',2,0,'15:00'],
 ['2026-08-22','Brentford FC','Tottenham Hotspur FC',3,0,'17:30'],
 ['2026-08-23','Manchester City FC','AFC Bournemouth',2,1,'14:00'],
 ['2026-08-23','Brighton & Hove Albion FC','Aston Villa FC',4,0,'14:00'],
 ['2026-08-23','Newcastle United FC','Liverpool FC',2,2,'16:30'],
 ['2026-08-24','Fulham FC','Chelsea FC',2,3,'20:00']],
 esp:[
 ['2026-08-15','Deportivo Alavés','Getafe CF',3,0,'19:30'],
 ['2026-08-15','Sevilla FC','Rayo Vallecano de Madrid',2,1,'21:30'],
 ['2026-08-16','Real Racing Club de Santander','Villarreal CF',2,2,'17:00'],
 ['2026-08-16','RCD Espanyol de Barcelona','Levante UD',3,0,'19:00'],
 ['2026-08-17','RC Deportivo La Coruña','Elche CF',1,1,'21:00'],
 ['2026-08-19','Club Atlético de Madrid','Málaga CF',2,0,'21:00'],
 ['2026-08-25','Valencia CF','Real Betis Balompié',0,1,'21:00'],
 ['2026-08-26','Real Madrid CF','Real Sociedad de Fútbol',4,1,'21:00'],
 ['2026-08-27','RC Celta de Vigo','CA Osasuna',1,2,'20:30'],
 ['2026-08-27','FC Barcelona','Athletic Club',2,0,'21:00']]
};
for(const [league,rows] of Object.entries(rounds)){
 const matches=rows.map(([date,team1,team2,h,a,time])=>({round:'Matchday 1',date,time,team1,team2,score:{ft:[h,a]}}));
 const res=convertOpenFootball({matches},league,db,{retrievedAt:'2026-10-27T00:00:00.000Z',seed:true});
 for(const [type,data] of Object.entries(res))fs.writeFileSync(path.join(root,'data-imports','soccerdata',`${league}-${type}.json`),JSON.stringify(data));
 console.log(league,res.fixtures.records.length,'primeras jornadas guardadas sin inventar datos');
}
