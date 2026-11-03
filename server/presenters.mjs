const playerFields=['id','name','team','played','starts','goals','assists','minutes','yellow','red','shots','saves','known'];
const pickPlayer=p=>Object.fromEntries(playerFields.map(k=>[k,p[k]]));
export function analyticsView(data,{view='full',team='',player=''}={}){
 if(view==='full')return data;
 const base={league:data.league,season:data.season,source:data.source,scope:data.scope,coverage:data.coverage,teamCoverage:team?{[team]:data.teamCoverage[team]}:{},rows:[],players:[]};
 if(view==='team')base.rows=data.rows.filter(r=>r.team===team);
 else if(view==='player')base.players=data.players.filter(p=>p.team===team&&String(p.id)===String(player)).map(p=>({...pickPlayer(p),matches:p.matches}));
 else {base.rows=data.rows.map(r=>({team:r.team,total:r.total}));base.players=data.players.map(pickPlayer);}
 return base;
}
export function miniAnalytics(data){
 const players=new Map();for(const metric of ['goals','assists','yellow','red'])for(const p of data.players.filter(p=>p[metric]>0).sort((a,b)=>b[metric]-a[metric]||a.name.localeCompare(b.name)).slice(0,5))players.set(p.team+':'+p.id,pickPlayer(p));
 return {coverage:data.coverage,players:[...players.values()],source:data.source,scope:data.scope};
}
