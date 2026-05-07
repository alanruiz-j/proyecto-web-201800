// ── Imports de Firebase ───────────────────────────────────────────────────────
// Firebase es el servicio de Google que usamos para autenticación y base de datos.
// Importamos solo los módulos que necesitamos (tree-shaking: reduce el tamaño del bundle).
import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// ── Credenciales ──────────────────────────────────────────────────────────────
// Las claves se leen desde variables de entorno (.env.local) para no exponerlas
// en el código fuente. NEXT_PUBLIC_ hace que Next.js las envíe al navegador.
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

// initializeApp conecta la aplicación con el proyecto Firebase usando las credenciales.
const app = initializeApp(firebaseConfig);

// auth maneja todo lo relacionado con usuarios: registro, login y sesión activa.
export const auth = getAuth(app);

// db es la instancia de Firestore, la base de datos donde guardamos blogs y comentarios.
export const db = getFirestore(app);

// googleProvider configura el inicio de sesión con cuenta de Google (OAuth 2.0).
export const googleProvider = new GoogleAuthProvider();

// ── Funciones de autenticación ────────────────────────────────────────────────

// Abre una ventana emergente para que el usuario elija su cuenta de Google.
// async/await permite esperar la respuesta sin bloquear el resto de la app.
export const signInWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return { success: true, user: result.user };
  } catch (error) {
    console.error('Error signing in with Google:', error);
    return { success: false, error };
  }
};

// Cierra la sesión del usuario actual y borra su estado en Firebase Auth.
export const logOut = async () => {
  try {
    await signOut(auth);
    return { success: true };
  } catch (error) {
    console.error('Error signing out:', error);
    return { success: false, error };
  }
};
