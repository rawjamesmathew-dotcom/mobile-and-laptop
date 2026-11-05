
/* ============================================================
   GTS — Admin portal logic
   NOTE: This demo runs fully client-side. In production every
   action here MUST be enforced server-side (see README).
   ============================================================ */
'use strict';

const AUTH_KEY = 'gts_auth_v1';
const LOCK_KEY = 'gts_lock_v1';
const SESSION_HOURS = 2;

/* ---------- crypto (SHA-256 salted hash — demo-grade; production: Argon2id/bcrypt server-side) ---------- */
async function sha256(text){
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return Array.from(new Uint8Array(buf)).map(b=>b.toString(16).padStart(2,'0')).join('');
}
function getAuth(){ try { return JSON.parse(localStorage.getItem(AUTH_KEY)); } catch(e){ return null; } }
function setAuth(a){ localStorage.setItem(AUTH_KEY, JSON.stringify(a)); }
async function hashPassword(pass, salt){
  salt = salt || Array.from(crypto.getRandomValues(new Uint8Array(8))).map(b=>b.toString(16).padStart(2,'0')).join('');
  return { salt, hash: await sha256(salt + ':' + pass) };
}
function getSession(){
  try { const s = JSON.parse(sessionStorage.getItem(AUTH_KEY)); if (!s) return null;
    if (Date.now() > s.exp){ sessionStorage.removeItem(AUTH_KEY); return null; } return s; } catch(e){ return null; }
}
function setSession(user){
  sessionStorage.setItem(AUTH_KEY, JSON.stringify({ user, exp: Date.now() + SESSION_HOURS*3600*1000 }));
}

/* ---------- rate limiting ---------- */
function lockState(){
  try { return JSON.parse(localStorage.getItem(LOCK_KEY)) || { fails:0, until:0 }; } catch(e){ return { fails:0, until:0 }; }
}
function recordFail(){
  const l = lockState(); l.fails++;
  if (l.fails >= 5){ l.until = Date.now() + 60000; l.fails = 0; }
  localStorage.setItem(LOCK_KEY, JSON.stringify(l));
  return l;
}
function clearFails(){ localStorage.removeItem(LOCK_KEY); }
function lockedRemaining(){
  const l = lockState();
  return l.until > Date.now() ? Math.ceil((l.until - Date.now())/1000) : 0;
}

const $ = s => document.querySelector(s);
const $$ = s => Array.from(document.querySelectorAll(s));

/* ---------- boot ---------- */
document.addEventListener('DOMContentLoaded', async () => {
  const auth = getAuth();
  if (!auth){ $('#setupBox').style.display = 'block'; }
  else if (getSession()){ showApp(); }
  else { $('#loginBox').style.display = 'block'; }
});

/* ---------- first-run setup ---------- */
$('#setupForm').addEventListener('submit', async e => {
  e.preventDefault();
  const f = e.target;
  let ok = gtsValidate(f);
  if (ok && $('#sPass').value !== $('#sPass2').value){
    $('#sPass2').closest('.field').classList.add('invalid'); ok = false;
  }
  if (!ok) return;
  const { salt, hash } = await hashPassword($('#sPass').value);
  setAuth({ user: 'samith1985', salt, hash, created: new Date().toISOString() });
  setSession('samith1985');
  gtsToast('Owner account created — welcome to GTS Admin');
  showApp();
});

/* ---------- login ---------- */
$('#loginForm').addEventListener('submit', async e => {
  e.preventDefault();
  const err = $('#loginErr'); err.classList.remove('show');
  const rem = lockedRemaining();
  if (rem > 0){ err.textContent = `Too many failed attempts — try again in ${rem}s.`; err.classList.add('show'); return; }
  if (!gtsValidate(e.target)) return;
  const auth = getAuth();
  const { hash } = await hashPassword($('#lPass').value, auth.salt);
  if ($('#lUser').value.trim() === auth.user && hash === auth.hash){
    clearFails(); setSession(auth.user);
    gtsToast('Signed in'); showApp();
  } else {
    const l = recordFail();
    err.textContent = l.until > Date.now()
      ? `Too many failed attempts — locked for 60 seconds.`
      : 'Invalid credentials. Attempt ' + Math.min(l.fails,5) + ' of 5.';
    err.classList.add('show');
  }
});

