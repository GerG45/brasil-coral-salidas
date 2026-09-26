const KEY='coral-salidas-v1';
const read=()=>Coral.validateStore(JSON.parse(localStorage.getItem(KEY)||'{"version":1,"trips":[]}'));
const snapshot=()=>{const data=read();return {data,revisions:{},etag:JSON.stringify(data)};};
window.CoralCloud={mode:'local',snapshot,isBusy:()=>false,
 async save(next,base){const current=snapshot();if(current.etag!==base.etag)throw Error('Los datos cambiaron en otra pestaña. Revisá la última versión.');Coral.validateStore(next);localStorage.setItem(KEY,JSON.stringify(next));return snapshot();},
 async board(tripId,id,value){const data=read(),t=data.trips.find(t=>t.id===tripId);if(!t)throw Error('Salida inexistente.');Coral.setBoarded(t,id,value,false);localStorage.setItem(KEY,JSON.stringify(data));return snapshot();}
};
try{read();const s=document.createElement('script');s.src=document.body.dataset.app;s.onload=()=>{document.documentElement.classList.add('cloud-ready');const status=document.querySelector('#save-status');if(status)status.textContent='Guardado en este navegador';};document.body.append(s);window.addEventListener('storage',e=>{if(e.key===KEY)window.dispatchEvent(new Event('coral-cloud-update'));});}
catch(e){document.documentElement.classList.add('cloud-ready');document.body.replaceChildren();const p=document.createElement('p');p.textContent='No se pudo leer el guardado local. Los datos originales se conservaron. '+e.message;document.body.append(p);}
