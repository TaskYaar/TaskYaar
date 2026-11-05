import { createContext, useCallback, useContext, useState } from "react";

const AuthContext = createContext(null);

const read = (key) => {
  try { return JSON.parse(localStorage.getItem(key)); }
  catch { return null; }
};

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem("token"));
  const [user, setUser] = useState(() => read("user"));

  const login = useCallback((t, u) => {
    localStorage.setItem("token", t);
    setToken(t);
    if (u) {
      localStorage.setItem("user", JSON.stringify(u));
      setUser(u);
    }
  }, []);

  const updateUser = useCallback((u) => {
    localStorage.setItem("user", JSON.stringify(u));
    setUser(u);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    sessionStorage.removeItem("phone");
    setToken(null);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ token, user, login, updateUser, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);