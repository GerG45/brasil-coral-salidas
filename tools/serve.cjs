'use strict';
const http=require('node:http'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'../dist');
const lan=process.argv.includes('--lan'),port=lan?4174:4173;
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.svg':'image/svg+xml','.png':'image/png'};
const server=http.createServer((req,res)=>{try{const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);const file=path.resolve(root,'.'+(pathname==='/'?'/index.html':pathname));if(file!==root&&!file.startsWith(root+path.sep)){res.writeHead(403);res.end();return;}fs.readFile(file,(err,content)=>{if(err){res.writeHead(404);res.end('No encontrado');return;}res.writeHead(200,{'Content-Type':types[path.extname(file)]||'application/octet-stream','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});res.end(content);});}catch(e){res.writeHead(400);res.end('Solicitud inválida');}});
server.listen(port,lan?'0.0.0.0':'127.0.0.1',()=>{
  console.log(`Coral local: http://127.0.0.1:${port}`);
  if(lan){for(const addresses of Object.values(require('node:os').networkInterfaces()))for(const address of addresses||[])if(address.family==='IPv4'&&!address.internal)console.log(`iPad, misma Wi-Fi: http://${address.address}:${port}/embarque.html`);console.log('Solo se sirve la aplicación. Cargar respaldo en el iPad; los datos no se sincronizan.');}
});
server.on('error',e=>{console.error(e.code==='EADDRINUSE'?`El puerto ${port} ya está en uso. Cerrá la otra instancia o abrí http://127.0.0.1:${port}`:e.message);process.exitCode=1;});
