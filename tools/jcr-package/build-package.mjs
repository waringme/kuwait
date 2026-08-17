/* eslint-disable no-console */
/**
 * Build an installable AEM FileVault content package from migrated .plain.html docs,
 * including DAM assets under /content/dam/kuwait.
 *
 * Pipeline per document: .plain.html -> rewrite image refs to DAM paths -> (wrap in <main>)
 *   -> html2md -> md2jcr -> .content.xml
 * DAM assets are emitted as dam:Asset nodes with their original-rendition binaries.
 * Then assemble jcr_root + META-INF/vault (filter.xml, properties.xml).
 *
 * Run: node tools/jcr-package/build-package.mjs
 */
import {
  readFileSync, writeFileSync, mkdirSync, rmSync, copyFileSync,
} from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';

const SCRIPTS = '/home/node/.excat-marketplaces/excat-marketplace/excat/skills/excat-content-import/scripts/node_modules';
const HTML2MD = '/usr/local/lib/node_modules/@adobe/aem-cli/node_modules/@adobe/helix-html2md/src/index.js';

const { html2md } = await import(HTML2MD);
const { md2jcr } = await import(join(SCRIPTS, '@adobe/helix-md2jcr/src/index.js'));

const REPO = fileURLToPath(new URL('../../', import.meta.url));
const models = JSON.parse(readFileSync(join(REPO, 'component-models.json'), 'utf-8'));
const definition = JSON.parse(readFileSync(join(REPO, 'component-definition.json'), 'utf-8'));
const filters = JSON.parse(readFileSync(join(REPO, 'component-filters.json'), 'utf-8'));

const SITE_ROOT = '/content/kuwait/language-masters/en';
const DAM_ROOT = '/content/dam/kuwait';
const OUT = join(REPO, 'tools', 'jcr-package', 'build');
const JCR_ROOT = join(OUT, 'jcr_root');

const log = {
  info: () => {}, warn: () => {}, error: (...a) => console.error(...a), debug: () => {},
};

// DAM assets to bundle: damName -> local source file + mime type.
const ASSETS = [
  { name: 'logo.svg', src: 'content/images/logo.svg', mime: 'image/svg+xml' },
  { name: 'kuwait-flag.png', src: 'content/images/kuwait-flag.png', mime: 'image/png' },
  { name: 'instagram.png', src: 'content/images/instagram.png', mime: 'image/png' },
  { name: 'twitter.png', src: 'content/images/twitter.png', mime: 'image/png' },
  { name: 'pexels-pixabay-50987.png', src: 'migration-work/images/bc9ec43781ee01ebb662bcf9b5af874c.png', mime: 'image/png' },
  { name: 'image.png', src: 'migration-work/images/deff8ef3cd37e3b2cb4043e66ec68a3b.png', mime: 'image/png' },
  { name: 'image-123.png', src: 'migration-work/images/c976fb3e728755e59797f7ed9300af25.png', mime: 'image/png' },
  { name: 'service-4.png', src: 'migration-work/images/e5c81ddc84ea8f0a2450fe85a766fe54.png', mime: 'image/png' },
];

// Rewrites applied to inner HTML before conversion: match a unique token inside an
// image reference and replace the whole src/href value with the DAM path.
const TOKEN_REWRITES = [
  { token: 'images/logo.svg', dam: `${DAM_ROOT}/logo.svg` },
  { token: 'images/kuwait-flag.png', dam: `${DAM_ROOT}/kuwait-flag.png` },
  { token: 'images/instagram.png', dam: `${DAM_ROOT}/instagram.png` },
  { token: 'images/twitter.png', dam: `${DAM_ROOT}/twitter.png` },
  { token: 'pexels-pixabay-50987', dam: `${DAM_ROOT}/pexels-pixabay-50987.png` },
  { token: 'image.png%3F2025-04-08T08%3A53%3A52', dam: `${DAM_ROOT}/image.png` },
  { token: 'image%2520123', dam: `${DAM_ROOT}/image-123.png` },
  { token: 'service-4.png%3F2025', dam: `${DAM_ROOT}/service-4.png` },
];

