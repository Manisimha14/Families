import { useContext } from "react";
import { Navigate } from "react-router-dom";
import userContext from "../context/user.context.js";

function ProtectedRoute({ children }) {
  const { user, loading } = useContext(userContext);

  if (loading) {
    return <main className="page-state">Checking your session…</main>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

export default ProtectedRoute;