/* ---------- app shell ---------- */
function showApp(){
  $('#authView').style.display = 'none';
  $('#appView').style.display = 'grid';
  switchView('dashboard');
  const tg = $('#adminMenuToggle');
  if (window.matchMedia('(max-width:920px)').matches) tg.style.display = 'flex';
  tg.onclick = () => $('#adminSide').classList.toggle('open');
}
$('#logoutBtn').addEventListener('click', () => {
  sessionStorage.removeItem(AUTH_KEY);
  location.reload();
});

const VIEW_TITLES = { dashboard:'Dashboard', products:'Products', prices:'Prices & Log', gallery:'Gallery', testimonials:'Testimonials', enquiries:'Enquiries', settings:'Settings' };
function switchView(name){
  $$('.view').forEach(v => v.classList.toggle('active', v.dataset.view === name));
  $$('.admin-nav-btn[data-view]').forEach(b => b.classList.toggle('active', b.dataset.view === name));
  $('#viewTitle').textContent = VIEW_TITLES[name];
  $('#adminSide').classList.remove('open');
  renderView(name);
}
$$('.admin-nav-btn[data-view]').forEach(b => b.addEventListener('click', () => switchView(b.dataset.view)));

function renderView(name){
  if (name==='dashboard') renderDashboard();
  if (name==='products') renderProducts();
  if (name==='prices') renderPrices();
  if (name==='gallery') renderGalleryAdmin();
  if (name==='testimonials') renderTestimonials();
  if (name==='enquiries') renderEnquiries();
}

/* ---------- dashboard ---------- */
function renderDashboard(){
  const s = gtsStore();
  const pub = s.products.filter(p=>p.status==='published').length;
  const draft = s.products.filter(p=>p.status==='draft').length;
  const gal = s.gallery.filter(g=>g.public).length;
  const pend = s.enquiries.length;
  $('#statCards').innerHTML = `
    <div class="stat-card"><span>Published products</span><b>${pub}</b><span class="up">live on site</span></div>
    <div class="stat-card"><span>Draft products</span><b>${draft}</b><span class="up">hidden from public</span></div>
    <div class="stat-card"><span>Gallery images</span><b>${gal}</b><span class="up">public / ${s.gallery.length} total</span></div>
    <div class="stat-card"><span>Enquiries</span><b>${pend}</b><span class="up">contact + orders</span></div>`;
  const upd = s.products.slice().sort((a,b)=>b.updated.localeCompare(a.updated)).slice(0,6);
  $('#recentUpdates').innerHTML = upd.map(p =>
    `<div style="display:flex;justify-content:space-between;gap:10px;padding:9px 0;border-bottom:1px solid var(--border)">
      <span>${p.name}</span><span class="muted">${gtsDate(p.updated)}</span></div>`).join('') || '<p class="muted">No products yet.</p>';
  $('#recentEnquiries').innerHTML = s.enquiries.slice(0,6).map(en =>
    `<div style="padding:9px 0;border-bottom:1px solid var(--border)">
      <b>${en.kind==='order'?'Order':'Contact'} — ${en.name}</b> <span class="muted">(${en.country})</span><br>
      <span class="muted" style="font-size:.78rem">${en.email} · ${gtsDate(en.at)}</span></div>`).join('') || '<p class="muted">No enquiries yet. Submitted forms will appear here.</p>';
}

