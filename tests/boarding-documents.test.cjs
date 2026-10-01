const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),C=require('../dist/core.js'),X=require('../dist/vendor/xlsx.full.min.js'),E=require('../dist/excel-export.js');
const src=fs.readFileSync(require.resolve('../dist/app.js'),'utf8');
const ctx={C,esc:s=>String(s??'').replaceAll('<','&lt;'),dateText:s=>s};vm.createContext(ctx);vm.runInContext(src.slice(src.indexOf('function reportTable('),src.indexOf('function showReport(')),ctx);
test('DNI corto lleva M solamente en manifiesto y nunca incluye ejemplar',()=>{
 const p={...C.blankPassenger(),document:'8.411.301',dniCopy:'Z'};
 assert.equal(ctx.manifestDni(p),'M8411301');assert.equal(p.document,'8.411.301');
 assert.doesNotMatch(ctx.manifestRoster([p],1),/ · Z/);
 assert.equal(ctx.manifestDni({...p,document:'18411301'}),'18411301');
 assert.equal(ctx.manifestDni({...p,document:'M8411301'}),'M8411301');
 assert.equal(ctx.manifestDni({...p,documentType:'Pasaporte',document:'1234567'}),'1234567');
});
test('Embarque papel identifica edad en fecha de salida, ejemplar y prioridad; 61 personas en dos páginas',()=>{
 const t=C.blankTrip();t.departure='2026-09-29';
 t.passengers=Array.from({length:61},(_,i)=>({...C.blankPassenger(),firstName:'Persona',lastName:'Prueba'+i,document:String(30000000+i),birthDate:i===0?'2008-09-30':'2008-09-29',dniCopy:'B',seatPriority:i===0?'Piso de abajo':''}));
 const html=ctx.boardingDocument(t);assert.match(html,/MENOR · 17/);assert.match(html,/18 años/);assert.match(html,/Piso de abajo/);assert.match(html,/>B<\/td>/);assert.equal((html.match(/paper-check/g)||[]).length,61);assert.equal((html.match(/class="manifest-page/g)||[]).length,2);
});
test('Excel completo conserva ceros, caracteres y texto sin fórmulas ejecutables',()=>{
 const t=C.blankTrip();t.name='Grupo de Patricio';t.passengers=[{...C.blankPassenger(),firstName:'=1+1',lastName:'Prueba',document:'008411301',dniCopy:'B',room:'08',seatPriority:'Panorámica'}];
 const wb=X.read(X.write(E.workbook(t,X,C),{type:'buffer',bookType:'xlsx'}),{type:'buffer'});
 assert.deepEqual(wb.SheetNames,['Pasajeros','Salida','Choferes','Grupos','Habitaciones','Plano']);
 const p=X.utils.sheet_to_json(wb.Sheets.Pasajeros)[0];assert.equal(p.Documento,'008411301');assert.equal(p.Habitación,'08');assert.equal(p.Ejemplar,'B');assert.equal(p['Prioridad de butaca'],'Panorámica');assert.equal(p.Nombre,'=1+1');
 assert.ok(Object.values(wb.Sheets.Pasajeros).every(c=>!c?.f));
 const old={...t.passengers[0]};delete old.seatPriority;t.passengers=[old];C.validateTrip(t);assert.equal(old.seatPriority,'');
});

test('Cocina incluye solo dietas informadas y no expone DNI ni observaciones',()=>{const t=C.blankTrip();t.passengers=[{...C.blankPassenger(),firstName:'Ana',lastName:'Prueba',specialDiet:'Sin gluten',hotel:'Real Canas',room:'08',document:'12345678',notes:'NOTA PRIVADA'},{...C.blankPassenger(),firstName:'Luis',lastName:'Otro',specialDiet:'   '}];const html=ctx.dietaryDocument(t);assert.match(html,/Sin gluten/);assert.match(html,/Real Canas/);assert.match(html,/>08</);assert.doesNotMatch(html,/Luis|12345678|NOTA PRIVADA/);t.passengers=[];assert.match(ctx.dietaryDocument(t),/No hay dietas/);});

test('Detalles técnicos incluyen medicación sin dieta especial y dieta común queda fuera de cocina',()=>{const t=C.blankTrip();t.passengers=[{...C.blankPassenger(),firstName:'Ana',lastName:'Prueba',specialDiet:'Común ',medicationAllergies:'Alergia A',medications:'Medicamento B',notes:'Detalle informado'}];const html=ctx.dietaryDocument(t);assert.match(html,/No hay dietas especiales/);assert.match(html,/Alergia A/);assert.match(html,/Medicamento B/);assert.match(html,/Detalle informado/);});
