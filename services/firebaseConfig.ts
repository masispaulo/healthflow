import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// CHEGA DE IMPORT.META.ENV. AS CHAVES ESTÃO AQUI AGORA.
const firebaseConfig = {
  apiKey: "AIzaSyABMLyKaiFV-R88AOvvYv9kkOhR6UNgY7Q",
  authDomain: "healthflow-plataforma.firebaseapp.com",
  projectId: "healthflow-plataforma",
  storageBucket: "healthflow-plataforma.firebasestorage.app",
  messagingSenderId: "781872196711",
  appId: "1:781872196711:web:5f346f1aefdfda4ea978c2"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const provider = new GoogleAuthProvider();