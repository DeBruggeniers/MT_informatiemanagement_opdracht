/* Presentation-only transformation for the MT v2 trial.
   Source content in Cloudflare is not modified. */
(function(){
"use strict";
const disclaimerPatterns=[
 /Fictieve oefengegevens\s*[–—-]\s*geen werkelijke (?:PNH[- ]prestaties|prestaties van (?:Provincie Noord-Holland|de provincie)|prestaties)\.?\s*/gi,
 /Kwartalen zijn een scenarioreeks\.?\s*/gi
];
function cleanText(text){
 let output=String(text||"");
 // Existing fictitious source notes use 2027 K3 values as if they were current.
 // Align visible reports to the time series: current = 2026 K4 (index 8).
 output=output
  .replace(/daalt in het laatste kwartaal tot 93,4%/gi,"daalt in 2026 K4 tot 94,9% (prognose 2027 K3: 93,4%)")
  .replace(/in het laatste kwartaal bedraagt de gemeten gemiddelde extra vertraging in de casus 12,1 minuten/gi,"in 2026 K4 bedraagt de gemeten extra vertraging 10,5 minuten (prognose 2027 K3: 12,1 minuten)")
  .replace(/42 VRI-storingen in het laatste kwartaal/gi,"36 VRI-storingen in 2026 K4 (prognose 2027 K3: 42)")
  .replace(/beeldkwaliteit komt in de casus uit op 93,4%/gi,"beeldkwaliteit komt in 2026 K4 uit op 94,9% (prognose 2027 K3: 93,4%)");
 for(const p of disclaimerPatterns)output=output.replace(p,"");
 return output.replace(/Provincie Noord-Holland/gi,"de provincie")
  .replace(/\bPNH\b/g,"provincie")
  .replace(/MT B&U/gi,"het MT")
  .replace(/\bB&U\b/g,"beheerorganisatie");
}
function cleanTree(root){
 if(!root)return root;
 const walker=root.ownerDocument.createTreeWalker(root,NodeFilter.SHOW_TEXT);
 const nodes=[];
 while(walker.nextNode())nodes.push(walker.currentNode);
 for(const node of nodes)node.nodeValue=cleanText(node.nodeValue);
 root.querySelectorAll("p,small").forEach(node=>{
  if(!node.textContent.trim() && !node.querySelector("img,svg,canvas"))node.remove();
 });
 return root;
}
function addSvgElement(svg,name,attributes){
 const e=svg.ownerDocument.createElementNS("http://www.w3.org/2000/svg",name);
 Object.entries(attributes).forEach(([k,v])=>e.setAttribute(k,String(v)));
 return e;
}
function markTrendAsObservedAndForecast(root){
 const charts=root.querySelectorAll("section.chart");
 charts.forEach(chart=>{
  const svg=chart.querySelector("svg");
  if(!svg)return;
  const lines=[...svg.querySelectorAll("polyline")];
  const line=lines.find(x=>x.hasAttribute("points")&&x.getAttribute("stroke")==="#245a91")||lines[0];
  if(!line)return;
  const coords=(line.getAttribute("points")||"").trim().split(/\s+/).map(x=>x.split(",").map(Number));
  if(coords.length!==12||coords.some(pair=>pair.length!==2||pair.some(v=>!Number.isFinite(v))))return;
  const here=8; // 2026 K4; future begins 2027 K1
  const color=line.getAttribute("stroke")||"#245a91";
  const dots=svg.querySelectorAll("circle");
  // The uncertainty band is an illustrative, non-statistical visual margin.
  const top=coords.slice(here).map(([x,y],i)=>[x,Math.max(8,y-[0,12,19,27][i])]);
  const bottom=coords.slice(here).map(([x,y],i)=>[x,Math.min(205,y+[0,12,19,27][i])]);
  const band=addSvgElement(svg,"polygon",{
   points:top.concat([...bottom].reverse()).map(x=>x.join(",")).join(" "),
   fill:"#5ab3b2","fill-opacity":".23",stroke:"none"
  });
  line.before(band);
  const solid=addSvgElement(svg,"polyline",{
   points:coords.slice(0,here+1).map(p=>p.join(",")).join(" "),
   fill:"none",stroke:color,"stroke-width":4,"stroke-linecap":"round","stroke-linejoin":"round"
  });
  line.before(solid);
  const future=addSvgElement(svg,"polyline",{
   points:coords.slice(here).map(p=>p.join(",")).join(" "),
   fill:"none",stroke:color,"stroke-width":4,
   "stroke-dasharray":"9 7","stroke-linecap":"round","stroke-linejoin":"round"
  });
  line.before(future);
  const current=coords[here];
  const separator=addSvgElement(svg,"line",{
    x1:current[0],x2:current[0],y1:14,y2:207,
    stroke:"#5f6e87","stroke-width":"1.5","stroke-dasharray":"3 5"
  });
  line.before(separator);
  const label=addSvgElement(svg,"text",{
    x:current[0]-5,y:12,"text-anchor":"end",fill:"#3b516f","font-size":"12","font-weight":"bold"
  });
  label.textContent="Heden: 2026 K4";
  line.before(label);
  const projected=addSvgElement(svg,"text",{
    x:coords[11][0],y:12,"text-anchor":"end",fill:"#28736f","font-size":"12","font-weight":"bold"
  });
  projected.textContent="Prognose 2027";
  line.before(projected);
  line.remove();
  dots.forEach((circle,i)=>{
   if(i>here){circle.setAttribute("fill","#ffffff");circle.setAttribute("stroke",color);circle.setAttribute("stroke-width","2");}
   const title=circle.querySelector("title");
   if(title&&i>here)title.textContent="Prognose: "+title.textContent;
  });
  const legend=chart.ownerDocument.createElement("div");
  legend.className="trend-legend";
  legend.style.cssText="display:flex;gap:14px;flex-wrap:wrap;font:12px system-ui;color:#52647a;margin:6px 0 10px";
  legend.innerHTML='<span><b style="color:#245a91">━━</b> Waargenomen t/m 2026 K4</span><span><b style="color:#245a91">┄┄</b> Prognose 2027</span><span><b style="color:#5ab3b2">▨</b> Indicatieve onzekerheidsband</span>';
  const summary=[...chart.querySelectorAll("p")].find(p=>/Begin:/.test(p.textContent)&&/Eind:/.test(p.textContent));
  if(summary){
   const labels=[...svg.querySelectorAll("circle title")].map(x=>x.textContent);
   const currentVal=labels[here]||"";
   const colon=currentVal.indexOf(':');
   const match=colon>=0?[null,currentVal.slice(colon+1).trim()]:null;
   summary.innerHTML=summary.innerHTML.replace("<strong>Eind:</strong>","<strong>Prognose 2027 K3:</strong>");
   if(match){const current=chart.ownerDocument.createElement("p");current.style.cssText="font-size:13px;font-weight:600;color:#284b70";current.textContent="Actueel (2026 K4): "+match[1];summary.before(current);}
  }
  const chartTitle=chart.querySelector("h3");
  if(chartTitle)chartTitle.after(legend);
  else chart.prepend(legend);
 });
 return root;
}
window.MTPresentation={
 cleanText,
 transformHTML(html,{charts=false}={}){
  const doc=new DOMParser().parseFromString(html,"text/html");
  cleanTree(doc.body);
  if(charts)markTrendAsObservedAndForecast(doc.body);
  return doc.body.innerHTML;
 },
 transformDocument(html){
  const doc=new DOMParser().parseFromString(html,"text/html");
  cleanTree(doc.body);
  return doc.body.innerHTML;
 },
 transformArticle(article,{charts=false}={}){
  cleanTree(article);
  if(charts)markTrendAsObservedAndForecast(article);
  return article;
 },
 goal(text){
  if(String(text).includes("assets in een veilige onderhoudstoestand")){
   return "Veiligheid: assets in veilige onderhoudstoestand houden; als oefenindicator geldt dat 100% van de urgente veiligheidsgebreken aantoonbaar wordt beoordeeld en waar nodig direct wordt veiliggesteld.";
  }
  return cleanText(text);
 }
};
})();
