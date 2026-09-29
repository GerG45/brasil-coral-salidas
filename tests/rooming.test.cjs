const {test}=require('node:test'),assert=require('node:assert/strict'),C=require('../dist/core.js');
const room=(id,name)=>({id,name,hotel:C.hotels[0],type:'',beds:'',meal:''});
test('Rooming conserva ceros y distingue 108, 08 y 8; asigna, mueve y libera',()=>{const t=C.blankTrip();const p={...C.blankPassenger(),firstName:'Ana',lastName:'Prueba'};t.passengers.push(p);C.saveRoom(t,room('a','08'),[p.id]);C.saveRoom(t,room('b','8'),[]);C.saveRoom(t,room('c','108'),[]);assert.deepEqual(t.rooms.map(r=>r.name),['08','8','108']);assert.throws(()=>C.saveRoom(t,room('b','8'),[p.id]),/otra habitación/);assert.equal(t.passengers[0].room,'08');C.saveRoom(t,room('a','08'),[]);C.saveRoom(t,room('b','8'),[p.id]);assert.equal(t.passengers[0].roomId,'b');assert.equal(t.passengers[0].room,'8');C.saveRoom(t,room('b','8'),[]);assert.equal(t.passengers[0].hotel,'');C.saveRoom(t,room('d',''),[p.id]);assert.equal(t.passengers[0].room,'');assert.throws(()=>C.saveRoom(t,room('e','08'),[]),/existe/);assert.equal(t.rooms.length,4);});
test('Migración conserva asignaciones existentes y genera IDs estables',()=>{const t=C.blankTrip();t.passengers.push({...C.blankPassenger(),firstName:'Ana',lastName:'Prueba',hotel:'Otro hotel',room:'08',roomType:'Doble',beds:'Dos camas',meal:'Desayuno'});const copy=structuredClone(t);C.validateTrip(t);C.validateTrip(copy);assert.deepEqual(t.rooms,copy.rooms);assert.equal(t.rooms[0].name,'08');assert.equal(t.passengers[0].hotel,'Otro hotel');C.validateStore(JSON.parse(JSON.stringify({version:1,trips:[t]})));});
test('Eliminar habitación libera solo sus huéspedes y conserva todos los demás datos',()=>{
 const t=C.blankTrip();t.passengers=[{...C.blankPassenger(),firstName:'Ana',lastName:'Prueba',dniCopy:'B',boarded:true},{...C.blankPassenger(),firstName:'Luis',lastName:'Prueba'}];
 C.saveRoom(t,room('a','08'),[t.passengers[0].id]);C.saveRoom(t,room('b','09'),[t.passengers[1].id]);
 const other=structuredClone(t.passengers[1]);C.deleteRoom(t,'a');
 assert.equal(t.rooms.length,1);for(const key of ['roomId','hotel','room','roomType','beds','meal'])assert.equal(t.passengers[0][key],'');
 assert.equal(t.passengers[0].dniCopy,'B');assert.equal(t.passengers[0].boarded,true);assert.deepEqual(t.passengers[1],other);
 C.saveRoom(t,room('b','09'),t.passengers.map(p=>p.id));assert.ok(t.passengers.every(p=>p.roomId==='b'));
});
