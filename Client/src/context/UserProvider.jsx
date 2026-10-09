import { useCallback, useEffect, useState } from "react";
import userContext from "./user.context.js";
import { authinstance } from "../../lib/axiosinstance.js";

function UserProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const refreshUser = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await authinstance.get("/me");
      setUser(response.data.user);
      return response.data.user;
    } catch (requestError) {
      setUser(null);
      if (requestError.response && requestError.response.status !== 404) {
        setError(
          requestError.response.data?.message ||
            "We could not verify your session. Please try again.",
        );
      } else if (!requestError.response && requestError.request) {
        setError("The server could not be reached. Check that it is running.");
      }
      throw requestError;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      refreshUser().catch(() => {});
    }, 0);
    return () => window.clearTimeout(timer);
  }, [refreshUser]);

  return (
    <userContext.Provider value={{ user, loading, error, refreshUser }}>
      {children}
    </userContext.Provider>
  );
}

export default UserProvider;
