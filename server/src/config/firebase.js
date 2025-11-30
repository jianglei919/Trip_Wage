import admin from 'firebase-admin';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

let db;

export const initializeFirebase = () => {
  try {
    // 方法 1: 使用服务账号密钥文件
    if (process.env.FIREBASE_SERVICE_ACCOUNT_PATH) {
      const serviceAccount = JSON.parse(
        readFileSync(process.env.FIREBASE_SERVICE_ACCOUNT_PATH, 'utf8')
      );
      
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
      });
    } 
    // 方法 2: 使用环境变量中的 JSON
    else if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
      const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
      
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
      });
    } 
    // 方法 3: 使用单独的环境变量
    else {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')
        })
      });
    }

    db = admin.firestore();
    console.log('Firebase initialized successfully');
    return db;
  } catch (error) {
    console.error('Firebase initialization error:', error);
    throw error;
  }
};

export const getFirestore = () => {
  if (!db) {
    throw new Error('Firebase not initialized. Call initializeFirebase() first.');
  }
  return db;
};

export default admin;
