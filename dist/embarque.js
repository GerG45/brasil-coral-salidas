'use strict';
const KEY='coral-salidas-v1',C=Coral,$=s=>document.querySelector(s);
const escapeHTML=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let data={version:1,trips:[]},activeId=new URLSearchParams(location.search).get('salida')||'',incoming=null,blocked=false;
function status(text,error=false){$('#status').textContent=text;$('#status').classList.toggle('error',error);}
function load(){data=CoralCloud.snapshot().data;blocked=false;if(!data.trips.some(t=>t.id===activeId))activeId=data.trips[0]?.id||'';}
function selected(){return data.trips.find(t=>t.id===activeId);}
function render(){
  const t=selected();$('#trip').innerHTML=data.trips.length?data.trips.map(t=>`<option value="${escapeHTML(t.id)}" ${t.id===activeId?'selected':''}>${escapeHTML(t.name)}</option>`).join(''):'<option>Sin salidas cargadas</option>';
  $('#export').disabled=!data.trips.length||blocked;
  $('#journey').textContent=t?`${t.origin} → ${t.destination} · ${t.departure?t.departure.split('-').reverse().join('/'):'Fecha sin definir'}`:'';
  const people=t?.passengers||[],entered=people.filter(p=>p.boarded).length;
  $('#total').textContent=people.length;$('#boarded').textContent=entered;$('#pending').textContent=people.length-entered;$('#minors').textContent=people.filter(p=>{const age=C.age(p.birthDate,t.departure);return age!==''&&age<18;}).length;
  if(!t){$('#list').innerHTML='<div class="empty"><h2>Todavía no hay salidas</h2>Creá o importá una salida en la gestión. Aparecerá automáticamente en esta lista.</div>';return;}
  const query=C.norm($('#search').value),filter=$('#filter').value;
  const rows=people.map(p=>({p,seat:t.layoutMode==='list'?(p.sourceNumber||'—'):(C.seats(t).find(s=>s.id===p.seatId)?.label||''),group:t.groups.find(g=>g.id===p.groupId)?.name||'',age:C.age(p.birthDate,t.departure)})).filter(({p,seat,group,age})=>C.norm([p.firstName,p.lastName,p.document,seat,group,p.boarding].join(' ')).includes(query)&&(filter==='all'||filter==='pending'&&!p.boarded||filter==='boarded'&&p.boarded||filter==='minor'&&age!==''&&age<18)).sort((a,b)=>(a.p.lastName+' '+a.p.firstName).localeCompare(b.p.lastName+' '+b.p.firstName,'es'));
  $('#list').innerHTML=rows.length?rows.map(({p,seat,group,age})=>`<article class="passenger ${p.boarded?'checked':''}"><div class="seat"><strong>${escapeHTML(p.noSeat?'—':seat||'?')}</strong><small>${p.noSeat?'Sin butaca':t.layoutMode==='list'?'Orden de lista':seat?'Butaca':'Por asignar'}</small></div><div><div class="person-head"><h2>${escapeHTML(p.lastName)}, ${escapeHTML(p.firstName)}</h2>${age===''?'<span class="badge unknown">Edad sin confirmar</span>':age<18?`<span class="badge">Menor de 18 · ${age} ${age===1?'año':'años'}</span>`:''}</div><p class="details">${escapeHTML(p.documentType)} ${escapeHTML(p.document||'sin documento')}${group?' · '+escapeHTML(group):''}<br>${escapeHTML(p.boarding||'Embarque sin definir')}${p.role!=='Pasajero'?' · '+escapeHTML(p.role):''}</p></div><label class="boarding-check"><input type="checkbox" data-person="${escapeHTML(p.id)}" ${p.boarded?'checked':''} ${blocked?'disabled':''} aria-label="Ingresó ${escapeHTML(p.firstName+' '+p.lastName)}"><span>${p.boarded?'Ingresó':'Marcar ingreso'}</span></label></article>`).join(''):'<div class="empty">'+(people.length?'No hay personas que coincidan con este filtro.':'Esta salida todavía no tiene pasajeros.')+'</div>';
}
$('#list').addEventListener('change',async e=>{
  if(!e.target.matches('[data-person]'))return;
  const id=e.target.dataset.person,value=e.target.checked,tripId=activeId;
  if(CoralCloud.isBusy()){render();return;}
  const p=selected()?.passengers.find(p=>p.id===id);render();
  try{await CoralCloud.board(tripId,id,value);load();status((p?.firstName||'Pasajero')+': '+(value?'ingreso registrado':'ingreso desmarcado')+'. Guardado en Firebase.');}
  catch(e){load();status(e.message,true);}
  render();const checkbox=Array.from(document.querySelectorAll('[data-person]')).find(el=>el.dataset.person===id);checkbox?.focus({preventScroll:true});
});
$('#trip').onchange=e=>{activeId=e.target.value;$('#search').value='';status('');render();};
$('#search').oninput=render;$('#filter').onchange=render;
$('#export').onclick=()=>{load();if(blocked)return;const url=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download=`coral-embarque-${new Date().toISOString().slice(0,10)}.json`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);status('Respaldo preparado con los ingresos actuales.');};
$('#import').onclick=()=>$('#file').click();$('#cancel').onclick=()=>{$('#confirm').close();incoming=null;};
$('#file').onchange=async e=>{const file=e.target.files[0];e.target.value='';if(!file)return;try{if(file.size>10*1024*1024)throw Error('El archivo supera los 10 MB.');incoming=C.validateStore(JSON.parse(await file.text()));$('#import-summary').textContent=`El respaldo contiene ${incoming.trips.length} salidas y ${incoming.trips.reduce((n,t)=>n+t.passengers.length,0)} personas.`;$('#confirm').showModal();}catch(err){status('No se pudo cargar: '+err.message,true);}};
$('#accept').onclick=async()=>{if(!incoming)return;const base=CoralCloud.snapshot();try{await CoralCloud.save(incoming,base);incoming=null;load();$('#confirm').close();$('#search').value='';$('#filter').value='all';status('Respaldo guardado en Firebase.');render();}catch(e){status(e.message,true);}};
window.addEventListener('coral-cloud-update',()=>{load();render();});
window.addEventListener('pageshow',()=>{load();render();});load();render();
