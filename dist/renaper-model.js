(function(root){
 const fingerprint=p=>[p.documentType,String(p.document).replace(/[.\s-]/g,''),p.sex,p.birthDate].join('|');
 function request(p){const dni=String(p.document).replace(/[.\s-]/g,'');if(p.documentType!=='DNI'||!/^\d{7,8}$/.test(dni)||!['F','M','X'].includes(p.sex)||!/^\d{4}-\d{2}-\d{2}$/.test(p.birthDate))throw Error('Para consultar RENAPER completá DNI, sexo del documento y nacimiento.');return {dni,sex:p.sex,birthDate:p.birthDate};}
 function parse(text){const s=String(text).replace(/\s+/g,' ').trim();const m=s.match(/^(?:el\s+)?ejemplar\s+vigente\b.{0,180}?(?:es\s*:?|:)\s*(?:el\s+)?(?:ejemplar\s*)?["'«]?([A-Z]{1,2})["'»]?[.\s]*$/i);return m&&m[1]===m[1].toUpperCase()&&!['NO','EL','ES','LA'].includes(m[1])?m[1]:'';}
 const api={fingerprint,request,parse};if(typeof module!=='undefined')module.exports=api;else root.CoralRenaper=api;
})(globalThis);
