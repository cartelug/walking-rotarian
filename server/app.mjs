import http from 'node:http';
import fs from 'node:fs';
import fsp from 'node:fs/promises';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { validateRecord, CONTENT_KINDS, ROLES, escapeHTML as esc, cleanText, visibleEntries, webURL } from '../src/assets/platform/model.js';
import { token,digest,passwordHash,passwordMatches,sessionFor,safeUser,requireRole,makeLimiter } from './security.mjs';
import { integrationStatus,processJobs,digestContent } from './jobs.mjs';

const MIME={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json; charset=utf-8','.xml':'application/xml; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.webp':'image/webp','.woff':'font/woff','.woff2':'font/woff2','.mp3':'audio/mpeg','.m4a':'audio/mp4','.mp4':'video/mp4','.webm':'video/webm','.ogg':'audio/ogg','.pdf':'application/pdf','.webmanifest':'application/manifest+json'};
const staff=['owner','editor'];
function fail(message,status=400){const e=new Error(message);e.status=status;throw e;}
async function readBody(req,limit=200000){let size=0;const chunks=[];for await(const c of req){size+=c.length;if(size>limit)fail('This upload is too large.',413);chunks.push(c);}return Buffer.concat(chunks);}
async function readJSON(req){if(!String(req.headers['content-type']).startsWith('application/json'))fail('Send JSON data.',415);try{return JSON.parse((await readBody(req)).toString());}catch(e){if(e.status)throw e;fail('The request contains invalid JSON.');}}

export function createApplication({store,seed,staticDir,dataDir,publicURL='',allowedOrigins=[],env={},fetcher=fetch}){
  const base=seed.settings?.basePath||'';
  const limiter=makeLimiter();
  const root=path.resolve(staticDir);
  const uploads=path.resolve(dataDir,'uploads');fs.mkdirSync(uploads,{recursive:true,mode:0o700});
  const getSettings=()=>JSON.parse(store.db.prepare("SELECT value FROM meta WHERE key='settings'").get()?.value||'{}');
  const configuredURL=publicURL?new URL(publicURL):null;
  function send(res,status,value,headers={}){res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store',...headers});res.end(JSON.stringify(value));}
  function siteRoot(req){return publicURL.replace(/\/$/,'')||`http://${req.headers.host}${base}`;}
  function publicData(){
    const data={...seed,settings:getSettings(),capabilities:{backend:true,...integrationStatus(env)}};
    for(const kind of CONTENT_KINDS){data[kind]=store.list(kind).filter(r=>r.status==='published'||(kind==='entries'&&r.status==='scheduled'&&Date.parse(r.publishedAt)<=Date.now())).map(({authorId,...r})=>r);}
    data.entries=visibleEntries(data.entries);
    return data;
  }
  function validOrigin(req){
    const origin=req.headers.origin;
    if(!origin)return true;
    const same=configuredURL?.origin||`http://${req.headers.host}`;
    return origin===same||allowedOrigins.includes(origin);
  }
  function contentPermission(user,kind,record){
    requireRole(user,kind==='finance'?['owner','finance']:kind==='entries'||kind==='media'?['owner','editor','contributor']:staff);
    if(user.role==='contributor'){
      if(record?.authorId&&record.authorId!==user.user_id)fail('You can edit only your own drafts.',403);
      if(record&&record.status!=='draft')fail('A contributor can save drafts only.',403);
    }
  }
  async function handler(req,res){
    res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('Referrer-Policy','strict-origin-when-cross-origin');res.setHeader('X-Frame-Options','SAMEORIGIN');
    try{
      const parsed=new URL(req.url,'http://local');
      let route=decodeURIComponent(parsed.pathname);
      if(base&&route===base){res.writeHead(308,{Location:`${base}/`});return res.end();}
      if(base&&route.startsWith(base+'/'))route=route.slice(base.length);
      if(route.startsWith('/api/')){
        if(req.headers.origin&&validOrigin(req)){res.setHeader('Access-Control-Allow-Origin',req.headers.origin);res.setHeader('Vary','Origin');res.setHeader('Access-Control-Allow-Credentials','true');}
        if(req.method==='OPTIONS'){if(!validOrigin(req))fail('Origin not allowed.',403);res.writeHead(204,{'Access-Control-Allow-Methods':'GET, POST, PUT, OPTIONS','Access-Control-Allow-Headers':'Content-Type, X-CSRF-Token, X-File-Name'});return res.end();}
        if(!['GET','HEAD'].includes(req.method)&&!validOrigin(req))fail('Origin not allowed.',403);
        const ip=req.socket.remoteAddress||'unknown';
        limiter(`all:${ip}`,300);
        const user=sessionFor(req,store);
        const body=async()=>readJSON(req);
        const protectedWrite=()=>{requireRole(user,ROLES);if(req.headers['x-csrf-token']!==user.csrf)fail('Reload the studio before making this change.',403);};
        if(route==='/api/public'&&req.method==='GET')return send(res,200,publicData());
        if(route==='/api/auth/me'&&req.method==='GET')return send(res,200,{user:safeUser(user),csrf:user?.csrf||'',capabilities:integrationStatus(env)});
        if(route==='/api/auth/login'&&req.method==='POST'){
          limiter(`login:${ip}`,6,15*60000);
          const p=await body();const email=cleanText(p.email,254).toLowerCase();
          const account=store.db.prepare('SELECT * FROM users WHERE email=? AND active=1').get(email);
          if(!account||!passwordMatches(p.password,account.password_hash))fail('Email or password is incorrect.',401);
          const raw=token(),csrf=token();store.db.prepare('INSERT INTO sessions(token_hash,user_id,csrf,expires_at) VALUES(?,?,?,?)').run(digest(raw),account.id,csrf,Date.now()+12*3600000);
          return send(res,200,{user:safeUser(account),csrf},{'Set-Cookie':`wr_session=${raw}; HttpOnly; Path=${base||'/'}; SameSite=Lax; Max-Age=43200${configuredURL?.protocol==='https:'?'; Secure':''}`});
        }
        if(route==='/api/auth/logout'&&req.method==='POST'){protectedWrite();store.db.prepare('DELETE FROM sessions WHERE token_hash=?').run(user.token_hash);return send(res,200,{ok:true},{'Set-Cookie':`wr_session=; HttpOnly; Path=${base||'/'}; SameSite=Lax; Max-Age=0`});}
        if(route==='/api/submissions'&&req.method==='POST'){
          limiter(`form:${ip}`,6,600000);const p=await body();
          if(p.website)fail('Please leave the website field empty.');
          const kinds=['encouragement','question','join','volunteer','sponsorship','speaking','interview','correction'];
          if(!kinds.includes(p.kind)||!cleanText(p.message)||cleanText(p.message).length>10000)fail('Choose a request type and add your message.');
          const email=cleanText(p.email,254);if(email&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))fail('Enter a valid email address.');
          if(!p.consent)fail('Confirm that the team may use these details to respond.');
          const id=randomUUID();const payload={name:cleanText(p.name,140),email,message:cleanText(p.message,10000),journey:cleanText(p.journey,120),date:cleanText(p.date,40),location:cleanText(p.location,180),skills:cleanText(p.skills,1000),publicConsent:p.publicConsent===true,consent:true};
          store.db.prepare('INSERT INTO submissions(id,kind,payload,created_at) VALUES(?,?,?,?)').run(id,p.kind,JSON.stringify(payload),new Date().toISOString());
          return send(res,201,{ok:true,id,message:'Received by the team. Public messages appear only after review.'});
        }
        if(route==='/api/encouragement'&&req.method==='GET'){
          const rows=store.db.prepare("SELECT id,payload,created_at FROM submissions WHERE kind='encouragement' AND status='approved' ORDER BY created_at DESC LIMIT 100").all();
          return send(res,200,rows.map(r=>{const p=JSON.parse(r.payload);return {id:r.id,name:p.publicConsent?p.name||'Supporter':'Anonymous supporter',message:p.message,date:r.created_at};}));
        }
        if(route==='/api/subscribe'&&req.method==='POST'){
          limiter(`subscribe:${ip}`,3,600000);if(!integrationStatus(env).email)fail('Email updates are not connected yet. Follow the RSS feed in the meantime.',503);
          const p=await body();if(p.website||!p.consent)fail('Confirm your subscription preference.');
          const email=cleanText(p.email,254).toLowerCase();if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))fail('Enter a valid email address.');
          const existing=store.db.prepare('SELECT * FROM subscribers WHERE email=?').get(email);
          const raw=token(),id=existing?.id||randomUUID(),manage=store.manageToken(id),frequency=p.frequency==='daily'?'daily':'weekly',journey=cleanText(p.journey,120);
          if(!existing||existing.status!=='active'){
            store.db.prepare(`INSERT INTO subscribers(id,email,journey,frequency,status,confirm_hash,confirm_expires,manage_hash,created_at) VALUES(?,?,?,?,?,?,?,?,?) ON CONFLICT(email) DO UPDATE SET journey=excluded.journey,frequency=excluded.frequency,status=excluded.status,confirm_hash=excluded.confirm_hash,confirm_expires=excluded.confirm_expires,manage_hash=excluded.manage_hash`).run(id,email,journey,frequency,'pending',digest(raw),Date.now()+48*3600000,digest(manage),new Date().toISOString());
            const confirm=`${siteRoot(req)}/subscribe/?confirm=${raw}`;
            const preferences=`${siteRoot(req)}/subscribe/?manage=${manage}`;
            store.enqueue(`confirm-${digest(email)}-${Date.now()}`,'email',{to:email,subject:'Confirm your Walking Rotarian updates',html:`<p>Confirm that you want updates from The Walking Rotarian.</p><p><a href="${esc(confirm)}">Confirm subscription</a></p><p>This link expires in 48 hours.</p><p><a href="${esc(preferences)}">Manage or cancel</a></p>`,text:`Confirm: ${confirm}\nManage or cancel: ${preferences}`});
          }
          return send(res,202,{message:'If this address needs confirmation, an email has been queued. Subscription begins only after confirmation.'});
        }
        if(route==='/api/subscription/confirm'&&req.method==='POST'){
          const p=await body();const row=store.db.prepare("SELECT id FROM subscribers WHERE confirm_hash=? AND confirm_expires>? AND status='pending'").get(digest(p.token),Date.now());
          if(!row)fail('This confirmation link is invalid or has expired.');
          store.db.prepare("UPDATE subscribers SET status='active',confirm_hash=NULL,confirm_expires=NULL WHERE id=?").run(row.id);return send(res,200,{message:'Your email subscription is confirmed.'});
        }
        if(route==='/api/subscription/preferences'&&req.method==='POST'){
          const p=await body();const row=store.db.prepare('SELECT id,journey,frequency,status FROM subscribers WHERE manage_hash=?').get(digest(p.token));
          if(!row)fail('This preference link is invalid.',404);
          if(p.action==='unsubscribe'){store.db.prepare("UPDATE subscribers SET status='unsubscribed',confirm_hash=NULL WHERE id=?").run(row.id);return send(res,200,{message:'You have been unsubscribed.'});}
          if(p.action==='save'){const frequency=p.frequency==='daily'?'daily':'weekly';store.db.prepare('UPDATE subscribers SET journey=?,frequency=? WHERE id=?').run(cleanText(p.journey,120),frequency,row.id);return send(res,200,{message:'Preferences saved.'});}
          return send(res,200,row);
        }
        if(route==='/api/events'&&req.method==='POST'){
          const p=await body();if(!['story_view','share','support_click','story_saved','subscribe_click'].includes(p.event))fail('Unknown event.');
          const day=new Date().toISOString().slice(0,10),resource=cleanText(p.resource,120);let source='direct';try{source=new URL(p.referrer).hostname.slice(0,150);}catch{}
          store.db.prepare('INSERT INTO analytics(day,event,resource,source,count) VALUES(?,?,?,?,1) ON CONFLICT(day,event,resource,source) DO UPDATE SET count=count+1').run(day,p.event,resource,source);return send(res,202,{ok:true});
        }
        if(!route.startsWith('/api/admin/'))fail('Not found.',404);
        requireRole(user,ROLES);if(req.method!=='GET')protectedWrite();
        if(route==='/api/admin/overview'&&req.method==='GET'){
          const allowed=CONTENT_KINDS.filter(k=>user.role==='owner'||(user.role==='finance'?k==='finance':k!=='finance'));
          return send(res,200,{user:safeUser(user),settings:getSettings(),capabilities:integrationStatus(env),counts:Object.fromEntries(allowed.map(k=>[k,store.list(k).length])),jobs:staff.includes(user.role)?store.db.prepare('SELECT id,type,state,attempts,last_error,created_at FROM jobs ORDER BY created_at DESC LIMIT 100').all():[],analytics:staff.includes(user.role)?store.db.prepare('SELECT * FROM analytics ORDER BY day DESC LIMIT 300').all():[]});
        }
        const contentMatch=route.match(/^\/api\/admin\/content\/([a-z]+)(?:\/([a-z0-9-]+))?$/);
        if(contentMatch){
          const [,kind,id]=contentMatch;if(!CONTENT_KINDS.includes(kind))fail('Unknown content type.');
          if(req.method==='GET'){contentPermission(user,kind);let rows=id?store.get(kind,id):store.list(kind);if(user.role==='contributor')rows=Array.isArray(rows)?rows.filter(r=>r.authorId===user.user_id):rows?.authorId===user.user_id?rows:null;return send(res,200,rows);}
          if(req.method==='PUT'||req.method==='POST'){
            const p=await body();let record=validateRecord(kind,p);if(id&&record.id!==id)fail('The record identifier cannot change.');
            const previous=store.get(kind,record.id);contentPermission(user,kind,previous);contentPermission(user,kind,record);
            const saved=store.put(kind,record,user.user_id,p.version);
            if(kind==='entries'&&p.shareFacebook&&['published','scheduled'].includes(record.status)){
              if(!integrationStatus(env).facebook)saved.deliveryWarning='The entry was saved. Facebook Page publishing is not connected; use the story’s manual share actions.';
              else {store.enqueue(`facebook-${record.id}`,'facebook',{message:record.body.slice(0,1200),link:`${siteRoot(req)}/journal/${record.id}/`});
              store.db.prepare('UPDATE jobs SET next_at=? WHERE id=? AND state=\'pending\'').run(Math.max(Date.now(),Date.parse(record.publishedAt)),`facebook-${record.id}`);}
            }
            return send(res,200,saved);
          }
        }
        if(route==='/api/admin/settings'&&req.method==='PUT'){
          requireRole(user,['owner']);const p=await body(),s=getSettings();
          s.socials={};for(const [name,value] of Object.entries(p.socials||{}))if(['facebook','instagram','tiktok','linkedin','youtube','x'].includes(name)&&value)s.socials[name]=webURL(value,{empty:false});
          if(p.email)s.email=cleanText(p.email,254);
          if(p.currentJourney)s.currentJourney=cleanText(p.currentJourney,120);
          s.digestEnabled=p.digestEnabled===true;
          store.db.prepare("UPDATE meta SET value=? WHERE key='settings'").run(JSON.stringify(s));store.audit(user.user_id,'settings','settings');return send(res,200,s);
        }
        if(route==='/api/admin/users'&&req.method==='GET'){requireRole(user,['owner']);return send(res,200,store.db.prepare('SELECT id,name,email,role,active FROM users').all());}
        if(route==='/api/admin/users'&&req.method==='POST'){
          requireRole(user,['owner']);const p=await body();if(!ROLES.includes(p.role)||!p.name||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(p.email||''))fail('Enter a name, valid email and role.');
          const id=randomUUID();store.db.prepare('INSERT INTO users(id,email,name,role,password_hash) VALUES(?,?,?,?,?)').run(id,p.email.toLowerCase(),cleanText(p.name,140),p.role,passwordHash(p.password));store.audit(user.user_id,'create-user',id);return send(res,201,{id});
        }
        if(route.startsWith('/api/admin/users/')&&req.method==='PUT'){
          requireRole(user,['owner']);const id=route.split('/').at(-1),p=await body(),account=store.db.prepare('SELECT * FROM users WHERE id=?').get(id);if(!account)fail('Account not found.',404);
          if(!ROLES.includes(p.role))fail('Choose a valid role.');
          if(account.role==='owner'&&(p.role!=='owner'||p.active===false)&&store.db.prepare("SELECT COUNT(*) AS n FROM users WHERE role='owner' AND active=1").get().n<=1)fail('Keep at least one active owner.');
          store.db.prepare('UPDATE users SET role=?,active=? WHERE id=?').run(p.role,p.active===false?0:1,id);store.db.prepare('DELETE FROM sessions WHERE user_id=?').run(id);store.audit(user.user_id,'update-user',id);return send(res,200,{ok:true});
        }
        if(route==='/api/admin/password'&&req.method==='POST'){
          const p=await body(),account=store.db.prepare('SELECT * FROM users WHERE id=?').get(user.user_id);if(!passwordMatches(p.currentPassword,account.password_hash))fail('Current password is incorrect.',403);
          store.db.prepare('UPDATE users SET password_hash=? WHERE id=?').run(passwordHash(p.newPassword),user.user_id);store.db.prepare('DELETE FROM sessions WHERE user_id=? AND token_hash<>?').run(user.user_id,user.token_hash);return send(res,200,{ok:true});
        }
        if(route==='/api/admin/submissions'&&req.method==='GET'){requireRole(user,staff);return send(res,200,store.db.prepare('SELECT * FROM submissions ORDER BY created_at DESC LIMIT 1000').all().map(r=>({...r,payload:JSON.parse(r.payload)})));}
        if(route.startsWith('/api/admin/submissions/')&&req.method==='PUT'){
          requireRole(user,staff);const id=route.split('/').at(-1),p=await body();const row=store.db.prepare('SELECT * FROM submissions WHERE id=?').get(id);if(!row)fail('Not found.',404);
          if(!['new','assigned','approved','declined','completed'].includes(p.status))fail('Choose a valid request status.');
          if(p.status==='approved'&&row.kind==='encouragement'&&!JSON.parse(row.payload).publicConsent)fail('This supporter did not consent to a public message.');
          store.db.prepare('UPDATE submissions SET status=?,owner=?,note=? WHERE id=?').run(p.status,cleanText(p.owner,140),cleanText(p.note,5000),id);store.audit(user.user_id,'review-submission',id);return send(res,200,{ok:true});
        }
        if(route==='/api/admin/subscribers'&&req.method==='GET'){requireRole(user,staff);return send(res,200,store.db.prepare('SELECT id,email,journey,frequency,status,created_at,last_sent FROM subscribers ORDER BY created_at DESC').all());}
        if(route==='/api/admin/digest/preview'&&req.method==='POST'){
          requireRole(user,staff);const p=await body();let entries=publicData().entries.filter(e=>!p.journey||e.journey===p.journey).slice(0,10);if(Array.isArray(p.entryIds))entries=entries.filter(e=>p.entryIds.includes(e.id));
          const result=digestContent(entries,store.get('journeys',p.journey)?.title,siteRoot(req));return send(res,200,{...result,entries:entries.map(e=>e.id)});
        }
        if(route==='/api/admin/digest/queue'&&req.method==='POST'){
          requireRole(user,staff);if(!integrationStatus(env).email)fail('Connect email sending before queuing a digest.',503);const p=await body();if(!p.confirmed)fail('Review and confirm the digest first.');
          const entries=publicData().entries.filter(e=>(!p.journey||e.journey===p.journey)&&Array.isArray(p.entryIds)&&p.entryIds.includes(e.id)).slice(0,20);if(!entries.length)fail('Select at least one published entry.');
          const subscribers=store.db.prepare("SELECT * FROM subscribers WHERE status='active'").all();let queued=0;
          for(const s of subscribers){const eligible=entries.filter(e=>!s.journey||s.journey===e.journey);if(!eligible.length)continue;const result=digestContent(eligible,store.get('journeys',s.journey)?.title,siteRoot(req)),batch=digest(eligible.map(e=>e.id+e.version).join('|')).slice(0,20),manage=store.manageToken(s.id);store.db.prepare('UPDATE subscribers SET manage_hash=? WHERE id=?').run(digest(manage),s.id);const link=`${siteRoot(req)}/subscribe/?manage=${manage}`;store.enqueue(`digest-${batch}-${s.id}`,'email',{to:s.email,subscriberId:s.id,subject:result.subject,html:`${result.html}<p><a href="${esc(link)}">Preferences or unsubscribe</a></p>`,text:`${result.subject}\n${eligible.map(e=>`${e.title}: ${siteRoot(req)}/journal/${e.id}/`).join('\n')}\nPreferences: ${link}`,headers:{'List-Unsubscribe':`<${link}>`}});queued++;}
          return send(res,202,{queued});
        }
        if(route==='/api/admin/jobs/process'&&req.method==='POST'){requireRole(user,['owner']);const processed=await processJobs(store,env,{fetcher});return send(res,200,{processed});}
        if(route.startsWith('/api/admin/jobs/')&&route.endsWith('/retry')&&req.method==='POST'){
          requireRole(user,['owner']);const id=route.split('/')[4],job=store.db.prepare('SELECT * FROM jobs WHERE id=?').get(id),p=await body();if(!job)fail('Delivery not found.',404);
          if(job.state==='sent'||job.state==='working')fail('This delivery cannot be retried.');
          if(job.type==='facebook'&&!p.checkedPage)fail('Check the Page and confirm the entry is not already published before retrying.');
          store.db.prepare("UPDATE jobs SET state='pending',next_at=? WHERE id=?").run(Date.now(),id);store.audit(user.user_id,'retry-delivery',id);return send(res,200,{ok:true});
        }
        if(route==='/api/admin/media'&&req.method==='POST'){
          requireRole(user,['owner','editor','contributor']);const contentType=String(req.headers['content-type']||'').split(';')[0];const types={'image/jpeg':'jpg','image/png':'png','image/webp':'webp','audio/mpeg':'mp3','audio/mp4':'m4a','audio/ogg':'ogg','video/mp4':'mp4','video/webm':'webm'};
          const extension=types[contentType];if(!extension)fail('Upload JPEG, PNG, WebP, MP3, M4A, OGG, MP4 or WebM.',415);
          const data=await readBody(req,25*1024*1024);if(!data.length)fail('The file is empty.');
          if(contentType==='image/jpeg'&&!(data[0]===255&&data[1]===216)||contentType==='image/png'&&data.subarray(0,8).toString('hex')!=='89504e470d0a1a0a'||contentType==='image/webp'&&!(data.subarray(0,4).toString()==='RIFF'&&data.subarray(8,12).toString()==='WEBP'))fail('The file contents do not match its image type.',415);
          const id=randomUUID(),filename=`${id}.${extension}`;await fsp.writeFile(path.join(uploads,filename),data,{mode:0o600,flag:'wx'});
          const record={id,title:cleanText(decodeURIComponent(req.headers['x-file-name']||filename),180),url:`${base}/uploads/${filename}`,type:contentType.split('/')[0],filename,status:'draft',alt:'',credit:'',caption:''};const saved=store.put('media',record,user.user_id);return send(res,201,saved);
        }
        if(route==='/api/admin/revisions'&&req.method==='GET'){requireRole(user,staff);const kind=parsed.searchParams.get('kind'),id=parsed.searchParams.get('id');return send(res,200,store.db.prepare('SELECT * FROM revisions WHERE kind=? AND content_id=? ORDER BY id DESC LIMIT 100').all(kind,id).map(r=>({...r,payload:JSON.parse(r.payload)})));}
        if(route==='/api/admin/restore'&&req.method==='POST'){
          requireRole(user,['owner']);const p=await body(),row=store.db.prepare('SELECT * FROM revisions WHERE id=?').get(Number(p.revisionId));if(!row)fail('Revision not found.',404);const current=store.get(row.kind,row.content_id);const record=validateRecord(row.kind,JSON.parse(row.payload));return send(res,200,store.put(row.kind,record,user.user_id,current?.version));
        }
        if(route==='/api/admin/backup'&&req.method==='GET'){
          requireRole(user,['owner']);store.audit(user.user_id,'export-backup','content');const backup={schema:1,createdAt:new Date().toISOString(),settings:getSettings(),content:Object.fromEntries(CONTENT_KINDS.map(k=>[k,store.list(k)]))};return send(res,200,backup,{'Content-Disposition':'attachment; filename="walking-rotarian-content-backup.json"'});
        }
        fail('Not found.',404);
      }
      if(route==='/rss.xml'){
        const data=publicData(),origin=siteRoot(req);res.writeHead(200,{'Content-Type':'application/rss+xml; charset=utf-8','Cache-Control':'public,max-age=60'});return res.end(`<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel><title>The Walking Rotarian</title><link>${esc(origin)}</link><description>Stories from the road</description>${data.entries.map(e=>`<item><title>${esc(e.title)}</title><link>${esc(`${origin}/journal/${e.id}/`)}</link><guid>${esc(`${origin}/journal/${e.id}/`)}</guid><description>${esc(e.body)}</description><pubDate>${new Date(e.publishedAt).toUTCString()}</pubDate></item>`).join('')}</channel></rss>`);
      }
      const article=route.match(/^\/journal\/([a-z0-9-]+)\/$/);
      if(article){const e=publicData().entries.find(e=>e.id===article[1]);if(!e)fail('Story not found.',404);const origin=siteRoot(req),home=getSettings().siteUrl||origin;res.writeHead(200,{'Content-Type':'text/html; charset=utf-8','Cache-Control':'public,max-age=30'});return res.end(`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="wr-api" content="${esc(base+'/api')}"><meta name="wr-base" content="${esc(base)}"><title>${esc(e.title)} | The Walking Rotarian</title><meta name="description" content="${esc(e.body.slice(0,160))}"><meta property="og:title" content="${esc(e.title)}"><meta property="og:description" content="${esc(e.body.slice(0,220))}"><meta property="og:type" content="article"><meta property="og:url" content="${esc(`${origin}/journal/${e.id}/`)}">${e.media?.[0]?.type==='image'?`<meta property="og:image" content="${esc(new URL(e.media[0].url,origin).href)}">`:''}<link rel="stylesheet" href="${esc(home)}/assets/main.css"><link rel="stylesheet" href="${esc(home)}/assets/platform/platform.css"><script type="module" src="${esc(origin)}/assets/platform/main.js"></script></head><body><main class="container block wr-story"><a href="${esc(home)}/live/">The Walking Rotarian / Live journal</a><article data-wr="story" data-entry="${esc(e.id)}"><p class="eyebrow">${esc(e.place)} · ${esc(e.author)}</p><h1>${esc(e.title)}</h1><p><time datetime="${esc(e.publishedAt)}">${esc(new Date(e.publishedAt).toLocaleString('en-GB',{timeZone:'Africa/Kampala'}))} EAT</time></p>${e.body.split(/\n\n+/).map(p=>`<p>${esc(p).replace(/\n/g,'<br>')}</p>`).join('')}${(e.media||[]).map(m=>m.type==='image'?`<figure><img src="${esc(m.url)}" alt="${esc(m.alt)}" width="1000" loading="lazy"><figcaption>${esc(m.caption)} ${esc(m.credit)}</figcaption></figure>`:`<${m.type} controls preload="none" src="${esc(m.url)}"></${m.type}>`).join('')}${e.correction?`<p>Correction: ${esc(e.correction)}</p>`:''}${(e.sources||[]).map(s=>`<p><a href="${esc(s.url)}" rel="noopener">${esc(s.label)}</a></p>`).join('')}</article><p><a href="${esc(home)}/live/">More stories from the road</a></p></main></body></html>`);}
      if(route.startsWith('/uploads/')){
        const filename=path.basename(route);if(!/^[a-f0-9-]+\.(jpg|png|webp|mp3|m4a|ogg|mp4|webm)$/.test(filename))fail('Not found.',404);
        const record=store.list('media').find(m=>m.filename===filename);const referenced=publicData().entries.some(e=>e.media?.some(m=>m.id===record?.id));
        const viewer=sessionFor(req,store),canSeeDraft=viewer&&(staff.includes(viewer.role)||viewer.user_id===record?.authorId);
        if(!record||(record.status!=='published'&&!referenced&&!canSeeDraft))fail('Not found.',404);
        const file=path.join(uploads,filename);const stat=await fsp.stat(file);res.writeHead(200,{'Content-Type':MIME[path.extname(file)]||'application/octet-stream','Content-Length':stat.size,'Content-Security-Policy':"default-src 'none'",'Cache-Control':record.status==='published'||referenced?'public,max-age=86400':'private,no-store'});return fs.createReadStream(file).pipe(res);
      }
      if(req.method!=='GET'&&req.method!=='HEAD')fail('Method not allowed.',405);
      if(route.includes('\\')||route.split('/').some(p=>p==='..'||p.startsWith('.')))fail('Not found.',404);
      let file=path.resolve(root,'.'+route);if(file!==root&&!file.startsWith(root+path.sep))fail('Not found.',404);
      let stat;try{stat=await fsp.stat(file);if(stat.isDirectory()){file=path.join(file,'index.html');stat=await fsp.stat(file);}}catch{fail('Not found.',404);}
      if(!stat.isFile())fail('Not found.',404);
      if(file.endsWith('.html')){let html=await fsp.readFile(file,'utf8');html=html.replace(/<meta name="wr-api" content="[^"]*">/,`<meta name="wr-api" content="${esc(base+'/api')}">`);res.writeHead(200,{'Content-Type':MIME['.html'],'Cache-Control':'no-cache'});return res.end(req.method==='HEAD'?'':html);}
      res.writeHead(200,{'Content-Type':MIME[path.extname(file)]||'application/octet-stream','Cache-Control':route.includes('data/')?'no-cache':'public,max-age=3600'});if(req.method==='HEAD')return res.end();return fs.createReadStream(file).pipe(res);
    }catch(error){const status=error.status||500;send(res,status,{error:status===500?'Something went wrong. Your draft has not been discarded.':error.message});if(status===500)console.error('Request failed:',error.code||error.name);}
  }
  const server=http.createServer(handler);
  return {server,handler,publicData,getSettings};
}
