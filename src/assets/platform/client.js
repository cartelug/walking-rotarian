import { escapeHTML, visibleEntries } from './model.js';
export const h=escapeHTML;
export const dateLabel=value=>{try{return new Date(value).toLocaleString('en-GB',{dateStyle:'medium',timeStyle:'short',timeZone:'Africa/Kampala'})+' EAT';}catch{return value||'';}};
export const readLocal=(key,fallback)=>{try{return JSON.parse(localStorage.getItem(key))??fallback;}catch{return fallback;}};
export function writeLocal(key,value){try{localStorage.setItem(key,JSON.stringify(value));return true;}catch{return false;}}
export const paragraphs=text=>String(text||'').split(/\n\n+/).map(p=>`<p>${h(p).replace(/\n/g,'<br>')}</p>`).join('');
export function toast(message){let el=document.querySelector('.wr-toast');if(!el){el=document.createElement('div');el.className='wr-toast';el.setAttribute('role','status');document.body.append(el);}el.textContent=message;clearTimeout(toast.timer);toast.timer=setTimeout(()=>el.remove(),5500);}
export function createClient(){
  const base=document.querySelector('meta[name=wr-base]')?.content||'';
  const apiBase=(document.querySelector('meta[name=wr-api]')?.content||'').replace(/\/$/,'');
  const ctx={base,apiBase,data:null,seed:null,csrf:'',user:null,toast,
    href(route){return base+route;},
    mediaURL(url){if(apiBase&&url?.startsWith(base+'/uploads/'))return new URL(apiBase,location.href).origin+url;return url||'';},
    entryURL(e){if(apiBase&&!ctx.seed?.entries?.some(s=>s.id===e.id))return new URL(apiBase,location.href).href.replace(/\/api$/,'')+'/journal/'+encodeURIComponent(e.id)+'/';return new URL(base+'/journal/'+encodeURIComponent(e.id)+'/',location.origin).href;},
    async api(route,{method='GET',body,raw,headers={}}={}){
      if(!apiBase)throw new Error('Shared publishing is not connected yet.');
      const response=await fetch(apiBase+route,{method,credentials:'same-origin',headers:{...(body?{'Content-Type':'application/json'}:{}),...(ctx.csrf?{'X-CSRF-Token':ctx.csrf}:{}),...headers},body:body?JSON.stringify(body):raw,signal:AbortSignal.timeout(raw?90000:20000)});
      const payload=await response.json().catch(()=>({error:'The service did not return a readable response.'}));
      if(!response.ok){const e=new Error(payload.error||'The request could not be completed.');e.status=response.status;throw e;}return payload;
    },
    async load(){
      if(!ctx.seed){const response=await fetch(base+'/data/platform.json',{cache:'no-cache'});if(!response.ok)throw new Error('The journey archive could not be loaded.');ctx.seed=await response.json();}
      if(apiBase){try{ctx.data=await ctx.api('/public');ctx.online=true;}catch{ctx.data={...ctx.seed,capabilities:{backend:false}};ctx.online=false;}}
      else ctx.data={...ctx.seed,capabilities:{backend:false}};
      ctx.data.entries=visibleEntries(ctx.data.entries||[]);return ctx.data;
    },
    bookmarks(){return readLocal('wr.saved',[]);},
    savedEntries(){return readLocal('wr.saved.entries',{});},
    save(e){const ids=new Set(ctx.bookmarks()),entries=ctx.savedEntries();if(ids.has(e.id)){ids.delete(e.id);delete entries[e.id];}else{ids.add(e.id);entries[e.id]=e;}if(!writeLocal('wr.saved',[...ids])||!writeLocal('wr.saved.entries',entries))throw new Error('This browser could not save the story. Check its storage settings.');return ids.has(e.id);},
    event(event,resource=''){if(apiBase)ctx.api('/events',{method:'POST',body:{event,resource,referrer:document.referrer}}).catch(()=>{});},
  };
  return ctx;
}
