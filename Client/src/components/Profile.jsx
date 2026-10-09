import { useContext, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { authinstance, postInstance } from "../../lib/axiosinstance.js";
import userContext from "../context/user.context.js";

function Profile() {
  const { user: sessionUser, refreshUser } = useContext(userContext);
  const [user, setUser] = useState(sessionUser);
  const [posts, setPosts] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const loadProfile = async () => {
      setLoading(true);
      setError("");
      try {
        const [profileResponse, postResponse] = await Promise.all([
          authinstance.get(`/profile/${encodeURIComponent(sessionUser.user_name)}`),
          postInstance.get("/posts"),
        ]);
        if (!active) return;
        const profile = profileResponse.data.user;
        setUser(profile);
        setPosts((postResponse.data.posts || []).filter(
          (post) => post.author?._id === profile._id,
        ));
      } catch (requestError) {
        if (!active) return;
        setError(
          requestError.response?.data?.message ||
            "Your profile could not be loaded. Please retry.",
        );
      } finally {
        if (active) setLoading(false);
      }
    };
    loadProfile();
    return () => { active = false; };
  }, [sessionUser.user_name]);

  const retry = async () => {
    try {
      await refreshUser();
      setLoading(true);
      const response = await authinstance.get(
        `/profile/${encodeURIComponent(sessionUser.user_name)}`,
      );
      const postResponse = await postInstance.get("/posts");
      const profile = response.data.user;
      setUser(profile);
      setPosts((postResponse.data.posts || []).filter(
        (post) => post.author?._id === profile._id,
      ));
      setError("");
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ||
          "Your profile could not be loaded. Please retry.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-shell">
      <header className="topbar">
        <Link className="wordmark" to="/">COMMON<span>PLACE</span></Link>
        <nav className="topbar-actions" aria-label="Main navigation">
          <Link className="nav-link" to="/discover">Find people</Link>
          <Link aria-label="Your profile" className="nav-avatar" to="/profile">
            {user?.name?.charAt(0) || "?"}
          </Link>
        </nav>
      </header>
      <main className="profile-page">
        <div className="profile-kicker">
          <Link className="quiet-link" to="/">← Back to the feed</Link>
          <span>YOUR ACCOUNT / PROFILE</span>
        </div>
        {error && <div className="notice notice-error" role="alert">{error} <button className="text-button" onClick={retry}>Retry</button></div>}
        {loading ? (
          <div className="feed-empty">Loading your profile…</div>
        ) : user && (
          <>
            <section className="profile-hero">
              <div className="profile-portrait">
                {user.profileImage ? <img src={user.profileImage} alt={`${user.name}'s profile`} /> : <span>{user.name?.charAt(0) || "?"}</span>}
              </div>
              <div className="profile-identity">
                <p className="eyebrow">YOUR LITTLE CORNER</p>
                <h1>{user.name}</h1>
                <p className="profile-handle">@{user.user_name}</p>
                {user.bio && <p className="profile-bio">{user.bio}</p>}
                <div className="profile-stats">
                  <span><strong>{user.posts?.length || posts.length}</strong> posts</span>
                  <span><strong>{user.followers?.length || 0}</strong> followers</span>
                  <span><strong>{user.following?.length || 0}</strong> following</span>
                </div>
              </div>
              <div className="profile-stamp">A PLACE<br />TO BE<br /><em>YOURSELF</em></div>
            </section>

            <div className="profile-columns">
              <section className="profile-posts">
                <div className="section-heading">
                  <div><p className="eyebrow">YOUR CONTRIBUTIONS</p><h2>Your posts</h2></div>
                  <span className="section-count">{posts.length.toString().padStart(2, "0")} POSTS</span>
                </div>
                {posts.length ? posts.map((post) => (
                  <article className="post-card" key={post._id}>
                    <header className="post-meta">
                      <span className="post-avatar">{user.name?.charAt(0) || "?"}</span>
                      <div><strong>{user.name}</strong><time>{post.createdAt ? new Date(post.createdAt).toLocaleString() : "Recently"}</time></div>
                    </header>
                    {post.image && <img className="post-image" src={post.image} alt="Post" />}
                    <p className="post-caption">{post.caption}</p>
                    <footer className="post-footer"><span>{post.likes?.length || 0} appreciations</span><span>COMMONPLACE / POST</span></footer>
                  </article>
                )) : (
                  <div className="feed-empty">
                    <span className="empty-spark">✳</span>
                    <h3>Your story starts here.</h3>
                    <p>When you share a post, it will find its way to this page.</p>
                    <Link className="button button-small" to="/">Write your first post <span>↗</span></Link>
                  </div>
                )}
              </section>

              <aside className="profile-details">
                <p className="eyebrow">ACCOUNT DETAILS</p>
                <dl>
                  <div><dt>Name</dt><dd>{user.name}</dd></div>
                  <div><dt>Username</dt><dd>@{user.user_name}</dd></div>
                  <div><dt>Email</dt><dd>{user.email}</dd></div>
                </dl>
                <p className="profile-unavailable">Profile editing and image uploads aren’t connected to an API route yet.</p>
              </aside>
            </div>
          </>
        )}
      </main>
      <footer className="site-footer">
        <span>COMMONPLACE © {new Date().getFullYear()}</span>
        <span>MADE FOR BEING HERE</span>
      </footer>
    </div>
  );
}

export default Profile;
