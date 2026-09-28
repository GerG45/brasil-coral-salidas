const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),C=require('../dist/core.js');
const source=fs.readFileSync(require.resolve('../dist/app.js'),'utf8');
const context={C,esc:s=>String(s??'').replaceAll('<','&lt;'),dateText:s=>s};
vm.createContext(context);
vm.runInContext(source.slice(source.indexOf('function reportTable('),source.indexOf('function showReport(')),context);
test('Manifiesto separa tripulantes, conserva cabecera y pagina después de 60 pasajeros',()=>{
 const t=C.blankTrip();Object.assign(t,{unit:'08',returnDate:'2026-10-30'});
 t.drivers=[{...C.blankDriver(),lastName:'Conductor',firstName:'Prueba'}];
 t.passengers=Array.from({length:60},(_,i)=>({...C.blankPassenger(),lastName:'Apellido'+i,firstName:'Nombre',document:String(30000000+i)}));
 t.passengers.push({...C.blankPassenger(),lastName:'Tripulante',role:'Tripulante'});
 let html=context.manifestDocument(t);
 assert.equal((html.match(/class="manifest-page"/g)||[]).length,1);
 assert.match(html,/Pasajeros: 60 · Tripulantes: 2 · Total: 62/);
 assert.match(html,/>08</);assert.match(html,/2026-10-30/);
 assert.equal((html.match(/>Tripulante</g)||[]).length,1);
 t.passengers.push({...C.blankPassenger(),lastName:'Último'});
 html=context.manifestDocument(t);
 assert.equal((html.match(/class="manifest-page"/g)||[]).length,2);
 assert.match(html,/<td>61<\/td><td>Último<\/td>/);
 assert.equal((html.match(/>Apellido0</g)||[]).length,1);
});
test('Unifica unidad e interno sin perder ceros ni datos anteriores',()=>{
 const t=C.blankTrip();t.internalNumber='08';C.validateTrip(t);assert.equal(t.unit,'08');assert.equal(t.internalNumber,undefined);
 t.internalNumber='08';C.validateTrip(t);assert.equal(t.unit,'08');
 t.internalNumber='12';C.validateTrip(t);assert.equal(t.unit,'08 / 12');
 C.validateTrip(t);assert.equal(t.unit,'08 / 12');
});
