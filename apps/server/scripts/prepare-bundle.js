#!/usr/bin/env node
/**
 * Prepares the server bundle for Electron packaging.
 * Creates a production-ready package.json with runtime dependencies.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const serverDir = path.resolve(__dirname, '..');
const bundleDir = path.join(serverDir, 'bundle');

// Read the original package.json
const pkgPath = path.join(serverDir, 'package.json');
const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));

// Create a production-ready package.json with runtime dependencies
const prodPkg = {
  name: pkg.name,
  type: pkg.type,
  dependencies: {
    ...pkg.dependencies,
    '@prisma/client': pkg.devDependencies['@prisma/client'],
    'prisma': pkg.devDependencies['prisma']
  }
};

// Ensure bundle directory exists
fs.mkdirSync(bundleDir, { recursive: true });

// Write the production package.json
const outputPath = path.join(bundleDir, 'package.json');
fs.writeFileSync(outputPath, JSON.stringify(prodPkg, null, 2));

console.log('Created production package.json at:', outputPath);
