const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'../dist');
for(const name of ['index.html','embarque.html']){
 const file=path.join(root,name);
 let html=fs.readFileSync(file,'utf8');
 html=html.replace(/((?:src|href|data-app)=")([^"?]+\.(?:js|css))(?:\?v=[^"]*)?"/g,(match,prefix,asset)=>{
  if(asset.includes('://'))return match;
  const hash=crypto.createHash('sha256').update(fs.readFileSync(path.join(root,asset))).digest('hex').slice(0,12);
  return prefix+asset+'?v='+hash+'"';
 });
 fs.writeFileSync(file,html);
}
