import { escapeHTML } from '../src/assets/platform/model.js';
import {visibleEntries} from '../src/assets/platform/model.js';
import {digest} from './security.mjs';

export function integrationStatus(env) {
  return {email:Boolean(env.RESEND_API_KEY&&env.MAIL_FROM),facebook:Boolean(env.FACEBOOK_PAGE_ID&&env.FACEBOOK_PAGE_ACCESS_TOKEN&&/^v\d+\.\d+$/.test(env.FACEBOOK_GRAPH_VERSION||''))};
}
export async function processJobs(store,env,{fetcher=fetch,limit=10}={}) {
  const jobs=store.db.prepare("SELECT * FROM jobs WHERE state IN ('pending','retry') AND next_at<=? ORDER BY next_at LIMIT ?").all(Date.now(),limit);
  for(const job of jobs){
    const p=JSON.parse(job.payload);
    store.db.prepare("UPDATE jobs SET state='working',attempts=attempts+1 WHERE id=?").run(job.id);
    try{
      let response;
      if(job.type==='email'){
        if(!integrationStatus(env).email)throw new Error('Email sending is not connected.');
        response=await fetcher('https://api.resend.com/emails',{method:'POST',headers:{Authorization:`Bearer ${env.RESEND_API_KEY}`,'Content-Type':'application/json','Idempotency-Key':job.id},body:JSON.stringify({from:env.MAIL_FROM,to:[p.to],subject:p.subject,html:p.html,text:p.text,...(p.headers?{headers:p.headers}:{})}),signal:AbortSignal.timeout(20000)});
      }else if(job.type==='facebook'){
        if(!integrationStatus(env).facebook)throw new Error('Facebook Page publishing is not connected.');
        response=await fetcher(`https://graph.facebook.com/${env.FACEBOOK_GRAPH_VERSION}/${encodeURIComponent(env.FACEBOOK_PAGE_ID)}/feed`,{method:'POST',headers:{Authorization:`Bearer ${env.FACEBOOK_PAGE_ACCESS_TOKEN}`,'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({message:p.message,link:p.link}),signal:AbortSignal.timeout(20000)});
      }else throw new Error('Unknown delivery type.');
      if(!response.ok)throw new Error(`${job.type==='email'?'Email':'Facebook'} service returned ${response.status}.`);
      const result=await response.json();
      if(!result.id)throw new Error('The service did not confirm a delivery identifier.');
      store.db.prepare("UPDATE jobs SET state='sent',result=?,last_error='' WHERE id=?").run(JSON.stringify({id:result.id}),job.id);
      if(p.subscriberId)store.db.prepare('UPDATE subscribers SET last_sent=? WHERE id=?').run(new Date().toISOString(),p.subscriberId);
    }catch(error){
      // A timed-out Facebook POST may already exist. Never blindly post it again.
      const state=job.type==='facebook'?'needs_review':job.attempts>=4?'failed':'retry';
      store.db.prepare('UPDATE jobs SET state=?,next_at=?,last_error=? WHERE id=?').run(state,Date.now()+Math.min(3600000,60000*2**job.attempts),String(error.message).slice(0,300),job.id);
    }
  }
  return jobs.length;
}
export function queueDueDigests(store,env,root){
  if(!integrationStatus(env).email||!root)return 0;
  const settings=JSON.parse(store.db.prepare("SELECT value FROM meta WHERE key='settings'").get()?.value||'{}');
  if(!settings.digestEnabled)return 0;
  const subscribers=store.db.prepare("SELECT * FROM subscribers WHERE status='active'").all();
  const entries=visibleEntries(store.list('entries'));let count=0;
  for(const sub of subscribers){
    const period=(sub.frequency==='daily'?1:7)*86400000,last=Date.parse(sub.last_sent||sub.created_at);
    if(Date.now()-last<period)continue;
    const selected=entries.filter(e=>(!sub.journey||e.journey===sub.journey)&&Date.parse(e.publishedAt)>last).slice(0,10);
    if(!selected.length)continue;
    const content=digestContent(selected,store.get('journeys',sub.journey)?.title,root),manage=store.manageToken(sub.id),link=`${root}/subscribe/?manage=${manage}`;
    const batch=digest(selected.map(e=>e.id+e.version).join('|')).slice(0,20);
    store.enqueue(`auto-digest-${sub.id}-${batch}`,'email',{to:sub.email,subscriberId:sub.id,subject:content.subject,html:`${content.html}<p><a href="${escapeHTML(link)}">Preferences or unsubscribe</a></p>`,text:`${content.subject}\n${selected.map(e=>`${e.title}: ${root}/journal/${e.id}/`).join('\n')}\nPreferences: ${link}`,headers:{'List-Unsubscribe':`<${link}>`}});
    store.db.prepare('UPDATE subscribers SET manage_hash=? WHERE id=?').run(digest(manage),sub.id);count++;
    if(count>=100)break;
  }
  return count;
}
export function digestContent(entries,journeyTitle,url){
  const subject=`From the road: ${journeyTitle||'The Walking Rotarian'}`;
  const html=`<h1>${escapeHTML(subject)}</h1>`+entries.map(e=>`<h2><a href="${escapeHTML(`${url}/journal/${e.id}/`)}">${escapeHTML(e.title)}</a></h2><p>${escapeHTML(e.body.slice(0,350))}</p>`).join('');
  return {subject,html};
}
