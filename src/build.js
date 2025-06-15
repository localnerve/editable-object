/**
 * Build script for editable-object web component
 * 
 * Copyright (c) 2025 Alex Grant (@localnerve), LocalNerve LLC
 * Copyrights licensed under the BSD License. See the accompanying LICENSE file for terms.
 */
import * as path from 'node:path';
import * as fs from 'node:fs/promises';
import { build } from '@localnerve/web-component-build';
import { thisDir, stageDir, distDir } from './build-settings.js';

const cssFilePath = path.join(thisDir, 'editable-object.css');
const htmlFilePath = path.join(thisDir, 'editable-object.html');
const jsFilePath = path.join(thisDir, 'editable-object.js');
const jsReplacement = '__JS_REPLACEMENT__';
const indexFilePath = path.join(thisDir, 'index.js');
const testFixturePath = path.join(thisDir, '../test/fixtures');

/**
 * Main build script.
 */
async function buildwc () {
  await fs.rm(stageDir, { recursive: true, force: true });
  await fs.mkdir(stageDir, { recursive: true });
  
  const result = await build(stageDir, {
    cssPath: cssFilePath,
    htmlPath: htmlFilePath,
    jsPath: jsFilePath,
    jsReplacement,
    minifySkip: !!process.env.SKIP_MIN
  });

  // INFO: webpack creates the dist bundle from stageDir

  await fs.cp(indexFilePath, path.join(distDir, path.basename(indexFilePath)));
  await fs.cp(result.cssPath, path.join(distDir, path.basename(result.cssPath)));

  // maintain test fixture copies
  await fs.cp(path.join(stageDir, path.basename(jsFilePath)), path.join(testFixturePath, path.basename(jsFilePath)));

  const normalizeCss = 'modern-normalize.css';
  await fs.cp(path.join(thisDir, '../', 'node_modules/modern-normalize', normalizeCss), path.join(testFixturePath, normalizeCss));
}

await buildwc();