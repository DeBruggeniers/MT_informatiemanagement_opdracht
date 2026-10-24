/* Docentassistent: alleen UI-code, zonder antwoorden of toegangscodes.
 * Laadt de prive-antwoordenbank lokaal in het browsergeheugen.
 * De docent houdt de bestaande verzendknop in eigen beheer.
 */
(()=>{
'use strict';
let bank=[],loaded='';
const teamNum={A:1,B:2,C:3,D:4};
const CHAT_URL='https://chatgpt.com/g/g-p-6abf7a7750488191aa4d6d50ccc71a25-cursus-assetmanagement/c/6ad0d8a9-087c-83ed-81de-faa255719706';
const norm=s=>String(s||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9 ]/g,' ');
const terms=s=>new Set(norm(s).split(/\s+/).filter(w=>w.length>3&&!['welke','waarom','kunnen','worden','heeft','zijn','deze','voor','door','over'].includes(w)));
function relevance(a,b){const x=terms(a),y=terms(b);let n=0;for(const t of x)if(y.has(t))n++;return n;}
const getQuestion=id=>{try{return state?.questions?.find(q=>Number(q.id)===id)||null}catch{return null}};
const active=()=>{try{return role==='admin'}catch{return false}};
function css(){if(document.getElementById('teacher-answer-style'))return;const s=document.createElement('style');s.id='teacher-answer-style';s.textContent=`
.teacher-answer{border:1px solid #d7e1ef;border-left:4px solid #5ab3b2;background:#f6fafc;border-radius:9px;padding:13px;margin:10px 0 18px}
.teacher-answer h3{font-size:15px;margin:0 0 6px;color:#202c5e}
.teacher-answer p{margin:6px 0 9px;font-size:12px;color:#53647b}
.teacher-answer input,.teacher-answer select{width:100%;padding:8px;margin:4px 0 8px;font-size:13px}
.teacher-answer .ta-preview{background:#fff;border:1px solid #dde6f0;border-radius:6px;padding:10px;max-height:200px;overflow:auto;white-space:pre-wrap;font-size:13px}
.teacher-answer .ta-actions{display:flex;flex-wrap:wrap;gap:7px;margin-top:8px}
.teacher-answer button{font-size:12px;margin:0;padding:8px 10px}
.teacher-answer .ta-status{font-size:12px;color:#245b77}
`;document.head.appendChild(s)}
function prompt(q,team){
const references=bank.filter(x=>x.team===team).map(x=>({...x,rank:relevance(q.question,x.question)})).sort((a,b)=>b.rank-a.rank).slice(0,4);
return ['Je ondersteunt een docent bij de assetmanagementsimulatie MT aan het stuur.','Formuleer een feitelijk, bondig conceptantwoord van maximaal 120 woorden. Gebruik uitsluitend de opgegeven bronantwoorden. Geef geen ongevraagde oplossingen. Markeer niet-onderbouwde oorzaken als onbekend. De docent beoordeelt het concept zelf.', 'MT '+team+' vraagt: '+q.question, 'Relevante oefenbronnen:',...references.map((x,i)=>(i+1)+'. '+x.question+'\n'+x.answer+'\nStatus: '+x.status+'; bron: '+x.source)].join('\n\n')}
function panel(field){
if(field.dataset.answerHelper)return;
field.dataset.answerHelper='1';
const id=Number(field.id.slice(7));
const wrap=document.createElement('div');wrap.className='teacher-answer';
wrap.innerHTML='<h3>Docentassistent · antwoordenbank</h3><p>Laad de privé-antwoordenbank. Alleen antwoorden van dit MT worden getoond. Een concept wordt nooit automatisch verstuurd.</p><input type="file" accept=".json,application/json" aria-label="Privé antwoordenbank laden"><input type="search" placeholder="Zoek in 20 antwoorden…" aria-label="Zoeken"><select aria-label="Passend antwoord selecteren"></select><div class="ta-preview">Laad eerst het privé JSON-bestand.</div><div class="ta-actions"><button type="button" class="ta-use">Antwoord overnemen</button><button type="button" class="secondary ta-ai">Vraag naar projectchat kopiëren</button></div><p class="ta-status" role="status"></p>';
const [file,search,select]=[wrap.querySelector('input[type=file]'),wrap.querySelector('input[type=search]'),wrap.querySelector('select')];
const preview=wrap.querySelector('.ta-preview'),status=wrap.querySelector('.ta-status');
const current=()=>getQuestion(id),team=()=>teamNum[current()?.team],available=()=>bank.filter(x=>x.team===team());
function render(){
 const q=current(),candidates=available().map((x,i)=>({x,i,n:relevance(search.value||q?.question,x.question)})).sort((a,b)=>b.n-a.n);
 const shown=search.value?candidates.filter(z=>z.n>0||norm(z.x.question).includes(norm(search.value))):candidates;
 const keep=select.value;select.replaceChildren();
 for(const z of shown){const option=document.createElement('option');option.value=String(z.i);option.textContent=z.x.question;select.appendChild(option)}
 if([...select.options].some(o=>o.value===keep)&&search.value)select.value=keep;
 const chosen=available()[Number(select.value)];
 preview.textContent=chosen?chosen.answer+'\n\nBewijsstatus: '+chosen.status+'\nBron: '+chosen.source:bank.length?'Geen passende vraag. Probeer een andere zoekterm.':'Laad eerst het privé JSON-bestand.';
 wrap.querySelector('.ta-use').disabled=!chosen;wrap.querySelector('.ta-ai').disabled=!q;
}
file.addEventListener('change',async()=>{
 try{const o=JSON.parse(await file.files[0].text());if(!Array.isArray(o.items)||o.items.length!==80||[1,2,3,4].some(t=>o.items.filter(x=>x.team===t).length!==20)||o.items.some(x=>!x.question||!x.answer))throw Error('Onjuist formaat: verwacht 20 vragen en antwoorden per MT.');
 bank=o.items;loaded=file.files[0].name;document.querySelectorAll('.teacher-answer').forEach(p=>p.dispatchEvent(new Event('answer-bank-loaded')));status.textContent='80 antwoorden lokaal geladen: '+loaded;
 }catch(e){status.textContent='Importeren mislukt: '+e.message}
});
search.addEventListener('input',render);select.addEventListener('change',render);wrap.addEventListener('answer-bank-loaded',render);
wrap.querySelector('.ta-use').addEventListener('click',()=>{const x=available()[Number(select.value)];if(!x)return;field.value=x.answer;field.dispatchEvent(new Event('input',{bubbles:true}));status.textContent='Concept overgenomen. Controleer de tekst en klik zelf op Verstuur antwoord.'});
wrap.querySelector('.ta-ai').addEventListener('click',async()=>{
 const q=current();if(!q)return;
 const message=prompt(q,team());
 // Open het venster rechtstreeks tijdens de klik om pop-upblokkering te voorkomen.
 const chat=window.open(CHAT_URL,'_blank','noopener,noreferrer');
 let copied=false;
 try{
  await navigator.clipboard.writeText(message);
  copied=true;
 }catch(err){
  // Clipboard may be restricted; provide a selectable fallback prompt.
  const previous=wrap.querySelector('.ta-manual-prompt');
  if(previous)previous.remove();
  const area=document.createElement('textarea');
  area.className='ta-manual-prompt';
  area.rows=7;
  area.readOnly=true;
  area.value=message;
  area.setAttribute('aria-label','Prompt voor de cursusprojectchat');
  wrap.appendChild(area);
  area.select();
  status.textContent='Automatisch kopiëren is geblokkeerd. Kopieer de geselecteerde tekst en plak deze in de projectchat.';
 }
 if(copied){
  status.textContent=chat
   ?'Vraag met scenario-informatie gekopieerd. Plak met Ctrl+V in de geopende projectchat en verzend.'
   :'Vraag gekopieerd. Open de projectchat via de onderstaande link, plak met Ctrl+V en verzend.';
 }
 if(!chat){
  let link=wrap.querySelector('.ta-chat-link');
  if(!link){link=document.createElement('a');link.className='ta-chat-link';link.target='_blank';link.rel='noopener noreferrer';link.textContent='Open ChatGPT-projectchat';wrap.appendChild(link);}
  link.href=CHAT_URL;
 }
});
field.insertAdjacentElement('afterend',wrap);render()
}
let busy=false;function mount(){if(busy||!active())return;busy=true;try{css();document.querySelectorAll('textarea[id^="answer-"]').forEach(panel)}finally{busy=false}}
const boot=()=>{new MutationObserver(mount).observe(document.body,{childList:true,subtree:true});mount()};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
