#!/usr/bin/env node

import { execSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = resolve(__dirname, '..');

// Check if dist folder exists
const distDir = resolve(rootDir, 'dist');
if (!existsSync(distDir)) {
  console.error('❌ Error: dist/ folder does not exist. Run "pnpm build" first.');
  process.exit(1);
}

// Read manifest
const manifestPath = resolve(distDir, 'manifest.json');
if (!existsSync(manifestPath)) {
  console.error(`❌ Error: ${manifestPath} does not exist. Run "pnpm build" first.`);
  process.exit(1);
}

let manifest;
try {
  manifest = JSON.parse(readFileSync(manifestPath, 'utf-8'));
} catch (error) {
  console.error(`❌ Error: Failed to parse manifest.json: ${error.message}`);
  process.exit(1);
}

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

// Check if zip command is available
try {
  execSync('which zip', { stdio: 'ignore' });
} catch (_error) {
  console.error('❌ Error: "zip" command not found. Please install zip utility.');
  process.exit(1);
}

// Create zip from dist folder
const zipPath = resolve(rootDir, zipName);

try {
  execSync(`cd "${distDir}" && zip -r "${zipPath}" .`, { stdio: 'inherit' });
  console.log(`\n✅ Created: ${zipName}`);
} catch (error) {
  console.error(`\n❌ Failed to create zip: ${error.message}`);
  if (error instanceof Error && error.message.includes('zip')) {
    console.error('   Make sure "zip" utility is installed and available in PATH.');
  }
  process.exit(1);
}
