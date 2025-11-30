#!/usr/bin/env node

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const args = process.argv.slice(2);
const dbType = args[0];

const help = () => {
  console.log('Usage: npm run switch-db <mongodb|firebase> [--dual|--single] [--read-primary=mongodb|firebase] [--env=development|production|path]');
  console.log('Examples:');
  console.log('  npm run switch-db mongodb');
  console.log('  npm run switch-db firebase --single');
  console.log('  npm run switch-db mongodb --dual --read-primary=mongodb');
  console.log('  npm run switch-db mongodb --env=production');
};

if (!dbType || !['mongodb', 'firebase'].includes(dbType)) {
  console.log('❌ Invalid or missing database type.');
  help();
  process.exit(1);
}

// Parse flags
let setDual = null; // true|false|null(no change)
let readPrimary = null;
let envTarget = null;

for (const arg of args.slice(1)) {
  if (arg === '--dual') setDual = true;
  else if (arg === '--single') setDual = false;
  else if (arg.startsWith('--read-primary=')) {
    const val = arg.split('=')[1];
    if (!['mongodb', 'firebase'].includes(val)) {
      console.log('❌ --read-primary must be mongodb or firebase');
      process.exit(1);
    }
    readPrimary = val;
  } else if (arg.startsWith('--env=')) {
    envTarget = arg.split('=')[1];
  } else {
    console.log(`⚠️ Unknown option ignored: ${arg}`);
  }
}

// Resolve env file path
function resolveEnvPath() {
  // If a direct path
  if (envTarget && envTarget.includes('/') || envTarget && envTarget.endsWith('.env')) {
    return resolve(process.cwd(), envTarget);
  }
  // If a named environment
  const nodeEnv = envTarget || process.env.NODE_ENV || 'development';
  const candidate = join(__dirname, `.env.${nodeEnv}`);
  if (existsSync(candidate)) return candidate;
  const fallback = join(__dirname, '.env');
  return fallback;
}

const envPath = resolveEnvPath();

// Helpers to get/set key
function setKey(content, key, value) {
  const re = new RegExp(`^${key}=.*$`, 'm');
  if (re.test(content)) {
    return content.replace(re, `${key}=${value}`);
  }
  // Append if not exists
  const sep = content.endsWith('\n') ? '' : '\n';
  return content + `${sep}${key}=${value}\n`;
}

try {
  let envContent = existsSync(envPath) ? readFileSync(envPath, 'utf8') : '';

  envContent = setKey(envContent, 'DB_TYPE', dbType);
  if (setDual !== null) envContent = setKey(envContent, 'DB_DUAL_WRITE', String(setDual));
  if (readPrimary) envContent = setKey(envContent, 'READ_PRIMARY', readPrimary);

  writeFileSync(envPath, envContent, 'utf8');

  console.log(`✅ Updated ${envPath}`);
  console.log(`   DB_TYPE=${dbType}`);
  if (setDual !== null) console.log(`   DB_DUAL_WRITE=${setDual}`);
  if (readPrimary) console.log(`   READ_PRIMARY=${readPrimary}`);
  console.log('🔄 Please restart the server for changes to take effect');
  console.log('   Run: npm run dev');
} catch (error) {
  console.error('❌ Error switching database:', error.message);
  process.exit(1);
}
