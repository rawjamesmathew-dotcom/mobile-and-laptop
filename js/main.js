
/* ============================================================
   GTS — Public site engine (shared across all pages)
   ============================================================ */
'use strict';

/* ---------- storage helpers ---------- */
const GTS_STORE_KEY = 'gts_store_v1';
function gtsSeed(){
  return {
    products: JSON.parse(JSON.stringify(GTS_SEED_PRODUCTS)),
    gallery: JSON.parse(JSON.stringify(GTS_SEED_GALLERY)),
    testimonials: JSON.parse(JSON.stringify(GTS_SEED_TESTIMONIALS)),
    enquiries: [], priceLog: [],
    seededAt: new Date().toISOString()
  };
}
function gtsStore(){
  try {
    const raw = localStorage.getItem(GTS_STORE_KEY);
    if (!raw){ const s = gtsSeed(); localStorage.setItem(GTS_STORE_KEY, JSON.stringify(s)); return s; }
    const s = JSON.parse(raw);
    s.enquiries = s.enquiries || []; s.priceLog = s.priceLog || [];
    return s;
  } catch(e){ return gtsSeed(); }
}
function gtsSave(s){ localStorage.setItem(GTS_STORE_KEY, JSON.stringify(s)); }
function gtsProducts(){ return gtsStore().products.filter(p => p.status === 'published'); }
function gtsBySlug(slug){ return gtsStore().products.find(p => p.slug === slug); }

/* ---------- cart ---------- */
const GTS_CART_KEY = 'gts_cart_v1';
function gtsCart(){ try { return JSON.parse(localStorage.getItem(GTS_CART_KEY)) || []; } catch(e){ return []; } }
function gtsSaveCart(c){ localStorage.setItem(GTS_CART_KEY, JSON.stringify(c)); gtsUpdateCartCount(); }
function gtsCartCount(){ return gtsCart().reduce((n,i)=>n+i.qty,0); }
function gtsAddToCart(slug, qty){
  qty = qty || 1;
  const p = gtsBySlug(slug); if(!p) return;
  const c = gtsCart();
  const line = c.find(i => i.slug === slug);
  const unitNow = gtsWholesalePrice(p, (line?line.qty:0) + qty).unit;
  if (line){ line.qty += qty; line.unit = unitNow; } else c.push({ slug, qty, unit: unitNow });
  gtsSaveCart(c);
  gtsToast(`Added ${qty} × ${p.name} to cart`);
}
function gtsUpdateCartCount(){
  const el = document.getElementById('cartCount'); if(!el) return;
  const n = gtsCartCount();
  el.textContent = n; el.style.display = n ? 'flex' : 'none';
}
function gtsRemoveFromCart(slug){ gtsSaveCart(gtsCart().filter(i => i.slug !== slug)); }
function gtsSetQty(slug, qty){
  const c = gtsCart();
  const line = c.find(i => i.slug === slug); if(!line) return;
  const p = gtsBySlug(slug);
  line.qty = Math.max(1, qty);
  line.unit = gtsWholesalePrice(p, line.qty).unit;
  gtsSaveCart(c);
}
function gtsCartTotals(){
  let subtotal = 0, discount = 0, total = 0;
  for (const line of gtsCart()){
    const p = gtsBySlug(line.slug); if(!p) continue;
    const base = (p.sale && p.sale < p.price) ? p.sale : p.price;
    subtotal += base * line.qty; total += line.unit * line.qty;
  }
  discount = subtotal - total;
  return { subtotal, discount, total };
}

