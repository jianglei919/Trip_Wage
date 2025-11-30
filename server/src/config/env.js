// 环境变量加载模块 - 必须在所有其他模块之前加载
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
// Prefer .env.<NODE_ENV> if present, otherwise fallback to .env
const envName = (process.env.NODE_ENV || 'development').trim();
const envPathCandidate = path.resolve(__dirname, `../../.env.${envName}`);
const envPathFallback = path.resolve(__dirname, '../../.env');

if (fs.existsSync(envPathCandidate)) {
  dotenv.config({ path: envPathCandidate });
  console.log(`📋 Loaded env from: .env.${envName}`);
} else if (fs.existsSync(envPathFallback)) {
  dotenv.config({ path: envPathFallback });
  console.log(`📋 Loaded env from: .env`);
} else {
  dotenv.config();
  console.log(`📋 Loaded env from default`);
}

export default process.env;
