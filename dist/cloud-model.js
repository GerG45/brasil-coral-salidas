(function(root){
  'use strict';
  const core=typeof module!=='undefined'?require('./core.js'):root.Coral;
  const copy=v=>JSON.parse(JSON.stringify(v));
  function payload(trip){
    core.validateTrip(trip);
    if(!/^[A-Za-z0-9_-]{1,128}$/.test(trip.id))throw Error('Identificador de salida no compatible.');
    const value=JSON.stringify(trip);
    if(new TextEncoder().encode(value).length>800000)throw Error('La salida supera el tamaño permitido.');
    return value;
  }
  function changes(next,base){
    core.validateStore(next);core.validateStore(base);
    const old=new Map(base.trips.map(t=>[t.id,payload(t)]));
    const fresh=new Map(next.trips.map(t=>[t.id,payload(t)]));
    return [...new Set([...old.keys(),...fresh.keys()])].filter(id=>old.get(id)!==fresh.get(id)).map(id=>({id,payload:fresh.get(id)??null}));
  }
  function assertRevision(actual,expected){if(actual!==expected)throw Error('La salida cambió en otro equipo. Se cargó la última versión; revisá los datos y repetí el cambio.');}
  function board(latest,id,value){const next=copy(latest);if(!next.passengers.some(p=>p.id===id))throw Error('Este pasajero ya no está en la salida.');core.setBoarded(next,id,value,false);payload(next);return next;}
  const api={copy,payload,changes,assertRevision,board};
  if(typeof module!=='undefined')module.exports=api;else root.CoralCloudModel=api;
})(globalThis);
