// ================================================================
// Tidsbrev.no — Felles navigasjon og footer
// ================================================================
// Inkluder dette scriptet i alle HTML-sider for å få konsekvent
// nav og footer. Ingen HTML-markup trengs i selve siden —
// scriptet injiserer alt automatisk.
//
// Bruk:
//   <script src="js/nav.js"></script>
//   (legg gjerne til data-page="faq" på <body> for å markere
//    aktiv nav-lenke, f.eks. <body data-page="faq">)
// ================================================================

(function () {
  'use strict';

  // Finn hvilken side vi er på (valgfritt, for aktiv-markering)
  const currentPage = document.body.dataset.page || '';

  // ---- Navigasjonslenker ----
  const NAV_LINKS = [
    { href: '/',            label: 'Hjem',   key: 'hjem',    i18n: 'nav_home'  },
    { href: '/bestill.html', label: 'Bestill', key: 'bestill', i18n: 'nav_order' },
    { href: '/faq.html',    label: 'FAQ',    key: 'faq',     i18n: 'nav_faq'   },
  ];

  function navLinkHtml(links) {
    return links.map(l => {
      const active = currentPage === l.key ? ' style="color:var(--burgundy);font-weight:600"' : '';
      return `<a href="${l.href}" class="nav-link" data-i18n="${l.i18n}"${active}>${l.label}</a>`;
    }).join('');
  }

  // ---- Logo SVG (liten forseglet konvolutt) ----
  const LOGO_ICON = `<svg width="32" height="32" viewBox="0 0 38 38" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" style="display:block">
    <circle cx="19" cy="19" r="17" stroke="currentColor" stroke-width="1.4"/>
    <circle cx="19" cy="19" r="13.5" stroke="currentColor" stroke-width="0.7" stroke-dasharray="2 2.5" opacity="0.45"/>
    <rect x="10.5" y="14" width="17" height="11.5" rx="1.6" stroke="currentColor" stroke-width="1.35" fill="none"/>
    <polyline points="10.5,14 19,21.5 27.5,14" stroke="currentColor" stroke-width="1.35" stroke-linejoin="round" fill="none"/>
    <line x1="19" y1="22" x2="19" y2="25.5" stroke="currentColor" stroke-width="1" stroke-linecap="round" opacity="0.4"/>
  </svg>`;

  // ---- Hamburgermeny (mobil) ----
  const HAMBURGER = `<button class="nav-hamburger" id="navHamburger" aria-label="Åpne meny" aria-expanded="false">
    <span></span><span></span><span></span>
  </button>`;

  // ---- CSS for nav og footer ----
  const CSS = `
    .site-nav{
      padding:18px 24px;
      background:rgba(245,240,232,.95);
      backdrop-filter:blur(10px);
      border-bottom:1px solid rgba(107,93,76,.12);
      position:sticky;top:0;z-index:100;
    }
    .site-nav .nav-inner{
      max-width:960px;margin:0 auto;
      display:flex;align-items:center;justify-content:space-between;gap:20px;
    }
    .nav-logo-group{display:flex;align-items:center;gap:9px;text-decoration:none}
    .nav-logo-icon{color:var(--burgundy,#6B2737);flex-shrink:0;transition:transform .3s ease}
    .nav-logo-group:hover .nav-logo-icon{transform:rotate(8deg)}
    .nav-logo-text{
      font-family:'Playfair Display',Georgia,serif;
      font-size:1.3rem;font-weight:700;
      color:var(--burgundy,#6B2737);letter-spacing:.3px;
      text-decoration:none;
    }
    .nav-links{display:flex;align-items:center;gap:28px}
    .nav-link{
      font-family:'Inter',system-ui,sans-serif;
      font-size:.9rem;color:var(--muted,#6B5D4C);
      text-decoration:none;font-weight:400;
      transition:color .15s;
    }
    .nav-link:hover{color:var(--burgundy,#6B2737)}
    .nav-cta{
      background:var(--burgundy,#6B2737);color:#F5F0E8 !important;
      padding:9px 22px;border-radius:50px;font-weight:500 !important;
      transition:background .2s,transform .2s;display:inline-block;
    }
    .nav-cta:hover{background:var(--burgundy-dark,#4E141C);transform:translateY(-1px)}

    /* Hamburgermeny */
    .nav-hamburger{
      display:none;flex-direction:column;justify-content:center;gap:5px;
      background:none;border:none;cursor:pointer;padding:4px;
    }
    .nav-hamburger span{
      display:block;width:22px;height:2px;
      background:var(--ink,#2A231C);border-radius:2px;
      transition:transform .25s, opacity .25s;
    }
    .nav-mobile-open .nav-hamburger span:nth-child(1){transform:translateY(7px) rotate(45deg)}
    .nav-mobile-open .nav-hamburger span:nth-child(2){opacity:0}
    .nav-mobile-open .nav-hamburger span:nth-child(3){transform:translateY(-7px) rotate(-45deg)}

    @media(max-width:640px){
      .nav-hamburger{display:flex}
      .nav-links{
        display:none;flex-direction:column;gap:0;
        position:absolute;top:100%;left:0;right:0;
        background:rgba(245,240,232,.98);
        border-bottom:1px solid rgba(107,93,76,.12);
        padding:8px 0 16px;
      }
      .nav-mobile-open .nav-links{display:flex}
      .nav-link{padding:13px 28px;font-size:1rem}
      .nav-cta{margin:8px 24px 0;text-align:center}
      .site-nav{position:relative}
    }

    /* Footer */
    .site-footer{
      background:var(--burgundy-dark,#4E141C);
      color:rgba(246,239,227,.8);
      padding:48px 24px 32px;
    }
    .site-footer .footer-inner{
      max-width:960px;margin:0 auto;
      display:grid;grid-template-columns:1fr 1fr 1fr;gap:40px;
    }
    @media(max-width:640px){
      .site-footer .footer-inner{grid-template-columns:1fr;gap:28px}
    }
    .footer-brand{}
    .footer-logo{
      font-family:'Playfair Display',serif;font-size:1.3rem;font-weight:700;
      color:rgba(246,239,227,.95);margin-bottom:8px;
    }
    .footer-tagline{font-size:.85rem;color:rgba(246,239,227,.6);line-height:1.5;font-style:italic}
    .footer-col h4{
      font-family:'Inter',sans-serif;font-size:.75rem;font-weight:700;
      letter-spacing:1.2px;text-transform:uppercase;
      color:rgba(246,239,227,.45);margin-bottom:14px;
    }
    .footer-col a{
      display:block;font-size:.9rem;color:rgba(246,239,227,.75);
      text-decoration:none;margin-bottom:10px;transition:color .15s;
    }
    .footer-col a:hover{color:var(--gold,#B08A3E)}
    .footer-bottom{
      max-width:960px;margin:32px auto 0;
      padding-top:22px;border-top:1px solid rgba(246,239,227,.1);
      display:flex;justify-content:space-between;align-items:center;
      font-size:.8rem;color:rgba(246,239,227,.4);flex-wrap:wrap;gap:8px;
    }
    .footer-operator{
      max-width:960px;margin:14px auto 0;
      font-size:.72rem;color:rgba(246,239,227,.32);
      text-align:center;line-height:1.5;
    }
    .footer-operator a{color:inherit;text-decoration:underline}
  `;

  // ---- NAV HTML ----
  function buildNav() {
    return `
<nav class="site-nav" role="navigation" aria-label="Hovedmeny">
  <div class="nav-inner">
    <a href="/" class="nav-logo-group" aria-label="Tidsbrev – til forsiden">
      <span class="nav-logo-icon">${LOGO_ICON}</span>
      <span class="nav-logo-text">Tidsbrev</span>
    </a>
    <div class="nav-links" id="navLinks">
      ${navLinkHtml(NAV_LINKS)}
      <a href="/bestill.html" class="nav-link nav-cta" data-i18n="nav_order_cta">Bestill brev</a>
    </div>
    ${typeof buildLangSwitcher === 'function' ? buildLangSwitcher() : ''}
    ${HAMBURGER}
  </div>
</nav>`;
  }

  // ---- FOOTER HTML ----
  function buildFooter() {
    const year = new Date().getFullYear();
    return `
<footer class="site-footer" role="contentinfo">
  <div class="footer-inner">
    <div class="footer-brand">
      <div class="footer-logo">Tidsbrev</div>
      <p class="footer-tagline" data-i18n-html="footer_tagline_html">Brev til fremtiden,<br>skrevet i dag.</p>
    </div>
    <div class="footer-col">
      <h4 data-i18n="footer_pages">Sider</h4>
      <a href="/" data-i18n="footer_home">Hjem</a>
      <a href="/bestill.html" data-i18n="footer_order">Bestill brev</a>
      <a href="/faq.html" data-i18n="footer_faq">Ofte stilte spørsmål</a>
    </div>
    <div class="footer-col">
      <h4 data-i18n="footer_info">Info</h4>
      <a href="/personvern.html" data-i18n="footer_privacy">Personvernerklæring</a>
      <a href="/vilkaar.html" data-i18n="footer_terms">Vilkår og betingelser</a>
      <a href="mailto:tidsbrev@outlook.com">tidsbrev@outlook.com</a>
    </div>
  </div>
  <div class="footer-bottom">
    <span>&copy; ${year} Tidsbrev.no — <span data-i18n="footer_copy">Norsk drift</span></span>
    <span data-i18n="footer_eu">Lagret sikkert i EU &nbsp;·&nbsp; GDPR-trygt</span>
  </div>
  <div class="footer-operator">Tidsbrev.no · <a href="mailto:tidsbrev@outlook.com">tidsbrev@outlook.com</a></div>
</footer>`;
  }

  // ---- Injiser CSS ----
  function injectCSS() {
    const style = document.createElement('style');
    style.id = 'tidsbrev-nav-css';
    style.textContent = CSS;
    document.head.appendChild(style);
  }

  // ---- Injiser HTML ----
  function injectHTML() {
    const navEl = document.createElement('div');
    navEl.innerHTML = buildNav();
    document.body.insertBefore(navEl.firstElementChild, document.body.firstChild);

    const footerEl = document.createElement('div');
    footerEl.innerHTML = buildFooter();
    document.body.appendChild(footerEl.firstElementChild);
  }

  // ---- Hamburgermeny-logikk ----
  function initHamburger() {
    const btn = document.getElementById('navHamburger');
    const nav = document.querySelector('.site-nav');
    if (!btn || !nav) return;
    btn.addEventListener('click', () => {
      const open = nav.classList.toggle('nav-mobile-open');
      btn.setAttribute('aria-expanded', open);
    });
    // Lukk ved klikk utenfor
    document.addEventListener('click', (e) => {
      if (!nav.contains(e.target)) nav.classList.remove('nav-mobile-open');
    });
  }

  // ---- Init ----
  function init() {
    injectCSS();
    injectHTML();
    initHamburger();
    if (typeof initI18n === 'function') initI18n();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
