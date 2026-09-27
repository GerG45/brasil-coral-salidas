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
// Generate one release identifier for the UI, both pages and the update notice.
const assets=fs.readdirSync(root).filter(n=>/\.(js|css)$/.test(n)).sort();
const build=crypto.createHash('sha256').update(assets.map(n=>n+'\n'+fs.readFileSync(path.join(root,n),'utf8')).join('\n')).digest('hex').slice(0,12);
for(const name of ['index.html','embarque.html']){const file=path.join(root,name);let html=fs.readFileSync(file,'utf8');html=html.replace(/name="coral-build" content="[^"]*"/,'name="coral-build" content="'+build+'"').replace(/Versión [^<]*/, 'Versión '+build+' ');fs.writeFileSync(file,html);}
fs.writeFileSync(path.join(root,'release.json'),JSON.stringify({build})+'\n');
