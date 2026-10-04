const {test}=require('node:test'),assert=require('node:assert/strict');
const C=require('../dist/core.js'),X=require('../dist/vendor/xlsx.full.min.js'),E=require('../dist/excel-export.js');
test('Seguro y manifiesto exporta solo las once columnas y los pasajeros de la salida, sin alterar datos',()=>{
 const t=C.blankTrip();t.departure='2026-10-04';
 t.passengers=[{...C.blankPassenger(),firstName:'=1+1',lastName:'Muñoz',document:'008411301',dniCopy:'B',birthDate:'2008-10-05',nationality:'Argentina',residence:'Uruguay',sex:'F',notes:'Observación',medications:'No exportar'}, {...C.blankPassenger(),firstName:'Ana',birthDate:'2008-10-04'}];
 t.drivers=[{...C.blankDriver(),firstName:'Chofer excluido'}];const before=JSON.stringify(t);
 const wb=X.read(X.write(E.insuranceWorkbook(t,X,C),{type:'buffer',bookType:'xlsx'}),{type:'buffer',cellNF:true});
 assert.deepEqual(wb.SheetNames,['Pasajeros']);const ws=wb.Sheets.Pasajeros;
 assert.deepEqual(X.utils.sheet_to_json(ws,{header:1})[0],['Nombre','Apellido','Documento','Tipo documento','Ejemplar','Nacionalidad','Residencia','Sexo','Nacimiento','Observaciones','Edad a la salida']);
 assert.equal(ws['!ref'],'A1:K3');assert.equal(ws.C2.v,'008411301');assert.equal(ws.A2.v,'=1+1');assert.equal(ws.A2.f,undefined);assert.equal(ws.E2.v,'B');assert.equal(ws.G2.v,'Uruguay');assert.equal(ws.J2.v,'Observación');assert.equal(ws.K2.v,17);assert.equal(ws.K3.v,18);assert.equal(ws.I2.t,'n');assert.equal(X.utils.format_cell(ws.I2),'2008-10-05');assert.equal(JSON.stringify(t),before);
});
test('Seguro conserva campos ausentes en blanco y exporta una salida vacía sin inventar viajeros',()=>{
 const t=C.blankTrip();let ws=E.insuranceWorkbook(t,X,C).Sheets.Pasajeros;assert.equal(ws['!ref'],'A1:K1');
 t.passengers=[{firstName:'Prueba',document:'8411301'}];ws=E.insuranceWorkbook(t,X,C).Sheets.Pasajeros;assert.equal(ws.C2.v,'8411301');assert.equal(ws.I2.v,'');assert.equal(ws.K2.v,'');assert.equal(ws.E2.v,'');
});