/* ---------- products ---------- */
function statusPill(st){
  const map = { published:['status-pub','Published'], draft:['status-draft','Draft'], archived:['status-arch','Archived'] };
  const m = map[st] || map.draft;
  return `<span class="status-pill ${m[0]}">${m[1]}</span>`;
}
function renderProducts(){
  const s = gtsStore();
  $('#productRows').innerHTML = s.products.map(p => `
    <tr>
      <td><b>${p.name}</b><br><span class="muted" style="font-size:.76rem">${p.slug}</span></td>
      <td>${p.category==='mobile'?'Mobile':'Laptop'}</td>
      <td>${money(p.price)}</td>
      <td>${p.sale ? money(p.sale) : '<span class="muted">—</span>'}</td>
      <td>${p.stock==='in'?'<span class="status-pill status-pub">In ('+(p.stockQty||0)+')</span>':p.stock==='low'?'<span class="status-pill status-draft">Low</span>':'<span class="status-pill status-pend">Out</span>'}</td>
      <td>${statusPill(p.status)}</td>
      <td style="white-space:nowrap">
        <button class="btn btn-dark btn-sm" data-edit="${p.id}">Edit</button>
        <button class="btn btn-ghost btn-sm" data-toggle="${p.id}">${p.status==='published'?'Unpublish':'Publish'}</button>
        <button class="btn btn-ghost btn-sm" data-del="${p.id}" style="color:var(--red2)">Delete</button>
      </td>
    </tr>`).join('');
  $$('#productRows [data-edit]').forEach(b => b.onclick = () => openProductModal(b.dataset.edit));
  $$('#productRows [data-toggle]').forEach(b => b.onclick = () => {
    const st = gtsStore();
    const p = st.products.find(x=>x.id===b.dataset.toggle);
    p.status = p.status==='published' ? 'draft' : 'published';
    p.updated = new Date().toISOString();
    gtsSave(st); gtsToast(p.status==='published' ? `"${p.name}" published` : `"${p.name}" unpublished`); renderProducts();
  });
  $$('#productRows [data-del]').forEach(b => b.onclick = () => askDelete(b.dataset.del));
}
function askDelete(id){
  const bar = $('#deleteBar'); const s = gtsStore();
  const p = s.products.find(x=>x.id===id);
  bar.innerHTML = `<span>Delete <b>${p.name}</b> permanently? This cannot be undone.</span>
    <span style="margin-left:auto;display:flex;gap:10px">
      <button class="btn btn-ghost btn-sm" id="delNo">Cancel</button>
      <button class="btn btn-primary btn-sm" id="delYes" style="background:var(--red)">Confirm delete</button></span>`;
  bar.classList.add('show');
  $('#delNo').onclick = () => bar.classList.remove('show');
  $('#delYes').onclick = () => {
    const st = gtsStore();
    st.products = st.products.filter(x=>x.id!==id);
    gtsSave(st); bar.classList.remove('show');
    gtsToast(`"${p.name}" deleted`); renderProducts();
  };
}