/* ---------- money / date ---------- */
function money(n){ return 'Rs ' + Number(n).toLocaleString('en-US'); }
function gtsDate(iso){ try { return new Date(iso).toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'}); } catch(e){ return iso; } }

/* ---------- SVG product artwork (original, licence-safe) ---------- */
const ART_CACHE = {};
function productArt(key, id){
  id = id || ('art' + Math.random().toString(36).slice(2,8));
  if (ART_CACHE[id]) return ART_CACHE[id];
  const stroke = '#F5F5F5', red = '#C41E3A';
  const S = (inner) => `<svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" role="img" aria-hidden="true">${inner}</svg>`;
  const arts = {
    charger: S(`<rect x="62" y="52" width="76" height="96" rx="20" stroke="${stroke}" stroke-width="5"/>
      <rect x="86" y="30" width="10" height="26" rx="4" fill="${stroke}"/><rect x="106" y="30" width="10" height="26" rx="4" fill="${stroke}"/>
      <path d="M104 84 L88 114 h14 l-8 30 26 -36 h-14 l10 -24 z" fill="${red}"/>
      <circle cx="100" cy="148" r="4" fill="${red}"/>`),
    earbuds: S(`<path d="M60 90 a26 26 0 1 1 40 22 l-6 34 a12 12 0 0 1 -24 0 l6 -34" stroke="${stroke}" stroke-width="5" stroke-linecap="round"/>
      <path d="M140 90 a26 26 0 1 0 -40 22 l6 34 a12 12 0 0 0 24 0 l-6 -34" stroke="${stroke}" stroke-width="5" stroke-linecap="round"/>
      <circle cx="72" cy="88" r="5" fill="${red}"/><circle cx="128" cy="88" r="5" fill="${red}"/>
      <rect x="66" y="160" width="68" height="22" rx="11" stroke="${red}" stroke-width="4"/>`),
    cable: S(`<path d="M40 150 C 40 90, 90 170, 100 110 S 160 60, 160 60" stroke="${stroke}" stroke-width="6" stroke-linecap="round"/>
      <rect x="148" y="34" width="26" height="34" rx="8" stroke="${red}" stroke-width="5"/>
      <rect x="30" y="140" width="26" height="34" rx="8" stroke="${red}" stroke-width="5"/>
      <path d="M96 96 l-10 16 h10 l-6 16 16 -20 h-10 l8 -12 z" fill="${red}"/>`),
    case: S(`<rect x="58" y="34" width="84" height="132" rx="18" stroke="${stroke}" stroke-width="5"/>
      <rect x="70" y="46" width="34" height="34" rx="10" stroke="${red}" stroke-width="4"/>
      <circle cx="81" cy="57" r="5" fill="${red}"/><circle cx="93" cy="57" r="5" fill="${red}"/>
      <circle cx="81" cy="69" r="5" fill="${red}"/>
      <path d="M70 100 h60 M70 116 h44 M70 132 h52" stroke="${stroke}" stroke-width="4" stroke-linecap="round" opacity=".5"/>`),
    powerbank: S(`<rect x="46" y="52" width="108" height="96" rx="22" stroke="${stroke}" stroke-width="5"/>
      <path d="M102 76 L86 104 h14 l-8 26 24 -32 h-14 l10 -28 z" fill="${red}"/>
      <circle cx="66" cy="132" r="4" fill="${red}"/><circle cx="80" cy="132" r="4" fill="${red}"/><circle cx="94" cy="132" r="4" fill="${stroke}" opacity=".4"/>`),
    mount: S(`<rect x="64" y="30" width="72" height="118" rx="14" stroke="${stroke}" stroke-width="5"/>
      <path d="M100 148 v20" stroke="${stroke}" stroke-width="6"/><path d="M64 172 h72" stroke="${stroke}" stroke-width="6" stroke-linecap="round"/>
      <path d="M84 66 l-8 14 h10 l-6 16 16 -20 h-10 l6 -10 z" fill="${red}"/>`),
    stand: S(`<path d="M44 96 L156 60" stroke="${stroke}" stroke-width="7" stroke-linecap="round"/>
      <path d="M44 96 L156 128" stroke="${stroke}" stroke-width="7" stroke-linecap="round"/>
      <path d="M156 60 L156 128" stroke="${red}" stroke-width="7" stroke-linecap="round"/>
      <path d="M64 148 h72" stroke="${stroke}" stroke-width="6" stroke-linecap="round"/><path d="M100 128 v20" stroke="${stroke}" stroke-width="6"/>`),
    hub: S(`<rect x="34" y="72" width="132" height="56" rx="14" stroke="${stroke}" stroke-width="5"/>
      <rect x="48" y="90" width="24" height="14" rx="4" stroke="${red}" stroke-width="4"/>
      <rect x="82" y="90" width="24" height="14" rx="4" stroke="${stroke}" stroke-width="4" opacity=".6"/>
      <rect x="116" y="90" width="24" height="14" rx="4" stroke="${stroke}" stroke-width="4" opacity=".6"/>
      <path d="M58 128 v14 M142 128 v14" stroke="${stroke}" stroke-width="5" stroke-linecap="round"/>
      <circle cx="100" cy="60" r="6" fill="${red}"/>`),
    mouse: S(`<path d="M100 34 C 64 34 52 66 52 100 c0 42 20 66 48 66 s48 -24 48 -66 c0 -34 -12 -66 -48 -66 z" stroke="${stroke}" stroke-width="5"/>
      <path d="M100 34 v44" stroke="${stroke}" stroke-width="4"/>
      <rect x="93" y="52" width="14" height="26" rx="7" stroke="${red}" stroke-width="4"/>`),
    keyboard: S(`<rect x="26" y="64" width="148" height="72" rx="14" stroke="${stroke}" stroke-width="5"/>
      ${[0,1,2].map(r=>[0,1,2,3,4,5].map(c=>`<rect x="${40+c*22}" y="${76+r*18}" width="14" height="10" rx="3" fill="${r===1&&c===2?red:stroke}" opacity="${r===1&&c===2?1:.45}"/>`).join('')).join('')}
      <rect x="64" y="130" width="72" height="8" rx="4" fill="${red}" opacity=".8"/>`),
    sleeve: S(`<rect x="36" y="52" width="128" height="96" rx="14" stroke="${stroke}" stroke-width="5"/>
      <path d="M36 66 L100 112 L164 66" stroke="${red}" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>
      <circle cx="100" cy="112" r="5" fill="${red}"/>`),
    coolpad: S(`<path d="M40 84 L160 84 L172 140 L28 140 Z" stroke="${stroke}" stroke-width="5" stroke-linejoin="round"/>
      <circle cx="72" cy="112" r="14" stroke="${red}" stroke-width="4"/><circle cx="128" cy="112" r="14" stroke="${red}" stroke-width="4"/>
      <path d="M72 104 a8 8 0 0 1 8 8 M128 104 a8 8 0 0 1 8 8" stroke="${red}" stroke-width="3"/>
      <path d="M48 72 h104" stroke="${stroke}" stroke-width="5" stroke-linecap="round"/>`)
  };
  ART_CACHE[id] = arts[key] || arts.charger;
  return ART_CACHE[id];
}
function galleryArt(art, big){
  return `<div class="g-art-inner" style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;padding:${big?'48px':'18%'}">${productArt(art)}</div>`;
}

/* ---------- icons ---------- */
const ICONS = {
  search: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>`,
  cart: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="20" r="1.6"/><circle cx="17" cy="20" r="1.6"/><path d="M3 4h2l2.6 11.5a1.5 1.5 0 0 0 1.5 1.2h7.9a1.5 1.5 0 0 0 1.5-1.2L20 8H6"/></svg>`,
  bolt: `<svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M13 2 4.5 13.5H11L9.5 22 19 10h-6.5L13 2z"/></svg>`,
  shield: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M12 3l7 3v5c0 4.5-3 8.5-7 10-4-1.5-7-5.5-7-10V6l7-3z"/><path d="m9 12 2 2 4-4"/></svg>`,
  globe: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.5 2.6 4 5.6 4 9s-1.5 6.4-4 9c-2.5-2.6-4-5.6-4-9s1.5-6.4 4-9z"/></svg>`,
  layers: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="m12 3 9 5-9 5-9-5 9-5z"/><path d="m3 13 9 5 9-5"/></svg>`,
  mail: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/></svg>`,
  pin: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 21s-7-5.5-7-11a7 7 0 0 1 14 0c0 5.5-7 11-7 11z"/><circle cx="12" cy="10" r="2.5"/></svg>`,
  clock: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>`,
  arrow: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>`
};
function featIcon(kind){ return `<span class="feat-icon">${ICONS[kind]||ICONS.bolt}</span>`; }

/* ---------- toast ---------- */
function gtsToast(msg){
  let t = document.getElementById('toast');
  if (!t){ t = document.createElement('div'); t.id = 'toast'; document.body.appendChild(t); }
  t.innerHTML = `<span class="dot"></span><span>${msg}</span>`;
  requestAnimationFrame(()=> t.classList.add('show'));
  clearTimeout(t._h); t._h = setTimeout(()=> t.classList.remove('show'), 2600);
}

/* ---------- header / footer ---------- */
function gtsHeader(active){
  const links = [
    ['index.html','Home'],['collections.html','Collections'],
    ['collections.html?cat=mobile','Mobile'],['collections.html?cat=laptop','Laptop'],
    ['about.html','About'],['contact.html','Contact']
  ];
  const nav = links.map(([h,l]) => `<a href="${h}" class="${active===l?'active':''}">${l}</a>`).join('');
  return `
  <div id="scrollProgress"></div>
  <header class="site-header" id="siteHeader">
    <div class="header-inner">
      <a class="logo" href="index.html" aria-label="GTS home"><span><b>GTS</b><span class="logo-dot">.</span></span><small>The Excellent Brand from Overseas</small></a>
      <nav class="main-nav" id="mainNav" aria-label="Main navigation">${nav}</nav>
      <div class="header-actions">
        <a class="icon-btn" href="collections.html#search" aria-label="Search products">${ICONS.search}</a>
        <a class="icon-btn" href="cart.html" aria-label="Cart">${ICONS.cart}<span class="cart-count" id="cartCount">0</span></a>
        <button class="menu-toggle" id="menuToggle" aria-label="Open menu" aria-expanded="false"><span></span><span></span><span></span></button>
      </div>
    </div>
  </header>
  <div class="menu-scrim" id="menuScrim"></div>`;
}
function gtsFooter(){
  const yr = new Date().getFullYear();
  return `
  <footer class="site-footer">
    <div class="container">
      <div class="footer-grid">
        <div>
          <a class="logo" href="index.html"><span><b>GTS</b><span class="logo-dot">.</span></span><small>The Excellent Brand from Overseas</small></a>
          <p class="muted" style="font-size:.88rem;margin-top:16px;max-width:300px">Premium mobile &amp; laptop accessories — imported quality with local presence, for retail and wholesale partners across South Asia.</p>
          <a class="footer-mail" href="mailto:${GTS_BRAND.email}">${ICONS.mail}<span>${GTS_BRAND.email}</span></a>
        </div>
        <div><h4>Shop</h4><ul>
          <li><a href="collections.html">All Collections</a></li>
          <li><a href="collections.html?cat=mobile">Mobile Accessories</a></li>
          <li><a href="collections.html?cat=laptop">Laptop Accessories</a></li>
          <li><a href="cart.html">Cart</a></li></ul></div>
        <div><h4>Company</h4><ul>
          <li><a href="about.html">About GTS</a></li>
          <li><a href="contact.html">Contact</a></li>
          <li><a href="index.html#wholesale">Wholesale</a></li>
          <li><a href="index.html#gallery">Lookbook</a></li></ul></div>
        <div><h4>Legal</h4><ul>
          <li><a href="privacy.html">Privacy Policy</a></li>
          <li><a href="terms.html">Terms &amp; Conditions</a></li></ul></div>
      </div>
      <div class="footer-bottom">
        <span>© ${yr} GTS. All rights reserved.</span>
        <span>Sri Lanka · India · Nepal · Bangladesh · Pakistan</span>
      </div>
    </div>
  </footer>`;
}
function gtsInitChrome(active){
  const h = document.getElementById('app-header'); if (h) h.innerHTML = gtsHeader(active);
  const f = document.getElementById('app-footer'); if (f) innerHTMLsafe(f, gtsFooter());
  gtsUpdateCartCount();
  const header = document.getElementById('siteHeader');
  const onScroll = () => {
    if (header) header.classList.toggle('scrolled', window.scrollY > 30);
    const sp = document.getElementById('scrollProgress');
    if (sp){ const d = document.documentElement; sp.style.width = (d.scrollTop/(d.scrollHeight-d.clientHeight||1)*100)+'%'; }
  };
  window.addEventListener('scroll', onScroll, {passive:true}); onScroll();
  const nav = document.getElementById('mainNav'), toggle = document.getElementById('menuToggle'), scrim = document.getElementById('menuScrim');
  if (toggle){
    toggle.addEventListener('click', () => {
      const open = nav.classList.toggle('open');
      toggle.classList.toggle('open', open);
      toggle.setAttribute('aria-expanded', open);
      scrim.classList.toggle('show', open);
      document.body.style.overflow = open ? 'hidden' : '';
    });
    scrim.addEventListener('click', () => { nav.classList.remove('open'); toggle.classList.remove('open'); scrim.classList.remove('show'); document.body.style.overflow=''; });
    nav.querySelectorAll('a').forEach(a => a.addEventListener('click', () => { nav.classList.remove('open'); toggle.classList.remove('open'); scrim.classList.remove('show'); document.body.style.overflow=''; }));
  }
}
function innerHTMLsafe(el, html){ const t = document.createElement('template'); t.innerHTML = html.trim(); el.appendChild(t.content); }

/* ---------- reveal on scroll ---------- */
function gtsReveal(){
  const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting){ e.target.classList.add('visible'); io.unobserve(e.target); } }), {threshold:.12});
  document.querySelectorAll('.reveal:not(.visible)').forEach(el => io.observe(el));
}
/* ---------- tilt ---------- */
function gtsTilt(){
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  if (window.matchMedia('(max-width: 820px)').matches) return;
  document.querySelectorAll('[data-tilt]').forEach(el => {
    if (el._tilt) return; el._tilt = true;
    el.addEventListener('mousemove', e => {
      const r = el.getBoundingClientRect();
      const rx = ((e.clientY - r.top)/r.height - .5) * -7;
      const ry = ((e.clientX - r.left)/r.width - .5) * 7;
      el.style.transform = `perspective(900px) rotateX(${rx}deg) rotateY(${ry}deg) translateY(-6px)`;
    });
    el.addEventListener('mouseleave', () => { el.style.transform = ''; });
  });
}

