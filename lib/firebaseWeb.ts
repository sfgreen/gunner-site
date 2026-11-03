import { getApps, initializeApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';

// The Firebase web app the admin page already signs in with (stepgunner-79ae7).
// Not a secret: a web API key names the project. Security is the ID-token check
// in every /api/pro route (lib/proServer.ts caller). Browser-only: /pro imports
// this inside an effect, so no other page carries the SDK.
const FIREBASE_WEB = {
  apiKey: 'AIzaSyDFMlHpkq29DSjkrrH5Xvnb3T9AeaEp9f4',
  authDomain: 'stepgunner-79ae7.firebaseapp.com',
  projectId: 'stepgunner-79ae7',
  storageBucket: 'stepgunner-79ae7.firebasestorage.app',
  messagingSenderId: '336131562975',
  appId: '1:336131562975:web:8c5913ff38073751d4786a',
};

export function webAuth(): Auth {
  const app = getApps()[0] || initializeApp(FIREBASE_WEB);
  return getAuth(app);
}
