'use strict';
const messagesPilotage={owner:'',rows:[],more:false,loading:false,loaded:false,error:'',epoch:0,busy:false,draft:null};
function messagesOwner(){return String(state.profile?.user_id||'')}
function messagesApplicationPage(){
 if(messagesPilotage.owner!==messagesOwner()){Object.assign(messagesPilotage,{owner:messagesOwner(),rows:[],loaded:false,error:'',more:false,draft:null});++messagesPilotage.epoch;}
 if(!messagesPilotage.loaded&&!messagesPilotage.loading)void chargerMessagesApplication();
 return `<section class="panel"><div class="panel-head"><h2 class="panel-title">Messages application</h2><div class="heading-actions"><button class="btn" data-message-action="actualiser">${icon('refresh')} Actualiser</button><button class="btn btn-primary" data-message-action="creer">${icon('info')} Créer un message</button></div></div>${messagesPilotage.error?`<div class="panel-body"><p class="form-error" role="alert">${esc(messagesPilotage.error)}</p></div>`:''}<div class="panel-body messages-application-liste">${messagesPilotage.rows.map(m=>`<article class="message-application-carte"><div class="message-application-entete"><h3>${esc(m.objet)}</h3><span class="status ${m.actif?'':'warn'}">${m.actif?'Publié':'Retiré'}</span></div><p class="message-application-description">${esc(m.description)}</p><div class="message-application-bas"><span>${esc(fullDate(m.cree_le))}</span><span>${fmt(m.validations)} / ${fmt(m.destinataires_actuels)} comptes actifs ont validé</span><div><button class="btn btn-ghost" data-message-action="apercu" data-id="${esc(m.id)}">Voir le message</button>${m.actif?` <button class="btn btn-ghost" data-message-action="retirer" data-id="${esc(m.id)}">Retirer</button>`:''}</div></div></article>`).join('')}${messagesPilotage.loading?'<div class="loading"><span class="spinner"></span>Chargement…</div>':!messagesPilotage.rows.length?'<div class="empty">Aucun message publié.</div>':''}${messagesPilotage.more?'<button class="btn" data-message-action="suite">Voir plus</button>':''}</div></section>`;
}
async function chargerMessagesApplication(more=false){
 if(messagesPilotage.loading)return;const owner=messagesOwner(),epoch=++messagesPilotage.epoch;messagesPilotage.loading=true;messagesPilotage.error='';
 try{const last=more?messagesPilotage.rows.at(-1):null;const d=state.demo?{messages:[],suite:false}:await rpc('pilotage_lister_messages_application',{p_avant_date:last?.cree_le||null,p_avant_id:last?.id||null});if(owner!==messagesOwner()||epoch!==messagesPilotage.epoch)return;messagesPilotage.rows=more?[...messagesPilotage.rows,...d.messages]:d.messages;messagesPilotage.more=d.suite;messagesPilotage.loaded=true;}
 catch(e){if(owner===messagesOwner()&&epoch===messagesPilotage.epoch){messagesPilotage.error=['42883','PGRST202'].includes(e.code)?'Installe messages-application.sql dans Supabase.':e.message||'Messages indisponibles.';messagesPilotage.loaded=true;}}
 finally{if(epoch===messagesPilotage.epoch){messagesPilotage.loading=false;if(state.profile&&state.page==='messages')render();}}
}
function formulaireMessageApplication(){
 if(messagesPilotage.busy)return;if(!messagesPilotage.draft)messagesPilotage.draft={id:createRequestId(),objet:'',description:''};const d=messagesPilotage.draft;
 modal(`<h2>Créer un message</h2><form id="message-application-form"><label class="field"><span>Objet</span><input name="objet" maxlength="180" required value="${esc(d.objet)}"></label><label class="field"><span>Description</span><textarea name="description" maxlength="10000" required>${esc(d.description)}</textarea></label><p class="form-error" id="message-application-erreur" role="alert"></p><div class="actions"><button type="button" class="btn btn-ghost" data-action="close-modal">Annuler</button><button type="button" class="btn" data-message-action="apercu-brouillon">Aperçu</button><button type="submit" class="btn btn-primary">Publier dans l’application</button></div></form>`);
}
function apercuMessageApplication(m,brouillon=false){
 modal(`<div class="message-application-apercu"><h2>${esc(m.objet)}</h2><div class="message-application-description">${esc(m.description)}</div><button type="button" class="btn btn-primary" data-message-action="${brouillon?'retour-brouillon':'fermer-apercu'}">Valider</button></div>`);
}
function erreurMessagesApplication(e){return ['42883','PGRST202'].includes(e.code)||/module Pilotage/.test(e.message)?'Installe messages-application.sql dans Supabase.':e.message||'La réponse du serveur n’a pas été confirmée. Réessaie la même publication.'}
async function publierMessageApplication(form){
 if(messagesPilotage.busy)return;if(state.demo)return toast('Aperçu : aucun message publié.');const d=messagesPilotage.draft,owner=messagesOwner();if(!d)return;
 d.objet=form.elements.objet.value.trim();d.description=form.elements.description.value.trim();if(!d.objet||!d.description)return $('#message-application-erreur').textContent='Renseigne l’objet et la description.';
 messagesPilotage.busy=true;form.querySelectorAll('button,input,textarea').forEach(x=>x.disabled=true);$('#message-application-erreur').textContent='';
 try{await rpc('pilotage_publier_message_application',{p_id:d.id,p_objet:d.objet,p_description:d.description});if(owner!==messagesOwner())return;messagesPilotage.draft=null;closeModal();toast('Message publié dans l’application principale.');messagesPilotage.loaded=false;await chargerMessagesApplication();}
 catch(e){if(owner===messagesOwner()&&$('#message-application-erreur'))$('#message-application-erreur').textContent=erreurMessagesApplication(e);}
 finally{messagesPilotage.busy=false;form.querySelectorAll('button,input,textarea').forEach(x=>x.disabled=false);}
}
function confirmerRetraitMessage(m){if(messagesPilotage.busy)return;modal(`<h2>Retirer le message ?</h2><p>${esc(m.objet)}</p><div class="actions"><button class="btn btn-ghost" data-action="close-modal">Annuler</button><button class="btn btn-primary" data-message-action="confirmer-retrait" data-id="${esc(m.id)}">Retirer</button></div><p id="message-retrait-erreur" class="form-error" role="alert"></p>`)}
async function retirerMessageApplication(id){
 if(messagesPilotage.busy||state.demo)return;messagesPilotage.busy=true;const owner=messagesOwner(),dialog=$('#modal');dialog.querySelectorAll('button').forEach(x=>x.disabled=true);
 try{await rpc('pilotage_retirer_message_application',{p_id:id});if(owner!==messagesOwner())return;closeModal();toast('Message retiré.');await chargerMessagesApplication();}
 catch(e){if(owner===messagesOwner()&&$('#message-retrait-erreur'))$('#message-retrait-erreur').textContent=erreurMessagesApplication(e);}
 finally{messagesPilotage.busy=false;dialog.querySelectorAll('button').forEach(x=>x.disabled=false);}
}
document.addEventListener('input',e=>{if(e.target.form?.id==='message-application-form'&&messagesPilotage.draft){const d=messagesPilotage.draft;if(['objet','description'].includes(e.target.name)){d[e.target.name]=e.target.value;d.id=createRequestId();}}});
document.addEventListener('submit',e=>{if(e.target.id==='message-application-form'){e.preventDefault();void publierMessageApplication(e.target)}});
document.addEventListener('click',e=>{const b=e.target.closest('[data-message-action]');if(!b)return;const a=b.dataset.messageAction,m=messagesPilotage.rows.find(x=>x.id===b.dataset.id);if(a==='actualiser')void chargerMessagesApplication();if(a==='suite')void chargerMessagesApplication(true);if(a==='creer')formulaireMessageApplication();if(a==='apercu'&&m)apercuMessageApplication(m);if(a==='apercu-brouillon')apercuMessageApplication(messagesPilotage.draft,true);if(a==='retour-brouillon')formulaireMessageApplication();if(a==='fermer-apercu')closeModal();if(a==='retirer'&&m)confirmerRetraitMessage(m);if(a==='confirmer-retrait')void retirerMessageApplication(b.dataset.id)});
$('#modal').addEventListener('cancel',e=>{if(messagesPilotage.busy)e.preventDefault()});

if(typeof sb!=='undefined'&&sb)sb.auth.onAuthStateChange(event=>{if(event==='SIGNED_OUT'){if($('#message-application-form')||$('#message-retrait-erreur')||$('.message-application-apercu'))closeModal();Object.assign(messagesPilotage,{owner:'',rows:[],loaded:false,loading:false,busy:false,draft:null,error:''});++messagesPilotage.epoch;}});
