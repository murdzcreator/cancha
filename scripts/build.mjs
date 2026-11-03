// Empaquetado reproducible de los módulos vanilla, sin compilador ni paquetes externos.
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const bundles={
 core:['live-policy.js','dates.js','db.js','assets/branding-data.js','branding-client.js','match-ui.js','view-utils.js','icons.js','client/api.js','client/ui.js','live.js'],
 avatars:['assets/club-avatar-themes.js','player-avatars.js'],
 universal:['client/live-connection.js','club-facts.js','club-matches.js','universal.js'],
 home:['home.js'],competition:['competition-ui.js'],insights:['insights.js'],directory:['directory.js'],calendar:['calendar.js'],app:['app.js']
};
const css=['styles.css','v13.css','v15.css','v16.css','player-avatars.css','match-center.css','v18.css','v19.css'];
const combine=async names=>(await Promise.all(names.map(async name=>'/* '+name+' */\n'+await fs.readFile(path.join(root,name),'utf8')))).join('\n');
export async function build({check=false}={}){
 await fs.mkdir(path.join(root,'client/bundles'),{recursive:true});
 const outputs=await Promise.all(Object.entries(bundles).map(async([name,files])=>['client/bundles/'+name+'.js',await combine(files)]));outputs.push(['cancha.css',await combine(css)]);
 for(const [file,text] of outputs){const target=path.join(root,file);if(check){if(await fs.readFile(target,'utf8')!==text)throw Error('Ejecuta npm run build: '+file+' está desactualizado');}else await fs.writeFile(target,text);}
 return {bundles,css};
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url))await build({check:process.argv.includes('--check')});
