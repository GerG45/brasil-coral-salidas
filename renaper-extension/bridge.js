if((location.origin==='https://gerg45.github.io'&&location.pathname.startsWith('/brasil-coral-salidas/'))||(['127.0.0.1','localhost'].includes(location.hostname)&&['4173','4174','4180'].includes(location.port))){
 window.addEventListener('message',async e=>{
  if(e.source!==window||e.origin!==location.origin||e.data?.source!=='coral-renaper')return;
  const {kind,id,payload}=e.data;if(!['ping','lookup'].includes(kind))return;
  try{const response=await chrome.runtime.sendMessage({kind,id,payload});window.postMessage({source:'coral-renaper-extension',id,...response},location.origin);}catch{window.postMessage({source:'coral-renaper-extension',id,error:'La extensión se desconectó. Recargá la página.'},location.origin);}
 });
 chrome.runtime.onMessage.addListener(message=>{if(message.kind==='result')window.postMessage({source:'coral-renaper-extension',...message},location.origin);});
}
