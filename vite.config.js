import fs from 'node:fs';
import fsp from 'node:fs/promises';
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { resolve } from 'path';
import * as esbuild from 'esbuild';

// Windows sandbox patch for native realpath
fs.realpathSync.native = fs.realpathSync;
if (fs.realpath && fs.realpath.native) {
  fs.realpath.native = fs.realpath;
}
fsp.realpath = async (p, opts) => {
  try {
    return fs.realpathSync(p, opts);
  } catch {
    return String(p);
  }
};
fsp.realpath.native = fsp.realpath;

function chromeExtensionBundler() {
  return {
    name: 'chrome-extension-bundler',
    async closeBundle() {
      // Bundle background service worker as standalone IIFE
      await esbuild.build({
        entryPoints: [resolve(__dirname, 'src/background/service-worker.js')],
        outfile: resolve(__dirname, 'dist/background/service-worker.js'),
        bundle: true,
        format: 'iife',
        minify: true,
        target: 'chrome100',
      });

      // Bundle content script as standalone IIFE
      await esbuild.build({
        entryPoints: [resolve(__dirname, 'src/content/index.js')],
        outfile: resolve(__dirname, 'dist/content/content-bundle.js'),
        bundle: true,
        format: 'iife',
        minify: true,
        target: 'chrome100',
      });

      console.log('✓ Bundled standalone background and content scripts (Chrome MV3 IIFE)');
    },
  };
}

export default defineConfig({
  base: './',
  plugins: [vue(), chromeExtensionBundler()],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        popup: resolve(__dirname, 'popup.html'),
        options: resolve(__dirname, 'options.html'),
      },
      output: {
        entryFileNames: 'assets/[name]-[hash].js',
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]',
      },
    },
  },
});
