/* eslint-disable */
/* global WebImporter */
/**
 * Parser for cards-service. Base: cards (container block, filter: cards-service).
 * Source: https://moc.gov.kw/ar  (selector: div.space-y-14 > div:nth-of-type(1))
 * Project type: xwalk. Item model card-service fields: image, text, ctastyle.
 *
 * E-services grid: 4 square image tiles, each an <a> wrapping a <picture> image
 * and an overlaid <h3> title. Each anchor becomes one card:
 *   - image cell : the picture/img (field:image)
 *   - text cell  : linked title — <a href> wrapping the h3 text (field:text)
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

  // Each service tile is an <a> containing a picture and an overlaid heading.
  // The source markup nests the anchors, so collect every card anchor by href.
  const anchors = Array.from(element.querySelectorAll('a[href]')).filter((a) => a.querySelector('picture, img, h3'));

  const cells = [];
  anchors.forEach((a) => {
    const pic = a.querySelector('picture') || a.querySelector('img');
    const heading = a.querySelector('h3, h2, h4');
    const href = a.getAttribute('href');

    // Rebuild the title as a link (title text wrapped in its own anchor) so the
    // card body carries a proper CTA/link, matching the "linked title" pattern.
    let textNode = null;
    if (heading || href) {
      const titleText = (heading ? heading.textContent : a.textContent).trim();
      const link = document.createElement('a');
      link.setAttribute('href', href || '#');
      link.textContent = titleText;
      const h = document.createElement('h3');
      h.appendChild(link);
      textNode = h;
    }

    const imageCell = pic ? cell('image', pic) : '';
    const textCell = textNode ? cell('text', textNode) : '';
    cells.push([imageCell, textCell, '']);
  });

  if (!cells.length) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const block = WebImporter.Blocks.createBlock(document, { name: 'cards-service', cells });
  element.replaceWith(block);
}
