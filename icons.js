/* Iconos SVG locales; reemplazan símbolos tipográficos decorativos. */
(()=>{'use strict';
 const paths={home:'m3 10 9-7 9 7v10H6V10m3 10v-7h6v7',grid:'M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z',calendar:'M4 5h16v16H4zM8 2v6m8-6v6M4 11h16',shield:'m12 3 8 3v6c0 5-8 10-8 10S4 17 4 12V6l8-3Z',user:'M4 21v-3a8 8 0 0 1 16 0v3M16 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0Z',info:'M12 11v6m0-10v1M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0Z',external:'M14 3h7v7m0-7L11 13M10 5H4v15h15v-6',refresh:'M20 7V2m0 5h-5M4 17v5m0-5h5M20 7a9 9 0 0 0-16 1m0 9a9 9 0 0 0 16-1',search:'M21 21l-6-6M17 9a8 8 0 1 1-16 0 8 8 0 0 1 16 0Z',menu:'M3 5h18M3 12h18M3 19h18',close:'m5 5 14 14M19 5 5 19',swap:'M3 7h17l-4-4m5 14H4l4 4'};
 function svg(name){return `<svg class="c-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="${paths[name]||paths.external}"/></svg>`;}
 function upgrade(root=document){
  root.querySelectorAll?.('[data-icon]').forEach(e=>{if(!e.querySelector('svg'))e.innerHTML=svg(e.dataset.icon)});
  const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);const nodes=[];while(walker.nextNode()){const n=walker.currentNode;if(/[↗↻]/.test(n.textContent)&&!n.parentElement?.closest('script,style,svg,option,textarea'))nodes.push(n)}
  for(const n of nodes){const fragment=document.createDocumentFragment();for(const p of n.textContent.split(/([↗↻])/)){if(p==='↗'||p==='↻'){const el=document.createElement('span');el.className='c-inline-icon';el.innerHTML=svg(p==='↗'?'external':'refresh');fragment.append(el)}else fragment.append(document.createTextNode(p))}n.replaceWith(fragment)}
 }
 if(typeof document!=='undefined'){const observer=new MutationObserver(records=>{for(const r of records)for(const n of r.addedNodes)if(n.nodeType===1&&!n.matches('svg,.c-inline-icon'))upgrade(n)});observer.observe(document.body,{childList:true,subtree:true});upgrade()}
 globalThis.CANCHA_ICONS={svg,upgrade};
})();
