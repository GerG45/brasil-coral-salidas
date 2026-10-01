(function(root){
 'use strict';
 const C=typeof module!=='undefined'?require('./core.js'):root.Coral;
 const text=v=>v==null?'':String(v).trim();
 function date(v,X){
  if(!v)return '';
  if(v instanceof Date)return v.toISOString().slice(0,10);
  if(typeof v==='number'){const d=X.SSF.parse_date_code(v);return d?`${d.y}-${String(d.m).padStart(2,'0')}-${String(d.d).padStart(2,'0')}`:'';}
  const s=text(v),iso=s.match(/^(\d{4})-(\d{2})-(\d{2})$/),local=s.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
  return iso?s:local?`${local[3]}-${local[2].padStart(2,'0')}-${local[1].padStart(2,'0')}`:'';
 }
 function readLegacy(wb,X){
  const name=wb.SheetNames[0],s=wb.Sheets[name];
  if(!s)throw Error('El archivo no tiene una primera hoja legible.');
  const cell=a=>s[a]?.v;
  if(!C.norm(cell('C3')).includes('nombre')||!C.norm(cell('D3')).includes('apellido')||!C.norm(cell('E3')).includes('dni'))throw Error('La primera hoja debe tener Nombres en C3, Apellido en D3 y DNI en E3.');
  const capacity=Number(cell('E1'));if(!Number.isInteger(capacity)||capacity<1||capacity>100)throw Error('E1 debe indicar una capacidad de 1 a 100.');
  const range=X.utils.decode_range(s['!ref']||'A1');if(range.e.r>2000)throw Error('La hoja supera las 2000 filas admitidas.');
  const passengers=[],errors=[];
  let departure=date(cell('A1'),X);const yearText=text(cell('B1'));
  if(yearText){
   if(!/^\d{4}$/.test(yearText)||Number(yearText)<1900||Number(yearText)>2200)errors.push('B1 debe contener un año de cuatro dígitos.');
   else if(departure&&departure.slice(0,4)!==yearText)errors.push('El año de A1 no coincide con B1.');
   else if(!departure){
    const months=['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];
    const value=C.norm(cell('A1')),named=value.match(/^(\d{1,2})\s+(?:de\s+)?([a-z]+)$/),numeric=value.match(/^(\d{1,2})[/-](\d{1,2})$/);
    const day=Number(named?.[1]||numeric?.[1]),month=named?months.indexOf(named[2])+1:Number(numeric?.[2]);
    if(day&&month>=1&&month<=12)departure=`${yearText}-${String(month).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
   }
  }
  if(text(cell('I3'))&&C.norm(cell('I3'))!=='sexo')errors.push('La columna I debe llamarse Sexo en I3.');
  for(let r=4;r<=range.e.r+1;r++){
   if(!['C','D','E','F','G','H'].some(c=>text(cell(c+r))))continue;
   const p={...C.blankPassenger(),firstName:text(cell('C'+r)),lastName:text(cell('D'+r)),document:text(cell('E'+r)).replace(/[.\s-]/g,''),birthDate:date(cell('F'+r),X),boarding:text(cell('G'+r)),specialDiet:text(cell('H'+r)),sourceRow:r,sourceNumber:text(cell('A'+r)),sourceCheck:cell('B'+r)??null};
   const sex=C.norm(cell('I'+r));p.sex=({f:'F',femenino:'F',m:'M',masculino:'M',x:'X','no binario':'X'})[sex]||'';
   if(sex&&!p.sex)errors.push(`Fila ${r}: Sexo debe ser F, M o X.`);
   if(!p.firstName||!p.lastName)errors.push(`Fila ${r}: falta nombre o apellido.`);
   if(cell('F'+r)&&!p.birthDate)errors.push(`Fila ${r}: nacimiento no reconocido.`);
   if(p.document&&!/^\d{7,8}$/.test(p.document))errors.push(`Fila ${r}: revisar DNI (7 u 8 dígitos).`);
   passengers.push(p);
  }
  if(!passengers.length)errors.push('No hay pasajeros desde la fila 4.');
  const seen=new Set();for(const p of passengers){if(p.document&&seen.has(p.document))errors.push(`Fila ${p.sourceRow}: DNI repetido.`);if(p.document)seen.add(p.document);}
  if(passengers.length>capacity)errors.push(`Hay ${passengers.length} pasajeros para ${capacity} lugares. Revisá la capacidad o la lista.`);
  return {sheet:name,departureText:text(cell('A1')),year:yearText,departure,vehicle:text(cell('C1')),capacity,passengers,errors};
 }

 const headerKey=v=>C.norm(v).replace(/[^a-z0-9]/g,'');
 const templateFields={sourceNumber:['numero','n'],firstName:['nombre','nombres'],lastName:['apellido','apellidos'],document:['dni'],sex:['sexo'],birthDate:['fechanac','fechanacimiento','fechadenacimiento'],nationality:['nacionalidad'],specialDiet:['dieta','dietaespecial'],notes:['observacion','observaciones'],medicationAllergies:['alergiamedicamentos','alergiaamedicamentos','alergiasamedicamentos'],medications:['medicacionquetoma','medicacion'],seatPriority:['prioridaddebutaca']};
 const fieldLabels={sourceNumber:'Número',firstName:'Nombre',lastName:'Apellido',document:'DNI',sex:'Sexo',birthDate:'Fecha nac.',nationality:'Nacionalidad',specialDiet:'Dieta',notes:'Observación',medicationAllergies:'Alergia Medicamentos',medications:'Medicación que toma',seatPriority:'Prioridad de butaca'};
 function read(buffer,X){
  const wb=X.read(buffer,{type:'array',cellDates:false,sheets:0}),name=wb.SheetNames[0],sheet=wb.Sheets[name];
  if(!sheet)throw Error('El archivo no tiene una primera hoja legible.');
  const range=X.utils.decode_range(sheet['!ref']||'A1');if(range.e.r>2000||range.e.c>100)throw Error('La hoja supera el tamaño admitido.');
  const row4=Array.from({length:range.e.c+1},(_,c)=>headerKey(sheet[X.utils.encode_cell({r:3,c})]?.v));
  if(!row4.includes('dni'))return readLegacy(wb,X);
  const columns={};for(const [key,aliases] of Object.entries(templateFields)){
   const matches=row4.map((h,i)=>aliases.includes(h)?i:-1).filter(i=>i>=0);
   if(matches.length!==1)throw Error('Fila 4: '+(matches.length?'se repite':'falta')+' la columna '+fieldLabels[key]+'.');columns[key]=matches[0];
  }
  const cell=(key,row)=>sheet[X.utils.encode_cell({r:row-1,c:columns[key]})]?.v;
  const passengers=[],errors=[];
  for(let r=5;r<=range.e.r+1;r++){
   if(!Object.keys(columns).filter(k=>k!=='sourceNumber').some(k=>text(cell(k,r))))continue;
   const p={...C.blankPassenger(),sourceRow:r};for(const key of Object.keys(columns))p[key]=text(cell(key,r));
   p.document=p.document.replace(/[.\s-]/g,'');p.birthDate=date(cell('birthDate',r),X);
   const sex=C.norm(cell('sex',r));p.sex=({f:'F',femenino:'F',m:'M',masculino:'M',x:'X','no binario':'X'})[sex]||'';
   if(sex&&!p.sex)errors.push('Fila '+r+': Sexo debe ser F, M o X.');
   if(!p.firstName||!p.lastName)errors.push('Fila '+r+': falta nombre o apellido.');
   if(cell('birthDate',r)&&!p.birthDate)errors.push('Fila '+r+': nacimiento no reconocido.');
   if(p.document&&!/^\d{7,8}$/.test(p.document))errors.push('Fila '+r+': revisar DNI (7 u 8 dígitos).');
   passengers.push(p);
  }
  if(!passengers.length)errors.push('No hay pasajeros desde la fila 5.');
  const seen=new Set();for(const p of passengers){if(p.document&&seen.has(p.document))errors.push('Fila '+p.sourceRow+': DNI repetido.');if(p.document)seen.add(p.document);}
  return {format:'third-edition',sheet:name,name:text(sheet.A1?.v),departureText:text(sheet.B2?.w||sheet.B2?.v),departure:date(sheet.B2?.v,X),year:'',capacity:null,vehicle:'',columns:Object.fromEntries(Object.entries(columns).map(([key,col])=>[key,X.utils.encode_col(col)])),passengers,errors};
 }

 function build(preview,departure,options={}){
  if(preview.errors.length)throw Error(preview.errors.join('\n'));
  if(!/^\d{4}-\d{2}-\d{2}$/.test(departure))throw Error('Completá la fecha de salida con año.');
  const capacity=Number(options.capacity??preview.capacity);if(!Number.isInteger(capacity)||capacity<1||capacity>100)throw Error('Completá la capacidad real del colectivo (1 a 100).');if(preview.passengers.filter(p=>!p.noSeat).length>capacity)throw Error('Hay más pasajeros que lugares disponibles.');
  const t=C.blankTrip();t.name=text(options.name||preview.name)||preview.sheet+' · '+departure;t.departure=departure;t.vehicle=text(options.vehicle??preview.vehicle);t.capacity=capacity;t.layoutMode='list';t.floors=[];t.configured=true;t.origin='';t.destination='';t.passengers=structuredClone(preview.passengers);t.importSource={sheet:preview.sheet,departureText:preview.departureText,format:preview.format||'legacy'};C.validateTrip(t);return t;
 }
 const api={read,build};if(typeof module!=='undefined')module.exports=api;else root.CoralExcel=api;
})(globalThis);
