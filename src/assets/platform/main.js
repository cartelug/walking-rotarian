import {bindExperience,homepageStoryCard} from './experience.js';
import {createClient,h,readLocal,writeLocal,toast} from './client.js';
import {entryCard,renderJournal,renderArchive,renderSaved,renderAtlas,renderCommunity,renderPartners,renderReports,renderSubscription,bindReaderActions} from './readers.js';
import {renderStudio} from './studio.js';
import {renderShop} from './shop.js';
const ctx=createClient();
const setLowData=value=>{document.documentElement.classList.toggle('wr-low-data',value);document.querySelectorAll('[data-low-data]').forEach(b=>{b.setAttribute('aria-pressed',String(value));b.textContent=value?'Low data: on':'Low data: off';});};
setLowData(readLocal('wr.low-data',navigator.connection?.saveData===true));
document.querySelectorAll('[data-low-data]').forEach(b=>b.addEventListener('click',()=>{const value=!document.documentElement.classList.contains('wr-low-data');writeLocal('wr.low-data',value);setLowData(value);}));
async function start(){
  try{await ctx.load();bindReaderActions(ctx);bindExperience(ctx);
    const socials=ctx.data.settings.socials||{};
    document.querySelectorAll('[data-social-links]').forEach(el=>{el.innerHTML=Object.entries(socials).filter(([,url])=>url).map(([name,url])=>`<a href="${h(url)}" target="_blank" rel="noopener noreferrer">${h(name==='facebook'?'Follow on Facebook':name[0].toUpperCase()+name.slice(1))}</a>`).join(' · ');});
    for(const root of document.querySelectorAll('[data-wr]')){
      const type=root.dataset.wr;
      if(type==='journal')renderJournal(root,ctx);
      if(type==='archive')renderArchive(root,ctx);
      if(type==='saved')renderSaved(root,ctx);
      if(type==='atlas')renderAtlas(root,ctx);
      if(type==='community'){renderCommunity(root,ctx);const kind=new URLSearchParams(location.search).get('request');if(kind&&root.querySelector('[name=request-kind]'))root.querySelector('[name=request-kind]').value=kind;}
      if(type==='partners')renderPartners(root,ctx);
      if(type==='reports')renderReports(root,ctx);
      if(type==='subscription')await renderSubscription(root,ctx);
      if(type==='studio')await renderStudio(root,ctx);
      if(type==='shop')await renderShop(root,ctx);
      if(type==='preview')root.innerHTML=ctx.data.entries.slice(0,3).map(e=>homepageStoryCard(e,ctx)).join('');
      if(type==='story'){const entry=ctx.data.entries.find(e=>e.id===root.dataset.entry);if(entry){root.innerHTML=entryCard(entry,ctx,{full:true,heading:'h1'});ctx.event('story_view',entry.id);}}
    }
    const currentPath=location.pathname.replace(ctx.base,'');
    if(currentPath.startsWith('/journeys/')){
      const slug=currentPath.split('/')[2],section=document.createElement('aside');section.className='container wr-notice';section.innerHTML=`<strong>Follow this journey’s story.</strong><div class="wr-actions"><a class="wr-action" href="${ctx.href('/live/?journey='+encodeURIComponent(slug))}">Open the diary</a><a class="wr-action" href="${ctx.href('/journey-atlas/?journey='+encodeURIComponent(slug))}">Explore the atlas</a><a class="wr-action" href="${ctx.href('/reports/')}">Create a reading copy</a></div>`;document.querySelector('main')?.append(section);
    }
    // Add download tools to the established media room, retaining its original content.
    if(currentPath==='/media/'){
      const kit=document.createElement('section');kit.className='block';kit.innerHTML=`<div class="container wr-panel"><h2>Speaker and press kit</h2><p>Download the sourced short biography, portrait and original WR logo for a media request.</p><div class="wr-actions"><button class="wr-action" type="button" data-download-bio>Download short biography</button><a class="wr-action" href="${ctx.href('/assets/press/walking-rotarian-logo-transparent.png')}" download>Download WR logo</a><a class="wr-action" href="${h(ctx.data.settings.portrait)}" download>Download portrait</a><a class="wr-action" href="${ctx.href('/community/?request=interview')}">Request an interview</a></div></div>`;document.querySelector('main').append(kit);kit.querySelector('button').onclick=async()=>{const {download}=await import('./exports.js');download(ctx.data.settings.bio+'\n\nSource: '+(ctx.data.settings.siteUrl||location.origin+ctx.base)+'/his-story/','Mbanda_Shyaka_Short_Biography.txt','text/plain;charset=utf-8');};
    }
  }catch(error){document.querySelectorAll('[data-wr]').forEach(el=>{if(el.dataset.wr!=='story')el.innerHTML=`<p class="wr-notice">${h(error.message)} Please try again when your connection returns.</p>`;});}
}
start();
let installEvent;
window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();installEvent=e;document.querySelectorAll('[data-install]').forEach(b=>b.hidden=false);});
document.querySelectorAll('[data-install]').forEach(b=>b.onclick=async()=>{if(installEvent){await installEvent.prompt();installEvent=null;b.hidden=true;}else toast('Use your browser’s Add to Home Screen command.');});
if('serviceWorker'in navigator&&location.protocol!=='file:'&&!['/studio/','/admin/'].some(route=>location.pathname.includes(route)))navigator.serviceWorker.register(ctx.href('/sw.js'),{scope:ctx.base+'/'}).catch(()=>{});
