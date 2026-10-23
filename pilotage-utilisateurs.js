'use strict';
const comptesPilotage={owner:null,rows:[],reprises:[],total:0,more:false,loading:false,loaded:false,error:'',search:'',etat:'tous',epoch:0,busy:false};
function cleComptes(){return String(state.profile?.user_id||'')}
function comptesPage(){
 if(comptesPilotage.owner!==cleComptes()){Object.assign(comptesPilotage,{owner:cleComptes(),rows:[],loaded:false,error:'',search:'',etat:'tous'});++comptesPilotage.epoch;}
 if(!comptesPilotage.loaded&&!comptesPilotage.loading)void chargerComptes();
 return `<section class="panel"><div class="panel-head"><h2 class="panel-title">Utilisateurs</h2><div class="heading-actions"><button class="btn" data-compte="actualiser">${icon('refresh')} Actualiser</button><button class="btn btn-primary" data-compte="creer">${icon('users')} Créer un utilisateur</button></div></div><div class="panel-body comptes-filtres"><form id="comptes-recherche"><input class="search" type="search" name="recherche" aria-label="Rechercher un utilisateur" placeholder="Nom, prénom, identifiant…" value="${esc(comptesPilotage.search)}"><button class="btn" type="submit">Rechercher</button></form><label class="field"><span>État</span><select id="comptes-etat"><option value="tous" ${comptesPilotage.etat==='tous'?'selected':''}>Tous les comptes</option><option value="actifs" ${comptesPilotage.etat==='actifs'?'selected':''}>Actifs</option><option value="inactifs" ${comptesPilotage.etat==='inactifs'?'selected':''}>Désactivés</option></select></label></div>${comptesPilotage.error?`<div class="notice warn" role="alert">${esc(comptesPilotage.error)}</div>`:''}${comptesPilotage.reprises.length?`<div class="panel-body">${comptesPilotage.reprises.map(o=>`<div class="notice warn" style="margin-bottom:10px">${esc(o.donnees.identifiant||'Opération sur un compte')} · validation à terminer <button class="btn" data-compte="reprendre" data-cle="${esc(o.cle)}">Reprendre</button></div>`).join('')}</div>`:''}<div class="table-wrap"><table class="data-table"><thead><tr><th>Utilisateur</th><th>Identifiant</th><th>Coordonnées</th><th>État</th><th>Actions</th></tr></thead><tbody>${comptesPilotage.rows.map(u=>`<tr><td><strong>${esc(u.prenom)} ${esc(u.nom)}</strong></td><td>${esc(u.identifiant)}</td><td>${esc(u.telephone||'—')}<br>${esc(u.email_contact||'—')}</td><td><span class="status ${u.actif?'':'warn'}">${u.actif?'Actif':'Désactivé'}</span></td><td><div class="comptes-actions"><button class="btn btn-ghost" data-compte="modifier" data-id="${esc(u.id)}">Modifier</button><button class="btn btn-ghost" data-compte="etat" data-id="${esc(u.id)}" ${u.id===state.profile.user_id?'disabled':''}>${u.actif?'Désactiver':'Réactiver'}</button><button class="btn compte-danger" data-compte="supprimer" data-id="${esc(u.id)}" ${u.id===state.profile.user_id?'disabled':''}>Supprimer</button></div></td></tr>`).join('')}</tbody></table></div>${comptesPilotage.loading?'<div class="loading"><span class="spinner"></span>Chargement…</div>':!comptesPilotage.rows.length?'<div class="empty">Aucun utilisateur trouvé.</div>':''}<div class="panel-body heading-actions"><span class="pill">${fmt(comptesPilotage.total)} COMPTE(S)</span>${comptesPilotage.more?'<button class="btn" data-compte="suite">Voir plus</button>':''}</div></section>`;
}
async function chargerComptes(more=false){
 if(comptesPilotage.loading)return;const owner=cleComptes(),epoch=++comptesPilotage.epoch;comptesPilotage.loading=true;comptesPilotage.error='';
 try{
  const data=state.demo?{utilisateurs:demoRecipients().utilisateurs.map(u=>({...u,actif:true,telephone:''})),total:8,suite:false}:await rpc('pilotage_lister_comptes',{p_recherche:comptesPilotage.search,p_etat:comptesPilotage.etat,p_apres:more?comptesPilotage.rows.at(-1)?.identifiant:null});
  if(owner!==cleComptes()||epoch!==comptesPilotage.epoch)return;
  comptesPilotage.reprises=data.reprises||[];comptesPilotage.rows=more?[...comptesPilotage.rows,...data.utilisateurs]:data.utilisateurs;comptesPilotage.total=data.total;comptesPilotage.more=data.suite;comptesPilotage.loaded=true;
 }catch(e){if(owner===cleComptes()){comptesPilotage.error=e.message||'Liste des utilisateurs indisponible.';comptesPilotage.loaded=true;}}
 finally{comptesPilotage.loading=false;if(state.profile&&state.page==='users')render();}
}
function formulaireCompte(u=null,reprise=null){
 if(comptesPilotage.busy)return;const creation=reprise?reprise.action==='creer':!u;if(reprise)u={...u,...reprise.donnees,id:reprise.action==='creer'?'':reprise.cible};
 modal(`<h2>${creation?'Créer un utilisateur':'Modifier '+esc(u.prenom+' '+u.nom)}</h2><form id="compte-form" autocomplete="off" data-id="${esc(u?.id||'')}" data-cle="${reprise?.cle||createRequestId()}"><div class="compte-form-grid">${[['identifiant','Identifiant','text'],['prenom','Prénom','text'],['nom','Nom','text'],['telephone','Téléphone','tel'],['email_contact','Adresse mail','email']].map(([k,l,t])=>`<label class="field"><span>${l}</span><input name="compte_${k}" type="${t}" autocomplete="off" maxlength="${k==='telephone'?40:k==='email_contact'?254:k==='identifiant'?80:100}" value="${esc(u?.[k]||'')}" ${['identifiant','prenom','nom'].includes(k)?'required':''}></label>`).join('')}<label class="field"><span>${creation?'Mot de passe':'Nouveau mot de passe'}</span><input name="compte_mot_de_passe" type="password" autocomplete="new-password" minlength="4" maxlength="128" value="" ${creation||reprise?.donnees.avec_mot_de_passe?'required':''}>${creation?'':'<small>Laisse vide pour conserver le mot de passe actuel.</small>'}</label></div><p class="form-error" id="compte-erreur" role="alert"></p><div class="actions"><button type="button" class="btn btn-ghost" data-action="close-modal">Annuler</button><button type="submit" class="btn btn-primary">${creation?'Créer le compte':'Enregistrer'}</button></div></form>`);
 if(reprise){$('#compte-form').querySelectorAll('input:not([type=password])').forEach(e=>e.readOnly=true);if(!reprise.donnees.avec_mot_de_passe)$('#compte-form').elements.compte_mot_de_passe.disabled=true;}
}
function confirmerCompte(action,u,reprise=null){
 if(comptesPilotage.busy)return;const sup=action==='supprimer';
 modal(`<h2>${sup?'Supprimer le compte':u.actif?'Désactiver le compte':'Réactiver le compte'}</h2><p><strong>${esc(u.prenom+' '+u.nom)}</strong> · ${esc(u.identifiant)}</p>${sup?'<p>Le compte disparaîtra des listes et des statistiques. Les documents déjà enregistrés restent conservés.</p>':''}<form id="compte-confirmation" data-id="${esc(u.id)}" data-cle="${reprise?.cle||createRequestId()}" data-action-compte="${action}" data-actif="${reprise?reprise.donnees.actif:!u.actif}">${sup?`<label class="field"><span>Retape l’identifiant pour confirmer</span><input name="confirmation" autocomplete="off" required data-attendu="${esc(u.identifiant)}"></label>`:''}<p class="form-error" id="compte-erreur" role="alert"></p><div class="actions"><button type="button" class="btn" data-action="close-modal">Annuler</button><button type="submit" class="btn ${sup?'compte-danger':'btn-primary'}">${sup?'Supprimer':u.actif?'Désactiver':'Réactiver'}</button></div></form>`);
}
async function sessionComptes(force=false){
 const r=await sb.auth.getSession();if(r.error)throw r.error;let session=r.data?.session;
 if(!session)throw Error('Connexion requise.');
 if(force||Number(session.expires_at||0)<=Date.now()/1000+60){const n=await sb.auth.refreshSession();if(n.error)throw n.error;session=n.data?.session;}
 if(!session||session.user.id!==state.profile?.user_id)throw Error('Le compte connecté a changé.');return session;
}
async function appelerCompte(body){
 let session=await sessionComptes();let r=await sb.functions.invoke('pilotage-utilisateurs',{body,headers:{Authorization:'Bearer '+session.access_token}});
 if(r.error?.context?.status===401){session=await sessionComptes(true);r=await sb.functions.invoke('pilotage-utilisateurs',{body,headers:{Authorization:'Bearer '+session.access_token}});}
 if(r.error){let detail='';try{detail=(await r.error.context.clone().json()).error||''}catch{}throw Error(detail||'La réponse du serveur n’a pas été confirmée. Réessaie la même validation.');}
 if(!r.data?.ok)throw Error(r.data?.error||'Opération non confirmée.');return r.data;
}
async function validerCompte(form){
 if(comptesPilotage.busy)return;if(state.demo)return toast('Aperçu : aucun compte n’est modifié.');
 const confirmation=form.elements.confirmation;if(confirmation&&confirmation.value.trim()!==confirmation.dataset.attendu)return $('#compte-erreur').textContent='L’identifiant ne correspond pas.';
 const body={cle:form.dataset.cle,user_id:form.dataset.id||undefined,action:form.id==='compte-form'?(form.dataset.id?'modifier':'creer'):form.dataset.actionCompte};
 if(form.id==='compte-form'){for(const k of ['identifiant','prenom','nom','telephone','email_contact','mot_de_passe'])body[k]=form.elements['compte_'+k].value;if(body.action==='creer')delete body.user_id;body.identifiant=body.identifiant.trim().toUpperCase();}else if(body.action==='etat')body.actif=form.dataset.actif==='true';
 const owner=cleComptes();comptesPilotage.busy=true;$('#compte-erreur').textContent='';form.querySelectorAll('input,button').forEach(e=>e.disabled=true);
 try{
  await appelerCompte(body);if(owner!==cleComptes())return;
  form.querySelectorAll('input[type=password]').forEach(e=>e.value='');closeModal();$('#modal').innerHTML='';
  toast(body.action==='creer'?'Compte créé.':body.action==='supprimer'?'Compte supprimé.':body.action==='etat'?(body.actif?'Compte réactivé.':'Compte désactivé.'):'Modifications enregistrées.');
  comptesPilotage.loaded=false;state.recipients=null;
  // Invalide aussi les statistiques déjà ouvertes avant la suppression.
  if(typeof suivi!=='undefined'){suivi.revision=(suivi.revision||0)+1;suivi.data=null;suivi.key='';suivi.rows=[];suivi.journalKey='';suivi.user='';suivi.details=null;++suivi.detailEpoch;}
  if(typeof rapports!=='undefined'){rapports.data=null;rapports.key='';rapports.loading=false;++rapports.epoch;}
  await chargerComptes();void refreshData();
  if(body.user_id===state.profile.user_id&&body.action==='modifier'){state.profile=await rpc('pilotage_session');render();}
 }catch(e){if(owner===cleComptes()&&$('#compte-erreur'))$('#compte-erreur').textContent=e.message||'Opération indisponible.';}
 finally{comptesPilotage.busy=false;form.querySelectorAll('input,button').forEach(e=>e.disabled=false);form.querySelectorAll('input:not([type=password])').forEach(e=>e.readOnly=true);}
}
document.addEventListener('submit',e=>{if(['compte-form','compte-confirmation'].includes(e.target.id)){e.preventDefault();void validerCompte(e.target);}if(e.target.id==='comptes-recherche'){e.preventDefault();comptesPilotage.search=e.target.elements.recherche.value.trim();void chargerComptes();}});
document.addEventListener('change',e=>{if(e.target.id==='comptes-etat'){comptesPilotage.etat=e.target.value;void chargerComptes();}});
document.addEventListener('click',e=>{const b=e.target.closest('button[data-compte]');if(!b||comptesPilotage.busy)return;const u=comptesPilotage.rows.find(x=>x.id===b.dataset.id);if(b.dataset.compte==='reprendre'){const o=comptesPilotage.reprises.find(x=>x.cle===b.dataset.cle);if(o){if(['creer','modifier'].includes(o.action))formulaireCompte(comptesPilotage.rows.find(x=>x.id===o.cible)||o.compte||null,o);else confirmerCompte(o.action,comptesPilotage.rows.find(x=>x.id===o.cible)||o.compte||{id:o.cible,prenom:'',nom:'',identifiant:o.donnees.identifiant||o.cible,actif:!o.donnees.actif},o);}}if(b.dataset.compte==='creer')formulaireCompte();if(b.dataset.compte==='modifier'&&u)formulaireCompte(u);if(['etat','supprimer'].includes(b.dataset.compte)&&u)confirmerCompte(b.dataset.compte,u);if(b.dataset.compte==='actualiser')void chargerComptes();if(b.dataset.compte==='suite')void chargerComptes(true);});
$('#modal').addEventListener('cancel',e=>{if(comptesPilotage.busy)e.preventDefault();});
$('#modal').addEventListener('close',()=>{if($('#compte-form')||$('#compte-confirmation'))$('#modal').innerHTML='';});
if(sb)sb.auth.onAuthStateChange(event=>{if(event==='SIGNED_OUT'){if($('#compte-form')||$('#compte-confirmation')){closeModal();$('#modal').innerHTML='';}comptesPilotage.loaded=false;comptesPilotage.rows=[];comptesPilotage.reprises=[];++comptesPilotage.epoch;}});

