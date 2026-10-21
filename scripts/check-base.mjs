#!/usr/bin/env node
import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';

const assetsDir = join(process.cwd(), '.vercel/output/static/assets');
let bad = false;
try {
  const files = readdirSync(assetsDir).filter(f => f.startsWith('index-') && f.endsWith('.js'));
  for (const f of files) {
    const content = readFileSync(join(assetsDir, f), 'utf8');
    if (content.includes('"/assets/') && !content.includes('/berty-run/assets/')) {
      console.error(`FAIL: ${f} has root /assets/ without /berty-run/ base`);
      bad = true;
    }
    if (!content.includes('/berty-run/assets/styles')) {
      console.error(`FAIL: ${f} missing /berty-run/assets/styles`);
      bad = true;
    }
  }
} catch (e) {
  console.error('check-base: no assets found or error', e.message);
  bad = true;
}
if (bad) process.exit(1);
console.log('check-base: OK, base is /berty-run/');
