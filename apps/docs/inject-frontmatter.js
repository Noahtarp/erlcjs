import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const apiDir = path.resolve(__dirname, 'src/content/docs/api');
const sidebarOutputFile = path.resolve(__dirname, 'src/api-sidebar.json');

if (!fs.existsSync(apiDir)) {
  console.log('❌ API directory not found, skipping optimization.');
  process.exit(0);
}

const capitalize = (str) => str.charAt(0).toUpperCase() + str.slice(1);

function findApiFiles(dir, baseDir = dir) {
  const files = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...findApiFiles(fullPath, baseDir));
    } else if (entry.isFile() && entry.name.endsWith('.md') && entry.name !== 'index.md') {
      files.push(path.relative(baseDir, fullPath).replace(/\\/g, '/'));
    }
  }
  return files;
}

const rawApiFiles = findApiFiles(apiDir);
const fileToUrlMap = new Map();

for (const relativeFile of rawApiFiles) {
  const fullPath = path.join(apiDir, relativeFile.replace(/\//g, path.sep));
  const content = fs.readFileSync(fullPath, 'utf8');

  const baseName = relativeFile.replace(/\.md$/, '').replace(/\//g, '.');
  const parts = baseName.split('.');

  const titleMatch = content.match(/^#+\s+(.+)$/m);
  let title = titleMatch ? titleMatch[1].replace(/`/g, '').trim() : parts[parts.length - 1];

  let cleanTitle = title.replace(/\s+(class|interface)$/i, '');

  const pathParts = parts.map(part => {
    if (part === '_constructor_') return 'constructor';
    return part.toLowerCase();
  });

  const relativeAstroUrl = `/api/${pathParts.join('/')}/`;

  fileToUrlMap.set(baseName, {
    oldFullPath: fullPath,
    parts,
    title,
    cleanTitle,
    pathParts,
    relativeAstroUrl
  });
}

const packagesMap = new Map();
const filesToWrite = [];

function createPackageEntry(rawPackageName) {
  return {
    label: rawPackageName.toUpperCase(),
    sections: {
      package: [],
      classes: [],
      functions: [],
      enums: [],
      errors: [],
      interfaces: [],
      types: [],
      misc: []
    }
  };
}

function getGroupFromMeta(meta) {
  const title = meta.title.toLowerCase();
  const filename = meta.parts[1]?.toLowerCase() ?? '';

  if (/\benum\b/.test(title)) return 'enums';
  if (/\bfunction\b/.test(title)) return 'functions';
  if (/\binterface\b/.test(title)) return 'interfaces';
  if (/\btype\b/.test(title)) return 'types';
  if (/error\b/.test(filename) || /\berror\b/.test(title)) return 'errors';
  if (/class\b/.test(title)) return 'classes';

  return 'misc';
}

function buildPackageSidebar(packageEntry, rawPackageName) {
  const items = [
    ...packageEntry.sections.package
  ];

  const groups = [
    { label: 'Classes', key: 'classes' },
    { label: 'Functions', key: 'functions' },
    { label: 'Enums', key: 'enums' },
    { label: 'Errors', key: 'errors' },
    { label: 'Interfaces', key: 'interfaces' },
    { label: 'Types', key: 'types' },
    { label: 'Misc', key: 'misc' }
  ];

  for (const group of groups) {
    const groupItems = packageEntry.sections[group.key];
    if (groupItems.length > 0) {
      items.push({
        label: group.label,
        items: groupItems
      });
    }
  }

  return items;
}

for (const [baseName, meta] of fileToUrlMap.entries()) {
  let content = fs.readFileSync(meta.oldFullPath, 'utf8');

  if (content.startsWith('---')) {
    const closingIndex = content.indexOf('---', 3);
    if (closingIndex !== -1) content = content.slice(closingIndex + 3).trim();
  }

  content = content.replace(/\]\((?:\.\/)?([^)]+)\.md\)/g, (match, capturedFilename) => {
    const cleanKey = decodeURIComponent(capturedFilename);
    
    if (cleanKey === 'index') {
      return '](/api/)';
    }
    
    if (fileToUrlMap.has(cleanKey)) {
      return `](${fileToUrlMap.get(cleanKey).relativeAstroUrl})`;
    }
    return match;
  });

  const isPackageRoot = meta.parts.length === 1;
  const isClassOrInterface = meta.parts.length === 2;
  const isMemberMethod = meta.parts.length > 2;

  let frontmatter = '---\n';
  frontmatter += `title: "${meta.title.replace(/"/g, '\\"')}"\n`;
  frontmatter += 'sidebar:\n';
  if (isMemberMethod) {
    frontmatter += '  hidden: true\n';
  } else if (isPackageRoot) {
    frontmatter += `  label: "${capitalize(meta.parts[0])} Package"\n`;
  } else {
    frontmatter += `  label: "${meta.cleanTitle.replace(/"/g, '\\"')}"\n`;
  }
  frontmatter += '---\n\n';

  const targetFolder = path.join(apiDir, ...meta.pathParts.slice(0, -1));
  const targetFileName = `${meta.pathParts[meta.pathParts.length - 1]}.md`;
  const newFullPath = path.join(targetFolder, targetFileName);

  filesToWrite.push({ 
    targetFolder, 
    newFullPath, 
    oldFullPath: meta.oldFullPath, 
    finalContent: frontmatter + content 
  });

  if (!isMemberMethod) {
    const rawPackageName = meta.parts[0];
    const packageKey = rawPackageName.toLowerCase();

    if (!packagesMap.has(packageKey)) {
      packagesMap.set(packageKey, createPackageEntry(rawPackageName));
    }

    const packageEntry = packagesMap.get(packageKey);
    const astroSlug = `api/${meta.pathParts.join('/')}`;
    const item = {
      label: meta.cleanTitle,
      slug: astroSlug
    };

    if (isPackageRoot) {
      packageEntry.sections.package.unshift({
        label: `${capitalize(rawPackageName)} Package`,
        slug: astroSlug
      });
    } else if (isClassOrInterface) {
      const group = getGroupFromMeta(meta);
      packageEntry.sections[group].push(item);
    } else {
      const group = getGroupFromMeta(meta);
      packageEntry.sections[group].push(item);
    }
  }
}

for (const file of filesToWrite) {
  fs.mkdirSync(file.targetFolder, { recursive: true });
  fs.writeFileSync(file.newFullPath, file.finalContent, 'utf8');
  
  if (file.oldFullPath !== file.newFullPath && fs.existsSync(file.oldFullPath)) {
    fs.unlinkSync(file.oldFullPath);
  }
}

const indexFile = path.join(apiDir, 'index.md');
if (fs.existsSync(indexFile)) {
  let indexContent = fs.readFileSync(indexFile, 'utf8');
  
  indexContent = indexContent.replace(/\]\((?:\.\/)?([^)]+)\.md\)/g, (match, capturedFilename) => {
    const cleanKey = decodeURIComponent(capturedFilename);
    
    if (cleanKey === 'index') {
      return '](/api/)';
    }
    
    if (fileToUrlMap.has(cleanKey)) {
      return `](${fileToUrlMap.get(cleanKey).relativeAstroUrl})`;
    }
    return match;
  });

  if (!indexContent.startsWith('---')) {
    fs.writeFileSync(indexFile, `---\ntitle: "API Reference Overview"\n---\n\n${indexContent}`, 'utf8');
  } else {
    fs.writeFileSync(indexFile, indexContent, 'utf8');
  }
}

