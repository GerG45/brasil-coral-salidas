(function(root){
 async function run(ids,query,wait,progress,signal){let completed=0;for(const id of ids){if(signal.stopped)break;progress({completed,total:ids.length,id});const ok=await query(id);if(!ok)return {completed,total:ids.length,error:true};completed++;progress({completed,total:ids.length,id:null});if(completed<ids.length&&!signal.stopped)await wait(5000);}return {completed,total:ids.length,stopped:signal.stopped};}
 const api={run};if(typeof module!=='undefined')module.exports=api;else root.CoralRenaperBatch=api;
})(globalThis);
