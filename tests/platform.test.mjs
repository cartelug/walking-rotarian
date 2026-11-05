import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,writeFile,mkdir,rm} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {openStore} from '../server/store.mjs';
import {createApplication} from '../server/app.mjs';
import {passwordHash,digest} from '../server/security.mjs';
import {processJobs,queueDueDigests} from '../server/jobs.mjs';
import {validateRecord,visibleEntries,distanceTotal,webURL,facebookURL} from '../src/assets/platform/model.js';
import {jpegPagesToPDF} from '../src/assets/platform/exports.js';

const past=new Date(Date.now()-3600000).toISOString();
const entry=(id,extra={})=>({id,title:id,body:'A sourced update from the road.',journey:'current',type:'update',status:'published',publishedAt:past,author:'Test editor',media:[],sources:[],...extra});
const PASSWORD='Testing only - not a deployed account!';
async function fixture(env={}){
  const dir=await mkdtemp(path.join(os.tmpdir(),'wr-test-'));const staticDir=path.join(dir,'dist');await mkdir(staticDir);await writeFile(path.join(staticDir,'index.html'),'<meta name="wr-api" content=""><h1>Test archive</h1>');
  const seed={settings:{name:'The Walking Rotarian',basePath:'/walking-rotarian',currentJourney:'current',email:'test@example.invalid'},journeys:[{id:'current',title:'Current journey',status:'published'}],entries:[entry('historical')],media:[],checkpoints:[],distances:[],tracks:[],finance:[],recognition:[],translations:[],partners:[],causes:[],opportunities:[]};
  const dataDir=path.join(dir,'data'),store=openStore(dataDir,seed);
  for(const role of ['owner','editor','contributor','finance'])store.db.prepare('INSERT INTO users(id,email,name,role,password_hash) VALUES(?,?,?,?,?)').run(role,role+'@example.invalid',role,role,passwordHash(PASSWORD));
  const app=createApplication({store,seed,staticDir,dataDir,env,fetcher:async()=>new Response(JSON.stringify({id:'test-provider-id'}),{status:200})});
  await new Promise(resolve=>app.server.listen(0,'127.0.0.1',resolve));const origin='http://127.0.0.1:'+app.server.address().port,base=origin+'/walking-rotarian';
  async function request(route,{method='GET',body,user,headers={},raw}={}){const response=await fetch(base+route,{method,headers:{...(body?{'Content-Type':'application/json'}:{}),...(user?{Cookie:user.cookie,'X-CSRF-Token':user.csrf}:{}),...headers},body:body?JSON.stringify(body):raw});const data=await response.json().catch(()=>null);return {response,data,status:response.status};}
  async function login(role){const r=await request('/api/auth/login',{method:'POST',body:{email:role+'@example.invalid',password:PASSWORD}});assert.equal(r.status,200);return {cookie:r.response.headers.get('set-cookie').split(';')[0],csrf:r.data.csrf};}
  return {store,seed,app,base,origin,request,login,dir,async close(){await new Promise(r=>app.server.close(r));store.close();await rm(dir,{recursive:true,force:true});}};
}

test('content rules reject unsafe URLs and unverified public finance or location records',()=>{
  assert.throws(()=>webURL('javascript:alert(1)'));
  assert.throws(()=>webURL('https://user:secret@example.com'));
  assert.throws(()=>facebookURL('https://example.com/not-facebook'));
  assert.throws(()=>validateRecord('finance',{id:'finance',journey:'current',confirmed:100,pledged:50,asOf:'2026-01-01',source:'https://example.com',status:'published'}));
  assert.throws(()=>validateRecord('checkpoints',{id:'checkpoint',journey:'current',date:'2026-01-01',lat:1,lon:32,source:'https://example.com',status:'published',verified:false}));
  assert.throws(()=>validateRecord('recognition',{id:'person',name:'A supporter',status:'published',consent:false}));
  const rows=[{journey:'current',date:'2026-01-01',km:30,status:'published',verified:true},{journey:'current',date:'2026-01-01',km:31,status:'published',verified:true},{journey:'current',date:'2026-01-02',km:15,status:'draft',verified:true}];
  assert.equal(distanceTotal(rows,'current'),31);
  assert.equal(visibleEntries([entry('future',{publishedAt:new Date(Date.now()+3600000).toISOString(),status:'scheduled'}),entry('draft',{status:'draft'}),entry('past')]).length,1);
});

