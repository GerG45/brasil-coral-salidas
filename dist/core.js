(function (root) {
  'use strict';
  const uid = () => globalThis.crypto?.randomUUID?.() || `id-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const blankPassenger = () => ({id:uid(),firstName:'',lastName:'',document:'',documentType:'DNI',dniCopy:'',dniCheckedAt:'',dniQueryKey:'',dniSource:'',renaperStatus:'',nationality:'Argentina',residence:'Argentina',occupation:'',sex:'',birthDate:'',phone:'',groupId:'',seatId:'',noSeat:false,origin:'',destination:'',boarding:'',hotel:'',roomType:'',room:'',beds:'',meal:'',notes:'',boarded:false,role:'Pasajero'});
  function layout(count=42, split='single', arrangement='2-2') {
    if (!Number.isInteger(count) || count<1 || count>100) throw Error('Elegí entre 1 y 100 butacas.');
    const [left,right]=arrangement.split('-').map(Number);
    if (![1,2].includes(left)||![1,2].includes(right)) throw Error('Distribución inválida.');
    const amounts=split==='double'?[Math.ceil(count*.7),count-Math.ceil(count*.7)]:[count];
    let label=0;
    return amounts.map((amount,f)=>({id:uid(),name:amounts.length===1?'Planta única':f===0?'Piso superior':'Piso inferior',rows:Math.ceil(amount/(left+right))+1,cols:left+right+1,seats:Array.from({length:amount},(_,i)=>({id:uid(),label:String(++label),row:Math.floor(i/(left+right)),col:i%(left+right)+(i%(left+right)>=left?1:0)}))}));
  }
  const blankTrip=()=>({id:uid(),name:'Nueva salida',origin:'Córdoba',destination:'Florianópolis',departure:'',returnDate:'',checkIn:'',checkOut:'',presentation:'',departureTime:'',boardingPlace:'',coordinator:'',carrier:'',vehicle:'',plate:'',route:'',border:'',provider:'',floors:layout(),groups:[],passengers:[],drivers:[],configured:false});
  const seats=t=>t.floors.flatMap(f=>f.seats);
  const fixtureTypes={bathroom:'Baño',stairs:'Escalera',coffee:'Cafetera'};
  const fixtures=t=>t.floors.flatMap(f=>f.fixtures||[]);
  function placeItem(t,floorId,row,col,kind='seat',movingId='') {
    const f=t.floors.find(f=>f.id===floorId);
    if(!f||!Number.isInteger(row)||!Number.isInteger(col)||row<0||row>=f.rows||col<0||col>=f.cols)throw Error('Posición fuera del plano.');
    if([...f.seats,...(f.fixtures||[])].some(s=>s.row===row&&s.col===col))throw Error('Ese espacio ya está ocupado.');
    if(movingId){
      for(const source of t.floors){for(const key of ['seats','fixtures']){const index=(source[key]||[]).findIndex(s=>s.id===movingId);if(index>=0){const item=source[key][index];source[key].splice(index,1);item.row=row;item.col=col;(f[key]??=[]).push(item);return item;}}}
      throw Error('El elemento seleccionado ya no existe.');
    }
    const item={id:uid(),row,col};
    if(kind==='seat'){if(seats(t).length>=100)throw Error('Máximo 100 butacas.');let n=1;while(seats(t).some(s=>s.label===String(n)))n++;item.label=String(n);f.seats.push(item);}
    else {if(!Object.hasOwn(fixtureTypes,kind))throw Error('Elemento no admitido.');item.type=kind;(f.fixtures??=[]).push(item);}
    return item;
  }
  function removeItem(t,id){
    if(t.passengers.some(p=>p.seatId===id))throw Error('No se puede quitar una butaca ocupada.');
    for(const f of t.floors)for(const key of ['seats','fixtures']){const i=(f[key]||[]).findIndex(s=>s.id===id);if(i>=0){if(key==='seats'&&seats(t).length<=1)throw Error('Debe quedar al menos una butaca.');f[key].splice(i,1);return;}}
    throw Error('El elemento ya no existe.');
  }
  const validDate=s=>typeof s==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(s)&&Number.isFinite(Date.parse(s))&&new Date(s).toISOString().slice(0,10)===s;
  function age(birth, date) {if(!validDate(birth)||!validDate(date))return '';const b=new Date(birth+'T12:00:00'),d=new Date(date+'T12:00:00');if(b>d)return '';return d.getFullYear()-b.getFullYear()-((d.getMonth()<b.getMonth()||(d.getMonth()===b.getMonth()&&d.getDate()<b.getDate()))?1:0);}
  const norm=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim();
  const docKey=s=>norm(s).replace(/[\s.\-]/g,'');
  function validatePassenger(t,p) {
    if(t.layoutMode==='list'&&!p.noSeat&&t.passengers.filter(q=>q.id!==p.id&&!q.noSeat).length>=t.capacity)throw Error('La lista supera la capacidad real del colectivo.');
    if(!p.firstName.trim()||!p.lastName.trim())throw Error('Completá nombre y apellido.');
    if(p.document&&t.passengers.some(q=>q.id!==p.id&&docKey(q.document)===docKey(p.document)&&q.documentType===p.documentType))throw Error('Ese documento ya está cargado en esta salida.');
    if(p.groupId&&!t.groups.some(g=>g.id===p.groupId))throw Error('El grupo no existe.');
    if(p.noSeat&&p.seatId)throw Error('Un pasajero sin butaca no puede tener asiento asignado.');
    if(p.seatId&&!seats(t).some(s=>s.id===p.seatId))throw Error('La butaca ya no existe.');
    if(p.seatId&&t.passengers.some(q=>q.id!==p.id&&q.seatId===p.seatId))throw Error('La butaca está ocupada por otro pasajero.');
    if(p.birthDate && (!validDate(p.birthDate)||p.birthDate>(t.departure||new Date().toISOString().slice(0,10))))throw Error('Revisá la fecha de nacimiento.');
  }
  function savePassenger(t,p) {validatePassenger(t,p);const i=t.passengers.findIndex(q=>q.id===p.id);if(i<0)t.passengers.push(p);else t.passengers[i]=p;}
  function setBoarded(t,pid,value,wholeGroup) {const p=t.passengers.find(q=>q.id===pid);if(!p)throw Error('Pasajero inexistente.');t.passengers.forEach(q=>{if(q.id===pid||(wholeGroup&&p.groupId&&q.groupId===p.groupId))q.boarded=value;});}
  const blankDriver=()=>({id:uid(),firstName:'',lastName:'',documentType:'DNI',document:'',nationality:'Argentina',residence:'Argentina',occupation:'Chofer',sex:'',birthDate:'',phone:''});
  function validateDrivers(t){
    if(t.drivers===undefined)t.drivers=[];
    if(!Array.isArray(t.drivers)||t.drivers.length>2)throw Error('Se permiten hasta dos choferes por salida.');
    const ids=new Set(t.passengers.map(p=>p.id)),docs=new Set(t.passengers.filter(p=>p.document).map(p=>p.documentType+'|'+docKey(p.document)));
    for(const d of t.drivers){
      if(!d||Object.keys(blankDriver()).some(k=>typeof d[k]!=='string')||!d.id||ids.has(d.id))throw Error('Chofer inválido o repetido.');
      ids.add(d.id);
      if(!d.firstName.trim()||!d.lastName.trim())throw Error('Completá nombre y apellido del chofer.');
      if(!['DNI','Pasaporte','Cédula','Otro'].includes(d.documentType)||!['','F','M','X'].includes(d.sex))throw Error('Revisá documento y sexo del chofer.');
      if(d.birthDate&&(!validDate(d.birthDate)||d.birthDate>(t.departure||new Date().toISOString().slice(0,10))))throw Error('Revisá la fecha de nacimiento del chofer.');
      const key=d.documentType+'|'+docKey(d.document);if(d.document&&docs.has(key))throw Error('Ese documento ya está cargado en esta salida.');if(d.document)docs.add(key);
    }
  }
  function saveDriver(t,d){const next=[...(t.drivers||[])],i=next.findIndex(q=>q.id===d.id);if(i<0)next.push(d);else next[i]=d;validateDrivers({...t,drivers:next});t.drivers=next;}
  const manifestPeople=t=>[...(t.drivers||[]).map(d=>({...d,role:'Chofer'})),...t.passengers];
  function validateTrip(t) {
    if(!t||typeof t!=='object'||typeof t.id!=='string'||typeof t.name!=='string'||!t.name.trim()||typeof t.configured!=='boolean'||!Array.isArray(t.floors)||!Array.isArray(t.groups)||!Array.isArray(t.passengers))throw Error('Salida inválida.');
    if((t.layoutMode!=='list'&&t.floors.length<1)||t.floors.length>2||t.passengers.length>1000)throw Error('Dimensiones no admitidas.');
    const ids=new Set(),labels=new Set();
    for(const f of t.floors){if(!f||typeof f.name!=='string'||!Number.isInteger(f.rows)||f.rows<1||f.rows>40||!Number.isInteger(f.cols)||f.cols<3||f.cols>7||!Array.isArray(f.seats))throw Error('Plano inválido.');const positions=new Set();for(const s of f.seats){const pos=`${s.row},${s.col}`;if(typeof s.id!=='string'||ids.has(s.id)||typeof s.label!=='string'||!s.label.trim()||labels.has(norm(s.label))||!Number.isInteger(s.row)||s.row<0||s.row>=f.rows||!Number.isInteger(s.col)||s.col<0||s.col>=f.cols||positions.has(pos))throw Error('Butacas duplicadas o posiciones inválidas.');ids.add(s.id);labels.add(norm(s.label));positions.add(pos);}}
    if(t.layoutMode==='list'&&(!Number.isInteger(t.capacity)||t.capacity<1||t.capacity>100||t.floors.length))throw Error('Capacidad de lista inválida.');
    if(t.layoutMode!=='list'&&(ids.size<1||ids.size>100))throw Error('El colectivo debe tener entre 1 y 100 butacas.');
    for(const f of t.floors){
      if(f.fixtures===undefined)f.fixtures=[];
      if(!Array.isArray(f.fixtures))throw Error('Equipamiento inválido.');
      const occupied=new Set(f.seats.map(s=>`${s.row},${s.col}`));
      for(const item of f.fixtures){const pos=`${item?.row},${item?.col}`;
        if(!item||typeof item.id!=='string'||ids.has(item.id)||!Object.hasOwn(fixtureTypes,item.type)||!Number.isInteger(item.row)||item.row<0||item.row>=f.rows||!Number.isInteger(item.col)||item.col<0||item.col>=f.cols||occupied.has(pos))throw Error('Equipamiento superpuesto o inválido.');
        ids.add(item.id);occupied.add(pos);
      }
    }
    const gids=new Set();for(const g of t.groups){if(!g||typeof g.id!=='string'||gids.has(g.id)||typeof g.name!=='string'||!g.name.trim()||!/^#[0-9a-f]{6}$/i.test(g.color))throw Error('Grupo inválido.');gids.add(g.id);}
    validateDrivers(t);
    const pids=new Set();for(const p of t.passengers){if(!p||typeof p.id!=='string'||pids.has(p.id))throw Error('Pasajero inválido o repetido.');pids.add(p.id);for(const key of ['dniCopy','dniCheckedAt','dniQueryKey','dniSource','renaperStatus'])if(p[key]===undefined)p[key]='';for(const [k,v]of Object.entries(blankPassenger())){if(typeof p[k]!==typeof v)throw Error('Campo de pasajero inválido: '+k);}validatePassenger(t,p);}
    for(const [k,v]of Object.entries(blankTrip()))if(typeof v==='string'&&typeof t[k]!=='string')throw Error('Campo de salida inválido: '+k);
    for(const key of ['departure','returnDate','checkIn','checkOut'])if(t[key]&&!validDate(t[key]))throw Error('Fecha inválida: '+key);
    for(const [a,b]of [['departure','returnDate'],['checkIn','checkOut']])if(t[a]&&t[b]&&t[a]>t[b])throw Error('Las fechas de regreso o check out no pueden ser anteriores al inicio.');
    return t;
  }
  function validateStore(data){if(!data||data.version!==1||!Array.isArray(data.trips)||data.trips.length>200)throw Error('El respaldo no tiene un formato compatible.');const ids=new Set();data.trips.forEach(t=>{validateTrip(t);if(ids.has(t.id))throw Error('Salidas repetidas.');ids.add(t.id);});return data;}
  const api={blankDriver,saveDriver,manifestPeople,uid,blankTrip,blankPassenger,layout,seats,fixtures,fixtureTypes,placeItem,removeItem,age,norm,validatePassenger,savePassenger,setBoarded,validateTrip,validateStore};
  if(typeof module!=='undefined')module.exports=api;else root.Coral=api;
})(globalThis);
