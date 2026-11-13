const clean = (value, max) => String(value || '').replace(/[\u0000-\u001f\u007f]/g,' ').replace(/\s+/g,' ').trim().slice(0,max);
export function donationDetails(input){
 const purpose=input.purpose==='education'?'education':'personal';
 const name=clean(input.name,80),note=clean(input.note,400);
 if(!name)throw new Error('Please add your name.');
 let currency=input.currency==='USD'?'USD':'UGX',steps=null,amount=Number(input.amount);
 if(purpose==='education'){
  steps=Number(input.steps);
  if(!Number.isSafeInteger(steps)||steps<5||steps>1000000)throw new Error('Choose a whole number of steps from 5 to 1,000,000.');
  amount=steps*5000;currency='UGX';
 }
 if(!Number.isFinite(amount)||amount<=0||amount>(purpose==='education'?5000000000:1000000000)||(currency==='UGX'&&!Number.isInteger(amount))||(currency==='USD'&&Math.abs(amount*100-Math.round(amount*100))>0.00001))throw new Error('Enter a valid amount within the allowed range.');
 return {purpose,name,note,currency,amount,steps,label:purpose==='education'?'Walk for Education':'The Walking Rotarian'};
}
export function donationMessage(details){
 return ['Hello Walking Rotarian team,','','I would like to give to *'+details.label+'*.','','*Name:* '+details.name,'*Amount:* '+details.currency+' '+details.amount.toLocaleString('en-US'),...(details.steps?['*Symbolic steps:* '+details.steps.toLocaleString('en-US')]:[]),...(details.note?['*Message:* '+details.note]:[]),'','Please confirm the authorised recipient and payment instructions for this purpose. This is my donation request; I have not made payment yet.'].join('\n');
}
