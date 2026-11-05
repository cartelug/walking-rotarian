// Local canvas exports: no third-party rendering or visitor photographs leave the browser.
const encoder=new TextEncoder();
export function jpegPagesToPDF(pages){
  const chunks=[],offsets=[0];let size=0;
  const write=value=>{const b=typeof value==='string'?encoder.encode(value):value;chunks.push(b);size+=b.length;};
  const object=(id,body)=>{offsets[id]=size;write(`${id} 0 obj\n`);body();write('\nendobj\n');};
  write('%PDF-1.4\n');
  object(1,()=>write('<< /Type /Catalog /Pages 2 0 R >>'));
  object(2,()=>write(`<< /Type /Pages /Kids [${pages.map((_,i)=>`${3+i*3} 0 R`).join(' ')}] /Count ${pages.length} >>`));
  pages.forEach((page,i)=>{const id=3+i*3,scale=595.28/page.width;
    object(id,()=>write(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595.28 ${(page.height*scale).toFixed(2)}] /Resources << /XObject << /Im${i} ${id+1} 0 R >> >> /Contents ${id+2} 0 R >>`));
    object(id+1,()=>{write(`<< /Type /XObject /Subtype /Image /Width ${page.width} /Height ${page.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${page.bytes.length} >>\nstream\n`);write(page.bytes);write('\nendstream');});
    const commands=`q 595.28 0 0 ${(page.height*scale).toFixed(2)} 0 0 cm /Im${i} Do Q`;
    object(id+2,()=>write(`<< /Length ${encoder.encode(commands).length} >>\nstream\n${commands}\nendstream`));
  });
  const xref=size;write(`xref\n0 ${offsets.length}\n0000000000 65535 f \n`);for(let i=1;i<offsets.length;i++)write(`${String(offsets[i]).padStart(10,'0')} 00000 n \n`);
  write(`trailer\n<< /Size ${offsets.length} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`);
  const result=new Uint8Array(size);let cursor=0;for(const c of chunks){result.set(c,cursor);cursor+=c.length;}return result;
}
export function download(bytes,name,type){const url=URL.createObjectURL(new Blob([bytes],{type}));const a=document.createElement('a');a.href=url;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),15000);}
async function loadImage(url){return new Promise((resolve,reject)=>{const img=new Image();const timer=setTimeout(()=>{img.src='';reject(new Error('An image could not be loaded in time.'));},7000);img.crossOrigin='anonymous';img.onload=()=>{clearTimeout(timer);resolve(img);};img.onerror=()=>{clearTimeout(timer);reject(new Error('An image could not be included.'));};img.src=url;});}
function wrap(ctx,text,x,y,width,lineHeight){let line='';for(const word of String(text).split(/\s+/)){const candidate=line?line+' '+word:word;if(ctx.measureText(candidate).width>width&&line){ctx.fillText(line,x,y);line=word;y+=lineHeight;}else line=candidate;}if(line)ctx.fillText(line,x,y);return y+lineHeight;}
async function jpeg(canvas){const blob=await new Promise(r=>canvas.toBlob(r,'image/jpeg',.93));if(!blob)throw new Error('The browser could not create this image.');return new Uint8Array(await blob.arrayBuffer());}
export async function exportSocialCard(entry,ctx,format='portrait'){
  const canvas=document.createElement('canvas');canvas.width=1080;canvas.height=format==='square'?1080:1350;const g=canvas.getContext('2d');
  g.fillStyle='#132b36';g.fillRect(0,0,canvas.width,canvas.height);
  const photo=entry.media?.find(m=>m.type==='image');
  if(photo){try{const img=await loadImage(ctx.mediaURL(photo.url));const height=canvas.height*.6,scale=Math.max(canvas.width/img.width,height/img.height);g.drawImage(img,(canvas.width-img.width*scale)/2,0,img.width*scale,img.height*scale);const gradient=g.createLinearGradient(0,height*.55,0,height);gradient.addColorStop(0,'#132b3600');gradient.addColorStop(1,'#132b36');g.fillStyle=gradient;g.fillRect(0,0,1080,height);}catch{}}
  g.fillStyle='#dec491';g.font='bold 23px sans-serif';g.fillText('THE WALKING ROTARIAN',65,canvas.height*.65);
  g.fillStyle='#fffdf8';g.font='bold 56px sans-serif';wrap(g,entry.title,65,canvas.height*.71,950,67);
  g.fillStyle='#ddd7cc';g.font='26px sans-serif';wrap(g,entry.place||ctx.data.journeys.find(j=>j.id===entry.journey)?.title||'Every step has a story.',65,canvas.height-110,950,34);
  g.font='20px sans-serif';g.fillText(new Date(entry.publishedAt).toLocaleDateString('en-GB',{timeZone:'Africa/Kampala'}),65,canvas.height-54);
  try{const logo=await loadImage(ctx.data.settings.logo);g.fillStyle='#fffdf8';g.fillRect(920,45,95,132);g.drawImage(logo,927,51,81,120);}catch{}
  download(await jpeg(canvas),`walking-rotarian-${entry.id}-${format}.jpg`,'image/jpeg');
}
export async function exportJourneyPDF(entries,journey,ctx){
  if(!entries.length)throw new Error('Choose a journey with published stories.');
  const pages=[];let canvas,g,y;
  function newPage(){canvas=document.createElement('canvas');canvas.width=1240;canvas.height=1754;g=canvas.getContext('2d');g.fillStyle='#fffdf8';g.fillRect(0,0,1240,1754);g.fillStyle='#132b36';g.font='bold 21px sans-serif';g.fillText('THE WALKING ROTARIAN',85,70);g.font='18px sans-serif';g.fillText(journey.title,85,105);g.strokeStyle='#d6c7ab';g.beginPath();g.moveTo(85,126);g.lineTo(1155,126);g.stroke();y=185;}
  async function finish(){g.fillStyle='#62645e';g.font='17px sans-serif';g.fillText(`Journey diary · ${pages.length+1} · Generated ${new Date().toLocaleDateString('en-GB')}`,85,1695);pages.push({bytes:await jpeg(canvas),width:1240,height:1754});}
  newPage();
  g.font='bold 47px sans-serif';y=wrap(g,journey.title,85,y,1060,58)+20;g.font='24px sans-serif';y=wrap(g,journey.summary||journey.route||'',85,y,1060,35)+30;
  for(const entry of entries.slice().sort((a,b)=>Date.parse(a.publishedAt)-Date.parse(b.publishedAt))){
    if(y>1350){await finish();newPage();}
    g.fillStyle='#132b36';g.font='bold 33px sans-serif';y=wrap(g,entry.title,85,y,1060,42)+8;g.fillStyle='#696b65';g.font='19px sans-serif';y=wrap(g,`${entry.publishedAt.slice(0,10)} · ${entry.author} · ${entry.place||''}`,85,y,1060,29)+16;
    const words=entry.body.split(/\s+/);let line='';g.fillStyle='#252d30';g.font='23px sans-serif';
    for(const word of words){const candidate=line?line+' '+word:word;if(g.measureText(candidate).width>1060&&line){g.fillText(line,85,y);y+=34;line=word;if(y>1560){await finish();newPage();g.fillStyle='#252d30';g.font='23px sans-serif';}}else line=candidate;}
    if(line){g.fillText(line,85,y);y+=44;}
    const picture=entry.media?.find(m=>m.type==='image');
    if(picture){try{const img=await loadImage(ctx.mediaURL(picture.url));const scale=Math.min(1060/img.width,430/img.height),width=img.width*scale,height=img.height*scale;if(y+height+95>1580){await finish();newPage();}g.drawImage(img,85+(1060-width)/2,y,width,height);y+=height+26;g.font='18px sans-serif';g.fillStyle='#62645e';y=wrap(g,[picture.caption,picture.credit].filter(Boolean).join(' · '),85,y,1060,26)+15;}catch{g.font='18px sans-serif';y=wrap(g,'Image unavailable for this export. '+(picture.caption||''),85,y,1060,26)+15;}}
    for(const source of entry.sources||[]){if(y>1530){await finish();newPage();}g.fillStyle='#62645e';g.font='17px sans-serif';y=wrap(g,`${source.label}: ${source.url}`,85,y,1060,24)+5;}
    y+=35;
  }
  await finish();download(jpegPagesToPDF(pages),`Walking_Rotarian_${journey.id}_Diary.pdf`,'application/pdf');
}