test('server enforces login, roles, CSRF and version conflicts while keeping the public journal readable',async()=>{
  const f=await fixture();try{
    assert.equal((await f.request('/api/admin/overview')).status,401);
    const owner=await f.login('owner'),contributor=await f.login('contributor'),editor=await f.login('editor'),finance=await f.login('finance');
    const publicResult=await f.request('/api/public');assert.equal(publicResult.status,200);assert.equal(publicResult.data.entries.length,1);assert.ok(!JSON.stringify(publicResult.data).includes('password_hash'));assert.ok(!JSON.stringify(publicResult.data).includes('authorId'));
    assert.equal((await f.request('/api/admin/content/entries',{method:'POST',user:{...owner,csrf:'wrong'},body:entry('forged')})).status,403);
    assert.equal((await f.request('/api/admin/content/entries',{method:'POST',user:owner,headers:{Origin:'https://evil.invalid'},body:entry('cross-site')})).status,403);
    assert.equal((await f.request('/api/admin/content/entries',{method:'POST',user:contributor,body:entry('not-allowed')})).status,403);
    const draft=await f.request('/api/admin/content/entries',{method:'POST',user:contributor,body:entry('own-draft',{status:'draft'})});assert.equal(draft.status,200);
    assert.equal((await f.request('/api/admin/content/finance',{user:editor})).status,403);
    const saved=await f.request('/api/admin/content/entries',{method:'POST',user:owner,body:entry('new-entry',{shareFacebook:true})});assert.equal(saved.status,200);assert.ok(saved.data.deliveryWarning);assert.equal(saved.data.version,1);
    assert.equal((await f.request('/api/admin/content/entries',{method:'POST',user:owner,body:entry('new-entry',{version:1,title:'Corrected title'})})).status,200);
    assert.equal((await f.request('/api/admin/content/entries',{method:'POST',user:owner,body:entry('new-entry',{version:1,title:'Lost update'})})).status,409);
    const history=await f.request('/api/admin/revisions?kind=entries&id=new-entry',{user:owner});assert.equal(history.data.length,1);
    assert.equal((await f.request('/api/admin/restore',{method:'POST',user:contributor,body:{revisionId:history.data[0].id}})).status,403);
    const restored=await f.request('/api/admin/restore',{method:'POST',user:owner,body:{revisionId:history.data[0].id}});assert.equal(restored.data.title,'new-entry');assert.equal(restored.data.version,3);
    const figures={id:'funds',title:'Reviewed funds',journey:'current',status:'published',confirmed:100000,pledged:50000,currency:'UGX',asOf:'2026-01-01',source:'https://example.com/ledger',verified:true};
    assert.equal((await f.request('/api/admin/content/finance',{method:'POST',user:finance,body:figures})).status,200);
    const backup=await f.request('/api/admin/backup',{user:owner});assert.equal(backup.status,200);assert.ok(!('users'in backup.data));assert.ok(!('sessions'in backup.data));
    assert.equal((await f.request('/api/admin/users/owner',{method:'PUT',user:owner,body:{role:'editor',active:true}})).status,400);
    const root=await fetch(f.base+'/');assert.match(await root.text(),/wr-api[^>]+\/walking-rotarian\/api/);
  }finally{await f.close();}
});

test('publishing is immediate, scheduling is time-aware and daily distances cannot be double-counted',async()=>{
  const f=await fixture();try{
    const owner=await f.login('owner');
    const future=entry('scheduled',{status:'scheduled',publishedAt:new Date(Date.now()+60000).toISOString()});
    const saved=await f.request('/api/admin/content/entries',{method:'POST',user:owner,body:future});assert.equal(saved.status,200);
    assert.ok(!(await f.request('/api/public')).data.entries.some(e=>e.id==='scheduled'));
    await f.request('/api/admin/content/entries',{method:'POST',user:owner,body:{...future,version:1,publishedAt:past}});
    assert.ok((await f.request('/api/public')).data.entries.some(e=>e.id==='scheduled'));
    const row={id:'day',title:'Day record',journey:'current',date:'2026-01-01',km:30,source:'Reviewed route log',status:'published',verified:true};
    const first=await f.request('/api/admin/content/distances',{method:'POST',user:owner,body:row});assert.equal(first.status,200);
    assert.equal((await f.request('/api/admin/content/distances',{method:'POST',user:owner,body:row})).status,409);
    assert.equal((await f.request('/api/admin/content/distances',{method:'POST',user:owner,body:{...row,km:31,version:1}})).status,200);
    const result=await f.request('/api/public');assert.equal(distanceTotal(result.data.distances,'current'),31);
    const story=await fetch(f.base+'/journal/scheduled/');assert.equal(story.status,200);assert.match(await story.text(),/og:title/);
    const rss=await fetch(f.base+'/rss.xml');assert.match(await rss.text(),/scheduled/);
  }finally{await f.close();}
});

