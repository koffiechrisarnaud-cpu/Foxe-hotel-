/* admin-content.js : contenu du site géré par l'administrateur.
   Chargé par admin.html. Utilise les fonctions de admin.html ($, db, toast, esc, ROOMS...). */

var CMS = { tab: "svc", SVC: [], HRS: [], GAL: [], RPH: [], wired: false, sheet: null };
var ICON_KEYS = ["wifi","breakfast","ac","parking","restaurant","shuttle","laundry","clock","pool","gym","spa","tv","safe","bell","car","bed","sun","star"];
var CATS = ["Chambres", "Extérieur", "Détente"];
var CONTACT_FIELDS = [
  ["contact_whatsapp", "Numéro WhatsApp", "+225 00 00 00 00 00", "tel"],
  ["contact_phone", "Téléphone de la réception", "+225 00 00 00 00 00", "tel"],
  ["contact_email", "E-mail de l'hôtel", "contact@votrehotel.com", "email"],
  ["contact_address", "Adresse", "Rue, quartier, ville", "text"],
  ["contact_maps_url", "Lien de l'itinéraire (Google Maps)", "https://maps.app.goo.gl/...", "url"],
  ["social_facebook", "Facebook (lien)", "https://facebook.com/...", "url"],
  ["social_instagram", "Instagram (lien)", "https://instagram.com/...", "url"],
  ["social_tiktok", "TikTok (lien)", "https://tiktok.com/@...", "url"]
];

function byPos(a, b) { return (a.position - b.position) || (a.id - b.id); }
function G(id) { return document.getElementById(id); }

