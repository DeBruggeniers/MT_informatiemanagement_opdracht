/* MT aan het stuur – client-side XLSX export without external libraries.
   No data is transmitted to third parties. All cells are inline strings or numbers. */
(function(){
'use strict';
const utf8=new TextEncoder();
const xmlEscape=s=>String(s??'').replace(/[<>&"']/g,c=>({'<':'&lt;','>':'&gt;','&':'&amp;','"':'&quot;',"'":'&apos;'}[c])).replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g,'');
const teams=['A','B','C','D'];
const teamName=t=>'MT '+(teams.indexOf(t)+1);

function letter(n){let s='';while(n>0){n--;s=String.fromCharCode(65+n%26)+s;n=Math.floor(n/26)}return s}
function sheet(rows,widths){
 const cells=rows.map((row,ri)=>{
  const r=ri+1;
  return '<row r="'+r+'">'+row.map((value,ci)=>{
   const col=letter(ci+1),address=col+r;
   if(value===null||value===undefined||value==='')return '';
   if(typeof value==='number'&&Number.isFinite(value))return '<c r="'+address+'" s="'+(ri===0?1:0)+'"><v>'+value+'</v></c>';
   return '<c r="'+address+'" t="inlineStr" s="'+(ri===0?1:0)+'"><is><t xml:space="preserve">'+xmlEscape(value)+'</t></is></c>';
  }).join('')+'</row>';
 }).join('');
 return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'+
 '<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">'+
 '<sheetViews><sheetView workbookViewId="0"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews>'+
 '<sheetFormatPr defaultRowHeight="15"/><cols>'+widths.map((width,i)=>'<col min="'+(i+1)+'" max="'+(i+1)+'" width="'+width+'" customWidth="1"/>').join('')+'</cols>'+
 '<sheetData>'+cells+'</sheetData><autoFilter ref="A1:'+letter(widths.length)+rows.length+'"/></worksheet>';
}
const styles='<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'+
 '<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">'+
 '<fonts count="2"><font><sz val="11"/><name val="Aptos"/></font><font><b/><color rgb="FFFFFFFF"/><sz val="11"/><name val="Aptos"/></font></fonts>'+
 '<fills count="2"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FF22345F"/><bgColor indexed="64"/></patternFill></fill></fills>'+
 '<borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders>'+
 '<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>'+
 '<cellXfs count="2"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0" applyAlignment="1"><alignment vertical="top" wrapText="1"/></xf><xf numFmtId="0" fontId="1" fillId="1" borderId="0" xfId="0" applyAlignment="1"><alignment vertical="top" wrapText="1"/></xf></cellXfs>'+
 '</styleSheet>';
function u16(n){return [n&255,n>>>8&255]}
function u32(n){return [n&255,n>>>8&255,n>>>16&255,n>>>24&255]}
const crcTable=(()=>{const t=[];for(let n=0;n<256;n++){let c=n;for(let i=0;i<8;i++)c=(c&1)?(0xEDB88320^(c>>>1)):(c>>>1);t.push(c>>>0)}return t})();
function crc32(bytes){let v=0xFFFFFFFF;for(const b of bytes)v=crcTable[(v^b)&255]^(v>>>8);return(v^0xFFFFFFFF)>>>0}
function zip(files){
 const local=[],central=[];let offset=0;
 for(const [path,body] of files){
  const name=utf8.encode(path),data=utf8.encode(body),crc=crc32(data);
  const hdr=new Uint8Array([
   0x50,0x4b,0x03,0x04,20,0,0,0,0,0,0,0,0,0,...u32(crc),...u32(data.length),...u32(data.length),...u16(name.length),0,0
  ]);
  local.push(hdr,name,data);
  central.push(new Uint8Array([
   0x50,0x4b,0x01,0x02,20,0,20,0,0,0,0,0,0,0,0,0,...u32(crc),...u32(data.length),...u32(data.length),...u16(name.length),0,0,0,0,0,0,0,0,0,0,0,0,...u32(offset)
  ]),name);
  offset+=hdr.length+name.length+data.length;
 }
 const centralSize=central.reduce((a,c)=>a+c.length,0);
 const end=new Uint8Array([0x50,0x4b,0x05,0x06,0,0,0,0,...u16(files.length),...u16(files.length),...u32(centralSize),...u32(offset),0,0]);
 return new Blob([...local,...central,end],{type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'});
}
function makeExcel(current){
 const decisions=[['MT','Ronde','Status','Waarnemingen en aannames','Managementbesluit(en)','Onderbouwing en onzekerheden','Zekerheidsscore (1-5)']];
 for(const t of teams)for(let round=1;round<=3;round++){
  const d=(current.decisions||[]).find(x=>x.team===t&&Number(x.round)===round);
  decisions.push([teamName(t),round,d?'Ingediend':'Niet ingediend',d?.observations||'',d?.decision||'',d?.reason||'',d&&Number.isFinite(Number(d.confidence))?Number(d.confidence):'']);
 }
 const questions=[['MT','Ronde','Vraag','Antwoord docent','Datum']];
 for(const q of current.questions||[]){
  questions.push([teamName(q.team),Number(q.round)||'',q.question||'',q.answer||'',q.created_at||'']);
 }
 const info=[['Onderdeel','Toelichting'],['Oefening','MT aan het stuur – informatiemanagement'],['Gegevens','Fictieve oefengegevens, geen werkelijke PNH-prestaties'],['Besluiten','Per MT en ronde, inclusief nog niet ingediende rondes'],['Zekerheid','Schaal van 1 (laag) tot 5 (hoog)'],['Exportmoment',new Date().toLocaleString('nl-NL')]];
 const workbook='<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'+
 '<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets>'+
 ['Besluiten','Informatievragen','Toelichting'].map((name,i)=>'<sheet name="'+name+'" sheetId="'+(i+1)+'" r:id="rId'+(i+1)+'"/>').join('')+'</sheets></workbook>';
 const relations='<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'+
 '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'+
 [1,2,3].map(i=>'<Relationship Id="rId'+i+'" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet'+i+'.xml"/>').join('')+
 '<Relationship Id="rId4" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>';
 const rootRelations='<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'+
 '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>';
 const types='<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'+
 '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/>'+
 '<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>'+
 '<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>'+
 [1,2,3].map(i=>'<Override PartName="/xl/worksheets/sheet'+i+'.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>').join('')+'</Types>';
 return zip([
  ['[Content_Types].xml',types],
  ['_rels/.rels',rootRelations],
  ['xl/workbook.xml',workbook],
  ['xl/_rels/workbook.xml.rels',relations],
  ['xl/styles.xml',styles],
  ['xl/worksheets/sheet1.xml',sheet(decisions,[12,12,19,48,55,55,24])],
  ['xl/worksheets/sheet2.xml',sheet(questions,[12,12,65,65,25])],
  ['xl/worksheets/sheet3.xml',sheet(info,[24,85])]
 ]);
}
window.exportMTExcel=async function(current){
 const blob=makeExcel(current);
 const url=URL.createObjectURL(blob);
 const anchor=document.createElement('a');
 anchor.href=url;
 anchor.download='MT_aan_het_stuur_resultaten_'+new Date().toISOString().slice(0,10)+'.xlsx';
 document.body.appendChild(anchor);
 anchor.click();
 anchor.remove();
 setTimeout(()=>URL.revokeObjectURL(url),1200);
};
})();
