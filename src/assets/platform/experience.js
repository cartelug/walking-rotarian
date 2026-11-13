import {h} from './client.js';
const arrow='<svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M2 8h11M9 4l4 4-4 4"/></svg>';
import {rankSearch} from './experience-model.js';

export function bindExperience(ctx) {
  const dialog = document.querySelector('[data-quick-search]');
  if (dialog) {
    const input = dialog.querySelector('input'), results = dialog.querySelector('[data-search-results]'), status = dialog.querySelector('[data-search-count]');
    const pages = [['His story','Meet Mbanda Shyaka and discover his work before the walks.','/his-story/'],['Shop','Merchandise, books and accessories.','/shop/'],['Get involved','Support the walk, host a stop or invite Shyaka to speak.','/get-involved/'],['Gallery','Photographs and visual stories.','/gallery/'],['Media','Interviews, press coverage and the speaker kit.','/media/']];
    const documents = [...ctx.data.journeys.map(j => ({...j, kind:'Journey', url:j.url||ctx.href('/journeys/')})), ...ctx.data.entries.map(e => ({...e, kind:'Journal', url:ctx.entryURL(e)})), ...pages.map(([title,body,url]) => ({title,body,kind:'Explore',url:ctx.href(url)})), ...(ctx.data.searchExtras||[]).map(e=>({...e,kind:'His story'}))];
    let opener;
    const render = () => {
      const matches = rankSearch(documents, input.value);
      status.textContent = input.value.trim() ? `${matches.length} matching ${matches.length === 1 ? 'result' : 'results'}` : 'A few places to begin';
      results.innerHTML = matches.length ? matches.map(item => `<a class="wr-search-result" href="${h(item.url)}"><span>${h(item.kind)}</span><strong>${h(item.title)}</strong><small>${h(item.place||item.route||item.body?.slice(0,100)||'Explore this part of the journey')}</small><b aria-hidden="true">${arrow}</b></a>`).join('') : '<p class="wr-search-empty">No matching stories yet. Try a place, a walk or a different word.</p>';
    };
    document.querySelectorAll('[data-search-open]').forEach(link => link.addEventListener('click', event => {
      if (!dialog.showModal) return;
      event.preventDefault(); opener=link; render(); dialog.showModal(); document.documentElement.classList.add('wr-search-open'); input.focus();
    }));
    input.addEventListener('input',render);
    dialog.querySelector('[data-search-close]').addEventListener('click',()=>dialog.close());
    dialog.addEventListener('keydown',event=>{if(event.key==='Escape'){event.preventDefault();dialog.close();}});
    dialog.addEventListener('close',()=>{document.documentElement.classList.remove('wr-search-open');opener?.focus();});
    dialog.addEventListener('click',event=>{if(event.target===dialog){const box=dialog.getBoundingClientRect();if(event.clientX<box.left||event.clientX>box.right||event.clientY<box.top||event.clientY>box.bottom)dialog.close();}});
    dialog.querySelector('form').addEventListener('submit',event=>{event.preventDefault();const first=results.querySelector('a');if(first)location.assign(first.href);});
  }
  document.querySelectorAll('[data-journey-explorer]').forEach(root=>{
    const tabs=[...root.querySelectorAll('[role=tab]')], panels=[...root.querySelectorAll('[role=tabpanel]')];
    const choose=tab=>{tabs.forEach(item=>{const selected=item===tab;item.setAttribute('aria-selected',String(selected));item.tabIndex=selected?0:-1;});panels.forEach(panel=>panel.hidden=panel.id!==tab.getAttribute('aria-controls'));};
    tabs.forEach((tab,index)=>{tab.addEventListener('click',()=>choose(tab));tab.addEventListener('keydown',event=>{let next;if(event.key==='ArrowRight')next=(index+1)%tabs.length;if(event.key==='ArrowLeft')next=(index+tabs.length-1)%tabs.length;if(event.key==='Home')next=0;if(event.key==='End')next=tabs.length-1;if(next!==undefined){event.preventDefault();choose(tabs[next]);tabs[next].focus();}});});
  });
}

export function homepageStoryCard(entry, ctx) {
  const image=(entry.media||[]).find(media=>media.type==='image');
  const journey=ctx.data.journeys.find(j=>j.id===entry.journey);
  const source=image?.url||journey?.image;
  const thumbnail=source?`<img src="${h(ctx.mediaURL(source))}" alt="${h(image?.alt||journey?.title||'Photograph from the journey')}" width="800" height="520" loading="lazy" decoding="async">`:'<span class="wr-journal-monogram" aria-hidden="true">WR</span>';
  return `<article class="wr-journal-card"><a class="wr-journal-card__image" href="${h(ctx.entryURL(entry))}" tabindex="-1" aria-hidden="true">${thumbnail}<span>${h(entry.type==='reflection'?'Reflection':'From the archive')}</span></a><div class="wr-journal-card__body"><p class="eyebrow"><time datetime="${h(entry.publishedAt)}">${h(entry.publishedAt.slice(0,10))}</time> / ${h(entry.place||'The journey')}</p><h3><a href="${h(ctx.entryURL(entry))}">${h(entry.title)}</a></h3><p>${h(entry.body.slice(0,145))}${entry.body.length>145?'…':''}</p><a class="wr-text-link" href="${h(ctx.entryURL(entry))}">Read the story <span aria-hidden="true">${arrow}</span></a></div></article>`;
}
