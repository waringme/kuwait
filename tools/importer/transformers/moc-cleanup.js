/* eslint-disable */
/* global WebImporter */

/**
 * Transformer: Ministry of Communications (moc.gov.kw) site-wide cleanup.
 *
 * Removes non-authorable site chrome so the import contains only page-level
 * authorable content (hero, news swiper, e-services cards, important links).
 *
 * All selectors below were verified by reading migration-work/cleaned.html:
 *  - body > img[alt="background image"]        (line 4)  global fixed background image
 *  - div[class*="sticky"]                       (line 5)  header wrapper: header-bg img + <header> nav (lines 5-111)
 *  - footer                                     (line 585) site footer + copyright bar
 *  - div[class*="bottom-6"]                      (line 607) floating "اسألني" chatbot widget
 *  - div[class*="top-4"]                         (line 620) empty fixed overlay slot
 *  - ol[class*="max-h-screen"]                   (line 623) Next.js toast portal (empty)
 *  - next-route-announcer                        (line 626) Next.js route announcer artifact
 */

const TransformHook = {
  beforeTransform: 'beforeTransform',
  afterTransform: 'afterTransform',
};

export default function transform(hookName, element, payload) {
  if (hookName === TransformHook.beforeTransform) {
    // Overlays / widgets / framework artifacts that are not authorable content.
    // Removed early so they never interfere with block matching.
    WebImporter.DOMUtils.remove(element, [
      'div[class*="bottom-6"]', // floating chatbot widget (verified cleaned.html line 607)
      'div[class*="top-4"]', // empty fixed overlay slot (line 620)
      'ol[class*="max-h-screen"]', // Next.js toast portal (line 623)
      'next-route-announcer', // Next.js route announcer (line 626)
    ]);
  }

  if (hookName === TransformHook.afterTransform) {
    // Non-authorable site chrome: global background image, header/nav, footer.
    WebImporter.DOMUtils.remove(element, [
      'img[alt="background image"]', // global fixed background image (line 4)
      'div[class*="sticky"]', // header wrapper incl. header-bg img + <header> nav (lines 5-111)
      'footer', // site footer + copyright bar (line 585)
    ]);
  }
}
