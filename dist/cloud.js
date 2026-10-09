import {firebaseConfig,allowedEmails} from './cloud-config.js?v=access-2';
const M=window.CoralCloudModel;
const gate=document.createElement('section');gate.id='cloud-gate';
gate.innerHTML='<div class="cloud-card"><img src="assets/brasil-coral.png" alt="Brasil Coral"><h1>Tu viaje empieza acá</h1><p id="cloud-message" role="status">Conectando con el guardado seguro…</p><button id="cloud-login" hidden>Ingresar con Google</button><button id="cloud-retry" hidden>Reintentar</button><button id="cloud-exit" hidden>Cerrar sesión</button></div>';
document.body.append(gate);
const message=gate.querySelector('#cloud-message'),login=gate.querySelector('#cloud-login'),retry=gate.querySelector('#cloud-retry'),exit=gate.querySelector('#cloud-exit');
retry.onclick=()=>location.reload();
function fail(text){document.documentElement.classList.remove('cloud-ready');gate.hidden=false;message.textContent=text;retry.hidden=false;}
try{
 const [appSDK,authSDK,dbSDK]=await Promise.all([
  import('https://www.gstatic.com/firebasejs/12.16.0/firebase-app.js'),
  import('https://www.gstatic.com/firebasejs/12.16.0/firebase-auth.js'),
  import('https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js')
 ]);
 const app=appSDK.initializeApp(firebaseConfig),auth=authSDK.getAuth(app);
 const db=dbSDK.initializeFirestore(app,{localCache:dbSDK.memoryLocalCache()});
 await authSDK.setPersistence(auth,authSDK.browserLocalPersistence);
 const tripsRef=dbSDK.collection(db,'coral_trips');
 let state={version:1,trips:[]},revisions={},loaded=false,busy=false,isAdmin=false,grants={},listeners=[],accessListener=null;
 const raw=new Map(),boarding=new Map(),boardListeners=new Map();
 const can=(id,permission)=>isAdmin||grants[id]?.[permission]===true;
 const pagePermission=location.pathname.endsWith('embarque.html')?'boarding':null;
 const readDoc=d=>{const record=d.data();if(!Number.isSafeInteger(record.revision)||record.revision<1)throw Error('Versión de salida inválida.');const t=JSON.parse(record.payload);if(t.id!==d.id)throw Error('Identificador inválido.');M.payload(t);return t;};
 const snapshot=()=>({data:M.copy(state),revisions:{...revisions}});
 const event=()=>window.dispatchEvent(new CustomEvent('coral-cloud-update'));
 const rebuild=()=>{state={version:1,trips:[...raw.values()].map(t=>{const next=M.copy(t),marks=boarding.get(t.id);for(const p of next.passengers)if(marks?.has(p.id))p.boarded=marks.get(p.id);return next;})};};
 const stop=()=>{listeners.forEach(fn=>fn());listeners=[];boardListeners.forEach(fn=>fn());boardListeners.clear();};
 const deny=text=>{stop();raw.clear();boarding.clear();state={version:1,trips:[]};revisions={};event();fail(text);};
 const install=()=>{
  rebuild();
  if(!loaded){loaded=true;const script=document.createElement('script');script.src=document.body.dataset.app;
   script.onload=()=>{gate.hidden=true;document.documentElement.classList.add('cloud-ready');};
   script.onerror=()=>fail('No se pudo cargar la aplicación. Reintentá.');document.body.append(script);
   const account=document.createElement('div');account.id='cloud-account';account.append(document.createTextNode(auth.currentUser.email+(isAdmin?' · Administrador':' · Coordinador')));const out=document.createElement('button');out.textContent='Cerrar sesión';out.onclick=logout;account.append(out);
   const dock=document.createElement('div');dock.id='cloud-account-dock';const toggle=document.createElement('button');toggle.type='button';toggle.id='cloud-account-toggle';toggle.textContent='Cuenta';toggle.setAttribute('aria-label','Mostrar opciones de cuenta');toggle.setAttribute('aria-controls','cloud-account');toggle.setAttribute('aria-expanded','false');
   const setOpen=value=>{dock.classList.toggle('is-open',value);toggle.setAttribute('aria-expanded',String(value));account.setAttribute('aria-hidden',String(!value));};setOpen(false);
   toggle.onclick=()=>setOpen(true);
   dock.onpointerenter=e=>{if(e.pointerType==='mouse')setOpen(true);};dock.onpointerleave=()=>{if(!dock.contains(document.activeElement))setOpen(false);};
   dock.onfocusin=()=>setOpen(true);dock.onfocusout=e=>{if(!dock.contains(e.relatedTarget))setOpen(false);};dock.onkeydown=e=>{if(e.key==='Escape'){document.activeElement?.blur();setOpen(false);}};
   document.addEventListener('pointerdown',e=>{if(!dock.contains(e.target))setOpen(false);});dock.append(toggle,account);document.body.append(dock);
  }else if(!busy)event();
 };
 async function receive(docs){
  const ids=new Set(docs.map(d=>d.id));
  for(const id of raw.keys())if(!ids.has(id)){raw.delete(id);boarding.delete(id);delete revisions[id];boardListeners.get(id)?.();boardListeners.delete(id);}
  for(const d of docs){if((revisions[d.id]||0)>d.data().revision)continue;raw.set(d.id,readDoc(d));revisions[d.id]=d.data().revision;}
  // Wait for authoritative attendance once, so existing checks never flash as pending.
  await Promise.all(docs.filter(d=>!boardListeners.has(d.id)).map(d=>new Promise((resolve,reject)=>{
   boardListeners.set(d.id,()=>{});
   const unsub=dbSDK.onSnapshot(dbSDK.collection(tripsRef,d.id,'boarding'),{includeMetadataChanges:true},snap=>{
    if(snap.metadata.fromCache||snap.metadata.hasPendingWrites)return;
    boarding.set(d.id,new Map(snap.docs.map(mark=>[mark.id,mark.data().boarded])));rebuild();if(loaded&&!busy)event();resolve();
   },e=>{reject(e);deny('Se perdió el acceso a esta salida. Volvé a iniciar sesión.');});
   boardListeners.set(d.id,unsub);
  })));
  install();
 }
 const refresh=async()=>{
  const docs=isAdmin?(await dbSDK.getDocsFromServer(tripsRef)).docs:await Promise.all(Object.keys(grants).filter(id=>(!pagePermission||can(id,pagePermission))&&(can(id,'boarding')||can(id,'documents'))).map(id=>dbSDK.getDocFromServer(dbSDK.doc(tripsRef,id))));
  await receive(docs.filter(d=>d.exists()));
 };
 async function operation(fn,refreshAfter=true){
  if(busy)throw Error('Hay otro cambio guardándose.');
  if(!navigator.onLine)throw Error('Sin conexión. El cambio no se guardó; conectate y volvé a intentarlo.');
  busy=true;document.body.classList.add('cloud-saving');
  const nodes=[...document.body.children].filter(n=>n!==gate&&n.tagName!=='SCRIPT');nodes.forEach(n=>n.inert=true);
  try{await fn();if(refreshAfter)await refresh();return snapshot();}
  catch(e){try{await refresh();}catch{}throw Error(e.code==='permission-denied'?'No tenés permiso para esta acción o tu acceso fue revocado.':e.message);}
  finally{busy=false;nodes.forEach(n=>n.inert=false);document.body.classList.remove('cloud-saving');event();}
 }
 window.CoralCloud={snapshot,isBusy:()=>busy,isAdmin:()=>isAdmin,can,
  async listAccess(){if(!isAdmin)throw Error('Solo administradores.');return (await dbSDK.getDocsFromServer(dbSDK.collection(db,'coral_access'))).docs.map(d=>({email:d.id,...d.data()}));},
  async setAccess(email,permissions){if(!isAdmin)throw Error('Solo administradores.');const draft=M.accessDraft(email,permissions);if(allowedEmails.includes(draft.email))throw Error('Esta cuenta ya es administradora.');await dbSDK.setDoc(dbSDK.doc(db,'coral_access',draft.email),{enabled:true,grants:draft.grants,updatedAt:dbSDK.serverTimestamp(),updatedBy:auth.currentUser.uid});},
  async revokeAccess(email){if(!isAdmin)throw Error('Solo administradores.');await dbSDK.deleteDoc(dbSDK.doc(db,'coral_access',email));},
  save(next,base){if(!isAdmin)return Promise.reject(Error('Tu acceso permite tomar lista y consultar documentos; no editar la salida.'));const changes=M.changes(next,base.data);return operation(async()=>{
   if(!changes.length)return;
   await dbSDK.runTransaction(db,async tx=>{
    const refs=changes.map(c=>dbSDK.doc(tripsRef,c.id));const docs=await Promise.all(refs.map(ref=>tx.get(ref)));
    changes.forEach((change,i)=>{
     const actual=docs[i].exists()?docs[i].data().revision:0;M.assertRevision(actual,base.revisions[change.id]||0);
     if(change.payload===null)tx.delete(refs[i]);
     else {const t=JSON.parse(change.payload),old=base.data.trips.find(t=>t.id===change.id);
      tx.set(refs[i],{payload:change.payload,passengerIds:t.passengers.map(p=>p.id),revision:actual+1,updatedAt:dbSDK.serverTimestamp(),updatedBy:auth.currentUser.uid});
      for(const p of t.passengers){const previous=old?.passengers.find(x=>x.id===p.id);if(!previous||previous.boarded!==p.boarded)tx.set(dbSDK.doc(tripsRef,t.id,'boarding',p.id),{boarded:!!p.boarded,updatedAt:dbSDK.serverTimestamp(),updatedBy:auth.currentUser.uid});}
     }
    });
   });
  });},
  board(tripId,passengerId,value){if(!can(tripId,'boarding'))return Promise.reject(Error('No tenés permiso para tomar lista en esta salida.'));return operation(async()=>{
   await dbSDK.runTransaction(db,async tx=>{
    const doc=await tx.get(dbSDK.doc(tripsRef,tripId));if(!doc.exists())throw Error('La salida ya no existe.');
    M.board(readDoc(doc),passengerId,value);
    tx.set(dbSDK.doc(tripsRef,tripId,'boarding',passengerId),{boarded:value,updatedAt:dbSDK.serverTimestamp(),updatedBy:auth.currentUser.uid});
   });
   if(!boarding.has(tripId))boarding.set(tripId,new Map());boarding.get(tripId).set(passengerId,value);rebuild();
  },false);}
 };
 const logout=async()=>{if(busy)return;stop();accessListener?.();await authSDK.signOut(auth);location.reload();};
 exit.onclick=logout;
 login.onclick=async()=>{login.disabled=true;message.textContent='Elegí tu cuenta de Google autorizada.';try{await authSDK.signInWithPopup(auth,new authSDK.GoogleAuthProvider());}catch(e){message.textContent='No se pudo iniciar sesión ('+e.code+'). Permití ventanas emergentes y reintentá.';}finally{login.disabled=false;}};
 authSDK.onAuthStateChanged(auth,async user=>{
  stop();accessListener?.();
  if(!user){if(loaded){location.reload();return;}message.textContent='Ingresá con tu cuenta autorizada de Brasil Coral.';login.hidden=false;return;}
  exit.hidden=false;login.hidden=true;
  if(!user.emailVerified){fail('Usá una cuenta de Google con correo verificado.');return;}
  isAdmin=allowedEmails.includes(user.email.toLowerCase());
  if(isAdmin){listeners.push(dbSDK.onSnapshot(tripsRef,{includeMetadataChanges:true},snap=>{if(!snap.metadata.fromCache&&!snap.metadata.hasPendingWrites)receive(snap.docs).catch(e=>fail(e.message));},()=>deny('No se pudo acceder a Firebase. Revisá tu conexión.')));return;}
  let accessKey=null;
  accessListener=dbSDK.onSnapshot(dbSDK.doc(db,'coral_access',user.email.toLowerCase()),{includeMetadataChanges:true},async snap=>{
   if(snap.metadata.fromCache||snap.metadata.hasPendingWrites)return;
   const a=snap.exists()?snap.data():null;
   if(!a?.enabled||!Object.keys(a.grants||{}).length){deny('Tu correo no tiene accesos activos. Pedí al administrador que te asigne una salida.');return;}
   const key=JSON.stringify(a.grants);if(accessKey===key)return;
   if(accessKey!==null){location.reload();return;}accessKey=key;grants=a.grants;
   const ids=Object.keys(grants).filter(id=>(can(id,'boarding')||can(id,'documents'))&&(!pagePermission||can(id,pagePermission)));
   if(!ids.length){deny('No tenés permiso para tomar lista. Entrá a la página principal para ver tus documentos.');return;}
   const assigned=new Map();let initial=new Set(ids);
   for(const id of ids)listeners.push(dbSDK.onSnapshot(dbSDK.doc(tripsRef,id),{includeMetadataChanges:true},doc=>{
    if(doc.metadata.fromCache||doc.metadata.hasPendingWrites)return;
    initial.delete(id);if(doc.exists())assigned.set(id,doc);else assigned.delete(id);
    if(!initial.size)receive([...assigned.values()]).catch(e=>fail(e.message));
   },()=>deny('Tu acceso a una salida cambió. Volvé a ingresar.')));
  },()=>deny('No se pudo comprobar tu acceso. Revisá la conexión y reintentá.'));
 });
}catch(e){fail(e.message);}
