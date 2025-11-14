// src/services/firebaseConfig.ts

// Importa as funções que precisamos do Firebase
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// (Este é o código que você acabou de copiar do Firebase)
const firebaseConfig = {
  apiKey: "AIzaSyABMLyKaiFV-R88AOvvYv9kkOhR6UNgY7Q",
  authDomain: "healthflow-plataforma.firebaseapp.com",
  projectId: "healthflow-plataforma",
  storageBucket: "healthflow-plataforma.firebasestorage.app",
  messagingSenderId: "781872196711",
  appId: "1:781872196711:web:5f346f1aefdfda4ea978c2"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// --- A MÁGICA ESTÁ AQUI ---
// Estamos inicializando os serviços e exportando eles
// para os outros arquivos (useAuth, useProcedures, etc.) usarem.
export const db = getFirestore(app);
export const auth = getAuth(app);