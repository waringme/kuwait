/* eslint-disable */
/* global WebImporter */
/**
 * Parser for cards-links. Base: cards (container block, filter: cards-links).
 * Source: https://moc.gov.kw/ar  (selector: div.space-y-14 > div:nth-of-type(2))
 * Project type: xwalk. Item model card-links fields: image, text, ctastyle.
 *
 * Important-links tile row: 6 text link tiles (no images). Each <a> becomes a card:
 *   - image cell : empty (no-images link tiles)
 *   - text cell  : the link, preserved as an <a href> with its label (field:text)
 *   - ctastyle   : empty (model default 'button' applies)
 * The section <h2> heading is default content and is intentionally excluded.
 */
export default function parse(element, { document }) {
  const cell = (field, ...nodes) => {
    const frag = document.createDocumentFragment();
    if (field) frag.appendChild(document.createComment(` field:${field} `));
    nodes.filter(Boolean).forEach((n) => frag.appendChild(n));
    return frag;
  };

  // Link tiles live inside the tile-row container; grab each anchor directly.
  const anchors = Array.from(element.querySelectorAll('a[href]'));

  const cells = [];
  anchors.forEach((a) => {
    const href = a.getAttribute('href');
    const label = a.textContent.trim();
    if (!label && !href) return;

    // Preserve the tile as a clean anchor (strip the source utility classes).
    const link = document.createElement('a');
    link.setAttribute('href', href || '#');
    link.textContent = label;

    // image (empty), text (linked label), ctastyle (empty)
    cells.push(['', cell('text', link), '']);
  });

  if (!cells.length) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const block = WebImporter.Blocks.createBlock(document, { name: 'cards-links', cells });
  element.replaceWith(block);
}