/* ---------- product card ---------- */
function stockLabel(p){
  if (p.stock === 'out') return `<span class="pc-stock stock-out"><i></i>Out of stock</span>`;
  if (p.stock === 'low') return `<span class="pc-stock stock-low"><i></i>Low stock — order soon</span>`;
  return `<span class="pc-stock stock-in"><i></i>In stock${p.stockQty?` (${p.stockQty})`:''}</span>`;
}
function salePct(p){ if (p.sale && p.sale < p.price) return Math.round((1 - p.sale/p.price)*100); return 0; }
function productCard(p, delay){
  const pct = salePct(p);
  const ws = gtsWholesalePrice(p, 10);
  return `
  <article class="product-card reveal ${p.stock==='out'?'stock-out-row':''}" style="transition-delay:${(delay||0)}ms">
    <a class="pc-media" href="product.html?slug=${p.slug}" aria-label="View ${p.name}">
      <div class="pc-badges">
        ${p.isNew ? '<span class="badge badge-new">New Arrival</span>' : ''}
        ${pct ? `<span class="badge badge-sale">−${pct}%</span>` : ''}
      </div>
      <div class="art-wrap">${productArt(p.art)}</div>
    </a>
    <div class="pc-body">
      <span class="pc-cat">${p.category === 'mobile' ? 'Mobile' : 'Laptop'}</span>
      <h3><a href="product.html?slug=${p.slug}">${p.name}</a></h3>
      <p class="pc-type">${p.type}</p>
      <div class="pc-price">
        <b>${money(p.sale && p.sale < p.price ? p.sale : p.price)}</b>
        ${pct ? `<s>${money(p.price)}</s><span class="save">SAVE ${pct}%</span>` : ''}
      </div>
      <p class="pc-wholesale">Wholesale 10+ from <b>${money(ws.unit)}</b> / unit</p>
      ${stockLabel(p)}
      <div class="pc-actions">
        <button class="btn btn-dark btn-sm" data-quickview="${p.slug}">Quick View</button>
        <button class="btn btn-primary btn-sm" data-addcart="${p.slug}" ${p.stock==='out'?'disabled':''}>
          ${p.stock==='out'?'Sold out':'Add to Cart'}
        </button>
      </div>
    </div>
  </article>`;
}
function bindProductCards(root){
  (root||document).querySelectorAll('[data-addcart]').forEach(b => b.addEventListener('click', () => gtsAddToCart(b.dataset.addcart)));
  (root||document).querySelectorAll('[data-quickview]').forEach(b => b.addEventListener('click', () => gtsQuickView(b.dataset.quickview)));
}