const structuredSidebar = [];
for (const [packageKey, packageEntry] of packagesMap.entries()) {
  structuredSidebar.push({
    label: packageEntry.label,
    items: buildPackageSidebar(packageEntry, packageKey)
  });
}
fs.writeFileSync(sidebarOutputFile, JSON.stringify(structuredSidebar, null, 2), 'utf8');
const packageLabels = structuredSidebar.map(pkg => pkg.label).join(', ');
console.log(`✅ Wrote ${fileToUrlMap.size} API docs into ${sidebarOutputFile}`);
console.log(`✅ Sidebar packages: ${packageLabels}`);

const guidesDir = path.resolve(__dirname, 'src/content/docs/guides');
const GITHUB_REPO = 'erlc-js/erlcjs';
const GUIDES_REPO_PATH = 'apps/docs/src/content/docs/guides';
const CONTRIBUTORS_MARKER = '{/* AUTOGENERATED PAST THIS POINT */}';

async function fetchFileContributors(filePath) {
  try {
    const res = await fetch(
      `https://api.github.com/repos/${GITHUB_REPO}/commits?path=${encodeURIComponent(filePath)}&per_page=100`
    );
    if (!res.ok) {
      console.log(`⚠️  GitHub API returned ${res.status} for ${filePath}, skipping.`);
      return null;
    }
    const commits = await res.json();

    const seen = new Map();
    for (const commit of commits) {
      if (!commit.author || commit.author.type !== 'User') continue;
      const login = commit.author.login;
      if (seen.has(login)) {
        seen.get(login).commits++;
      } else {
        seen.set(login, {
          login,
          avatar_url: commit.author.avatar_url,
          html_url: commit.author.html_url,
          commits: 1,
        });
      }
    }

    return Array.from(seen.values());
  } catch (err) {
    console.log(`⚠️  Failed to fetch contributors for ${filePath}: ${err.message}`);
    return null;
  }
}

