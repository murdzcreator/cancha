/* Identidad visual local: un mismo avatar ilustrado para todos los futbolistas. */
(()=>{'use strict';
 const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const hex=(value,fallback)=>/^#[\da-f]{6}$/i.test(value||'')?value:fallback;
 const patterns=new Set(['plain','trim','stripes','band','hoop','hoops','sash','sleeves','halves']);
 const sizes=new Set(['compact','roster','directory','profile','card']);
 const shirt='M32 57 20 62 8 77 21 88 27 81 25 112H71L69 81 75 88 88 77 76 62 64 57 58 53H38Z';
 let nextId=0;
 function theme(teamId){
  const t=globalThis.CANCHA_AVATAR_THEMES?.[teamId]||[];
  return {primary:hex(t[0],'#69488e'),secondary:hex(t[1],'#d5c4ed'),accent:hex(t[2],'#f1eafa'),pattern:patterns.has(t[3])?t[3]:'plain'};
 }
 function initials(name){
  const words=String(name??'').trim().split(/\s+/u).filter(Boolean);
  return words.length?[words[0],...(words.length>1?[words.at(-1)]:[])].map(w=>Array.from(w)[0]).join('').toLocaleUpperCase('es').slice(0,4):'·';
 }
 function number(value){return value!==null&&value!==undefined&&String(value).trim()!==''&&/^\d{1,3}$/.test(String(value))?String(value):null;}
 function ink(color){const c=color.slice(1).match(/../g).map(x=>{const n=parseInt(x,16)/255;return n<=.04045?n/12.92:((n+.055)/1.055)**2.4});return c[0]*.2126+c[1]*.7152+c[2]*.0722>.4?'#172033':'#ffffff';}
 function motif(t){
  const a=t.secondary;
  if(t.pattern==='stripes')return `<path d="M29 54H39V114H29ZM48 54H58V114H48ZM67 54H77V114H67Z" fill="${a}"/>`;
  if(t.pattern==='band')return `<path d="M37 53H59V114H37Z" fill="${a}"/><path d="M38 53V114M58 53V114" fill="none" stroke="${t.accent}" stroke-width="2"/>`;
  if(t.pattern==='hoop')return `<path d="M9 73H87V91H9Z" fill="${a}"/>`;
  if(t.pattern==='hoops')return `<path d="M8 65H88V75H8ZM8 85H88V95H8ZM8 105H88V115H8Z" fill="${a}"/>`;
  if(t.pattern==='sash')return `<path d="M13 52 84 105 74 119 3 66Z" fill="${a}"/>`;
  if(t.pattern==='sleeves')return `<path d="M0 55H29L24 94H0ZM67 55H96V94H72Z" fill="${a}"/>`;
  if(t.pattern==='halves')return `<path d="M48 52H96V114H48Z" fill="${a}"/>`;
  return '';
 }
 function html(teamId,player={},size='roster'){
  const t=theme(teamId),club=globalThis.CANCHA_DB?.teams?.[teamId],label=number(player.number)??initials(player.name),id='c-avatar-kit-'+(++nextId),fg=ink(t.primary);
  const crest=club&&globalThis.CANCHA_BRAND?globalThis.CANCHA_BRAND.teamHTML(teamId):'';
  return `<span class="c-player-avatar c-avatar--${sizes.has(size)?size:'roster'}" data-avatar-team="${esc(club?.id||'')}" data-avatar-pattern="${t.pattern}" style="--avatar-primary:${t.primary};--avatar-secondary:${t.secondary};--avatar-accent:${t.accent}" aria-hidden="true" title="${esc('Avatar ilustrado · '+(club?.name||'CANCHA'))}"><svg viewBox="0 0 96 112" fill="none" aria-hidden="true" focusable="false"><defs><clipPath id="${id}"><path d="${shirt}"/></clipPath></defs><circle cx="48" cy="34" r="26" fill="${t.primary}" opacity=".18"/><path d="M16 13H29M75 40H84" stroke="${t.accent}" opacity=".35" stroke-width="2" stroke-linecap="round"/><circle cx="48" cy="32" r="14" fill="#ded8e7"/><path d="M40 44V55L48 63 56 55V44" fill="#b7aec9"/><path d="${shirt}" fill="${t.primary}"/><g clip-path="url(#${id})">${motif(t)}<path d="M14 82 22 88M74 88 82 82" stroke="${t.pattern==='trim'?t.secondary:t.accent}" stroke-width="4"/><path d="M30 99 28 112M66 99 68 112" stroke="#0b1022" opacity=".16" stroke-width="5"/></g><path d="M37 55Q48 72 59 55" stroke="${t.pattern==='trim'?t.secondary:t.accent}" stroke-width="3"/><rect x="33" y="77" width="30" height="27" rx="8" fill="${t.primary}" fill-opacity=".94"/><text x="48" y="97" text-anchor="middle" fill="${fg}" font-family="system-ui,sans-serif" font-size="${label.length>2?15:20}" font-weight="800">${esc(label)}</text></svg>${crest?`<span class="c-avatar-crest">${crest}</span>`:''}</span>`;
 }
 globalThis.CANCHA_AVATARS={html,theme,initials};
})();
