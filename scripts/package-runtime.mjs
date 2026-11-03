// Edición de uso: lista explícita de archivos; nunca incluye cachés ni credenciales.
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {build} from './build.mjs';
const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
export async function packageRuntime({out=null}={}){
 await build();
 const base=path.join(ROOT,'output');await fs.mkdir(base,{recursive:true});
 const directory=out?path.resolve(out):await fs.mkdtemp(path.join(base,'CANCHA_LIGERA-'));
 if(directory===ROOT||!path.relative(directory,ROOT).startsWith('..'))throw Error('La salida no puede contener el proyecto de origen');
 await fs.mkdir(directory,{recursive:true});if((await fs.readdir(directory)).length)throw Error('Elige una carpeta de salida vacía; no se sobrescriben datos personales');
 const files=['index.html','cancha.css','server.mjs','db.js','dates.js','INICIAR_CANCHA_WINDOWS.bat','.env.example','PUBLICAR_WEB.md'];
 const copy=async(relative,target=relative)=>{const dest=path.join(directory,target);await fs.mkdir(path.dirname(dest),{recursive:true});await fs.copyFile(path.join(ROOT,relative),dest)};
 for(const file of files)await copy(file);
 await copy('client/bootstrap.js');
 for(const file of await fs.readdir(path.join(ROOT,'client/bundles')))if(file.endsWith('.js'))await copy('client/bundles/'+file);
 for(const file of await fs.readdir(path.join(ROOT,'server')))if(/\.(mjs|json)$/.test(file))await copy('server/'+file);
 await copy('assets/branding-manifest.json');await copy('assets/cancha-mark.svg');
 for(const folder of ['escudos','competiciones'])for(const file of await fs.readdir(path.join(ROOT,'assets',folder)))if(/\.(webp|svg|png)$/.test(file))await copy('assets/'+folder+'/'+file);
 // Solo las cuatro tablas y calendarios públicos previstos; no se copian otros archivos importados.
 for(const lid of ['eng','esp'])for(const kind of ['fixtures','standings']){
  const relative='data-imports/soccerdata/'+lid+'-'+kind+'.json';const d=JSON.parse(await fs.readFile(path.join(ROOT,relative),'utf8'));
  if(d.provider!=='OpenFootball (CC0)'||d.league!==lid||d.kind!==kind)throw Error('La importación '+relative+' no corresponde al calendario público esperado');await copy(relative);
 }
 await copy('deploy/runtime.Dockerfile','Dockerfile');await copy('deploy/runtime.dockerignore','.dockerignore');
 await copy('render.yaml');
 const pkg=JSON.parse(await fs.readFile(path.join(ROOT,'package.json'),'utf8'));
 await fs.writeFile(path.join(directory,'package.json'),JSON.stringify({name:'cancha',version:pkg.version,private:true,type:'module',description:'CANCHA · edición ligera para uso y alojamiento',scripts:{start:'node server.mjs'},engines:pkg.engines},null,2)+'\n');
 await fs.writeFile(path.join(directory,'LEEME.txt'),`CANCHA V${pkg.version.replace(/\.0$/,'')} · EDICION LIGERA\n\nExtrae todo el ZIP en una carpeta nueva.\nWindows: instala Node.js 20+ y abre INICIAR_CANCHA_WINDOWS.bat.\nMac/Linux: npm start. No hay paquetes npm que instalar.\nAbre http://127.0.0.1:4173/ y mantén la consola abierta.\n\nPara que tus amigos entren solo con un enlace hay que alojar el servidor.\nConsulta PUBLICAR_WEB.md. La dirección 127.0.0.1 solo sirve en tu PC.\n\nEsta edición conserva todas las secciones, escudos y fuentes.\nOmite capturas, pruebas, informes antiguos y fuentes de desarrollo duplicadas.\nLos datos personales de uso se crean en data-cache/ al iniciar.\nEl repositorio completo conserva el código para continuar desarrollando.\n`);
 const rows=[];async function walk(folder){for(const e of await fs.readdir(folder,{withFileTypes:true})){const p=path.join(folder,e.name);if(e.isDirectory())await walk(p);else rows.push({path:path.relative(directory,p).replaceAll(path.sep,'/'),bytes:(await fs.stat(p)).size});}}await walk(directory);
 return {directory,version:pkg.version,files:rows.length,bytes:rows.reduce((n,r)=>n+r.bytes,0),rootItems:(await fs.readdir(directory)).length,entries:rows};
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const args=process.argv.slice(2);if(args.length&&!(args.length===2&&args[0]==='--out'))throw Error('Uso: npm run package:runtime -- [--out carpeta-vacía]');
 const report=await packageRuntime({out:args[1]||null});const {entries,...summary}=report;console.log(JSON.stringify(summary,null,2));
}
