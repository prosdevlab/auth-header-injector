#!/usr/bin/env node

import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = resolve(__dirname, '..');

// Read manifest
const manifestPath = resolve(rootDir, 'dist', 'manifest.json');
const manifest = JSON.parse(readFileSync(manifestPath, 'utf-8'));

// Convert manifest name to filename-friendly format
// "Auth HI!" -> "auth-hi"
const name = manifest.name
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, '-') // Replace non-alphanumeric with hyphens
  .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens

const version = manifest.version;
const zipName = `${name}-${version}.zip`;

console.log(`Creating ${zipName} from manifest:`);
console.log(`  Name: ${manifest.name}`);
console.log(`  Version: ${version}`);

// Create zip from dist folder
const distDir = resolve(rootDir, 'dist');
const zipPath = resolve(rootDir, zipName);

try {
  execSync(`cd "${distDir}" && zip -r "${zipPath}" .`, { stdio: 'inherit' });
  console.log(`\n✅ Created: ${zipName}`);
} catch (error) {
  console.error(`\n❌ Failed to create zip: ${error.message}`);
  process.exit(1);
}
