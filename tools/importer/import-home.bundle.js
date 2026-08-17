/* eslint-disable */
var CustomImportScript = (() => {
  var __defProp = Object.defineProperty;
  var __defProps = Object.defineProperties;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropDescs = Object.getOwnPropertyDescriptors;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __getOwnPropSymbols = Object.getOwnPropertySymbols;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __propIsEnum = Object.prototype.propertyIsEnumerable;
  var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
  var __spreadValues = (a, b) => {
    for (var prop in b || (b = {}))
      if (__hasOwnProp.call(b, prop))
        __defNormalProp(a, prop, b[prop]);
    if (__getOwnPropSymbols)
      for (var prop of __getOwnPropSymbols(b)) {
        if (__propIsEnum.call(b, prop))
          __defNormalProp(a, prop, b[prop]);
      }
    return a;
  };
  var __spreadProps = (a, b) => __defProps(a, __getOwnPropDescs(b));
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

  // tools/importer/import-home.js
  var import_home_exports = {};
  __export(import_home_exports, {
    default: () => import_home_default
  });

  // tools/importer/parsers/hero-home.js
  function parse(element, { document }) {
    const cell = (field, ...nodes) => {
      const content = nodes.filter(Boolean);
      if (!content.length) return "";
      const frag = document.createDocumentFragment();
      frag.appendChild(document.createComment(` field:${field} `));
      content.forEach((n) => frag.appendChild(n));
      return frag;
    };
    const findVideoUrl = () => {
      const scopes = [element, element.parentElement, element.closest("article"), document];
      for (const scope of scopes) {
        if (!scope) continue;
        const source = scope.querySelector("video source[src], video[src]");
        if (source) return source.getAttribute("src");
      }
      return "";
    };
    const videoUrl = findVideoUrl();
    let assetNode = null;
    if (videoUrl) {
      assetNode = document.createElement("a");
      assetNode.setAttribute("href", videoUrl);
      assetNode.textContent = videoUrl;
    }
    const herolayout = document.createElement("p");
    herolayout.textContent = "overlay";
    const cells = [
      [cell("image", assetNode)],
      // 1: image (background video anchor)
      [cell("text")],
      // 2: text (empty)
      [cell("enableunderline")],
      // 3: enableunderline (empty -> JS default)
      [cell("herolayout", herolayout)],
      // 4: herolayout = overlay
      [cell("backgroundstyle")],
      // 5: backgroundstyle (empty)
      [cell("ctalabel")],
      // 6: ctalabel (empty)
      [cell("ctalink")],
      // 7: ctalink (empty)
      [cell("ctastyle")],
      // 8: ctastyle (empty)
      [cell("badge")]
      // 9: badge (empty)
    ];
    const block = WebImporter.Blocks.createBlock(document, { name: "hero-home", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/cards-news.js
  function parse2(element, { document }) {
    const cell = (field, ...nodes) => {
      const frag = document.createDocumentFragment();
      if (field) frag.appendChild(document.createComment(` field:${field} `));
      nodes.filter(Boolean).forEach((n) => frag.appendChild(n));
      return frag;
    };
    const slides = Array.from(element.querySelectorAll(":scope > .swiper-slide"));
    const cells = [];
    slides.forEach((slide) => {
      const title = slide.querySelector("h3");
      const date = slide.querySelector("p");
      if (!title && !date) return;
      const textNodes = [];
      if (title) textNodes.push(title);
      if (date) textNodes.push(date);
      cells.push(["", cell("text", ...textNodes), ""]);
    });
    if (!cells.length) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const block = WebImporter.Blocks.createBlock(document, { name: "cards-news", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/cards-service.js
  function parse3(element, { document }) {
    const cell = (field, ...nodes) => {
      const frag = document.createDocumentFragment();
      if (field) frag.appendChild(document.createComment(` field:${field} `));
      nodes.filter(Boolean).forEach((n) => frag.appendChild(n));
      return frag;
    };
    const anchors = Array.from(element.querySelectorAll("a[href]")).filter((a) => a.querySelector("picture, img, h3"));
    const cells = [];
    anchors.forEach((a) => {
      const pic = a.querySelector("picture") || a.querySelector("img");
      const heading = a.querySelector("h3, h2, h4");
      const href = a.getAttribute("href");
      let textNode = null;
      if (heading || href) {
        const titleText = (heading ? heading.textContent : a.textContent).trim();
        const link = document.createElement("a");
        link.setAttribute("href", href || "#");
        link.textContent = titleText;
        const h = document.createElement("h3");
        h.appendChild(link);
        textNode = h;
      }
      const imageCell = pic ? cell("image", pic) : "";
      const textCell = textNode ? cell("text", textNode) : "";
      cells.push([imageCell, textCell, ""]);
    });
    if (!cells.length) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const block = WebImporter.Blocks.createBlock(document, { name: "cards-service", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/cards-links.js
  function parse4(element, { document }) {
    const cell = (field, ...nodes) => {
      const frag = document.createDocumentFragment();
      if (field) frag.appendChild(document.createComment(` field:${field} `));
      nodes.filter(Boolean).forEach((n) => frag.appendChild(n));
      return frag;
    };
    const anchors = Array.from(element.querySelectorAll("a[href]"));
    const cells = [];
    anchors.forEach((a) => {
      const href = a.getAttribute("href");
      const label = a.textContent.trim();
      if (!label && !href) return;
      const link = document.createElement("a");
      link.setAttribute("href", href || "#");
      link.textContent = label;
      cells.push(["", cell("text", link), ""]);
    });
    if (!cells.length) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const block = WebImporter.Blocks.createBlock(document, { name: "cards-links", cells });
    element.replaceWith(block);
  }

  // tools/importer/transformers/moc-relocate-news.js
  var TransformHook = {
    beforeTransform: "beforeTransform",
    afterTransform: "afterTransform"
  };
  function transform(hookName, element, payload) {
    if (hookName === TransformHook.beforeTransform) {
      const hero = element.querySelector("#high-impact-hero");
      if (!hero) return;
      if (element.querySelector(".swiper-wrapper.news-relocated")) return;
      const newsWrapper = hero.querySelector(".swiper-wrapper");
      if (!newsWrapper) return;
      const parent = hero.parentNode;
      if (!parent) return;
      newsWrapper.classList.add("news-relocated");
      parent.insertBefore(newsWrapper, hero.nextSibling);
    }
  }

  // tools/importer/transformers/moc-cleanup.js
  var TransformHook2 = {
    beforeTransform: "beforeTransform",
    afterTransform: "afterTransform"
  };
  function transform2(hookName, element, payload) {
    if (hookName === TransformHook2.beforeTransform) {
      WebImporter.DOMUtils.remove(element, [
        'div[class*="bottom-6"]',
        // floating chatbot widget (verified cleaned.html line 607)
        'div[class*="top-4"]',
        // empty fixed overlay slot (line 620)
        'ol[class*="max-h-screen"]',
        // Next.js toast portal (line 623)
        "next-route-announcer"
        // Next.js route announcer (line 626)
      ]);
    }
    if (hookName === TransformHook2.afterTransform) {
      WebImporter.DOMUtils.remove(element, [
        'img[alt="background image"]',
        // global fixed background image (line 4)
        'div[class*="sticky"]',
        // header wrapper incl. header-bg img + <header> nav (lines 5-111)
        "footer"
        // site footer + copyright bar (line 585)
      ]);
    }
  }

  // tools/importer/import-home.js
  var parsers = {
    "hero-home": parse,
    "cards-news": parse2,
    "cards-service": parse3,
    "cards-links": parse4
  };
  var transformers = [
    transform,
    transform2
  ];
  var PAGE_TEMPLATE = {
    name: "home",
    description: "Ministry of Communications homepage: hero, news listing, e-services cards, and important links.",
    urls: [
      "https://moc.gov.kw/ar"
    ],
    blocks: [
      {
        name: "hero-home",
        instances: ["#high-impact-hero"]
      },
      {
        name: "cards-news",
        instances: [".swiper-wrapper.news-relocated"]
      },
      {
        name: "cards-service",
        instances: ["div.space-y-14 > div:nth-of-type(1)"]
      },
      {
        name: "cards-links",
        instances: ["div.space-y-14 > div:nth-of-type(2)"]
      }
    ],
    sections: [
      {
        id: "rc3",
        name: "main-content",
        selector: "body > article.relative.h-full.w-full",
        style: null,
        blocks: ["hero-home", "cards-news", "cards-service", "cards-links"],
        defaultContent: [
          "div.space-y-14 > div:nth-of-type(1) h2",
          "div.space-y-14 > div:nth-of-type(2) h2"
        ]
      }
    ]
  };
  function executeTransformers(hookName, element, payload) {
    const enhancedPayload = __spreadProps(__spreadValues({}, payload), {
      template: PAGE_TEMPLATE
    });
    transformers.forEach((transformerFn) => {
      try {
        transformerFn.call(null, hookName, element, enhancedPayload);
      } catch (e) {
        console.error(`Transformer failed at ${hookName}:`, e);
      }
    });
  }
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
            section: blockDef.section || null
          });
        });
      });
    });
    console.log(`Found ${pageBlocks.length} block instances on page`);
    return pageBlocks;
  }
  var import_home_default = {
    transform: (payload) => {
      const { document, url, html, params } = payload;
      const main = document.body;
      executeTransformers("beforeTransform", main, payload);
      const pageBlocks = findBlocksOnPage(document, PAGE_TEMPLATE);
      pageBlocks.forEach((block) => {
        if (!block.element.parentNode) return;
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
      executeTransformers("afterTransform", main, payload);
      const hr = document.createElement("hr");
      main.appendChild(hr);
      WebImporter.rules.createMetadata(main, document);
      WebImporter.rules.transformBackgroundImages(main, document);
      WebImporter.rules.adjustImageUrls(main, url, params.originalURL);
      const rawPath = new URL(params.originalURL).pathname.replace(/\/$/, "").replace(/\.html?$/, "");
      const path = WebImporter.FileUtils.sanitizePath(rawPath === "" ? "/index" : rawPath);
      return [{
        element: main,
        path,
        report: {
          title: document.title,
          template: PAGE_TEMPLATE.name,
          blocks: pageBlocks.map((b) => b.name)
        }
      }];
    }
  };
  return __toCommonJS(import_home_exports);
})();
