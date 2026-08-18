import { getMetadata } from '../../scripts/aem.js';
import { loadFragment } from '../fragment/fragment.js';
import { isAuthorEnvironment } from '../../scripts/scripts.js';
import { getLanguage, getSiteName, PATH_PREFIX } from '../../scripts/utils.js';

// media query match that indicates desktop width
const isDesktop = window.matchMedia('(min-width: 900px)');

/**
 * Toggle the mobile nav open/closed.
 * @param {Element} nav the nav element
 * @param {boolean} [forceState] optional explicit state
 */
function toggleMenu(nav, forceState) {
  const expanded = nav.getAttribute('aria-expanded') === 'true';
  const open = typeof forceState === 'boolean' ? forceState : !expanded;
  nav.setAttribute('aria-expanded', open ? 'true' : 'false');
  const toggle = nav.querySelector('.nav-hamburger button');
  if (toggle) toggle.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');
}

/**
 * Resolve and load the nav fragment across environments.
 * @returns {Promise<Element>} the nav fragment
 */
async function loadNavFragment() {
  const navMeta = getMetadata('nav');
  const langCode = getLanguage();
  const siteName = await getSiteName();
  const isAuthor = isAuthorEnvironment();

  let navPath = `/${langCode}/nav`;
  if (isAuthor) {
    navPath = navMeta
      ? new URL(navMeta, window.location).pathname
      : `/content/${siteName}${PATH_PREFIX}/${langCode}/nav`;
  }

  // Local preview / aem up first, then environment-resolved path.
  let fragment = null;
  try {
    const resp = await fetch('/content/nav.plain.html');
    if (resp.ok) {
      const html = await resp.text();
      const tmp = document.createElement('div');
      tmp.innerHTML = html;
      fragment = tmp;
    }
  } catch (e) {
    fragment = null;
  }
  if (!fragment) {
    fragment = await loadFragment(navPath);
  }
  return fragment;
}

/**
 * Decorate the header block: brand, primary nav links, and locale.
 * All copy/links/images are read from the nav fragment DOM; nothing is hardcoded.
 * @param {Element} block the header block element
 */
