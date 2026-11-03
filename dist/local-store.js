const KEY='coral-salidas-v1';
const SALES_KEY='coral-ventas-v1';
const read=()=>Coral.validateStore(JSON.parse(localStorage.getItem(KEY)||'{"version":1,"trips":[]}'));
const snapshot=()=>{const data=read();return {data,revisions:{},etag:JSON.stringify(data)};};
function readSales(){
 const records=JSON.parse(localStorage.getItem(SALES_KEY)||'[]');
 if(!Array.isArray(records))throw Error('No se pudo leer el guardado local de Ventas.');
 return records.map(({sale,revision})=>{
  if(!Number.isSafeInteger(revision)||revision<1)throw Error('Registro de venta inválido.');
  return {sale:CoralSales.validateSale(sale),revision};
 });
}
window.CoralCloud={mode:'local',snapshot,isBusy:()=>false,
 async listSales(){return readSales();},
 async saveSale(sale,expectedRevision){
  const save=()=>{
   const records=readSales();
   const index=records.findIndex(record=>record.sale.id===sale.id);
   if((records[index]?.revision??0)!==expectedRevision)throw Error('La ficha cambió en otra pestaña. Cerrá el formulario y actualizá Ventas.');
   const record={sale:CoralSales.validateSale(structuredClone(sale)),revision:expectedRevision+1};
   if(index===-1)records.push(record);
   else records[index]=record;
   localStorage.setItem(SALES_KEY,JSON.stringify(records));
   return record;
  };
  return navigator.locks ? navigator.locks.request(SALES_KEY,save) : save();
 },
 async save(next,base){const current=snapshot();if(current.etag!==base.etag)throw Error('Los datos cambiaron en otra pestaña. Revisá la última versión.');Coral.validateStore(next);localStorage.setItem(KEY,JSON.stringify(next));return snapshot();},
 async board(tripId,id,value){const data=read(),t=data.trips.find(t=>t.id===tripId);if(!t)throw Error('Salida inexistente.');Coral.setBoarded(t,id,value,false);localStorage.setItem(KEY,JSON.stringify(data));return snapshot();}
};
try{read();const s=document.createElement('script');s.src=document.body.dataset.app;s.onload=()=>{document.documentElement.classList.add('cloud-ready');const status=document.querySelector('#save-status');if(status)status.textContent='Guardado en este navegador';};document.body.append(s);window.addEventListener('storage',e=>{if(e.key===KEY)window.dispatchEvent(new Event('coral-cloud-update'));});}
catch(e){document.documentElement.classList.add('cloud-ready');document.body.replaceChildren();const p=document.createElement('p');p.textContent='No se pudo leer el guardado local. Los datos originales se conservaron. '+e.message;document.body.append(p);}