/* ---------- product modal ---------- */
let editingId = null;
$('#addProductBtn').addEventListener('click', () => openProductModal(null));
$('#pmClose').addEventListener('click', closeProductModal);
$('#pmCancel').addEventListener('click', closeProductModal);
$('#productModal').addEventListener('click', e => { if (e.target.id==='productModal') closeProductModal(); });
function closeProductModal(){ $('#productModal').classList.remove('open'); }
function openProductModal(id){
  editingId = id;
  const f = $('#productForm');
  if (id){
    const p = gtsStore().products.find(x=>x.id===id);
    $('#pmTitle').textContent = 'Edit — ' + p.name;
    $('#pfName').value=p.name; $('#pfType').value=p.type||''; $('#pfCat').value=p.category; $('#pfArt').value=p.art;
    $('#pfPrice').value=p.price; $('#pfSale').value=p.sale||''; $('#pfStock').value=p.stock;
    $('#pfQty').value=p.stockQty||0; $('#pfStatus').value=p.status;
    $('#pfFeatured').checked=!!p.featured; $('#pfNew').checked=!!p.isNew; $('#pfDesc').value=p.desc;
  } else {
    $('#pmTitle').textContent = 'Add product'; f.reset();
    $('#pfQty').value=50; $('#pfStatus').value='draft';
  }
  f.querySelectorAll('.field').forEach(fd=>fd.classList.remove('invalid'));
  $('#productModal').classList.add('open');
}
$('#productForm').addEventListener('submit', e => {
  e.preventDefault();
  const f = e.target;
  const price = parseFloat($('#pfPrice').value), sale = $('#pfSale').value==='' ? null : parseFloat($('#pfSale').value);
  let ok = gtsValidate(f);
  if (isNaN(price) || price < 0){ $('#pfPrice').closest('.field').classList.add('invalid'); ok=false; }
  if (sale !== null && (isNaN(sale) || sale < 0)){ $('#pfSale').closest('.field').classList.add('invalid'); ok=false; }
  if (!ok){ gtsToast('Please fix the highlighted fields'); return; }
  const st = gtsStore();
  const now = new Date().toISOString();
  if (editingId){
    const p = st.products.find(x=>x.id===editingId);
    if (p.price !== price) logPrice(st, p.name, p.price, price);
    if (p.sale !== sale) logPrice(st, p.name + ' (sale)', p.sale, sale);
    Object.assign(p, {
      name: $('#pfName').value.trim(), type: $('#pfType').value.trim(), category: $('#pfCat').value,
      art: $('#pfArt').value, price, sale, stock: $('#pfStock').value,
      stockQty: Math.max(0, parseInt($('#pfQty').value)||0), status: $('#pfStatus').value,
      featured: $('#pfFeatured').checked, isNew: $('#pfNew').checked,
      desc: $('#pfDesc').value.trim(), updated: now
    });
    gtsToast('Product updated');
  } else {
    const slug = $('#pfName').value.trim().toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
    st.products.push({
      id:'p'+Date.now(), slug, name:$('#pfName').value.trim(), type:$('#pfType').value.trim(),
      category:$('#pfCat').value, art:$('#pfArt').value, price, sale, stock:$('#pfStock').value,
      stockQty:Math.max(0,parseInt($('#pfQty').value)||0), status:$('#pfStatus').value,
      featured:$('#pfFeatured').checked, isNew:$('#pfNew').checked,
      desc:$('#pfDesc').value.trim(), specs:{Note:"Specs to be confirmed"}, created:now, updated:now
    });
    gtsToast('Product created');
  }
  gtsSave(st); closeProductModal(); renderProducts();
});
function logPrice(st, name, oldP, newP){
  st.priceLog.unshift({ at:new Date().toISOString(), product:name, from:oldP, to:newP, by:(getSession()||{}).user || 'samith1985' });
  if (st.priceLog.length > 200) st.priceLog.length = 200;
}

/* ---------- prices ---------- */
function renderPrices(){
  const s = gtsStore();
  $('#priceRows').innerHTML = s.products.map(p => `
    <tr data-pid="${p.id}">
      <td><b>${p.name}</b><br><span class="muted" style="font-size:.76rem">${p.category==='mobile'?'Mobile':'Laptop'} · ${statusPill(p.status)}</span></td>
      <td><input type="number" min="0" step="1" value="${p.price}" data-field="price" style="width:110px;background:var(--bg2);border:1px solid var(--border);border-radius:8px;color:#fff;padding:8px 10px"></td>
      <td><input type="number" min="0" step="1" value="${p.sale ?? ''}" data-field="sale" placeholder="—" style="width:110px;background:var(--bg2);border:1px solid var(--border);border-radius:8px;color:#fff;padding:8px 10px"></td>
      <td><button class="btn btn-primary btn-sm" data-save="${p.id}">Save</button></td>
    </tr>`).join('');
  $$('#priceRows [data-save]').forEach(b => b.onclick = () => {
    const tr = b.closest('tr'); const st = gtsStore();
    const p = st.products.find(x=>x.id===b.dataset.save);
    const np = parseFloat(tr.querySelector('[data-field=price]').value);
    const nsRaw = tr.querySelector('[data-field=sale]').value;
    const ns = nsRaw === '' ? null : parseFloat(nsRaw);
    if (isNaN(np) || np < 0 || (ns !== null && (isNaN(ns) || ns < 0))){ gtsToast('Prices must be numbers ≥ 0'); return; }
    if (p.price !== np) logPrice(st, p.name, p.price, np);
    if (p.sale !== ns) logPrice(st, p.name + ' (sale)', p.sale, ns);
    p.price = np; p.sale = ns; p.updated = new Date().toISOString();
    gtsSave(st); gtsToast(`Prices saved for ${p.name}`); renderPrices();
  });
  $('#priceLogRows').innerHTML = s.priceLog.length ? s.priceLog.slice(0,15).map(l => `
    <tr><td>${gtsDate(l.at)} <span class="muted" style="font-size:.72rem">${new Date(l.at).toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit'})}</span></td>
    <td style="color:#fff">${l.product}</td>
    <td>${l.from==null?'—':money(l.from)} → <b style="color:var(--red2)">${l.to==null?'—':money(l.to)}</b></td>
    <td>${l.by}</td></tr>`).join('') : '<tr><td colspan="4" class="muted">No price changes recorded yet.</td></tr>';
}