test('private uploads remain private until attached to a published entry',async()=>{
  const f=await fixture();try{
    const owner=await f.login('owner'),contributor=await f.login('contributor');
    const bad=await f.request('/api/admin/media',{method:'POST',user:owner,raw:'<script>bad</script>',headers:{'Content-Type':'image/png','X-File-Name':'image.png'}});assert.equal(bad.status,415);
    const png=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/lY4AAAAASUVORK5CYII=','base64');
    const upload=await f.request('/api/admin/media',{method:'POST',user:owner,raw:png,headers:{'Content-Type':'image/png','X-File-Name':'photo.png'}});assert.equal(upload.status,201);
    assert.equal((await fetch(f.origin+upload.data.url)).status,404);
    assert.equal((await fetch(f.origin+upload.data.url,{headers:{Cookie:contributor.cookie}})).status,404);
    assert.equal((await fetch(f.origin+upload.data.url,{headers:{Cookie:owner.cookie}})).status,200);
    await f.request('/api/admin/content/entries',{method:'POST',user:owner,body:entry('with-photo',{media:[upload.data]})});
    assert.equal((await fetch(f.origin+upload.data.url)).status,200);
    const records=(await f.request('/api/public')).data.media;assert.ok(!records.some(m=>m.id===upload.data.id));
  }finally{await f.close();}
});

test('requests are moderated, subscriptions require confirmation, and preference links survive digests',async()=>{
  const env={RESEND_API_KEY:'test-not-a-real-key',MAIL_FROM:'test@example.invalid'};const f=await fixture(env);try{
    const owner=await f.login('owner');
    const form={kind:'encouragement',name:'Test supporter',email:'person@example.invalid',message:'Keep going.',consent:true,publicConsent:false};
    const received=await f.request('/api/submissions',{method:'POST',body:form});assert.equal(received.status,201);
    assert.equal((await f.request('/api/admin/submissions/'+received.data.id,{method:'PUT',user:owner,body:{status:'approved'}})).status,400);
    assert.equal((await f.request('/api/encouragement')).data.length,0);
    const subscribed=await f.request('/api/subscribe',{method:'POST',body:{email:'reader@example.invalid',consent:true,frequency:'daily',journey:'current'}});assert.equal(subscribed.status,202);
    let row=f.store.db.prepare('SELECT * FROM subscribers WHERE email=?').get('reader@example.invalid');assert.equal(row.status,'pending');
    const job=f.store.db.prepare("SELECT * FROM jobs WHERE type='email'").get();const confirm=JSON.parse(job.payload).text.match(/confirm=([^\s]+)/)[1];
    assert.equal((await f.request('/api/subscription/confirm',{method:'POST',body:{token:confirm}})).status,200);
    row=f.store.db.prepare('SELECT * FROM subscribers WHERE id=?').get(row.id);assert.equal(row.status,'active');
    const manage=f.store.manageToken(row.id);
    assert.equal((await f.request('/api/subscription/preferences',{method:'POST',body:{token:manage}})).status,200);
    const queued=await f.request('/api/admin/digest/queue',{method:'POST',user:owner,body:{entryIds:['historical'],journey:'current',confirmed:true}});assert.equal(queued.data.queued,1);
    assert.equal((await f.request('/api/subscription/preferences',{method:'POST',body:{token:manage}})).status,200);
    await processJobs(f.store,env,{fetcher:async()=>new Response(JSON.stringify({id:'mail-test'}),{status:200})});assert.equal(f.store.db.prepare("SELECT COUNT(*) n FROM jobs WHERE state='sent'").get().n,2);
    assert.equal((await f.request('/api/subscription/preferences',{method:'POST',body:{token:manage,action:'unsubscribe'}})).status,200);
    assert.equal(f.store.db.prepare('SELECT status FROM subscribers WHERE id=?').get(row.id).status,'unsubscribed');
  }finally{await f.close();}
});

