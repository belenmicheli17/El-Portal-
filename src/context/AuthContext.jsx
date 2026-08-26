import React, { createContext, useContext, useState, useEffect } from 'react';
import { getAuth, onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase'; // Asegurate de que esta ruta apunte a tu archivo de configuración de Firebase

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children, loadingFallback = null }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const auth = getAuth();
    // onAuthStateChanged se queda escuchando si alguien entra o sale
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          // Si hay usuario en Auth, buscamos sus datos reales en Firestore
          const docRef = doc(db, 'usuarios', user.uid);
          const docSnap = await getDoc(docRef);
          
          if (docSnap.exists()) {
            // Unimos el UID con los datos de Firestore (nombre, rol, slug, etc)
            setCurrentUser({ uid: user.uid, ...docSnap.data() });
          } else {
            setCurrentUser({ uid: user.uid }); 
          }
        } catch (error) {
          console.error("Error obteniendo datos del usuario:", error);
          setCurrentUser(null);
        }
      } else {
        setCurrentUser(null); // No hay sesión iniciada
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  // 👇 Función para cerrar sesión en Firebase
  const logout = () => {
    const auth = getAuth();
    return signOut(auth);
  };

   const refreshUser = async () => {
    const auth = getAuth();
    const user = auth.currentUser;
    if (!user) return;
    try {
      const docRef = doc(db, 'usuarios', user.uid);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setCurrentUser({ uid: user.uid, ...docSnap.data() });
      }
    } catch (error) {
      console.error("Error refrescando usuario:", error);
    }
  };

  return (
    <AuthContext.Provider value={{ currentUser, loading, logout, refreshUser }}>
      {loading ? loadingFallback : children}
    </AuthContext.Provider>
  );
}