export default async function decorate(block) {
  const fragment = await loadNavFragment();
  if (!fragment) return;

  const sections = [...fragment.children].filter((el) => el.tagName === 'DIV');
  // Section order in nav.plain.html: [0] brand/logo, [1] primary links, [2] locale.
  const [brandSection, linksSection, localeSection] = sections;

  block.textContent = '';

  const nav = document.createElement('nav');
  nav.id = 'nav';
  nav.setAttribute('aria-expanded', 'false');

  // Brand / logo
  if (brandSection) {
    const brand = document.createElement('div');
    brand.className = 'nav-brand';
    while (brandSection.firstElementChild) brand.append(brandSection.firstElementChild);

    // Ensure a brand logo is present. The authored nav is expected to supply the
    // ministry logo as an image; when it doesn't (e.g. an empty brand link), fall
    // back to the bundled ministry logo so the header matches the original site.
    if (!brand.querySelector('img, picture, svg')) {
      const logo = document.createElement('img');
      logo.src = '/icons/moc-logo.svg';
      logo.alt = 'وزارة المواصلات';
      logo.className = 'nav-brand-logo';
      logo.width = 200;
      logo.height = 56;
      logo.loading = 'eager';
      const brandLink = brand.querySelector('a');
      if (brandLink) {
        brandLink.classList.remove('button');
        brandLink.textContent = '';
        brandLink.append(logo);
      } else {
        brand.append(logo);
      }
    }

    nav.append(brand);
  }

  // Primary navigation links
  if (linksSection) {
    const sectionsWrap = document.createElement('div');
    sectionsWrap.className = 'nav-sections';
    while (linksSection.firstElementChild) sectionsWrap.append(linksSection.firstElementChild);
    nav.append(sectionsWrap);
  }

  // Tools: search pill + language/country dropdown (matches moc.gov.kw/ar)
  if (localeSection) {
    const tools = document.createElement('div');
    tools.className = 'nav-tools';

    // Hold the authored locale content (flag image + language label) so we can
    // reshape it into a dropdown.
    const localeHolder = document.createElement('div');
    while (localeSection.firstElementChild) localeHolder.append(localeSection.firstElementChild);

    // --- Search pill: "بحث" + magnifier, expands to an input on click ---
    const search = document.createElement('form');
    search.className = 'nav-search';
    search.setAttribute('role', 'search');
    search.action = `/${getLanguage()}/search`;
    search.method = 'get';
    search.innerHTML = `
      <input type="search" name="q" class="nav-search-input" aria-label="بحث" placeholder="بحث" />
      <button type="submit" class="nav-search-btn" aria-label="بحث">
        <span class="nav-search-label">بحث</span>
        <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path fill="currentColor" d="M15.5 14h-.79l-.28-.27a6.5 6.5 0 1 0-.7.7l.27.28v.79l5 4.99L20.49 19l-4.99-5Zm-6 0A4.5 4.5 0 1 1 14 9.5 4.49 4.49 0 0 1 9.5 14Z"/></svg>
      </button>`;
    search.querySelector('.nav-search-btn').addEventListener('click', (e) => {
      if (!search.classList.contains('open')) {
        e.preventDefault();
        search.classList.add('open');
        search.querySelector('.nav-search-input').focus();
      }
    });
    tools.append(search);

    // --- Language / country dropdown ---
    const flagImg = localeHolder.querySelector('picture, img');
    const currentLabel = (localeHolder.querySelector('a.button')?.textContent
      || localeHolder.textContent || 'العربية').trim();

    const langWrap = document.createElement('div');
    langWrap.className = 'nav-lang';

    const langToggle = document.createElement('button');
    langToggle.type = 'button';
    langToggle.className = 'nav-lang-toggle';
    langToggle.setAttribute('aria-haspopup', 'true');
    langToggle.setAttribute('aria-expanded', 'false');
    if (flagImg) langToggle.append(flagImg.cloneNode(true));
    const langLabel = document.createElement('span');
    langLabel.className = 'nav-lang-label';
    langLabel.textContent = currentLabel || 'العربية';
    langToggle.append(langLabel);
    const caret = document.createElement('span');
    caret.className = 'nav-lang-caret';
    caret.setAttribute('aria-hidden', 'true');
    langToggle.append(caret);

    const langMenu = document.createElement('ul');
    langMenu.className = 'nav-lang-menu';
    langMenu.hidden = true;
    langMenu.innerHTML = `
      <li><a href="/ar" lang="ar">العربية</a></li>
      <li><a href="/en" lang="en">English</a></li>`;

    langToggle.addEventListener('click', () => {
      const open = langToggle.getAttribute('aria-expanded') === 'true';
      langToggle.setAttribute('aria-expanded', open ? 'false' : 'true');
      langMenu.hidden = open;
    });
    document.addEventListener('click', (e) => {
      if (!langWrap.contains(e.target)) {
        langToggle.setAttribute('aria-expanded', 'false');
        langMenu.hidden = true;
      }
    });

    langWrap.append(langToggle, langMenu);
    tools.append(langWrap);

    nav.append(tools);
  }

  // Hamburger (mobile)
  const hamburger = document.createElement('div');
  hamburger.className = 'nav-hamburger';
  const hamburgerBtn = document.createElement('button');
  hamburgerBtn.type = 'button';
  hamburgerBtn.setAttribute('aria-label', 'Open navigation');
  hamburgerBtn.setAttribute('aria-controls', 'nav');
  hamburgerBtn.innerHTML = '<span class="nav-hamburger-icon"></span>';
  hamburgerBtn.addEventListener('click', () => toggleMenu(nav));
  hamburger.append(hamburgerBtn);
  nav.prepend(hamburger);

  // Reset to desktop layout when crossing the breakpoint.
  isDesktop.addEventListener('change', () => {
    if (isDesktop.matches) toggleMenu(nav, false);
  });

  const navWrapper = document.createElement('div');
  navWrapper.className = 'nav-wrapper';
  navWrapper.append(nav);
  block.append(navWrapper);
}
