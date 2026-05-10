import { createContext, useContext, useMemo, useState } from "react";
import { loginUser, signupUser } from "../api/libraryApi";

const AuthContext = createContext({
  user: null,
  isAdmin: false,
  login: async () => {},
  signup: async () => {},
  logout: () => {},
});

function getInitialUser() {
  const raw = localStorage.getItem("library_user");
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch (_error) {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(getInitialUser);

  const login = async (credentials) => {
    const loggedInUser = await loginUser(credentials);
    localStorage.setItem("library_user", JSON.stringify(loggedInUser));
    setUser(loggedInUser);
    return loggedInUser;
  };

  const signup = async (userData) => {
    const newUser = await signupUser(userData);
    localStorage.setItem("library_user", JSON.stringify(newUser));
    setUser(newUser);
    return newUser;
  };

  const logout = () => {
    localStorage.removeItem("library_user");
    setUser(null);
  };

  const value = useMemo(
    () => ({
      user,
      isAdmin: user?.role === "admin",
      login,
      signup,
      logout,
    }),
    [user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);