/* ---------- gallery admin ---------- */
let pendingUploads = [];
const ALLOWED = ['image/jpeg','image/png','image/webp'];
const MAX_SIZE = 2 * 1024 * 1024;

function renderGalleryAdmin(){
  const s = gtsStore();
  $('#galAdminGrid').innerHTML = s.gallery.map((g,i) => `
    <div class="gal-admin-item">
      <div class="ga-art">${g.src
        ? `<img src="${g.src}" alt="${g.alt||''}" style="width:100%;height:110px;object-fit:cover;border-radius:8px">`
        : productArt(g.art)}</div>
      <div class="ga-meta"><b>${g.title||'(untitled)'}</b><br>
        <span class="muted">${g.tag==='mobile'?'Mobile':'Laptop'}${g.country?' · '+g.country:''}</span><br>
        ${g.public ? '<span class="status-pill status-pub">Public</span>' : '<span class="status-pill status-draft">Draft</span>'}
      </div>
      <div class="ga-actions">
        <button data-up="${i}" ${i===0?'disabled':''}>↑</button>
        <button data-down="${i}" ${i===s.gallery.length-1?'disabled':''}>↓</button>
        <button data-vis="${i}">${g.public?'Draft':'Publish'}</button>
        <button data-gdel="${i}" style="color:var(--red2)">Delete</button>
      </div>
    </div>`).join('');
  $$('#galAdminGrid [data-up]').forEach(b => b.onclick = () => moveGallery(+b.dataset.up, -1));
  $$('#galAdminGrid [data-down]').forEach(b => b.onclick = () => moveGallery(+b.dataset.down, 1));
  $$('#galAdminGrid [data-vis]').forEach(b => b.onclick = () => {
    const st = gtsStore(); const g = st.gallery[+b.dataset.vis];
    g.public = !g.public; gtsSave(st); renderGalleryAdmin();
    gtsToast(g.public ? 'Image published' : 'Image set to draft');
  });
  $$('#galAdminGrid [data-gdel]').forEach(b => b.onclick = () => {
    if (!confirm('Delete this gallery image?')) return;
    const st = gtsStore(); st.gallery.splice(+b.dataset.gdel,1); gtsSave(st);
    gtsToast('Image deleted'); renderGalleryAdmin();
  });
  renderPending();
}
function moveGallery(i, dir){
  const st = gtsStore(); const j = i + dir;
  if (j < 0 || j >= st.gallery.length) return;
  [st.gallery[i], st.gallery[j]] = [st.gallery[j], st.gallery[i]];
  gtsSave(st); renderGalleryAdmin();
}
const dz = $('#dropZone'), fi = $('#fileInput');
dz.addEventListener('click', () => fi.click());
dz.addEventListener('dragover', e => { e.preventDefault(); dz.classList.add('drag'); });
dz.addEventListener('dragleave', () => dz.classList.remove('drag'));
dz.addEventListener('drop', e => { e.preventDefault(); dz.classList.remove('drag'); handleFiles(e.dataTransfer.files); });
fi.addEventListener('change', () => handleFiles(fi.files));
function handleFiles(files){
  for (const file of files){
    if (!ALLOWED.includes(file.type)){ gtsToast(`Rejected ${file.name} — only JPEG, PNG or WebP allowed`); continue; }
    if (file.size > MAX_SIZE){ gtsToast(`Rejected ${file.name} — exceeds 2 MB limit`); continue; }
    const reader = new FileReader();
    reader.onload = ev => {
      pendingUploads.push({ src: ev.target.result, name: file.name, alt:'', caption: file.name.replace(/\.[^.]+$/,'') });
      renderPending();
    };
    reader.readAsDataURL(file);
  }
  fi.value = '';
}
function renderPending(){
  const wrap = $('#uploadPreview');
  wrap.innerHTML = pendingUploads.map((u,i) => `
    <div class="up-item"><img src="${u.src}" alt="">
      <input placeholder="Alt text *" value="${u.alt}" data-alt="${i}">
      <input placeholder="Caption" value="${u.caption}" data-cap="${i}" style="border-top:1px solid var(--border)">
    </div>`).join('');
  $$('#uploadPreview [data-alt]').forEach(inp => inp.oninput = () => pendingUploads[+inp.dataset.alt].alt = inp.value);
  $$('#uploadPreview [data-cap]').forEach(inp => inp.oninput = () => pendingUploads[+inp.dataset.cap].caption = inp.value);
  $('#saveUploads').disabled = !pendingUploads.length;
}
$('#saveUploads').addEventListener('click', () => {
  const missing = pendingUploads.findIndex(u => !u.alt.trim());
  if (missing > -1){ gtsToast('Please add alt text for every image'); return; }
  const st = gtsStore();
  const tag = $('#upTag').value, pub = $('#upPublic').checked;
  for (const u of pendingUploads){
    st.gallery.push({ id:'g'+Date.now()+Math.random().toString(36).slice(2,5), title:u.caption, alt:u.alt, src:u.src, art:'charger', tag, country:'', public:pub });
  }
  gtsSave(st); pendingUploads = []; renderGalleryAdmin();
  gtsToast('Images saved to gallery');
});

