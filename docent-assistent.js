/* Docentassistent: alleen UI-code, zonder antwoorden of toegangscodes.
 * Laadt de prive-antwoordenbank lokaal in het browsergeheugen.
 * De docent houdt de bestaande verzendknop in eigen beheer.
 */
(()=>{
'use strict';
let bank=[],loaded='';
const STORAGE_KEY='mt_docent_antwoordenbank_v65';
// De bank blijft in deze browser en wordt nooit meegestuurd naar GitHub of de Worker.
function validBank(o){
 return Array.isArray(o?.items)&&o.items.length===80&&
  [1,2,3,4].every(t=>o.items.filter(x=>Number(x.team)===t).length===20)&&
  o.items.every(x=>x.question&&x.answer);
}
function notifyBank(){document.querySelectorAll('.teacher-answer').forEach(p=>p.dispatchEvent(new Event('answer-bank-loaded')))}
function restoreBank(){
 try{
  const raw=localStorage.getItem(STORAGE_KEY);
  if(!raw)return;
  const o=JSON.parse(raw);
  if(!validBank(o))return;
  bank=o.items;loaded='Opgeslagen privé-antwoordenbank (v6.5)';
  notifyBank();
 }catch(e){console.warn('De lokale antwoordenbank kon niet worden hersteld.',e)}
}

const teamNum={A:1,B:2,C:3,D:4};
const CHAT_URL='https://chatgpt.com/g/g-p-6abf7a7750488191aa4d6d50ccc71a25-cursus-assetmanagement/c/6adcc685-328c-83eb-9e09-1acb86802803';
const norm=s=>String(s||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9 ]/g,' ');
const ignored=new Set(['welke','waarom','kunnen','worden','heeft','zijn','deze','voor','door','over','hoeveel','waarvan','omdat','betekent','jullie','onze','de','het','een','bij','wat','hoe','waar','met','aan','die','dit','dat','nog','niet']);
const aliases={wegvakken:'wegvak',wegen:'weg',kwaliteit:'beeldkwaliteit',wegkwaliteit:'beeldkwaliteit',vertraging:'reistijd',omrijtijd:'reistijd',vris:'vri',verkeerslichten:'vri',storingen:'storing',uitval:'storing',kostenoverschrijding:'kosten',onderhoudskosten:'kosten',onderhoudsprogrammering:'planning',inspectieopvolging:'inspectie',personeel:'capaciteit',vacatures:'capaciteit',bruggen:'kunstwerk',brug:'kunstwerk'};
const terms=s=>new Set(norm(s).split(/\s+/).filter(w=>w.length>2&&!ignored.has(w)).map(w=>aliases[w]||w.replace(/(ingen|heden|en|s)$/,m=>w.length>6?'':m)));
function relevance(a,b){
 const x=terms(a),y=terms(b);let n=0;
 for(const t of x)if(y.has(t))n+=2;
 if(norm(a).trim()===norm(b).trim())n+=100;
 return n;
}
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
 const round=Number(q.round)||'onbekend';
 const references=bank.filter(x=>x.team===team).map(x=>({...x,rank:relevance(q.question,x.question)})).filter(x=>x.rank>0).sort((a,b)=>b.rank-a.rank).slice(0,4);
 return [
  'DOCENTASSISTENT | MT AAN HET STUUR | CURSUS ASSETMANAGEMENT',
  'Beantwoord de letterlijke informatievraag binnen de fictieve assetmanagementsimulatie v6.5. Gebruik uitsluitend de vastgelegde scenariogegevens, de beschikbare projectdocumenten en de hieronder meegegeven bronantwoorden. Verzin geen cijfers of oorzakelijke verbanden.',
  'Informatiepositie: MT '+team+'; informatieronde '+round+'. Beantwoord uitsluitend de gestelde vraag. Verstrek geen ongevraagde informatie uit andere MT-dossiers, geen volledige interventieafweging en geen hints naar de beste maatregel. Een gerichte vraag mag wel relevante achterliggende informatie opleveren, mits die in het scenario onderbouwd is.',
  'Geef precies twee onderdelen: (1) ANTWOORD AAN MT, maximaal 120 woorden, direct kopieerbaar naar de simulatie; (2) DOCENTCONTROLE, met bron, bewijsstatus en eventuele ontbrekende informatie. Houd onderdeel 2 buiten het antwoord aan het MT.',
  'LETTERLIJKE VRAAG MT '+team+' (ronde '+round+'): '+q.question,
  references.length?'RELEVANTE GEGEVENS UIT DE LOKALE ANTWOORDENBANK:':'Geen passende antwoordenbankvermelding meegegeven; controleer de projectbronnen en zeg expliciet wanneer de gegevens ontbreken.',
  ...references.map((x,i)=>(i+1)+'. '+x.question+'\nAntwoord: '+x.answer+'\nBewijsstatus: '+x.status+'; bron: '+x.source)
 ].join('\n\n');
}
function panel(field){
if(field.dataset.answerHelper)return;
field.dataset.answerHelper='1';
const id=Number(field.id.slice(7));
const wrap=document.createElement('div');wrap.className='teacher-answer';
wrap.innerHTML='<h3>Docentassistent · antwoordenbank</h3><p>De privé-antwoordenbank wordt na één keer laden op dit apparaat bewaard. Het best passende standaardantwoord verschijnt automatisch; controleer altijd de inhoud voordat je verzendt.</p><input type="file" accept=".json,application/json" aria-label="Privé antwoordenbank laden"><input type="search" placeholder="Zoek in 20 antwoorden…" aria-label="Zoeken"><select aria-label="Passend antwoord selecteren"></select><div class="ta-preview">Laad eerst het privé JSON-bestand.</div><div class="ta-actions"><button type="button" class="ta-use">Antwoord overnemen</button><button type="button" class="secondary ta-ai">Vraag naar projectchat kopiëren</button></div><p class="ta-status" role="status"></p>';
const [file,search,select]=[wrap.querySelector('input[type=file]'),wrap.querySelector('input[type=search]'),wrap.querySelector('select')];
const preview=wrap.querySelector('.ta-preview'),status=wrap.querySelector('.ta-status');
const current=()=>getQuestion(id),team=()=>teamNum[current()?.team],available=()=>bank.filter(x=>x.team===team());
function render(){
 const q=current(),candidates=available().map((x,i)=>({x,i,n:relevance(search.value||q?.question,x.question)})).sort((a,b)=>b.n-a.n);
 const shown=search.value?candidates.filter(z=>z.n>0||norm(z.x.question).includes(norm(search.value))):candidates;
 const keep=select.value;select.replaceChildren();
 for(const z of shown){const option=document.createElement('option');option.value=String(z.i);option.textContent=z.x.question;select.appendChild(option)}
 if([...select.options].some(o=>o.value===keep)&&search.value)select.value=keep;
 const chosen=select.options.length?available()[Number(select.value)]:null;
 preview.textContent=chosen?((!search.value&&candidates[0]?.n===0)?'Let op: geen duidelijke overeenkomst gevonden. Selecteer een ander antwoord of gebruik ChatGPT.\n\n':'')+chosen.answer+'\n\nBewijsstatus: '+chosen.status+'\nBron: '+chosen.source:bank.length?'Geen passende vraag. Probeer een andere zoekterm.':'Laad de privé-antwoordenbank eenmalig via het JSON-bestand.';
 wrap.querySelector('.ta-use').disabled=!chosen;wrap.querySelector('.ta-ai').disabled=false;
}
file.addEventListener('change',async()=>{
 try{
  const selected=file.files?.[0];if(!selected)return;
  const raw=await selected.text(),o=JSON.parse(raw);
  if(!validBank(o))throw Error('Onjuist formaat: verwacht 20 vragen en antwoorden per MT.');
  bank=o.items;loaded=selected.name;
  try{localStorage.setItem(STORAGE_KEY,raw);status.textContent='80 antwoorden opgeslagen in deze browser. Voortaan automatisch beschikbaar.'}
  catch{status.textContent='80 antwoorden geladen, maar lokaal opslaan is geblokkeerd. Volgende keer opnieuw laden.'}
  notifyBank();
 }catch(e){status.textContent='Importeren mislukt: '+e.message}
});
search.addEventListener('input',render);select.addEventListener('change',render);wrap.addEventListener('answer-bank-loaded',render);
wrap.querySelector('.ta-use').addEventListener('click',()=>{const x=select.options.length?available()[Number(select.value)]:null;if(!x)return;field.value=x.answer;field.dispatchEvent(new Event('input',{bubbles:true}));status.textContent='Concept overgenomen. Controleer de tekst en klik zelf op Verstuur antwoord.'});
function manualPrompt(message){
 let area=wrap.querySelector('.ta-manual-prompt');
 if(!area){
  area=document.createElement('textarea');
  area.className='ta-manual-prompt';area.rows=8;area.readOnly=true;
  area.setAttribute('aria-label','De gegenereerde ChatGPT-prompt');
  wrap.appendChild(area);
 }
 area.value=message;
 let copy=wrap.querySelector('.ta-copy-prompt');
 if(!copy){
  copy=document.createElement('button');
  copy.type='button';copy.className='secondary ta-copy-prompt';
  copy.textContent='Kopieer de volledige prompt';
  wrap.appendChild(copy);
  copy.addEventListener('click',async()=>{
   const text=area.value;
   try{await navigator.clipboard.writeText(text);status.textContent='Prompt gekopieerd. Plak met Ctrl+V in de projectchat.'}
   catch{
    area.focus();area.select();
    if(document.execCommand('copy'))status.textContent='Prompt gekopieerd. Plak met Ctrl+V in de projectchat.';
    else status.textContent='Automatisch kopiëren is niet toegestaan. Selecteer de tekst hieronder en gebruik Ctrl+C.';
   }
  });
 }
 return area;
}
wrap.querySelector('.ta-ai').addEventListener('click',()=>{
 const q=current();
 if(!q){status.textContent='De informatievraag is niet gevonden. Vernieuw de docentomgeving.';return;}
 const message=prompt(q,team());
 // Toon de volledige prompt altijd op de docentpagina als controleerbare fallback.
 const area=manualPrompt(message);
 // Clipboard request MUST start before navigating to ChatGPT.
 // A synchronous fallback supports browsers that deny the modern Clipboard API.
 let syncCopied=false;
 try{
  area.focus();area.select();
  syncCopied=document.execCommand('copy');
 }catch{}
 const modernCopy=typeof navigator.clipboard?.writeText==='function'
  ?navigator.clipboard.writeText(message).then(()=>{
    status.textContent='Prompt gekopieerd. Plak deze met Ctrl+V in de geopende projectchat.';
   }).catch(()=>{
    status.textContent=syncCopied
      ?'Prompt gekopieerd. Plak deze met Ctrl+V in de geopende projectchat.'
      :'Kopiëren geblokkeerd. Ga terug naar dit venster en klik op Kopieer de volledige prompt.';
   })
  :null;
 // Open the chat after initiating copy, without automatic sending.
 const chat=window.open(CHAT_URL,'_blank');
 if(!chat){
  let link=wrap.querySelector('.ta-chat-link');
  if(!link){link=document.createElement('a');link.className='ta-chat-link';link.target='_blank';link.rel='noopener noreferrer';link.textContent='Open ChatGPT-projectchat';wrap.appendChild(link)}
  link.href=CHAT_URL;
 }
 status.textContent=syncCopied?'Prompt gekopieerd. Plak met Ctrl+V in de projectchat.':'Prompt klaargezet. Gebruik Ctrl+V in de projectchat; als dat niet lukt, klik op Kopieer de volledige prompt.';
});
field.insertAdjacentElement('afterend',wrap);render()
}
let busy=false;function mount(){if(busy||!active())return;busy=true;try{css();document.querySelectorAll('textarea[id^="answer-"]').forEach(panel)}finally{busy=false}}
const boot=()=>{new MutationObserver(mount).observe(document.body,{childList:true,subtree:true});mount()};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>{restoreBank();boot()},{once:true});else {restoreBank();boot()}
})();
