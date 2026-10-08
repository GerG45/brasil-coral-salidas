const {test}=require('node:test'),assert=require('node:assert/strict');
const C=require('../dist/core.js'),X=require('../dist/vendor/xlsx.full.min.js'),E=require('../dist/excel-export.js');
test('Excel de barco incluye solo seleccionados, incluidos acompañantes, sin cambiar datos',()=>{
 const t=C.blankTrip();t.departure='2026-10-08';t.passengers=[{...C.blankPassenger(),firstName:'Ana',document:'00123456',boatSelected:true},{...C.blankPassenger(),firstName:'Excluido'}];t.boatOrganizers=[{id:'test',firstName:'Acompañante',lastName:'Prueba',birthDate:'2020-08-25',boatSelected:true},{id:'other',firstName:'No seleccionado',boatSelected:false}];
 const before=JSON.stringify(t),wb=X.read(X.write(E.boatWorkbook(t,X,C),{bookType:'xlsx',type:'buffer'}),{type:'buffer'});assert.deepEqual(wb.SheetNames,['Salida en Barco']);const rows=X.utils.sheet_to_json(wb.Sheets['Salida en Barco']);assert.equal(rows.length,2);assert.equal(rows[0].Documento,'00123456');assert.equal(rows[1].Nombre,'Acompañante');assert.equal(rows[1]['Edad a la salida'],6);assert.equal(JSON.stringify(t),before);
});
test('Excel de barco no genera listas vacías',()=>{assert.throws(()=>E.boatWorkbook(C.blankTrip(),X,C),/Seleccioná al menos/);});
