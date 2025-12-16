import { useState, useEffect } from 'react'; import { onAuthStateChanged, User, GoogleAuthProvider, signInWithRedirect, getRedirectResult, signOut } from 'firebase/auth'; import { auth } from './firebaseConfig';

export const useAuth = () => { const [user, setUser] = useState<User | null>(null); const [loading, setLoading] = useState(true);

useEffect(() => { getRedirectResult(auth) .then((result) => { if (result) { console.log("Login via Redirect concluído"); } }) .catch((error) => { console.error("Erro no retorno do login:", error); });

}, []);

const signInWithGoogle = async () => { const provider = new GoogleAuthProvider(); try { await signInWithRedirect(auth, provider); } catch (error) { console.error("Erro ao logar com Google:", error); } };

const logOut = async () => { try { await signOut(auth); } catch (error) { console.error("Erro ao fazer logout:", error); } };

return { user, loading, signInWithGoogle, logOut }; };