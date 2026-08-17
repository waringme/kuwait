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
    nav.append(brand);
  }

  // Primary navigation links
  if (linksSection) {
    const sectionsWrap = document.createElement('div');
    sectionsWrap.className = 'nav-sections';
    while (linksSection.firstElementChild) sectionsWrap.append(linksSection.firstElementChild);
    nav.append(sectionsWrap);
  }

  // Tools: locale selector
  if (localeSection) {
    const tools = document.createElement('div');
    tools.className = 'nav-tools';
    while (localeSection.firstElementChild) tools.append(localeSection.firstElementChild);
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
