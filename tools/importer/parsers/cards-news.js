/* eslint-disable */
/* global WebImporter */
/**
 * Parser for cards-news. Base: cards (container block, filter: cards-news).
 * Source: https://moc.gov.kw/ar  (selector: #high-impact-hero .swiper-wrapper)
 * Project type: xwalk. Item model card-news fields: image, text, ctastyle.
 *
 * News ticker with ~50 items. Each swiper-slide is one card:
 *   - image cell : empty (no-images news list)
 *   - text cell  : bold title link (h3 > a) + Arabic date paragraph
 *   - ctastyle   : empty (model default 'button' applies)
 * Every row keeps the same 3-cell shape required by the card-news model.
 */
export default function parse(element, { document }) {
  // Build a cell with an xwalk field hint comment placed BEFORE its content.
  const cell = (field, ...nodes) => {
    const frag = document.createDocumentFragment();
    if (field) frag.appendChild(document.createComment(` field:${field} `));
    nodes.filter(Boolean).forEach((n) => frag.appendChild(n));
    return frag;
  };

  // Each slide = one news card. Validated against source.html.
  const slides = Array.from(element.querySelectorAll(':scope > .swiper-slide'));

  const cells = [];
  slides.forEach((slide) => {
    const title = slide.querySelector('h3'); // title heading containing the link
    const date = slide.querySelector('p'); // formatted Arabic date
    if (!title && !date) return; // skip empty slide

    const textNodes = [];
    if (title) textNodes.push(title);
    if (date) textNodes.push(date);

    // image (empty), text (title + date), ctastyle (empty)
    cells.push(['', cell('text', ...textNodes), '']);
  });

  if (!cells.length) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const block = WebImporter.Blocks.createBlock(document, { name: 'cards-news', cells });
  element.replaceWith(block);
}
