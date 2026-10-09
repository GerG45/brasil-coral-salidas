const {test}=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs'),C=require('../dist/core.js');
test('Embarque y gestión conservan el segundo colectivo y actualizan el enlace al cambiar',()=>{
 const trips=[C.blankTrip(),C.blankTrip()];const nodes=new Map();const node=()=>({value:'',innerHTML:'',classList:{toggle(){},add(){},remove(){}},addEventListener(){},before(){},after(){},append(){}});const document={querySelector(s){if(!nodes.has(s))nodes.set(s,node());return nodes.get(s);},querySelectorAll:()=>[],createElement:node,addEventListener(){}};
 const location={href:'https://example.test/embarque.html?salida='+trips[1].id,search:'?salida='+trips[1].id};const history={replaceState(a,b,url){location.href=String(url);location.search=new URL(url).search;}};
 const common={Coral:C,CoralCloud:{snapshot:()=>({data:{version:1,trips}})},document,window:{addEventListener(){}},URL,URLSearchParams,location,history,structuredClone,localStorage:{getItem:()=>null},console};const boarding=vm.createContext({...common});vm.runInContext(fs.readFileSync(require.resolve('../dist/embarque.js'),'utf8'),boarding);
 assert.equal(nodes.get('#back-management').href,'index.html?salida='+trips[1].id);
 location.href=new URL(nodes.get('#back-management').href,location.href).href;location.search=new URL(location.href).search;
 const app=vm.createContext({...common});vm.runInContext(fs.readFileSync(require.resolve('../dist/app.js'),'utf8'),app);assert.equal(vm.runInContext('activeId',app),trips[1].id);
 nodes.get('#trip').onchange({target:{value:trips[0].id}});assert.equal(nodes.get('#back-management').href,'index.html?salida='+trips[0].id);
});
