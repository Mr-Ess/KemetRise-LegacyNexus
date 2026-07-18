import { chromium } from 'playwright';
import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

const svgContent = readFileSync(join(__dirname, 'public', 'favicon.svg'), 'utf-8');

const html = `<!DOCTYPE html>
<html>
<head>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { background: #000; width: 512px; height: 512px; overflow: hidden; }
  svg { width: 512px; height: 512px; }
</style>
</head>
<body>${svgContent}</body>
</html>`;

const browser = await chromium.launch();
const page = await browser.newPage();

// 512x512
await page.setViewportSize({ width: 512, height: 512 });
await page.setContent(html);
const buf512 = await page.screenshot({ clip: { x: 0, y: 0, width: 512, height: 512 } });
writeFileSync(join(__dirname, 'public', 'icon-512.png'), buf512);
console.log('✓ icon-512.png');

// 192x192
await page.setViewportSize({ width: 192, height: 192 });
await page.evaluate((svg) => {
  document.body.style.width = '192px';
  document.body.style.height = '192px';
  document.querySelector('svg').style.width = '192px';
  document.querySelector('svg').style.height = '192px';
}, svgContent);
const buf192 = await page.screenshot({ clip: { x: 0, y: 0, width: 192, height: 192 } });
writeFileSync(join(__dirname, 'public', 'icon-192.png'), buf192);
console.log('✓ icon-192.png');

// 32x32
await page.setViewportSize({ width: 32, height: 32 });
await page.evaluate(() => {
  document.body.style.width = '32px';
  document.body.style.height = '32px';
  document.querySelector('svg').style.width = '32px';
  document.querySelector('svg').style.height = '32px';
});
const buf32 = await page.screenshot({ clip: { x: 0, y: 0, width: 32, height: 32 } });
writeFileSync(join(__dirname, 'public', 'favicon-32.png'), buf32);
console.log('✓ favicon-32.png');

await browser.close();
console.log('All icons generated!');