/* ---------- quick view modal ---------- */
function gtsQuickView(slug){
  const p = gtsBySlug(slug); if (!p) return;
  const pct = salePct(p); const eff = p.sale && p.sale < p.price ? p.sale : p.price;
  const modal = document.createElement('div');
  modal.className = 'modal-backdrop'; modal.setAttribute('role','dialog'); modal.setAttribute('aria-modal','true');
  modal.innerHTML = `
    <div class="modal">
      <div class="modal-head"><h3>${p.name}</h3><button class="modal-close" aria-label="Close quick view">✕</button></div>
      <div class="modal-body" style="display:grid;grid-template-columns:220px 1fr;gap:28px;align-items:center">
        <div style="border-radius:14px;background:var(--bg2);border:1px solid var(--border);padding:22px">${productArt(p.art)}</div>
        <div>
          <span class="pc-cat">${p.category === 'mobile' ? 'Mobile Accessories' : 'Laptop Accessories'} · ${p.type}</span>
          <div class="pc-price" style="margin-top:10px"><b style="font-size:1.6rem">${money(eff)}</b>${pct?`<s>${money(p.price)}</s>`:''}</div>
          <p class="muted" style="font-size:.9rem;margin:12px 0">${p.desc.slice(0,150)}…</p>
          ${stockLabel(p)}
          <div style="display:flex;gap:12px;margin-top:20px;flex-wrap:wrap">
            <a class="btn btn-ghost btn-sm" href="product.html?slug=${p.slug}">View Details ${ICONS.arrow}</a>
            <button class="btn btn-primary btn-sm" data-addcart="${p.slug}" ${p.stock==='out'?'disabled':''}>Add to Cart</button>
          </div>
        </div>
      </div>
    </div>`;
  document.body.appendChild(modal);
  requestAnimationFrame(()=> modal.classList.add('open'));
  const close = () => { modal.classList.remove('open'); setTimeout(()=>modal.remove(), 300); };
  modal.querySelector('.modal-close').addEventListener('click', close);
  modal.addEventListener('click', e => { if (e.target === modal) close(); });
  modal.querySelector('[data-addcart]')?.addEventListener('click', function(){ gtsAddToCart(this.dataset.addcart); });
  document.addEventListener('keydown', function esc(e){ if (e.key === 'Escape'){ close(); document.removeEventListener('keydown', esc); } });
}

/* ---------- validation helper ---------- */
function gtsValidate(form){
  let ok = true;
  form.querySelectorAll('[required]').forEach(inp => {
    const field = inp.closest('.field');
    let valid = inp.value.trim().length > 0;
    if (valid && inp.type === 'email') valid = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(inp.value.trim());
    if (valid && inp.dataset.min) valid = inp.value.trim().length >= +inp.dataset.min;
    field.classList.toggle('invalid', !valid);
    if (!valid) ok = false;
  });
  return ok;
}

/* ---------- enquiry persistence ---------- */
function gtsSaveEnquiry(data){
  const s = gtsStore();
  s.enquiries.unshift(Object.assign({ id:'e'+Date.now(), at:new Date().toISOString() }, data));
  gtsSave(s);
}
function gtsMailto(subject, body){
  return `mailto:${GTS_BRAND.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

document.addEventListener('DOMContentLoaded', () => { gtsInitChrome(document.body.dataset.page || ''); });