/* ---------- testimonials ---------- */
function renderTestimonials(){
  const s = gtsStore();
  $('#testiRows').innerHTML = s.testimonials.map((t,i) => `
    <tr>
      <td style="max-width:380px"><b>${t.name}</b> <span class="muted" style="font-size:.76rem">· ${t.role||''}</span><br>
        <span class="muted" style="font-size:.84rem">${t.text}</span>
        ${t.demo ? '<br><span class="demo-flag" style="margin-top:8px">Demo — not a real review</span>' : ''}</td>
      <td>${t.country||'—'}</td>
      <td>${t.status==='demo' ? '<span class="status-pill status-draft">Demo (locked)</span>'
        : t.status==='approved' ? '<span class="status-pill status-pub">Approved</span>'
        : t.status==='hidden' ? '<span class="status-pill status-arch">Hidden</span>'
        : '<span class="status-pill status-pend">Pending</span>'}</td>
      <td style="white-space:nowrap">
        ${t.demo ? '<span class="muted" style="font-size:.78rem">Cannot be published as genuine</span>' : `
          ${t.status!=='approved' ? `<button class="btn btn-primary btn-sm" data-approve="${i}">Approve</button>` : ''}
          ${t.status!=='hidden' ? `<button class="btn btn-ghost btn-sm" data-hide="${i}">Hide</button>` : `<button class="btn btn-ghost btn-sm" data-unhide="${i}">Restore</button>`}`}
      </td>
    </tr>`).join('');
  $$('#testiRows [data-approve]').forEach(b => b.onclick = () => {
    const st = gtsStore(); const t = st.testimonials[+b.dataset.approve];
    if (t.demo){ gtsToast('Demo entries can never be published as genuine reviews'); return; }
    if (!t.consent){ gtsToast('Consent not recorded — cannot approve'); return; }
    t.status = 'approved'; gtsSave(st); renderTestimonials(); gtsToast('Feedback approved for display');
  });
  $$('#testiRows [data-hide]').forEach(b => b.onclick = () => {
    const st = gtsStore(); st.testimonials[+b.dataset.hide].status = 'hidden'; gtsSave(st); renderTestimonials();
  });
  $$('#testiRows [data-unhide]').forEach(b => b.onclick = () => {
    const st = gtsStore(); st.testimonials[+b.dataset.unhide].status = 'pending'; gtsSave(st); renderTestimonials();
  });
}

