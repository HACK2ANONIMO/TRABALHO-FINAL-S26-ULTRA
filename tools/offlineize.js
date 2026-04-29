#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const http = require('http');
const https = require('https');
const { URL } = require('url');

const projectDir = path.resolve(__dirname, '..');
const assetsDir = path.join(projectDir, 'offline_assets');
const exts = ['.html', '.htm', '.css', '.js', '.ejs'];

function walk(dir) {
  const list = [];
  const items = fs.readdirSync(dir, { withFileTypes: true });
  for (const it of items) {
    const p = path.join(dir, it.name);
    if (it.isDirectory()) {
      if (it.name === 'node_modules' || it.name === '.git' || it.name === 'offline_assets' || it.name === 'tools') continue;
      list.push(...walk(p));
    } else if (exts.includes(path.extname(it.name).toLowerCase())) {
      list.push(p);
    }
  }
  return list;
}

function findUrls(content) {
  const urls = new Set();
  const regex = /https?:\/\/[^\s"'()<>]+/g;
  let m;
  while ((m = regex.exec(content)) !== null) urls.add(m[0]);
  return Array.from(urls);
}

function sanitizeFilename(s) {
  return s.replace(/[<>:"\\\/\|\?\*]/g, '_');
}

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function downloadTo(urlStr, dest) {
  return new Promise((resolve, reject) => {
    const url = new URL(urlStr);
    const mod = url.protocol === 'https:' ? https : http;
    ensureDir(path.dirname(dest));
    const req = mod.get(urlStr, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return resolve(downloadTo(new URL(res.headers.location, url).toString(), dest));
      }
      if (res.statusCode !== 200) return reject(new Error(`HTTP ${res.statusCode} for ${urlStr}`));
      const file = fs.createWriteStream(dest);
      res.pipe(file);
      file.on('finish', () => file.close(resolve));
      file.on('error', reject);
    });
    req.on('error', reject);
  });
}

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry') || args.includes('--dry-run');

  console.log('Projeto:', projectDir);
  ensureDir(assetsDir);

  const files = walk(projectDir);
  console.log(`Arquivos verificados: ${files.length}`);

  const urlMap = new Map();

  for (const file of files) {
    const content = fs.readFileSync(file, 'utf8');
    const urls = findUrls(content);
    for (const u of urls) {
      if (u.startsWith('http://localhost') || u.includes(projectDir)) continue;
      if (!urlMap.has(u)) {
        try {
          const uobj = new URL(u);
          const hostDir = path.join(assetsDir, sanitizeFilename(uobj.hostname));
          const pathname = uobj.pathname === '/' || uobj.pathname === '' ? '/index' : uobj.pathname;
          const destPath = path.join(hostDir, sanitizeFilename(pathname));
          // try to preserve extension from pathname or from search
          let ext = path.extname(uobj.pathname);
          if (!ext) {
            if (u.includes('.css')) ext = '.css';
            else if (u.includes('.js')) ext = '.js';
            else if (u.includes('.woff2')) ext = '.woff2';
            else if (u.includes('.woff')) ext = '.woff';
            else if (u.includes('.ttf')) ext = '.ttf';
            else if (u.includes('.svg')) ext = '.svg';
          }
          const finalDest = ext ? destPath + ext : destPath;
          urlMap.set(u, path.relative(projectDir, finalDest).split(path.sep).join('/'));
        } catch (e) {
          console.warn('URL inválida:', u);
        }
      }
    }
  }

  console.log(`URLs externas encontradas: ${urlMap.size}`);

  // Download step
  if (!dryRun) {
    let i = 0;
    for (const [u, rel] of urlMap.entries()) {
      i++;
      const dest = path.join(projectDir, rel);
      try {
        process.stdout.write(`(${i}/${urlMap.size}) ` + u + ' => ' + rel + ' ... ');
        await downloadTo(u, dest);
        console.log('OK');
      } catch (err) {
        console.log('ERR', err.message);
      }
    }

    // Replace occurrences in files
    for (const file of files) {
      let content = fs.readFileSync(file, 'utf8');
      let changed = false;
      for (const [u, rel] of urlMap.entries()) {
        if (content.includes(u)) {
          content = content.split(u).join(rel);
          changed = true;
        }
      }
      if (changed) {
        fs.copyFileSync(file, file + '.bak');
        fs.writeFileSync(file, content, 'utf8');
        console.log('Atualizado:', path.relative(projectDir, file));
      }
    }
    console.log('Concluído: recursos baixados e referências atualizadas em', projectDir);
  } else {
    console.log('Dry run: não serão feitos downloads nem alterações. Use --run para executar.');
  }
}

