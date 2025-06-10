/**
 * editable-object Node entry point
 * 
 * Copyright (c) 2025 Alex Grant (@localnerve), LocalNerve LLC
 * Copyrights licensed under the BSD License. See the accompanying LICENSE file for terms.
 */
import * as path from 'node:path';
import * as fs from 'node:fs/promises';
import * as url from 'node:url';

const thisDir = url.fileURLToPath(new URL('.', import.meta.url));

/**
 * Get the css file contents.
 * Useful for CSP builds.
 *
 * @returns {Promise<String>} The utf8 css file content
 */
export function getEditableObjectCssText () {
  return fs.readFile(path.join(thisDir, 'editable-object.css'), {
    encoding: 'utf8'
  });
}