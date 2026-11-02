import fs from 'fs';
import path from 'path';

function runTests() {
  console.log('🧪 Starting FloatView Verification Test Suite...\n');
  let passed = 0;
  let failed = 0;

  function assert(condition, testName) {
    if (condition) {
      console.log(`  ✓ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`  ✗ FAIL: ${testName}`);
      failed++;
    }
  }

  const distDir = path.resolve('dist');

  // Test 1: Dist directory exists
  assert(fs.existsSync(distDir), 'Dist directory exists');

  // Test 2: Manifest file exists and is valid JSON
  const manifestPath = path.join(distDir, 'manifest.json');
  assert(fs.existsSync(manifestPath), 'dist/manifest.json exists');
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));

  assert(manifest.manifest_version === 3, 'Manifest version is 3');
  assert(manifest.name.includes('Floating View'), 'Manifest name is YouTube Floating View');
  assert(manifest.action && manifest.action.default_popup === 'popup.html', 'Action popup points to popup.html');
  assert(manifest.options_ui && manifest.options_ui.page === 'options.html', 'Options UI points to options.html');
  assert(manifest.background && manifest.background.service_worker === 'background/service-worker.js', 'Service worker points to background/service-worker.js');
  assert(manifest.content_scripts && manifest.content_scripts[0].js[0] === 'content/content-bundle.js', 'Content script points to content/content-bundle.js');
  assert(manifest.commands && manifest.commands['toggle-pip'], 'Alt+Shift+P shortcut command configured');

  // Test 3: Icons exist
  for (const size of [16, 32, 48, 128]) {
    const iconPath = path.join(distDir, 'icons', `icon${size}.png`);
    assert(fs.existsSync(iconPath), `Icon ${size}x${size} exists (${iconPath})`);
  }

  // Test 4: HTML files exist and contain app mount point
  const popupHtml = fs.readFileSync(path.join(distDir, 'popup.html'), 'utf8');
  assert(popupHtml.includes('<div id="app"></div>'), 'popup.html has #app mount div');
  assert(popupHtml.includes('assets/popup-'), 'popup.html references bundled popup js');
  assert(popupHtml.includes('assets/main-'), 'popup.html references bundled css');

  const optionsHtml = fs.readFileSync(path.join(distDir, 'options.html'), 'utf8');
  assert(optionsHtml.includes('<div id="app"></div>'), 'options.html has #app mount div');
  assert(optionsHtml.includes('assets/options-'), 'options.html references bundled options js');

  // Test 5: Background service worker contains NO top-level ESM imports (Chrome MV3 requirement)
  const bgContent = fs.readFileSync(path.join(distDir, 'background', 'service-worker.js'), 'utf8');
  assert(!bgContent.startsWith('import '), 'service-worker.js is self-contained (no top-level ESM import)');
  assert(bgContent.includes('chrome.contextMenus'), 'service-worker.js contains context menu handling');
  assert(bgContent.includes('chrome.commands'), 'service-worker.js contains keyboard shortcut handling');

  // Test 6: Content script contains NO top-level ESM imports (Chrome MV3 requirement)
  const contentScript = fs.readFileSync(path.join(distDir, 'content', 'content-bundle.js'), 'utf8');
  assert(!contentScript.startsWith('import '), 'content-bundle.js is self-contained IIFE (no top-level ESM import)');
  assert(contentScript.includes('requestPictureInPicture'), 'content-bundle.js implements requestPictureInPicture');
  assert(contentScript.includes('floatview-overlay-host'), 'content-bundle.js implements Vivaldi-style floating button shadow DOM');

  // Test 7: Vue 3 components and services code integrity
  const popupJs = fs.readdirSync(path.join(distDir, 'assets')).find(f => f.startsWith('popup-'));
  const popupJsContent = fs.readFileSync(path.join(distDir, 'assets', popupJs), 'utf8');
  assert(popupJsContent.includes('Floating View'), 'Bundled popup code contains YouTube Floating View components');

  console.log(`\n========================================`);
  console.log(`Test Summary: ${passed} passed, ${failed} failed`);
  console.log(`========================================\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

runTests();

