import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { authinstance } from "../../lib/axiosinstance.js";

function Register() {
  const [form, setForm] = useState({
    name: "",
    user_name: "",
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  const updateField = (event) => {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  };

  const registerUser = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      await authinstance.post("/register", form);
      navigate("/login", { replace: true });
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ||
          (requestError.code === "ECONNABORTED"
            ? "The server took too long to respond. Please try again."
            : requestError.request
              ? "We couldn’t reach the server. Check that it’s running and try again."
              : "Your account could not be created. Please try again."),
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
          <p className="eyebrow"><span className="eyebrow-dot" /> A GOOD PLACE TO START</p>
          <h1>Make room<br />for a little<br /><em>more you.</em></h1>
          <p>One account, your own corner, and a feed that feels like your people.</p>
          <div className="auth-aside-mark">CP&nbsp; / &nbsp;01</div>
        </aside>
        <section className="auth-card">
          <p className="eyebrow">COME AS YOU ARE</p>
          <h2>Make your space.</h2>
          <p className="auth-description">A few details and you’re in.</p>
          <form onSubmit={registerUser}>
            <label className="field-label" htmlFor="register-name">Your name</label>
            <input
              id="register-name"
              name="name"
              autoComplete="name"
              placeholder="How people know you"
              value={form.name}
              onChange={updateField}
              required
            />
            <label className="field-label" htmlFor="register-username">Username</label>
            <input
              id="register-username"
              name="user_name"
              autoComplete="username"
              placeholder="A name for your corner"
              value={form.user_name}
              onChange={updateField}
              required
            />
            <label className="field-label" htmlFor="register-email">Email address</label>
            <input
              id="register-email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              value={form.email}
              onChange={updateField}
              required
            />
            <label className="field-label" htmlFor="register-password">Password</label>
            <input
              id="register-password"
              name="password"
              type="password"
              autoComplete="new-password"
              placeholder="At least 7 characters"
              minLength={7}
              value={form.password}
              onChange={updateField}
              required
            />
            {error && <p className="form-error" role="alert">{error}</p>}
            <button className="button auth-submit" disabled={submitting}>
              {submitting ? "Creating your account…" : "Create account"} <span>↗</span>
            </button>
          </form>
          <p className="auth-switch">Already have a space? <Link to="/login">Sign in</Link></p>
        </section>
      </main>
      <footer className="site-footer">
        <span>COMMONPLACE © {new Date().getFullYear()}</span>
        <span>MADE FOR BEING HERE</span>
      </footer>
    </div>
  );
}

export default Register;
