(function(root){
 'use strict';
 const labels={id:'ID',firstName:'Nombre',lastName:'Apellido',document:'Documento',documentType:'Tipo documento',dniCopy:'Ejemplar',dniCheckedAt:'Fecha consulta',dniSource:'Origen del ejemplar',dniQueryKey:'Referencia consulta',renaperStatus:'Estado RENAPER',birthDate:'Nacimiento',sex:'Sexo',nationality:'Nacionalidad',residence:'Residencia',occupation:'Ocupación',phone:'Teléfono',groupId:'ID grupo',seatId:'ID butaca',seatPriority:'Prioridad de butaca',noSeat:'No ocupa butaca',origin:'Origen',destination:'Destino',boarding:'Lugar de embarque',hotel:'Hospedaje',roomId:'ID habitación',room:'Habitación',roomType:'Tipo habitación',beds:'Camas',meal:'Régimen',medicationAllergies:'Alergias a medicamentos',medications:'Medicación que toma',specialDiet:'Dieta especial',notes:'Observaciones',boarded:'Ingresó',role:'Tipo de viajero',sourceNumber:'Orden de lista',name:'Nombre / alias',departure:'Fecha de salida',returnDate:'Fecha regreso',unit:'Unidad / N.º interno',carrier:'Empresa de transporte',plate:'Dominio',route:'Ruta',border:'Paso fronterizo',migrationAuthority:'Autoridad migratoria',consignee:'Consignado a',vehicle:'Tipo de colectivo',capacity:'Capacidad',color:'Color',type:'Tipo'};
 function workbook(t,X,C){
  const wb=X.utils.book_new();
  function add(name,records,fallback=[]){
   const keys=[...new Set([...fallback,...records.flatMap(r=>Object.keys(r))])];
   const text=v=>v==null?'':typeof v==='boolean'?(v?'Sí':'No'):typeof v==='object'?JSON.stringify(v):String(v);
   const rows=[keys.map(k=>labels[k]||k),...records.map(r=>keys.map(k=>text(r[k])))];
   const ws=X.utils.aoa_to_sheet(rows);
   ws['!cols']=keys.map((k,i)=>({wch:Math.min(42,Math.max(14,...rows.map(r=>String(r[i]||'').length+2)))}));
   if(keys.length)ws['!autofilter']={ref:X.utils.encode_range({r:0,c:0},{r:Math.max(0,rows.length-1),c:keys.length-1})};
   X.utils.book_append_sheet(wb,ws,name);
  }
  add('Pasajeros',t.passengers.map(p=>({...p,'Grupo coral':t.groups.find(g=>g.id===p.groupId)?.name||'','Butaca':C.seats(t).find(s=>s.id===p.seatId)?.label||'','Edad a la salida':C.age(p.birthDate,t.departure)})),Object.keys(C.blankPassenger()));
  add('Salida',Object.entries(t).filter(([,v])=>!Array.isArray(v)&&typeof v!=='object').map(([k,v])=>({Campo:labels[k]||k,Valor:v})),['Campo','Valor']);
  add('Choferes',t.drivers||[],Object.keys(C.blankDriver()));
  add('Grupos',t.groups,['id','name','color']);
  add('Habitaciones',t.rooms||[],['id','hotel','name','type','beds','meal']);
  add('Plano',t.floors.flatMap(f=>[...f.seats.map(s=>({...s,Tipo:'Butaca',Piso:f.name})),...(f.fixtures||[]).map(s=>({...s,Tipo:C.fixtureTypes[s.type]||s.type,Piso:f.name}))]),['Piso','Tipo','label','row','col']);
  return wb;
 }
 const api={workbook};if(typeof module!=='undefined')module.exports=api;else root.CoralExport=api;
})(globalThis);
