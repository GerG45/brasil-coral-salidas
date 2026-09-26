(async()=>{
 const job=await chrome.runtime.sendMessage({kind:'getJob'});if(!job.payload)return;
 const form=document.querySelector('#miejemplar'),dni=document.querySelector('#dni'),sex=document.querySelector('#tipoDoc'),birth=document.querySelector('#fecha');
 if(!form||!dni||!sex||!birth){await chrome.runtime.sendMessage({kind:'done',error:'Cambió el formulario de RENAPER. Consultá manualmente.'});return;}
 dni.value=job.payload.dni;sex.value=job.payload.sex;birth.value=job.payload.birthDate;
 for(const el of [dni,sex,birth]){el.dispatchEvent(new Event('input',{bubbles:true}));el.dispatchEvent(new Event('change',{bubbles:true}));}
 const note=document.createElement('p');note.textContent='Brasil Coral completó los datos. La consulta se enviará por el formulario oficial. Si RENAPER pide una verificación, completala en esta página.';note.style.cssText='padding:16px;background:#eaf4ed;color:#173d29';form.before(note);
 let finished=false;
 const finish=async message=>{if(finished)return;finished=true;observer.disconnect();clearTimeout(timeout);await chrome.runtime.sendMessage({kind:'done',...message});note.textContent=message.error||'Resultado enviado a Brasil Coral. Podés volver a la lista.';};
 const observer=new MutationObserver(()=>{const panel=document.querySelector('#panel_mensaje'),text=document.querySelector('#texto_mensaje')?.innerText?.trim();if(panel&&!panel.classList.contains('hidden')&&text&&text!=='El ejemplar vigente para el documento ingresado es:')finish({text});});
 observer.observe(document.body,{subtree:true,childList:true,attributes:true});
 const timeout=setTimeout(()=>finish({error:'RENAPER no respondió. Revisá la página o volvé a intentar. No se guardó un ejemplar.'}),120000);
 // Use the site's normal form, including its own reCAPTCHA. No direct endpoint or token handling.
 form.requestSubmit();
})().catch(()=>{});
