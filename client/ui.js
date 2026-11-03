/* Actualiza nodos por identidad y conserva los controles que usa el visitante. */
(()=>{'use strict';
 const key=n=>n.nodeType===1?(n.id||n.getAttribute('data-key')||''):'';
 const same=(a,b)=>a?.nodeType===b.nodeType&&a?.nodeName===b.nodeName;
 function sync(old,fresh){
  if(old.nodeType!==1){if(old.nodeValue!==fresh.nodeValue)old.nodeValue=fresh.nodeValue;return}
  for(const a of [...old.attributes])if(!fresh.hasAttribute(a.name)&&!(a.name==='open'&&old.tagName==='DETAILS'))old.removeAttribute(a.name);
  for(const a of fresh.attributes)if(old.getAttribute(a.name)!==a.value&&!(a.name==='open'&&old.tagName==='DETAILS'))old.setAttribute(a.name,a.value);
  children(old,fresh);
  if(old.tagName==='INPUT'&&old!==document.activeElement)old.value=fresh.value;
 }
 function children(root,fresh){
  const keyed=new Map([...root.childNodes].filter(n=>key(n)).map(n=>[key(n),n]));let cursor=root.firstChild;
  for(const next of [...fresh.childNodes]){
   const id=key(next);let node=id?keyed.get(id):cursor&&!key(cursor)&&same(cursor,next)?cursor:null;
   if(!same(node,next))node=next.cloneNode(true);
   if(node!==cursor)root.insertBefore(node,cursor);
   sync(node,next);cursor=node.nextSibling;
  }
  while(cursor){const next=cursor.nextSibling;cursor.remove();cursor=next}
 }
 function patch(root,html){if(!root)return;const template=document.createElement('template');template.innerHTML=html;children(root,template.content);}
 const queued=new Map();let frame=0;
 function batch(key,work){queued.set(key,work);if(!frame)frame=requestAnimationFrame(()=>{frame=0;const tasks=[...queued.values()];queued.clear();tasks.forEach(run=>run());});}
 globalThis.CANCHA_UI={patch,batch};
})();