test('automatic digests respect subscription frequency and only include newly published matching stories',async()=>{
  const env={RESEND_API_KEY:'test-key',MAIL_FROM:'test@example.invalid'},f=await fixture(env);try{
    const settings=JSON.parse(f.store.db.prepare("SELECT value FROM meta WHERE key='settings'").get().value);settings.digestEnabled=true;f.store.db.prepare("UPDATE meta SET value=? WHERE key='settings'").run(JSON.stringify(settings));
    const old=new Date(Date.now()-2*86400000).toISOString();
    f.store.db.prepare('INSERT INTO subscribers(id,email,journey,frequency,status,manage_hash,created_at) VALUES(?,?,?,?,?,?,?)').run('daily','daily@example.invalid','current','daily','active',digest(f.store.manageToken('daily')),old);
    f.store.db.prepare('INSERT INTO subscribers(id,email,journey,frequency,status,manage_hash,created_at) VALUES(?,?,?,?,?,?,?)').run('weekly','weekly@example.invalid','current','weekly','active',digest(f.store.manageToken('weekly')),old);
    f.store.db.prepare('INSERT INTO subscribers(id,email,journey,frequency,status,manage_hash,created_at) VALUES(?,?,?,?,?,?,?)').run('other','other@example.invalid','other-journey','daily','active',digest(f.store.manageToken('other')),old);
    assert.equal(queueDueDigests(f.store,env,f.base),1);assert.equal(f.store.db.prepare("SELECT COUNT(*) n FROM jobs").get().n,1);
    queueDueDigests(f.store,env,f.base);assert.equal(f.store.db.prepare("SELECT COUNT(*) n FROM jobs").get().n,1);
  }finally{await f.close();}
});

test('Facebook delivery uncertainty never triggers an automatic duplicate',async()=>{
  const env={FACEBOOK_PAGE_ID:'test-page',FACEBOOK_PAGE_ACCESS_TOKEN:'test-token',FACEBOOK_GRAPH_VERSION:'v99.0'},f=await fixture(env);try{
    const owner=await f.login('owner');const r=await f.request('/api/admin/content/entries',{method:'POST',user:owner,body:entry('cross-post',{shareFacebook:true})});assert.equal(r.status,200);
    await processJobs(f.store,env,{fetcher:async()=>{throw new Error('Timed out.');}});
    assert.equal(f.store.db.prepare('SELECT state FROM jobs WHERE id=?').get('facebook-cross-post').state,'needs_review');
    assert.equal(await processJobs(f.store,env,{fetcher:()=>{throw new Error('Must not retry.');}}),0);
    assert.equal((await f.request('/api/admin/jobs/facebook-cross-post/retry',{method:'POST',user:owner,body:{checkedPage:false}})).status,400);
    assert.equal((await f.request('/api/admin/jobs/facebook-cross-post/retry',{method:'POST',user:owner,body:{checkedPage:true}})).status,200);
    await processJobs(f.store,env,{fetcher:async()=>new Response(JSON.stringify({id:'fb-test-id'}),{status:200})});
    assert.equal(f.store.db.prepare('SELECT state FROM jobs WHERE id=?').get('facebook-cross-post').state,'sent');
    assert.ok((await f.request('/api/public')).data.entries.some(e=>e.id==='cross-post'));
  }finally{await f.close();}
});

test('a generated diary PDF has consistent objects and a valid cross-reference offset',()=>{
  const pdf=jpegPagesToPDF([{width:1,height:1,bytes:new Uint8Array([255,216,255,217])}]);const text=new TextDecoder().decode(pdf);assert.ok(text.startsWith('%PDF-1.4'));assert.match(text,/\/Count 1/);const offset=Number(text.match(/startxref\n(\d+)/)[1]);assert.equal(text.slice(offset,offset+4),'xref');assert.match(text,/%%EOF$/);
});
