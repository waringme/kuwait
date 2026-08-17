/* eslint-disable */
/* global WebImporter */

// PARSER IMPORTS
import heroHomeParser from './parsers/hero-home.js';
import cardsNewsParser from './parsers/cards-news.js';
import cardsServiceParser from './parsers/cards-service.js';
import cardsLinksParser from './parsers/cards-links.js';

// TRANSFORMER IMPORTS
import mocRelocateNewsTransformer from './transformers/moc-relocate-news.js';
import mocCleanupTransformer from './transformers/moc-cleanup.js';

// PARSER REGISTRY
const parsers = {
  'hero-home': heroHomeParser,
  'cards-news': cardsNewsParser,
  'cards-service': cardsServiceParser,
  'cards-links': cardsLinksParser,
};

// TRANSFORMER REGISTRY
// Relocate the nested news swiper OUT of #high-impact-hero (beforeTransform) so it
// survives the hero-home parser's replaceWith; then run cleanup.
const transformers = [
  mocRelocateNewsTransformer,
  mocCleanupTransformer,
];

// PAGE TEMPLATE CONFIGURATION - Embedded from page-templates.json
const PAGE_TEMPLATE = {
  name: 'home',
  description: 'Ministry of Communications homepage: hero, news listing, e-services cards, and important links.',
  urls: [
    'https://moc.gov.kw/ar',
  ],
  blocks: [
    {
      name: 'hero-home',
      instances: ['#high-impact-hero'],
    },
    {
      name: 'cards-news',
      instances: ['.swiper-wrapper.news-relocated'],
    },
    {
      name: 'cards-service',
      instances: ['div.space-y-14 > div:nth-of-type(1)'],
    },
    {
      name: 'cards-links',
      instances: ['div.space-y-14 > div:nth-of-type(2)'],
    },
  ],
  sections: [
    {
      id: 'rc3',
      name: 'main-content',
      selector: 'body > article.relative.h-full.w-full',
      style: null,
      blocks: ['hero-home', 'cards-news', 'cards-service', 'cards-links'],
      defaultContent: [
        'div.space-y-14 > div:nth-of-type(1) h2',
        'div.space-y-14 > div:nth-of-type(2) h2',
      ],
    },
  ],
};

/**
 * Execute all page transformers for a specific hook
 * @param {string} hookName - The hook name ('beforeTransform' or 'afterTransform')
 * @param {Element} element - The DOM element to transform
 * @param {Object} payload - The payload containing { document, url, html, params }
 */
function executeTransformers(hookName, element, payload) {
  const enhancedPayload = {
    ...payload,
    template: PAGE_TEMPLATE,
  };

  transformers.forEach((transformerFn) => {
    try {
      transformerFn.call(null, hookName, element, enhancedPayload);
    } catch (e) {
      console.error(`Transformer failed at ${hookName}:`, e);
    }
  });
}

/**
 * Find all blocks on the page based on the embedded template configuration
 * @param {Document} document - The DOM document
 * @param {Object} template - The embedded PAGE_TEMPLATE object
 * @returns {Array} Array of block instances found on the page
 */
function findBlocksOnPage(document, template) {
  const pageBlocks = [];

  template.blocks.forEach((blockDef) => {
    blockDef.instances.forEach((selector) => {
      const elements = document.querySelectorAll(selector);
      if (elements.length === 0) {
        console.warn(`Block "${blockDef.name}" selector not found: ${selector}`);
      }
      elements.forEach((element) => {
        pageBlocks.push({
          name: blockDef.name,
          selector,
          element,
          section: blockDef.section || null,
        });
      });
    });
  });

  console.log(`Found ${pageBlocks.length} block instances on page`);
  return pageBlocks;
}

// EXPORT DEFAULT CONFIGURATION
export default {
  transform: (payload) => {
    const { document, url, html, params } = payload;

    const main = document.body;

    // 1. Execute beforeTransform transformers (initial cleanup)
    executeTransformers('beforeTransform', main, payload);

    // 2. Find blocks on page using embedded template
    const pageBlocks = findBlocksOnPage(document, PAGE_TEMPLATE);

    // 3. Parse each block using registered parsers
    pageBlocks.forEach((block) => {
      if (!block.element.parentNode) return; // Already replaced by earlier parser
      const parser = parsers[block.name];
      if (parser) {
        try {
          parser(block.element, { document, url, params });
        } catch (e) {
          console.error(`Failed to parse ${block.name} (${block.selector}):`, e);
        }
      } else {
        console.warn(`No parser found for block: ${block.name}`);
      }
    });

    // 4. Execute afterTransform transformers (final cleanup)
    executeTransformers('afterTransform', main, payload);

    // 5. Apply WebImporter built-in rules
    const hr = document.createElement('hr');
    main.appendChild(hr);
    WebImporter.rules.createMetadata(main, document);
    WebImporter.rules.transformBackgroundImages(main, document);
    WebImporter.rules.adjustImageUrls(main, url, params.originalURL);

    // 6. Generate sanitized path (map root/homepage URL to /index)
    const rawPath = new URL(params.originalURL).pathname
      .replace(/\/$/, '')
      .replace(/\.html?$/, '');
    const path = WebImporter.FileUtils.sanitizePath(rawPath === '' ? '/index' : rawPath);

    return [{
      element: main,
      path,
      report: {
        title: document.title,
        template: PAGE_TEMPLATE.name,
        blocks: pageBlocks.map((b) => b.name),
      },
    }];
  },
};
