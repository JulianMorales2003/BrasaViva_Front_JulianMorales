import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { setUnauthorizedHandler, tokenStore } from '../api/client.js';
import { authService } from '../api/services.js';

const AuthContext = createContext(null);
const USER_KEY = 'brasaviva.usuario';

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(() => {
    const raw = sessionStorage.getItem(USER_KEY);
    return raw && tokenStore.get() ? JSON.parse(raw) : null;
  });
  const [expirada, setExpirada] = useState(false);

  const logout = useCallback(() => {
    tokenStore.clear();
    sessionStorage.removeItem(USER_KEY);
    setUsuario(null);
  }, []);

  useEffect(() => {
    setUnauthorizedHandler(() => {
      logout();
      setExpirada(true);
    });
  }, [logout]);

  const login = async (email, password) => {
    const token = await authService.login(email, password);
    tokenStore.set(token.token);
    // /auth/me trae el nombre; el rol viene en la respuesta del login
    let nombre = token.email;
    try {
      const me = await authService.me();
      nombre = me.nombre;
    } catch {
      /* si falla, se usa el email */
    }
    const u = { email: token.email, rol: token.rol, nombre };
    sessionStorage.setItem(USER_KEY, JSON.stringify(u));
    setUsuario(u);
    setExpirada(false);
    return u;
  };

  const tieneRol = (...roles) => !!usuario && roles.includes(usuario.rol);

  return (
    <AuthContext.Provider value={{ usuario, login, logout, tieneRol, expirada, setExpirada }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
