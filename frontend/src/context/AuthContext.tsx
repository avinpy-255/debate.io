import React, {
  createContext,
  useState,
  useContext,
  ReactNode,
  useEffect,
  useCallback,
} from "react";
import { getPlayer } from "../services/api";

interface AuthContextType {
  username: string | null;
  setUsername: (username: string) => void;
  logout: () => void;
  playerData: any;
  isLoading: boolean;
  refreshPlayerData: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [username, setUsernameState] = useState<string | null>(() => {
    return localStorage.getItem("username");
  });
  const [playerData, setPlayerData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  const setUsername = (name: string) => {
    localStorage.setItem("username", name);
    setUsernameState(name);
  };

  const logout = () => {
    localStorage.removeItem("username");
    setUsernameState(null);
    setPlayerData(null);
  };

  const fetchPlayerData = useCallback(async (username: string) => {
    if (!username) return;

    setIsLoading(true);
    try {
      const data = await getPlayer(username);

      setPlayerData(data);
    } catch (error) {
      console.error("Failed to fetch player data:", error);
      // If player not found, clear the invalid username
      if (error.status === 404) {
        logout();
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  const refreshPlayerData = async () => {
    // await fetchPlayerData(username);
  };
  useEffect(() => {
    if (username) {
      fetchPlayerData(username);
    }
  }, [username, fetchPlayerData]);

  return (
    <AuthContext.Provider
      value={{
        username,
        setUsername,
        logout,
        playerData,
        isLoading,
        refreshPlayerData,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
