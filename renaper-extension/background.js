const official='https://tramites.renaper.gob.ar/mi_ejemplar/';
const local=url=>{try{const u=new URL(url);return (u.origin==='https://gerg45.github.io'&&u.pathname.startsWith('/brasil-coral-salidas/'))||u.protocol==='http:'&&['127.0.0.1','localhost'].includes(u.hostname)&&['4173','4174','4180'].includes(u.port);}catch{return false;}};
let starting=false;
chrome.runtime.onMessage.addListener((m,sender,reply)=>{
 (async()=>{
  if(local(sender.url)){
   if(m.kind==='ping')return {ready:true};
   if(m.kind!=='lookup')throw Error('Solicitud desconocida.');
   const p=m.payload;if(!/^\d{7,8}$/.test(p?.dni)||!['F','M','X'].includes(p.sex)||!/^\d{4}-\d{2}-\d{2}$/.test(p.birthDate))throw Error('Datos incompletos.');
   if(starting)throw Error('Ya se está abriendo una consulta.');
   starting=true;
   try {
   const state=await chrome.storage.session.get('job');if(state.job&&Date.now()-state.job.created<180000)throw Error('Ya hay una consulta abierta. Terminá o cerrá su pestaña antes de consultar otra.');
   const tab=await chrome.tabs.create({url:'about:blank',active:true});
   await chrome.storage.session.set({job:{id:m.id,payload:p,originTab:sender.tab.id,targetTab:tab.id,created:Date.now()}});
   await chrome.tabs.update(tab.id,{url:official});return {accepted:true};
   } finally {starting=false;}
  }
  if(!sender.url?.startsWith(official))throw Error('Origen no autorizado.');
  const {job}=await chrome.storage.session.get('job');if(!job||job.targetTab!==sender.tab.id||Date.now()-job.created>180000)throw Error('Consulta vencida.');
  if(m.kind==='getJob')return {payload:job.payload};
  if(m.kind==='done'){
   await chrome.tabs.sendMessage(job.originTab,{kind:'result',id:job.id,text:String(m.text||'').slice(0,2000),error:m.error||''});
   await chrome.storage.session.remove('job');return {ok:true};
  }
  throw Error('Solicitud desconocida.');
 })().then(reply,e=>reply({error:e.message}));return true;
});
chrome.tabs.onRemoved.addListener(async id=>{const {job}=await chrome.storage.session.get('job');if(job&&(job.targetTab===id||job.originTab===id)){await chrome.storage.session.remove('job');if(job.originTab!==id)chrome.tabs.sendMessage(job.originTab,{kind:'result',id:job.id,error:'Consulta cerrada sin resultado.'}).catch(()=>{});}});
