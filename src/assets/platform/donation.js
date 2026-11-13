import {donationDetails,donationMessage} from './donation-model.js';
export function bindDonation(){
 const root=document.querySelector('[data-donation]');if(!root)return;
 const form=root.querySelector('form'),f=form.elements,review=root.querySelector('[data-giving-review]'),summary=root.querySelector('[data-giving-summary]'),error=root.querySelector('[data-giving-error]'),status=root.querySelector('[data-giving-status]');
 let message='';
 root.querySelector('[data-giving-submit]').disabled=false;
 const progress=step=>root.querySelectorAll('[data-giving-progress]').forEach(li=>{if(li.dataset.givingProgress===step)li.setAttribute('aria-current','step');else li.removeAttribute('aria-current');});
 const total=()=>{const n=Number(f.steps.value);root.querySelector('[data-giving-total]').textContent=Number.isInteger(n)&&n>=5&&n<=1000000?'UGX '+(n*5000).toLocaleString('en-US'):'Choose at least 5 whole steps.';};
 const amounts=()=>root.querySelectorAll('[data-giving-amount]').forEach(b=>b.setAttribute('aria-pressed',String(f.currency.value==='UGX'&&Number(f.amount.value)===Number(b.dataset.givingAmount))));
 const purpose=()=>{const education=f.purpose.value==='education';root.querySelector('[data-giving-personal]').hidden=education;root.querySelector('[data-giving-education]').hidden=!education;f.steps.disabled=!education;f.steps.required=education;f.amount.disabled=education;f.amount.required=!education;f.currency.disabled=education;total();};
 const currency=()=>{f.amount.step=f.currency.value==='USD'?'0.01':'1';amounts();};
 f.purpose.addEventListener('change',purpose);f.currency.addEventListener('change',currency);f.steps.addEventListener('input',total);f.amount.addEventListener('input',amounts);
 root.querySelectorAll('[data-giving-amount]').forEach(b=>b.addEventListener('click',()=>{f.currency.value='UGX';f.amount.value=b.dataset.givingAmount;currency();}));
 const params=new URLSearchParams(location.search);if(params.get('purpose')==='education')f.purpose.value='education';const count=Number(params.get('steps'));if(Number.isInteger(count)&&count>=5&&count<=1000000)f.steps.value=count;purpose();currency();
 form.addEventListener('submit',event=>{event.preventDefault();error.textContent='';let details;try{details=donationDetails(Object.fromEntries(new FormData(form)));}catch(e){error.textContent=e.message;return;}
  summary.replaceChildren();const rows=[['For',details.label],['From',details.name],['Your gift',details.currency+' '+details.amount.toLocaleString('en-US')],...(details.steps?[['Symbolic steps',details.steps.toLocaleString('en-US')]]:[]),...(details.note?[['Your message',details.note]]:[])];
  rows.forEach(([key,value])=>{const row=document.createElement('div'),dt=document.createElement('dt'),dd=document.createElement('dd');dt.textContent=key;dd.textContent=value;row.append(dt,dd);summary.append(row);});
  message=donationMessage(details);root.querySelector('[data-giving-send]').href='https://wa.me/'+root.dataset.whatsapp+'?text='+encodeURIComponent(message);root.querySelector('[data-giving-copy-text]').value=message;status.textContent='';form.hidden=true;review.hidden=false;progress('review');review.focus({preventScroll:true});root.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth',block:'start'});
 });
 root.querySelector('[data-giving-edit]').addEventListener('click',()=>{review.hidden=true;form.hidden=false;progress('details');f.purpose.focus();root.querySelector('[data-giving-copy-text]').hidden=true;});
 root.querySelector('[data-giving-send]').addEventListener('click',()=>{progress('connect');status.textContent='WhatsApp opens with your request ready. Review it and press Send there. No payment has been taken.';});
 root.querySelector('[data-giving-copy]').addEventListener('click',async()=>{try{await navigator.clipboard.writeText(message);status.textContent='Donation request copied. Paste it into your conversation with the team.';}catch{const text=root.querySelector('[data-giving-copy-text]');text.hidden=false;text.focus();text.select();status.textContent='Select and copy the prepared request below.';}});
}