main().catch((e) => { console.error('Erro:', e); process.exit(1); });
const fs = require('fs').promises;
const path = require('path');
const http = require('http');
const https = require('https');
const { URL } = require('url');

const ROOT = path.resolve(__dirname, '..');
const OUT_DIR = path.join(ROOT, 'offline_assets');
const FILE_GLOBS = ['.html', '.css', '.js'];

function isAssetUrl(u) {
  try {
    const p = new URL(u);
    const ext = path.extname(p.pathname).toLowerCase();
    if (ext) return true;
    // common hosts that serve fonts/css/js/assets
    return /fonts\.googleapis|fonts\.gstatic|cdnjs|cdn\.|unpkg|pravatar|i\.pravatar|images\.unsplash|fonts\./i.test(p.host + p.pathname);
  } catch (e) {
    return false;
  }
}

async function walk(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = [];
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (e.name === 'offline_assets' || e.name === 'node_modules') continue;
      files.push(...await walk(full));
    } else {
      if (FILE_GLOBS.includes(path.extname(e.name).toLowerCase())) files.push(full);
    }
  }
  return files;
}

function downloadUrl(urlStr) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(urlStr);
    const getter = urlObj.protocol === 'https:' ? https : http;
    getter.get(urlObj, res => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return resolve(downloadUrl(new URL(res.headers.location, urlObj).toString()));
      }
      if (res.statusCode !== 200) return reject(new Error(`Failed ${urlStr} - ${res.statusCode}`));
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => {
        const buf = Buffer.concat(chunks);
        resolve({ buf, contentType: res.headers['content-type'] });
      });
    }).on('error', reject);
  });
}

function safeLocalPathForUrl(u) {
  const urlObj = new URL(u);
  const host = urlObj.host.replace(/[:]/g, '_');
  // preserve filename when present
  let pathname = urlObj.pathname;
  if (pathname.endsWith('/')) pathname += 'index';
  const ext = path.extname(pathname) || '';
  const base = pathname.split('/').filter(Boolean).join('_') || 'file';
  const qs = urlObj.search ? '_' + Buffer.from(urlObj.search).toString('base64').replace(/=+$/,'') : '';
  const filename = base + qs + ext;
  return path.join(OUT_DIR, host, filename);
}

async function ensureDirFor(filePath) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
}

async function process() {
  console.log('Scanning files...');
  const files = await walk(ROOT);
  const urlRegex = /https?:\/\/[\w\-@:%._+~#=\/\?&;,\(\)\[\]!:\$]+/g;
  const found = new Set();
  const occurrences = {};

  for (const f of files) {
    const txt = await fs.readFile(f, 'utf8');
    const matches = txt.match(urlRegex) || [];
    for (const m of matches) {
      if (!isAssetUrl(m)) continue;
      found.add(m);
      occurrences[m] = occurrences[m] || [];
      occurrences[m].push(f);
    }
  }

  console.log(`Found ${found.size} external asset URLs.`);
  for (const u of Array.from(found)) {
    try {
      console.log('Downloading', u);
      const { buf, contentType } = await downloadUrl(u);
      if (/text\/html/.test(contentType || '')) { console.log('Skipping HTML page', u); continue; }
      const local = safeLocalPathForUrl(u);
      await ensureDirFor(local);
      await fs.writeFile(local, buf);
      // special-case google fonts CSS: rewrite font urls to local
      if (u.includes('fonts.googleapis.com')) {
        let css = buf.toString('utf8');
        const urlMatch = css.match(/https?:\\/\\/fonts\.gstatic\.com\\/[^)"']+/g) || [];
        for (const fu of urlMatch) {
          try {
            const r = await downloadUrl(fu);
            const localF = safeLocalPathForUrl(fu);
            await ensureDirFor(localF);
            await fs.writeFile(localF, r.buf);
            const rel = path.relative(path.dirname(local), localF).replace(/\\\\/g, '/');
            css = css.split(fu).join(rel);
          } catch (e) { console.log('Failed font', fu, e.message); }
        }
        await fs.writeFile(local, css, 'utf8');
      }
      // replace occurrences in files
      for (const f of occurrences[u] || []) {
        let txt = await fs.readFile(f, 'utf8');
        const relPath = path.relative(path.dirname(f), local).replace(/\\\\/g, '/');
        const escaped = u.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const re = new RegExp(escaped, 'g');
        txt = txt.replace(re, relPath);
        await fs.writeFile(f, txt, 'utf8');
        console.log(`Updated ${path.relative(ROOT, f)} -> ${relPath}`);
      }
    } catch (err) {
      console.log('Error downloading', u, err.message);
    }
  }

  console.log('Offlineization complete. Assets in:', OUT_DIR);
}

process().catch(err => { console.error(err); process.exit(1); });
