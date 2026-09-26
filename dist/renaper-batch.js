(function(root){
 async function run(ids,query,wait,progress,signal){let completed=0;const results=[];for(const id of ids){if(signal.stopped)break;progress({completed,processed:results.length,total:ids.length,id});let outcome;try{outcome=await query(id);}catch(e){outcome={ok:false,message:e.message};}const ok=outcome===true||outcome?.ok===true;results.push({id,ok,message:outcome?.message||(ok?'Guardado':'No se pudo completar la consulta')});if(ok)completed++;progress({completed,processed:results.length,total:ids.length,id:null});if(results.length<ids.length&&!signal.stopped)await wait(5000);}return {completed,total:ids.length,results,stopped:signal.stopped};}
 const api={run};if(typeof module!=='undefined')module.exports=api;else root.CoralRenaperBatch=api;
})(globalThis);
