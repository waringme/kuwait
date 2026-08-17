/* eslint-disable */
/* global WebImporter */

/**
 * Transformer: Ministry of Communications (moc.gov.kw) — relocate news ticker.
 *
 * PROBLEM: The homepage news ticker ("الأخبار", ~50 items) lives NESTED inside
 * the hero at `#high-impact-hero .swiper .swiper-wrapper` (each item is a
 * `.swiper-slide`). Verified by reading migration-work/cleaned.html:
 *   - line 114: <div id="high-impact-hero" ...>
 *   - line 122: <div class="swiper ... swiper-vertical ...">   (inside the hero)
 *   - line 123:   <div class="swiper-wrapper">                 (the news list)
 *   - lines 124+: <div class="swiper-slide ...">               (news items)
 * There is exactly one `.swiper-wrapper` in the whole document, and it is the
 * news ticker inside the hero.
 *
 * The hero-home parser calls element.replaceWith(block) on `#high-impact-hero`,
 * which destroys this nested swiper before the cards-news parser can extract it.
 *
 * FIX (beforeTransform, before any parser runs): move the news `.swiper-wrapper`
 * out of the hero subtree so it becomes a SIBLING immediately AFTER
 * `#high-impact-hero`, surviving the hero replacement. A stable marker class
 * `news-relocated` is added so downstream mapping/parsing can target it, and so
 * this operation is idempotent.
 */

const TransformHook = {
  beforeTransform: 'beforeTransform',
  afterTransform: 'afterTransform',
};

export default function transform(hookName, element, payload) {
  if (hookName === TransformHook.beforeTransform) {
    const hero = element.querySelector('#high-impact-hero');
    if (!hero) return; // hero not present on this page — nothing to relocate

    // Idempotency: if we already relocated the news wrapper, do nothing.
    if (element.querySelector('.swiper-wrapper.news-relocated')) return;

    const newsWrapper = hero.querySelector('.swiper-wrapper');
    if (!newsWrapper) return; // no nested news ticker — nothing to relocate

    const parent = hero.parentNode;
    if (!parent) return; // hero has no parent — cannot relocate as a sibling

    // Mark, then move to sit immediately after the hero as a sibling, outside
    // the hero subtree so it survives hero.replaceWith(block).
    newsWrapper.classList.add('news-relocated');
    parent.insertBefore(newsWrapper, hero.nextSibling);
  }
}
