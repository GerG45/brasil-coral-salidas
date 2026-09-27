(()=>{
 const current=document.querySelector('meta[name="coral-build"]')?.content;if(!current)return;
 const clean=new URL(location.href);if(clean.searchParams.has('_refresh')){clean.searchParams.delete('_refresh');history.replaceState(null,'',clean);}
 let checking=false,shown=false;
 async function check(){if(checking||shown||document.hidden)return;checking=true;try{const response=await fetch('release.json',{cache:'no-store'});if(!response.ok)return;const release=await response.json();if(typeof release.build!=='string'||release.build===current)return;shown=true;
 const banner=document.createElement('aside');banner.setAttribute('role','status');banner.style.cssText='position:fixed;bottom:16px;left:16px;right:16px;z-index:10000;background:#fff;border:2px solid #337b58;border-radius:12px;padding:14px;box-shadow:0 4px 18px #0002;display:flex;align-items:center;justify-content:space-between;gap:12px;color:#172e36;font:16px system-ui';
 const text=document.createElement('span');text.textContent='Hay una actualización disponible. Terminá y guardá tu trabajo antes de actualizar.';const button=document.createElement('button');button.textContent='Actualizar ahora';button.style.cssText='background:#337b58;color:white;border:0;border-radius:8px;padding:12px;cursor:pointer';button.onclick=()=>{const url=new URL(location.href);url.searchParams.set('_refresh',Date.now());location.replace(url.href);};banner.append(text,button);document.body.append(banner);
 }catch{}finally{checking=false;}}
 window.addEventListener('focus',check);document.addEventListener('visibilitychange',check);setInterval(check,60000);check();
})();
