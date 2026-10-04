const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const X=require('../dist/vendor/xlsx.full.min.js'),I=require('../dist/excel-import.js');
test('Plantilla pública vacía, compatible con el importador al completar una edición',()=>{
 const buffer=fs.readFileSync(require.resolve('../dist/templates/plantilla-pasajeros.xlsx'));
 const wb=X.read(buffer,{type:'buffer'}),s=wb.Sheets[wb.SheetNames[0]];
 assert.equal(wb.SheetNames.length,1);assert.ok(!s.A1?.v);assert.ok(!s.B2?.v);
 for(const [address,cell] of Object.entries(s)){if(!address.startsWith('!')&&X.utils.decode_cell(address).r>=4){assert.ok(cell.v==null||cell.v==='','Dato inesperado en '+address);assert.ok(!cell.f);}}
 assert.equal(I.read(buffer,X).passengers.length,0);
 X.utils.sheet_add_aoa(s,[['Edición de prueba']],{origin:'A1'});X.utils.sheet_add_aoa(s,[['04/10/2026']],{origin:'B2'});
 X.utils.sheet_add_aoa(s,[[1,'Ana','Prueba','30123456','F','05/10/2008','Argentina','Sin gluten','Observación','Alergia informada','Medicación informada','Piso de abajo']],{origin:'A5'});
 const preview=I.read(X.write(wb,{bookType:'xlsx',type:'buffer'}),X);assert.deepEqual(preview.errors,[]);assert.equal(preview.passengers.length,1);assert.equal(preview.departure,'2026-10-04');assert.equal(preview.passengers[0].specialDiet,'Sin gluten');assert.equal(preview.passengers[0].seatPriority,'Piso de abajo');assert.equal(preview.passengers[0].medications,'Medicación informada');
 const trip=I.build(preview,preview.departure,{capacity:42,vehicle:'Mix'});assert.equal(trip.name,'Edición de prueba');assert.equal(trip.passengers.length,1);
});