/* ---------- enquiries ---------- */
function renderEnquiries(){
  const s = gtsStore();
  $('#enquiryList').innerHTML = s.enquiries.length ? s.enquiries.map(en => `
    <div class="info-card" style="margin-bottom:14px">
      <div style="display:flex;justify-content:space-between;gap:10px;flex-wrap:wrap">
        <b>${en.kind==='order' ? 'Order Enquiry' : 'Contact Message'} — ${en.name}</b>
        <span class="muted" style="font-size:.78rem">${gtsDate(en.at)}</span>
      </div>
      <p class="muted" style="font-size:.84rem;margin-top:6px">${en.email} · ${en.country}${en.phone ? ' · ' + en.phone : ''}</p>
      ${en.items ? `<div style="margin-top:10px;font-size:.86rem">${en.items.map(l => {
          const p = gtsBySlug(l.slug); return `<div>• ${p ? p.name : l.slug} — ${l.qty} × ${money(l.unit)}</div>`; }).join('')}
        <div style="margin-top:6px"><b>Total: ${money(en.total)}</b></div></div>` : ''}
      ${en.message ? `<p style="font-size:.88rem;margin-top:10px">${en.message}</p>` : ''}
      <a class="btn btn-ghost btn-sm" style="margin-top:12px" href="mailto:${en.email}?subject=Re: your GTS ${en.kind==='order'?'order enquiry':'message'}">Reply by email</a>
    </div>`).join('') : '<div class="empty-state"><h3>No enquiries yet</h3><p>Contact form and order requests will appear here.</p></div>';
}

/* ---------- settings ---------- */
$('#passForm').addEventListener('submit', async e => {
  e.preventDefault();
  let ok = gtsValidate(e.target);
  if (ok && $('#newPass').value !== $('#newPass2').value){ $('#newPass2').closest('.field').classList.add('invalid'); ok = false; }
  if (!ok) return;
  const auth = getAuth();
  const { hash } = await hashPassword($('#oldPass').value, auth.salt);
  if (hash !== auth.hash){ $('#oldPass').closest('.field').classList.add('invalid'); gtsToast('Current password is incorrect'); return; }
  const { salt, hash: nh } = await hashPassword($('#newPass').value);
  auth.salt = salt; auth.hash = nh; setAuth(auth);
  e.target.reset(); gtsToast('Password updated');
});
$('#exportBtn').addEventListener('click', () => {
  const blob = new Blob([JSON.stringify(gtsStore(), null, 2)], { type:'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob); a.download = 'gts-backup-' + new Date().toISOString().slice(0,10) + '.json';
  a.click(); URL.revokeObjectURL(a.href);
  gtsToast('Backup downloaded');
});
$('#resetBtn').addEventListener('click', () => {
  const bar = $('#resetBar');
  bar.innerHTML = `<span>Reset all catalogue, gallery, testimonials and enquiries to the demo dataset?</span>
    <span style="margin-left:auto;display:flex;gap:10px">
      <button class="btn btn-ghost btn-sm" id="rsNo">Cancel</button>
      <button class="btn btn-primary btn-sm" id="rsYes" style="background:var(--red)">Confirm reset</button></span>`;
  bar.classList.add('show');
  $('#rsNo').onclick = () => bar.classList.remove('show');
  $('#rsYes').onclick = () => {
    localStorage.removeItem(GTS_STORE_KEY); localStorage.removeItem(GTS_CART_KEY);
    bar.classList.remove('show'); gtsToast('Demo data restored'); switchView('dashboard');
  };
});
