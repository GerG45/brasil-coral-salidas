import {firebaseConfig,ownerEmail} from './cloud-config.js';
const M=window.CoralCloudModel;
const gate=document.createElement('section');gate.id='cloud-gate';
gate.innerHTML='<div class="cloud-card"><img src="assets/brasil-coral.png" alt="Brasil Coral"><h1>Tu viaje empieza acá</h1><p id="cloud-message" role="status">Conectando con el guardado seguro…</p><button id="cloud-login" hidden>Ingresar con Google</button><button id="cloud-retry" hidden>Reintentar</button><button id="cloud-exit" hidden>Cerrar sesión</button></div>';
document.body.append(gate);
const message=gate.querySelector('#cloud-message'),login=gate.querySelector('#cloud-login'),retry=gate.querySelector('#cloud-retry'),exit=gate.querySelector('#cloud-exit');
retry.onclick=()=>location.reload();
function fail(text){document.documentElement.classList.remove('cloud-ready');gate.hidden=false;message.textContent=text;retry.hidden=false;}
try{
  if(!firebaseConfig)throw Error('La conexión con Firebase todavía no está configurada.');
  const [appSDK,authSDK,dbSDK]=await Promise.all([
    import('https://www.gstatic.com/firebasejs/12.16.0/firebase-app.js'),
    import('https://www.gstatic.com/firebasejs/12.16.0/firebase-auth.js'),
    import('https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js')
  ]);
  const app=appSDK.initializeApp(firebaseConfig),auth=authSDK.getAuth(app);
  const db=dbSDK.initializeFirestore(app,{localCache:dbSDK.memoryLocalCache()});
  await authSDK.setPersistence(auth,authSDK.browserSessionPersistence);
  const tripsRef=dbSDK.collection(db,'coral_trips');
  let state={version:1,trips:[]},revisions={},loaded=false,unsubscribe=null,busy=false;
  const readDoc=d=>{const record=d.data();if(!Number.isSafeInteger(record.revision)||record.revision<1)throw Error('Versión de salida inválida.');const t=JSON.parse(record.payload);if(t.id!==d.id)throw Error('Identificador de salida inválido.');M.payload(t);return t;};
  const snapshot=()=>({data:M.copy(state),revisions:{...revisions}});
  const event=()=>window.dispatchEvent(new CustomEvent('coral-cloud-update'));
  const refresh=async()=>{const docs=await dbSDK.getDocsFromServer(tripsRef);const next={version:1,trips:docs.docs.map(readDoc)};window.Coral.validateStore(next);state=next;revisions=Object.fromEntries(docs.docs.map(d=>[d.id,d.data().revision]));};
  async function operation(fn){
    if(busy)throw Error('Hay otro cambio guardándose.');
    if(!navigator.onLine)throw Error('Sin conexión. El cambio no se guardó; conectate y volvé a intentarlo.');
    busy=true;document.body.classList.add('cloud-saving');
    const nodes=[...document.body.children].filter(n=>n!==gate&&n.tagName!=='SCRIPT');nodes.forEach(n=>n.inert=true);
    try{await fn();try{await refresh();}catch{const error='El cambio fue enviado, pero no se pudo verificar la última versión. Reconectate y reintentá cargar antes de editar.';fail(error);throw Error(error);}return snapshot();}
    catch(e){try{await refresh();}catch{}throw e;}
    finally{busy=false;nodes.forEach(n=>n.inert=false);document.body.classList.remove('cloud-saving');event();}
  }
  window.CoralCloud={snapshot,isBusy:()=>busy,
    save(next,base){const changes=M.changes(next,base.data);return operation(async()=>{
      if(!changes.length)return;
      await dbSDK.runTransaction(db,async tx=>{
        const refs=changes.map(c=>dbSDK.doc(tripsRef,c.id));
        const docs=await Promise.all(refs.map(ref=>tx.get(ref)));
        changes.forEach((change,i)=>{
          const actual=docs[i].exists()?docs[i].data().revision:0;
          M.assertRevision(actual,base.revisions[change.id]||0);
          if(change.payload===null)tx.delete(refs[i]);
          else tx.set(refs[i],{payload:change.payload,revision:actual+1,updatedAt:dbSDK.serverTimestamp(),updatedBy:auth.currentUser.uid});
        });
      });
    });},
    board(tripId,passengerId,value){return operation(()=>dbSDK.runTransaction(db,async tx=>{
      const ref=dbSDK.doc(tripsRef,tripId),doc=await tx.get(ref);
      if(!doc.exists())throw Error('La salida ya no existe.');
      const next=M.board(readDoc(doc),passengerId,value);
      tx.set(ref,{payload:M.payload(next),revision:doc.data().revision+1,updatedAt:dbSDK.serverTimestamp(),updatedBy:auth.currentUser.uid});
    }));}
  };
  const logout=async()=>{if(busy)return;unsubscribe?.();await authSDK.signOut(auth);location.reload();};
  exit.onclick=logout;
  login.onclick=async()=>{login.disabled=true;message.textContent='Elegí tu cuenta en la ventana de Google. Si no se abre, permití ventanas emergentes o abrí este enlace en Chrome o Safari.';retry.hidden=false;try{await authSDK.signInWithPopup(auth,new authSDK.GoogleAuthProvider());}catch(e){message.textContent='No se pudo iniciar sesión ('+e.code+'). Permití ventanas emergentes y volvé a intentarlo.';}finally{login.disabled=false;}};
  authSDK.onAuthStateChanged(auth,async user=>{
    unsubscribe?.();
    if(!user){if(loaded){location.reload();return;}message.textContent='Ingresá con la cuenta autorizada de Brasil Coral para ver y gestionar las salidas.';login.hidden=false;return;}
    exit.hidden=false;login.hidden=true;
    if(!user.emailVerified||user.email?.toLowerCase()!==ownerEmail){fail('Esta cuenta no está autorizada para ver las salidas de Brasil Coral. Cerrá sesión e ingresá con la cuenta administradora.');return;}
    message.textContent='Cargando salidas desde Firebase…';
    unsubscribe=dbSDK.onSnapshot(tripsRef,{includeMetadataChanges:true},async docs=>{
      if(docs.metadata.fromCache||docs.metadata.hasPendingWrites)return;
      try{
        const next={version:1,trips:docs.docs.map(readDoc)};window.Coral.validateStore(next);
        state=next;revisions=Object.fromEntries(docs.docs.map(d=>[d.id,d.data().revision]));
        if(!loaded){loaded=true;const script=document.createElement('script');script.src=document.body.dataset.app;
          script.onload=()=>{gate.hidden=true;document.documentElement.classList.add('cloud-ready');};
          script.onerror=()=>fail('No se pudo cargar la aplicación. Reintentá.');document.body.append(script);
          const account=document.createElement('div');account.id='cloud-account';account.append(document.createTextNode(user.email));const out=document.createElement('button');out.textContent='Cerrar sesión';out.onclick=logout;account.append(out);document.body.append(account);
        }else if(!busy)event();
      }catch(e){fail('No se pudieron leer las salidas: '+e.message);}
    },()=>fail('No se pudo acceder a Firebase. Revisá la conexión y los permisos de tu cuenta.'));
  });
}catch(e){fail(e.message);}