function esc(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Rewrite image references (src="..." / plain images/… tokens) to DAM paths. */
function rewriteImages(html) {
  let out = html;
  for (const { token, dam } of TOKEN_REWRITES) {
    if (token.startsWith('images/')) {
      // fragment relative path used verbatim (e.g. src="images/logo.svg")
      out = out.split(token).join(dam);
    } else {
      // service images: replace the whole src="...token..." attribute value
      const re = new RegExp(`src="[^"]*${esc(token)}[^"]*"`, 'g');
      out = out.replace(re, `src="${dam}"`);
    }
  }
  return out;
}

async function convert(file) {
  const inner = rewriteImages(readFileSync(join(REPO, file), 'utf-8'));
  const html = `<!DOCTYPE html><html><body><main>${inner}</main></body></html>`;
  const md = await html2md(html, { log, url: `https://local/${file}`, mediaHandler: null });
  const xml = await md2jcr(md, { models, definition, filters });
  return xml;
}

// Documents to package: source .plain.html -> JCR node path (relative to SITE_ROOT)
const DOCS = [
  { file: 'content/ar.plain.html', node: 'index' },
  { file: 'content/nav.plain.html', node: 'nav' },
  { file: 'content/footer.plain.html', node: 'footer' },
];

rmSync(OUT, { recursive: true, force: true });

const createdPaths = [];

// --- Pages ---
for (const doc of DOCS) {
  const xml = await convert(doc.file);
  const nodeDir = join(JCR_ROOT, SITE_ROOT.slice(1), doc.node);
  mkdirSync(nodeDir, { recursive: true });
  writeFileSync(join(nodeDir, '.content.xml'), xml, 'utf-8');
  createdPaths.push(`${SITE_ROOT}/${doc.node}`);
  console.log(`✅ ${doc.file} -> ${SITE_ROOT}/${doc.node}/.content.xml (${xml.length} bytes)`);
}

// --- DAM folder node ---
const damDir = join(JCR_ROOT, DAM_ROOT.slice(1));
mkdirSync(damDir, { recursive: true });
writeFileSync(
  join(damDir, '.content.xml'),
  `<?xml version="1.0" encoding="UTF-8"?>
<jcr:root xmlns:jcr="http://www.jcp.org/jcr/1.0" xmlns:nt="http://www.jcp.org/jcr/nt/1.0" xmlns:sling="http://sling.apache.org/jcr/sling/1.0"
    jcr:primaryType="sling:OrderedFolder" jcr:title="kuwait"/>
`,
  'utf-8',
);

// --- DAM assets (dam:Asset node + original-rendition binary) ---
for (const asset of ASSETS) {
  const srcPath = join(REPO, asset.src);
  const assetDir = join(damDir, asset.name);
  const renditionsDir = join(assetDir, '_jcr_content', 'renditions');
  mkdirSync(renditionsDir, { recursive: true });

  // dam:Asset descriptor
  const assetXml = `<?xml version="1.0" encoding="UTF-8"?>
<jcr:root xmlns:jcr="http://www.jcp.org/jcr/1.0" xmlns:nt="http://www.jcp.org/jcr/nt/1.0"
    xmlns:dam="http://www.day.com/dam/1.0" xmlns:dc="http://purl.org/dc/elements/1.1/"
    jcr:primaryType="dam:Asset">
  <jcr:content jcr:primaryType="dam:AssetContent">
    <metadata jcr:primaryType="nt:unstructured" dc:format="${asset.mime}"/>
    <renditions jcr:primaryType="nt:folder">
      <original jcr:primaryType="nt:file">
        <jcr:content jcr:primaryType="nt:resource" jcr:mimeType="${asset.mime}"/>
      </original>
    </renditions>
  </jcr:content>
</jcr:root>
`;
  writeFileSync(join(assetDir, '.content.xml'), assetXml, 'utf-8');
  // original rendition binary
  copyFileSync(srcPath, join(renditionsDir, 'original'));
  console.log(`✅ DAM asset -> ${DAM_ROOT}/${asset.name} (${asset.mime})`);
}
createdPaths.push(DAM_ROOT);

// --- META-INF/vault ---
const vaultDir = join(JCR_ROOT, '..', 'META-INF', 'vault');
mkdirSync(vaultDir, { recursive: true });

const filterXml = `<?xml version="1.0" encoding="UTF-8"?>
<workspaceFilter version="1.0">
${createdPaths.map((p) => `  <filter root="${p}"/>`).join('\n')}
</workspaceFilter>
`;
writeFileSync(join(vaultDir, 'filter.xml'), filterXml, 'utf-8');

const propsXml = `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<!DOCTYPE properties SYSTEM "http://java.sun.com/dtd/properties.dtd">
<properties>
  <comment>FileVault Package Definition</comment>
  <entry key="name">kuwait-content</entry>
  <entry key="group">waringme</entry>
  <entry key="version">1.0.0</entry>
  <entry key="packageType">content</entry>
  <entry key="createdBy">excat-migration</entry>
</properties>
`;
writeFileSync(join(vaultDir, 'properties.xml'), propsXml, 'utf-8');

console.log('✅ META-INF/vault/filter.xml + properties.xml written');
console.log(`BUILD_DIR=${OUT}`);
