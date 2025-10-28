import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyBDnuYE4QWvno04mfLviwK7REkywSir5zo",
  authDomain: "hr-chatting-app.firebaseapp.com",
  projectId: "hr-chatting-app",
  storageBucket: "hr-chatting-app.firebasestorage.app",
  messagingSenderId: "473817114563",
  appId: "1:473817114563:web:81f277a5c27a3614d37f76"
};

let app: FirebaseApp;
if (getApps().length === 0) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApp();
}

const auth: Auth = getAuth(app);
const db: Firestore = getFirestore(app);

export { auth, db };
