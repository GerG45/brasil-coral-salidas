const {test}=require('node:test');
const assert=require('node:assert/strict');
const C=require('../dist/core.js'),M=require('../dist/cloud-model.js');
function fixture(){const t=C.blankTrip();t.name='Prueba nube';t.passengers=['Ana','Luis'].map(firstName=>({...C.blankPassenger(),firstName,lastName:'Prueba',noSeat:true}));return t;}
test('Solo se escriben las salidas modificadas',()=>{const t=fixture(),base={version:1,trips:[t]},next=M.copy(base);assert.deepEqual(M.changes(next,base),[]);next.trips[0].name='Nueva';assert.equal(M.changes(next,base).length,1);});
test('Una edición antigua se rechaza antes de sobrescribir',()=>{assert.throws(()=>M.assertRevision(3,2),/otro equipo/);assert.doesNotThrow(()=>M.assertRevision(3,3));assert.throws(()=>M.assertRevision(0,1));});
test('Checks de dos personas conservan ambos ingresos al releer la última versión',()=>{const original=fixture();const first=M.board(original,original.passengers[0].id,true);const second=M.board(first,original.passengers[1].id,true);assert.deepEqual(second.passengers.map(p=>p.boarded),[true,true]);assert.deepEqual(original.passengers.map(p=>p.boarded),[false,false]);});
test('Desmarcar a una persona no cambia su acompañante',()=>{let t=fixture();for(const p of t.passengers)t=M.board(t,p.id,true);t=M.board(t,t.passengers[0].id,false);assert.deepEqual(t.passengers.map(p=>p.boarded),[false,true]);});
test('No recrea pasajeros eliminados desde otro dispositivo',()=>{const t=fixture();assert.throws(()=>M.board(t,'eliminado',true),/ya no está/);});
test('Respaldo identifica altas y bajas sin afectar salidas iguales',()=>{const a=fixture(),b=fixture(),c=fixture();const result=M.changes({version:1,trips:[b,c]},{version:1,trips:[a,b]});assert.equal(result.length,2);assert.equal(result.find(x=>x.id===a.id).payload,null);assert.ok(result.find(x=>x.id===c.id).payload);});
test('Rechaza identificadores que intentan cambiar la ruta del documento',()=>{const t=fixture();t.id='otra/ruta';assert.throws(()=>M.payload(t),/Identificador/);});
