/* Représentation fermée : texte, gras et couleur hexadécimale uniquement. Aucun HTML fourni par le navigateur n'est envoyé. */
(function(scope){
 'use strict';
 function couleur(v){v=String(v||'').toLowerCase();if(/^#[0-9a-f]{6}$/.test(v))return v;var m=v.match(/^rgb\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)$/);return m&&m.slice(1).every(function(x){return +x<=255})?'#'+m.slice(1).map(function(x){return (+x).toString(16).padStart(2,'0')}).join(''):null;}
 function normaliser(input){if(!Array.isArray(input))return [];var out=[];input.forEach(function(r){if(!r||typeof r.text!=='string'||!r.text)return;var item={text:r.text,bold:r.bold===true,color:couleur(r.color)},last=out[out.length-1];if(last&&last.bold===item.bold&&last.color===item.color)last.text+=item.text;else out.push(item);});if(out.length>5000||out.reduce(function(n,r){return n+r.text.length},0)>30000)throw Error('Le message dépasse 30 000 caractères ou contient trop de mises en forme.');return out;}
 function texte(runs){return normaliser(runs).map(function(r){return r.text}).join('')}
 function tronquer(runs){runs=normaliser(runs);var full=texte(runs),start=full.length-full.trimStart().length,end=full.trimEnd().length,pos=0,out=[];runs.forEach(function(r){var a=Math.max(start-pos,0),b=Math.min(end-pos,r.text.length);if(b>a)out.push({text:r.text.slice(a,b),bold:r.bold,color:r.color});pos+=r.text.length;});return normaliser(out);}
 function personnaliser(runs,personne){runs=normaliser(runs);var full=texte(runs),out=[],regex=/{{\s*(prenom|nom|identifiant)\s*}}/gi,last=0,m;
  function fragment(a,b){var pos=0;runs.forEach(function(r){var from=Math.max(a-pos,0),to=Math.min(b-pos,r.text.length);if(to>from)out.push({text:r.text.slice(from,to),bold:r.bold,color:r.color});pos+=r.text.length;});}
  function styleAt(index){var pos=0;for(var i=0;i<runs.length;i++){if(index<pos+runs[i].text.length)return runs[i];pos+=runs[i].text.length;}return {};}
  while((m=regex.exec(full))){fragment(last,m.index);var style=styleAt(m.index);out.push({text:String(personne?.[m[1].toLowerCase()]??''),bold:style.bold===true,color:style.color});last=regex.lastIndex;}fragment(last,full.length);return normaliser(out);
 }
 function escape(v){return String(v??'').replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})}
 function html(runs,personne){return personnaliser(runs,personne||{}).map(function(r){var s=escape(r.text).replace(/\r?\n/g,'<br>');if(r.bold)s='<strong>'+s+'</strong>';if(r.color)s='<span style="color:'+r.color+'">'+s+'</span>';return s;}).join('')}
 scope.CISMailFormat={couleur:couleur,normaliser:normaliser,texte:texte,tronquer:tronquer,personnaliser:personnaliser,html:html,escape:escape};
})(globalThis);
