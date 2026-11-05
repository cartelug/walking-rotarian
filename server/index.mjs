import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { openStore } from './store.mjs';
import { createApplication } from './app.mjs';
import { processJobs,queueDueDigests } from './jobs.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const staticDir=path.resolve(root,process.env.STATIC_DIR||'dist');
const seed=JSON.parse(fs.readFileSync(path.join(staticDir,'data/platform.json'),'utf8'));
const dataDir=path.resolve(process.env.DATA_DIR||path.join(root,'runtime'));
const store=openStore(dataDir,seed);
if(process.env.NODE_ENV==='production'&&!/^https:\/\//.test(process.env.PUBLIC_URL||''))throw new Error('Set PUBLIC_URL to the HTTPS backend address, including the site subdirectory.');
// Recover interrupted sends conservatively. Facebook is never posted twice blindly.
store.db.prepare("UPDATE jobs SET state=CASE WHEN type='facebook' THEN 'needs_review' ELSE 'retry' END WHERE state='working'").run();
const app=createApplication({store,seed,staticDir,dataDir,publicURL:process.env.PUBLIC_URL||'',allowedOrigins:(process.env.ALLOWED_ORIGINS||'').split(',').filter(Boolean),env:process.env});
const argument=name=>{const i=process.argv.indexOf(name);return i<0?'':process.argv[i+1];};
const port=Number(argument('--port')||process.env.PORT||8080);
app.server.listen(port,argument('--host')||process.env.HOST||'0.0.0.0',()=>console.log(`Walking Rotarian server listening on port ${port}`));
let working=false;
const timer=setInterval(async()=>{if(working)return;working=true;try{queueDueDigests(store,process.env,(process.env.PUBLIC_URL||'').replace(/\/$/,''));await processJobs(store,process.env);}catch(e){console.error('Delivery check failed:',e.name);}finally{working=false;}},30000);timer.unref();
function shutdown(){clearInterval(timer);app.server.close(()=>{store.close();process.exit(0);});}
process.on('SIGTERM',shutdown);process.on('SIGINT',shutdown);
