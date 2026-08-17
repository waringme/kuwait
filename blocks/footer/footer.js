import { getMetadata } from '../../scripts/aem.js';
import { loadFragment } from '../fragment/fragment.js';
import { isAuthorEnvironment } from '../../scripts/scripts.js';
import { getLanguage, getSiteName, PATH_PREFIX } from '../../scripts/utils.js';

/**
 * Loads and decorates the footer.
 * Content (links, social icons, copyright) is read from the footer fragment DOM.
 * @param {Element} block The footer block element
 */
export default async function decorate(block) {
  const footerMeta = getMetadata('footer');
  const langCode = getLanguage();
  const siteName = await getSiteName();
  const isAuthor = isAuthorEnvironment();

  let footerPath = `/${langCode}/footer`;
  if (isAuthor) {
    footerPath = footerMeta
      ? new URL(footerMeta, window.location).pathname
      : `/content/${siteName}${PATH_PREFIX}/${langCode}/footer`;
  }

  // Local preview / aem up first, then environment-resolved path.
  let fragment = null;
  try {
    const resp = await fetch('/content/footer.plain.html');
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
    fragment = await loadFragment(footerPath);
  }
  if (!fragment) return;

  block.textContent = '';
  const footer = document.createElement('div');
  while (fragment.firstElementChild) footer.append(fragment.firstElementChild);
  block.append(footer);
}
