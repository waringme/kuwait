/* eslint-disable no-console */
/**
 * Build an installable AEM FileVault content package from migrated .plain.html docs.
 *
 * Pipeline per document: .plain.html -> (wrap in <main>) -> html2md -> md2jcr -> .content.xml
 * Then assemble jcr_root + META-INF/vault (filter.xml, properties.xml) and zip.
 *
 * Run: node tools/jcr-package/build-package.mjs
 */
import { readFileSync, writeFileSync, mkdirSync, rmSync } from 'fs';
import { join, dirname } from 'path';
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
const OUT = join(REPO, 'tools', 'jcr-package', 'build');
const JCR_ROOT = join(OUT, 'jcr_root');

const log = {
  info: () => {}, warn: () => {}, error: (...a) => console.error(...a), debug: () => {},
};

// Documents to package: source .plain.html -> JCR node path (relative to SITE_ROOT)
const DOCS = [
  { file: 'content/ar.plain.html', node: 'index' },
  { file: 'content/nav.plain.html', node: 'nav' },
  { file: 'content/footer.plain.html', node: 'footer' },
];

async function convert(file) {
  const inner = readFileSync(join(REPO, file), 'utf-8');
  const html = `<!DOCTYPE html><html><body><main>${inner}</main></body></html>`;
  const md = await html2md(html, { log, url: `https://local/${file}`, mediaHandler: null });
  const xml = await md2jcr(md, { models, definition, filters });
  return xml;
}

rmSync(OUT, { recursive: true, force: true });

const createdPaths = [];
for (const doc of DOCS) {
  const xml = await convert(doc.file);
  const nodeDir = join(JCR_ROOT, SITE_ROOT.slice(1), doc.node);
  mkdirSync(nodeDir, { recursive: true });
  writeFileSync(join(nodeDir, '.content.xml'), xml, 'utf-8');
  createdPaths.push(`${SITE_ROOT}/${doc.node}`);
  console.log(`✅ ${doc.file} -> ${SITE_ROOT}/${doc.node}/.content.xml (${xml.length} bytes)`);
}

// META-INF/vault
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
console.log('BUILD_DIR=' + OUT);