function buildContributorsHtml(contributors) {
  const avatars = contributors.map(c => {
    return `<a href="${c.html_url}" target="_blank" rel="noopener noreferrer" class="contributor"><img src="${c.avatar_url}&s=64" alt="${c.login}" width="40" height="40" loading="lazy" /><span class="contributor-name">${c.login}</span></a>`;
  }).join('\n      ');

  return `
${CONTRIBUTORS_MARKER}
---

<div class="contributors-section">
  <h3 class="contributors-heading">Contributors</h3>
  <p class="contributors-subtext">Thank you to everyone who contributed to this page!</p>
  <div class="contributors-grid">
      ${avatars}
  </div>
</div>
`;
}

if (fs.existsSync(guidesDir)) {
  function walkDirSync(dir, baseDir = dir) {
    const results = [];
    for (const dirent of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, dirent.name);
      if (dirent.isDirectory()) {
        results.push(...walkDirSync(full, baseDir));
      } else if (dirent.isFile() && (full.endsWith('.md') || full.endsWith('.mdx'))) {
        results.push(path.relative(baseDir, full));
      }
    }
    return results;
  }

  const guideFiles = walkDirSync(guidesDir);
  let totalInjected = 0;

  for (const file of guideFiles) {
    const repoFilePath = `${GUIDES_REPO_PATH}/${file.replace(/\\/g, '/')}`;
    const contributors = await fetchFileContributors(repoFilePath);

    const fullPath = path.join(guidesDir, file);
    let content = fs.readFileSync(fullPath, 'utf8');

    const markerIndex = content.indexOf(CONTRIBUTORS_MARKER);
    if (markerIndex !== -1) {
      content = content.slice(0, markerIndex).trimEnd();
    }

    if (contributors && contributors.length > 0) {
      content = content.trimEnd() + '\n' + buildContributorsHtml(contributors);
      totalInjected++;
      console.log(`  📝 ${file}: ${contributors.length} contributor(s) — ${contributors.map(c => c.login).join(', ')}`);
    }

    fs.writeFileSync(fullPath, content, 'utf8');
  }

  console.log(`✅ Injected per-file contributors into ${totalInjected}/${guideFiles.length} guide(s).`);
} else {
  console.log('ℹ️  Guides directory not found, skipping contributors injection.');
}