/* ---------- Photos : réduction et envoi ---------- */
function shrinkPhoto(file) {
  return new Promise(function (resolve) {
    var ok4 = file.size <= 4 * 1024 * 1024;
    if (!/^image\/(jpeg|png|webp)$/.test(file.type)) { resolve(ok4 ? file : null); return; }
    var img = new Image(), url = URL.createObjectURL(file);
    img.onload = function () {
      var max = 1600, w = img.naturalWidth, h = img.naturalHeight, k = Math.min(1, max / Math.max(w, h));
      var cv = document.createElement("canvas");
      cv.width = Math.max(1, Math.round(w * k)); cv.height = Math.max(1, Math.round(h * k));
      cv.getContext("2d").drawImage(img, 0, 0, cv.width, cv.height);
      URL.revokeObjectURL(url);
      cv.toBlob(function (b) { resolve(b && b.size ? b : (ok4 ? file : null)); }, "image/jpeg", 0.85);
    };
    img.onerror = function () { URL.revokeObjectURL(url); resolve(ok4 ? file : null); };
    img.src = url;
  });
}
async function uploadPhoto(file, folder) {
  if (!/^image\//.test(file.type)) return { error: "« " + file.name + " » n'est pas une image." };
  if (file.size > 25 * 1024 * 1024) return { error: "« " + file.name + " » est trop lourde (25 Mo maximum)." };
  var blob = await shrinkPhoto(file);
  if (!blob) return { error: "« " + file.name + " » n'a pas pu être préparée." };
  var ext = blob.type == "image/png" ? "png" : blob.type == "image/webp" ? "webp" : "jpg";
  var path = folder + "/" + Date.now() + "-" + Math.random().toString(36).slice(2, 8) + "." + ext;
  var up = await db.storage.from("room-photos").upload(path, blob, { contentType: blob.type || "image/jpeg", cacheControl: "3600" });
  if (up.error) return { error: "L'envoi de la photo a échoué. Réessayez." };
  return { url: db.storage.from("room-photos").getPublicUrl(path).data.publicUrl };
}
function removeFile(url) {
  var key = "/room-photos/", i = String(url).indexOf(key);
  if (i < 0) return;
  db.storage.from("room-photos").remove([decodeURIComponent(String(url).slice(i + key.length))]);
}

/* ---------- Chargement ---------- */
async function cmsLoad() {
  var r = await Promise.all([
    db.from("services").select("*").order("position").order("id"),
    db.from("opening_hours").select("*").order("position").order("id"),
    db.from("gallery_photos").select("*").order("position").order("id"),
    db.from("room_photos").select("*").order("position").order("id")
  ]);
  CMS.SVC = r[0].data || []; CMS.HRS = r[1].data || []; CMS.GAL = r[2].data || []; CMS.RPH = r[3].data || [];
  if (r.some(function (x) { return x.error; })) toast("Le contenu du site n'a pas pu être entièrement chargé. Avez-vous lancé le script de l'étape 5 ?");
  cmsWire();
  cmsRender();
}
function cmsWire() {
  if (CMS.wired) return; CMS.wired = true;
  G("fph").onchange = function () { if (this.files.length) rpAdd(this.files); };
  G("cmsx").onclick = closeSheet;
  G("cmsov").onclick = function (e) { if (e.target == G("cmsov")) closeSheet(); };
  document.addEventListener("keydown", function (e) { if (e.key == "Escape") closeSheet(); });
}
function openSheet(html) { G("cmsform").innerHTML = html; G("cmsov").classList.add("on"); }
function closeSheet() { G("cmsov").classList.remove("on"); }

/* ---------- Photos des chambres (6 maximum) ---------- */
function rpList(roomId) { return CMS.RPH.filter(function (p) { return p.room_id == roomId; }).sort(byPos); }
function rpRender(roomId) {
  var box = G("rph"), inp = G("fph");
  if (!roomId) { box.innerHTML = '<div class="sub" style="grid-column:1/-1">Enregistrez d\'abord la chambre, puis ajoutez ses photos.</div>'; inp.disabled = true; G("fpn").textContent = ""; return; }
  var ph = rpList(roomId);
  box.innerHTML = ph.map(function (p, i) {
    return '<div class="rp" style="background-image:url(\'' + encodeURI(p.url) + '\')">' +
      (i == 0 ? '<span class="rpm">Principale</span>' : '<button class="rpa" data-rpm="' + p.id + '" type="button">Principale</button>') +
      '<button class="rpx" data-rpd="' + p.id + '" type="button" aria-label="Supprimer la photo">✕</button></div>';
  }).join("");
  G("fpn").textContent = ph.length + " / 6 photos" + (ph.length >= 6 ? " (maximum atteint)" : "") + ". La photo « Principale » s'affiche en premier.";
  inp.disabled = ph.length >= 6;
  box.querySelectorAll("[data-rpd]").forEach(function (b) { b.onclick = function () { rpDelete(+b.dataset.rpd, roomId); }; });
  box.querySelectorAll("[data-rpm]").forEach(function (b) { b.onclick = function () { rpMain(+b.dataset.rpm, roomId); }; });
}
async function rpSync(roomId) {
  var ph = rpList(roomId), url = ph.length ? ph[0].url : null;
  await db.from("rooms").update({ image_url: url }).eq("id", roomId);
  ROOMS.forEach(function (r) { if (r.id == roomId) r.image_url = url; });
  roomsUI();
}
async function rpAdd(files) {
  var roomId = editId; if (!roomId) return;
  var have = rpList(roomId), free = 6 - have.length, arr = Array.prototype.slice.call(files);
  if (!free) { toast("Maximum 6 photos par chambre."); G("fph").value = ""; return; }
  if (arr.length > free) { toast("Seules les " + free + " premières photos sont ajoutées (maximum 6)."); arr = arr.slice(0, free); }
  var pos = have.length ? have[have.length - 1].position : 0, done = 0;
  for (var i = 0; i < arr.length; i++) {
    G("fpn").textContent = "Envoi de la photo " + (i + 1) + " sur " + arr.length + "…";
    var up = await uploadPhoto(arr[i], "rooms/" + roomId);
    if (up.error) { toast(up.error); continue; }
    pos += 1;
    var ins = await db.from("room_photos").insert({ room_id: roomId, url: up.url, position: pos }).select("*").single();
    if (ins.error) { removeFile(up.url); toast(/Maximum 6/i.test(ins.error.message || "") ? "Maximum 6 photos par chambre." : "Une photo n'a pas pu être enregistrée."); continue; }
    CMS.RPH.push(ins.data); done++;
  }
  G("fph").value = "";
  await rpSync(roomId); rpRender(roomId);
  if (done) toast(done + " photo" + (done > 1 ? "s ajoutées" : " ajoutée") + " ✓");
}
async function rpDelete(id, roomId) {
  if (!window.confirm("Supprimer cette photo ?")) return;
  var p = CMS.RPH.filter(function (x) { return x.id == id; })[0]; if (!p) return;
  var r = await db.from("room_photos").delete().eq("id", id);
  if (r.error) { toast("La photo n'a pas pu être supprimée."); return; }
  removeFile(p.url);
  CMS.RPH = CMS.RPH.filter(function (x) { return x.id != id; });
  await rpSync(roomId); rpRender(roomId); toast("Photo supprimée.");
}
async function rpMain(id, roomId) {
  var ph = rpList(roomId), min = ph.length ? ph[0].position : 1;
  var r = await db.from("room_photos").update({ position: min - 1 }).eq("id", id);
  if (r.error) { toast("Le changement n'a pas pu être enregistré."); return; }
  CMS.RPH.forEach(function (x) { if (x.id == id) x.position = min - 1; });
  await rpSync(roomId); rpRender(roomId); toast("Photo principale modifiée ✓");
}

/* ---------- Onglets du contenu ---------- */
function cmsRender() {
  var T = [["svc", "Services (" + CMS.SVC.length + ")"], ["hrs", "Horaires (" + CMS.HRS.length + ")"], ["gal", "Galerie (" + CMS.GAL.length + ")"], ["ctc", "Contact"]];
  G("cmsTabs").innerHTML = T.map(function (t) { return '<button class="chip' + (CMS.tab == t[0] ? ' on' : '') + '" data-ct="' + t[0] + '" type="button">' + t[1] + '</button>'; }).join("");
  G("cmsTabs").querySelectorAll("[data-ct]").forEach(function (b) { b.onclick = function () { CMS.tab = b.dataset.ct; cmsRender(); }; });
  if (CMS.tab == "svc") cmsServices(); else if (CMS.tab == "hrs") cmsHours(); else if (CMS.tab == "gal") cmsGallery(); else cmsContact();
}
function moveBtns(id, i, n) {
  return '<div class="mv"><button data-mv="' + id + '" data-d="-1" type="button" aria-label="Monter"' + (i == 0 ? ' disabled style="opacity:.35"' : '') + '>↑</button>' +
    '<button data-mv="' + id + '" data-d="1" type="button" aria-label="Descendre"' + (i == n - 1 ? ' disabled style="opacity:.35"' : '') + '>↓</button></div>';
}
async function cmsMove(table, arr, id, dir) {
  var i = arr.findIndex(function (x) { return x.id == id; }), j = i + dir;
  if (i < 0 || j < 0 || j >= arr.length) return;
  var t = arr[i]; arr[i] = arr[j]; arr[j] = t;
  var jobs = [];
  arr.forEach(function (x, k) { if (x.position !== k + 1) { x.position = k + 1; jobs.push(db.from(table).update({ position: k + 1 }).eq("id", x.id)); } });
  await Promise.all(jobs); cmsRender();
}
async function cmsDelete(table, arr, id, msg, after) {
  if (!window.confirm(msg)) return;
  var r = await db.from(table).delete().eq("id", id);
  if (r.error) { toast("La suppression n'a pas pu se faire."); return; }
  var k = arr.findIndex(function (x) { return x.id == id; });
  if (k >= 0) { if (after) after(arr[k]); arr.splice(k, 1); }
  cmsRender(); toast("Supprimé ✓");
}
function wireMoves(table, arr) {
  G("cmsBody").querySelectorAll("[data-mv]").forEach(function (b) { b.onclick = function () { cmsMove(table, arr, +b.dataset.mv, +b.dataset.d); }; });
}

/* ---------- Services ---------- */
function cmsServices() {
  var n = CMS.SVC.length;
  G("cmsBody").innerHTML = '<button class="add" id="cAdd" type="button">+ Ajouter un service</button>' +
    (n ? CMS.SVC.map(function (s, i) {
      return '<div class="ctr"><div class="ib">' + foxeIcon(s.icon) + '</div><div style="flex:1;min-width:0"><b>' + esc(s.title) + '</b>' + (s.is_active ? '' : ' <span class="badge b-cancelled">Masqué</span>') + '<div class="sub">' + esc(s.description) + '</div>' +
        '<div class="row" style="margin-top:6px;justify-content:flex-start;gap:8px"><button class="a" data-se="' + s.id + '" type="button">Modifier</button><button class="a o" data-sd="' + s.id + '" type="button">Supprimer</button></div></div>' + moveBtns(s.id, i, n) + '</div>';
    }).join("") : '<div class="empty">Aucun service. La section « Nos services » est masquée sur le site.</div>');
  G("cAdd").onclick = function () { svcForm(0); };
  G("cmsBody").querySelectorAll("[data-se]").forEach(function (b) { b.onclick = function () { svcForm(+b.dataset.se); }; });
  G("cmsBody").querySelectorAll("[data-sd]").forEach(function (b) { b.onclick = function () { cmsDelete("services", CMS.SVC, +b.dataset.sd, "Supprimer ce service ?"); }; });
  wireMoves("services", CMS.SVC);
}
function svcForm(id) {
  var s = id ? CMS.SVC.filter(function (x) { return x.id == id; })[0] : { title: "", description: "", icon: "star", is_active: true };
  CMS.sheet = { id: id, icon: s.icon };
  openSheet('<h2 style="font-size:28px;margin-bottom:6px">' + (id ? "Modifier le service" : "Nouveau service") + '</h2>' +
    '<label for="cft">Nom du service</label><input class="inp" id="cft" maxlength="60" value="' + esc(s.title) + '" placeholder="Ex. Piscine">' +
    '<label for="cfd">Description courte</label><input class="inp" id="cfd" maxlength="160" value="' + esc(s.description) + '" placeholder="Ex. Ouverte de 8h à 20h">' +
    '<label>Icône</label><div class="icg" id="icg">' + ICON_KEYS.map(function (k) { return '<button type="button" data-ic="' + k + '" class="' + (k == s.icon ? 'on' : '') + '" aria-label="' + k + '">' + foxeIcon(k) + '</button>'; }).join("") + '</div>' +
    '<label style="margin-top:12px"><input type="checkbox" id="cfa" ' + (s.is_active ? "checked" : "") + ' style="width:auto;margin-right:8px">Visible sur le site</label>' +
    '<div class="err" id="cfe"></div><button class="save" id="cfs" type="button">Enregistrer</button>');
  G("icg").querySelectorAll("[data-ic]").forEach(function (b) {
    b.onclick = function () { CMS.sheet.icon = b.dataset.ic; G("icg").querySelectorAll("button").forEach(function (o) { o.classList.toggle("on", o == b); }); };
  });
  G("cfs").onclick = async function () {
    var t = G("cft").value.trim(), d = G("cfd").value.trim(), e = G("cfe");
    if (t.length < 2) { e.textContent = "Entrez le nom du service (2 caractères minimum)."; return; }
    var row = { title: t, description: d, icon: CMS.sheet.icon, is_active: G("cfa").checked };
    G("cfs").disabled = true;
    var r;
    if (id) { r = await db.from("services").update(row).eq("id", id).select("*").single(); }
    else { row.position = CMS.SVC.length ? CMS.SVC[CMS.SVC.length - 1].position + 1 : 1; r = await db.from("services").insert(row).select("*").single(); }
    G("cfs").disabled = false;
    if (r.error) { e.textContent = "L'enregistrement n'a pas pu se faire. Réessayez."; return; }
    if (id) CMS.SVC = CMS.SVC.map(function (x) { return x.id == id ? r.data : x; }); else CMS.SVC.push(r.data);
    closeSheet(); cmsRender(); toast("Service enregistré ✓");
  };
}

/* ---------- Horaires ---------- */
function cmsHours() {
  var n = CMS.HRS.length;
  G("cmsBody").innerHTML = '<button class="add" id="cAdd" type="button">+ Ajouter un horaire</button>' +
    (n ? CMS.HRS.map(function (h, i) {
      return '<div class="ctr"><div style="flex:1;min-width:0"><b>' + esc(h.label) + '</b><div class="sub">' + esc(h.value) + '</div>' +
        '<div class="row" style="margin-top:6px;justify-content:flex-start;gap:8px"><button class="a" data-he="' + h.id + '" type="button">Modifier</button><button class="a o" data-hd="' + h.id + '" type="button">Supprimer</button></div></div>' + moveBtns(h.id, i, n) + '</div>';
    }).join("") : '<div class="empty">Aucun horaire. La section « Horaires » est masquée sur le site.</div>');
  G("cAdd").onclick = function () { hrsForm(0); };
  G("cmsBody").querySelectorAll("[data-he]").forEach(function (b) { b.onclick = function () { hrsForm(+b.dataset.he); }; });
  G("cmsBody").querySelectorAll("[data-hd]").forEach(function (b) { b.onclick = function () { cmsDelete("opening_hours", CMS.HRS, +b.dataset.hd, "Supprimer cet horaire ?"); }; });
  wireMoves("opening_hours", CMS.HRS);
}
function hrsForm(id) {
  var h = id ? CMS.HRS.filter(function (x) { return x.id == id; })[0] : { label: "", value: "" };
  openSheet('<h2 style="font-size:28px;margin-bottom:6px">' + (id ? "Modifier l'horaire" : "Nouvel horaire") + '</h2>' +
    '<label for="chl">Intitulé</label><input class="inp" id="chl" maxlength="60" value="' + esc(h.label) + '" placeholder="Ex. Restaurant">' +
    '<label for="chv">Horaire</label><input class="inp" id="chv" maxlength="60" value="' + esc(h.value) + '" placeholder="Ex. 12h – 22h">' +
    '<div class="err" id="cfe"></div><button class="save" id="cfs" type="button">Enregistrer</button>');
  G("cfs").onclick = async function () {
    var l = G("chl").value.trim(), v = G("chv").value.trim(), e = G("cfe");
    if (l.length < 2) { e.textContent = "Entrez l'intitulé (2 caractères minimum)."; return; }
    if (!v) { e.textContent = "Entrez l'horaire."; return; }
    G("cfs").disabled = true;
    var r;
    if (id) r = await db.from("opening_hours").update({ label: l, value: v }).eq("id", id).select("*").single();
    else r = await db.from("opening_hours").insert({ label: l, value: v, position: CMS.HRS.length ? CMS.HRS[CMS.HRS.length - 1].position + 1 : 1 }).select("*").single();
    G("cfs").disabled = false;
    if (r.error) { e.textContent = "L'enregistrement n'a pas pu se faire. Réessayez."; return; }
    if (id) CMS.HRS = CMS.HRS.map(function (x) { return x.id == id ? r.data : x; }); else CMS.HRS.push(r.data);
    closeSheet(); cmsRender(); toast("Horaire enregistré ✓");
  };
}

/* ---------- Galerie ---------- */
function cmsGallery() {
  G("cmsBody").innerHTML = '<button class="add" id="cAdd" type="button">+ Ajouter des photos</button>' +
    (CMS.GAL.length ? '<div class="gadm">' + CMS.GAL.map(function (g) {
      return '<div class="gi" style="background-image:url(\'' + encodeURI(g.url) + '\')"><span>' + esc(g.caption || g.category) + ' · ' + esc(g.category) + '</span><button data-gd="' + g.id + '" type="button" aria-label="Supprimer la photo">✕</button></div>';
    }).join("") + '</div>' : '<div class="empty">Aucune photo. La section « Galerie photo » est masquée sur le site.</div>');
  G("cAdd").onclick = galForm;
  G("cmsBody").querySelectorAll("[data-gd]").forEach(function (b) {
    b.onclick = function () { cmsDelete("gallery_photos", CMS.GAL, +b.dataset.gd, "Supprimer cette photo de la galerie ?", function (g) { removeFile(g.url); }); };
  });
}
function galForm() {
  openSheet('<h2 style="font-size:28px;margin-bottom:6px">Ajouter des photos</h2>' +
    '<label for="cgc">Catégorie</label><select class="inp" id="cgc">' + CATS.map(function (c) { return '<option>' + c + '</option>'; }).join("") + '</select>' +
    '<label for="cgd">Légende (facultatif)</label><input class="inp" id="cgd" maxlength="80" placeholder="Ex. Terrasse au coucher du soleil">' +
    '<label for="cgf">Photos (vous pouvez en choisir plusieurs)</label><input class="inp" id="cgf" type="file" accept="image/*" multiple>' +
    '<div class="sub" id="cgn" style="margin-top:6px"></div><div class="err" id="cfe"></div>' +
    '<button class="save" id="cfs" type="button">Envoyer les photos</button>');
  G("cfs").onclick = async function () {
    var files = Array.prototype.slice.call(G("cgf").files), e = G("cfe");
    if (!files.length) { e.textContent = "Choisissez au moins une photo."; return; }
    if (CMS.GAL.length + files.length > 40) { e.textContent = "La galerie est limitée à 40 photos."; return; }
    e.textContent = ""; G("cfs").disabled = true;
    var pos = CMS.GAL.length ? CMS.GAL[CMS.GAL.length - 1].position : 0, done = 0, cat = G("cgc").value, cap = G("cgd").value.trim();
    for (var i = 0; i < files.length; i++) {
      G("cgn").textContent = "Envoi de la photo " + (i + 1) + " sur " + files.length + "…";
      var up = await uploadPhoto(files[i], "gallery");
      if (up.error) { e.textContent = up.error; continue; }
      pos += 1;
      var r = await db.from("gallery_photos").insert({ url: up.url, caption: cap || null, category: cat, position: pos }).select("*").single();
      if (r.error) { removeFile(up.url); e.textContent = "Une photo n'a pas pu être enregistrée."; continue; }
      CMS.GAL.push(r.data); done++;
    }
    G("cfs").disabled = false; G("cgn").textContent = "";
    if (done) { closeSheet(); cmsRender(); toast(done + " photo" + (done > 1 ? "s ajoutées" : " ajoutée") + " ✓"); }
  };
}

/* ---------- Coordonnées ---------- */
function cmsContact() {
  G("cmsBody").innerHTML = '<div class="panel" style="margin-top:10px"><h2>Coordonnées affichées sur le site</h2>' +
    '<p class="sub" style="margin-bottom:6px">Page Contact. Un champ laissé vide n\'est pas affiché.</p>' +
    CONTACT_FIELDS.map(function (f) { return '<label for="ct_' + f[0] + '">' + f[1] + '</label><input class="inp" id="ct_' + f[0] + '" type="' + (f[3] == "email" ? "email" : f[3] == "tel" ? "tel" : "text") + '" placeholder="' + f[2] + '" maxlength="300" value="' + esc(SET[f[0]] || "") + '">'; }).join("") +
    '<p class="sub" style="margin-top:10px">Pour l\'itinéraire : ouvrez l\'hôtel dans Google Maps, appuyez sur « Partager », puis copiez le lien ici. Sans lien, le site utilise l\'adresse.</p>' +
    '<div class="err" id="cte"></div><button class="add" id="ctS" type="button" style="margin-top:8px">Enregistrer les coordonnées</button></div>';
  G("ctS").onclick = async function () {
    var rows = [], e = G("cte");
    for (var i = 0; i < CONTACT_FIELDS.length; i++) {
      var f = CONTACT_FIELDS[i], v = G("ct_" + f[0]).value.trim();
      if (f[3] == "email" && v && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) { e.textContent = "L'e-mail n'est pas valide."; return; }
      if (f[3] == "tel" && v && v.replace(/\D/g, "").length < 8) { e.textContent = "« " + f[1] + " » n'est pas un numéro valide."; return; }
      if (f[3] == "url" && v && !/^https?:\/\//i.test(v)) { e.textContent = "« " + f[1] + " » doit commencer par https://"; return; }
      rows.push({ key: f[0], value: v });
    }
    e.textContent = ""; G("ctS").disabled = true;
    var r = await db.from("hotel_settings").upsert(rows, { onConflict: "key" });
    G("ctS").disabled = false;
    if (r.error) { e.textContent = "Les coordonnées n'ont pas pu être enregistrées. Réessayez."; return; }
    rows.forEach(function (x) { SET[x.key] = x.value; });
    toast("Coordonnées enregistrées ✓");
  };
}
