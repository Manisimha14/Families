import { useContext, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { authinstance } from "../../lib/axiosinstance.js";
import userContext from "../context/user.context.js";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { refreshUser } = useContext(userContext);
  const navigate = useNavigate();

  const loginUser = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      await authinstance.post("/login", { email, password });
      await refreshUser();
      navigate("/", { replace: true });
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ||
          "Sign in failed. Check your details and try again.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="app-shell auth-shell">
      <header className="topbar">
        <Link className="wordmark" to="/">COMMON<span>PLACE</span></Link>
        <Link className="nav-link" to="/">Back to home</Link>
      </header>
      <main className="auth-layout">
        <aside className="auth-aside">
          <p className="eyebrow"><span className="eyebrow-dot" /> YOUR SPACE IS HERE</p>
          <h1>Pick up<br />where you<br /><em>left off.</em></h1>
          <p>Your people and your little moments are right where you left them.</p>
          <div className="auth-aside-mark">CP&nbsp; / &nbsp;02</div>
        </aside>
        <section className="auth-card">
          <p className="eyebrow">WELCOME BACK</p>
          <h2>Come on in.</h2>
          <p className="auth-description">Sign in to your Commonplace account.</p>
          <form onSubmit={loginUser}>
            <label className="field-label" htmlFor="login-email">Email address</label>
            <input
              id="login-email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
            <label className="field-label" htmlFor="login-password">Password</label>
            <input
              id="login-password"
              type="password"
              autoComplete="current-password"
              placeholder="Your password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
            {error && <p className="form-error" role="alert">{error}</p>}
            <button className="button auth-submit" disabled={submitting}>
              {submitting ? "Signing you in…" : "Sign in"} <span>↗</span>
            </button>
          </form>
          <p className="auth-switch">New around here? <Link to="/register">Make your space</Link></p>
        </section>
      </main>
      <footer className="site-footer">
        <span>COMMONPLACE © {new Date().getFullYear()}</span>
        <span>MADE FOR BEING HERE</span>
      </footer>
    </div>
  );
}

export default Login;
