/* eslint-disable */
/* global WebImporter */
/**
 * Parser for hero-home. Base: hero (simple xwalk block, model: hero-home).
 * Source: https://moc.gov.kw/ar  (selector: #high-impact-hero)
 * Project type: xwalk.
 *
 * Model hero-home fields (imageAlt is a collapsed *Alt field -> no row):
 *   image, text, enableunderline, herolayout, backgroundstyle,
 *   ctalabel, ctalink, ctastyle, badge  => one row per field (simple block).
 *
 * The hero is a full-width looping video-background banner. The video lives in
 * a SIBLING container (div.min-h-[60vh] > video > source[src=...moc-home-video.mp4]),
 * not inside #high-impact-hero, and there is no overlaid title/CTA text.
 * hero-home.js auto-detects a video from any <a> whose href ends in a video
 * extension and renders it as a muted looping background, so the asset cell
 * carries an <a href="…mp4">. Layout is 'overlay' (asset-background).
 */
export default function parse(element, { document }) {
  // Simple-block cell: field hint comment BEFORE content; empty cells get no hint.
  const cell = (field, ...nodes) => {
    const content = nodes.filter(Boolean);
    if (!content.length) return ''; // empty cell -> no comment (xwalk hinting rule)
    const frag = document.createDocumentFragment();
    frag.appendChild(document.createComment(` field:${field} `));
    content.forEach((n) => frag.appendChild(n));
    return frag;
  };

  // Locate the background video URL. It sits in a sibling of #high-impact-hero,
  // so widen the search scope until one is found.
  const findVideoUrl = () => {
    const scopes = [element, element.parentElement, element.closest('article'), document];
    for (const scope of scopes) {
      if (!scope) continue;
      const source = scope.querySelector('video source[src], video[src]');
      if (source) return source.getAttribute('src');
    }
    return '';
  };

  const videoUrl = findVideoUrl();

  // Asset cell: a video anchor (hero-home.js converts it to a background <video>).
  let assetNode = null;
  if (videoUrl) {
    assetNode = document.createElement('a');
    assetNode.setAttribute('href', videoUrl);
    assetNode.textContent = videoUrl;
  }

  // No overlaid headline/CTA in the source -> text and CTA fields stay empty.
  const herolayout = document.createElement('p');
  herolayout.textContent = 'overlay'; // asset-background layout

  const cells = [
    [cell('image', assetNode)], // 1: image (background video anchor)
    [cell('text')], // 2: text (empty)
    [cell('enableunderline')], // 3: enableunderline (empty -> JS default)
    [cell('herolayout', herolayout)], // 4: herolayout = overlay
    [cell('backgroundstyle')], // 5: backgroundstyle (empty)
    [cell('ctalabel')], // 6: ctalabel (empty)
    [cell('ctalink')], // 7: ctalink (empty)
    [cell('ctastyle')], // 8: ctastyle (empty)
    [cell('badge')], // 9: badge (empty)
  ];

  const block = WebImporter.Blocks.createBlock(document, { name: 'hero-home', cells });
  element.replaceWith(block);
}
