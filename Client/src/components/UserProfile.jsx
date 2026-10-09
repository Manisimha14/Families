import { useContext, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { authinstance, postInstance } from "../../lib/axiosinstance.js";
import userContext from "../context/user.context.js";

function UserProfile() {
  const { user_name: userName } = useParams();
  const { user: currentUser } = useContext(userContext);
  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [postsError, setPostsError] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    const loadProfile = async () => {
      setLoading(true);
      setError("");
      try {
        const response = await authinstance.get(
          `/profile/${encodeURIComponent(userName)}`,
        );
        if (!active) return;
        const profileData = response.data.user;
        setProfile(profileData);
        if (currentUser) {
          try {
            const postResponse = await postInstance.get("/posts");
            if (!active) return;
            setPosts((postResponse.data.posts || []).filter(
              (post) => post.author?._id === profileData._id,
            ));
          } catch (postRequestError) {
            setPosts([]);
            setPostsError(
              postRequestError.response?.data?.message ||
                "Posts could not be loaded right now.",
            );
          }
        }
      } catch (requestError) {
        if (active) {
          setError(
            requestError.response?.data?.message ||
              "This profile could not be loaded.",
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    };
    loadProfile();
    return () => { active = false; };
  }, [currentUser, userName]);

  return (
    <div className="app-shell">
      <header className="topbar">
        <Link className="wordmark" to="/">COMMON<span>PLACE</span></Link>
        <nav className="topbar-actions" aria-label="Main navigation">
          {currentUser ? (
            <>
              <Link className="nav-link" to="/discover">Find people</Link>
              <Link aria-label="Your profile" className="nav-avatar" to="/profile">
                {currentUser.name?.charAt(0) || "?"}
              </Link>
            </>
          ) : (
            <Link className="button button-small" to="/login">Sign in</Link>
          )}
        </nav>
      </header>
      <main className="profile-page public-profile">
        <div className="profile-kicker">
          <Link className="quiet-link" to="/">← Back to the feed</Link>
          <span>COMMUNITY / PROFILE</span>
        </div>
        {loading ? (
          <div className="feed-empty">Finding this corner…</div>
        ) : error || !profile ? (
          <div className="feed-empty">
            <span className="empty-spark">✳</span>
            <h3>We couldn’t find that person.</h3>
            <p>{error || "This profile may no longer be here."}</p>
            <Link className="button button-small" to="/">Back to the feed <span>↗</span></Link>
          </div>
        ) : (
          <>
            <section className="profile-hero">
              <div className="profile-portrait">
                {profile.profileImage ? <img src={profile.profileImage} alt={`${profile.name}'s profile`} /> : <span>{profile.name?.charAt(0) || "?"}</span>}
              </div>
              <div className="profile-identity">
                <p className="eyebrow">A MEMBER OF COMMONPLACE</p>
                <h1>{profile.name}</h1>
                <p className="profile-handle">@{profile.user_name}</p>
                {profile.bio && <p className="profile-bio">{profile.bio}</p>}
                <div className="profile-stats">
                  <span><strong>{profile.posts?.length || 0}</strong> posts</span>
                  <span><strong>{profile.followers?.length || 0}</strong> followers</span>
                  <span><strong>{profile.following?.length || 0}</strong> following</span>
                </div>
              </div>
              <div className="profile-stamp">A PLACE<br />TO BE<br /><em>YOURSELF</em></div>
            </section>
            {currentUser ? (
              <section className="profile-posts public-posts">
                <div className="section-heading">
                  <div><p className="eyebrow">SHARED HERE</p><h2>Posts</h2></div>
                  <span className="section-count">{posts.length.toString().padStart(2, "0")} POSTS</span>
                </div>
                {postsError && (
                  <div className="notice notice-error" role="alert">{postsError}</div>
                )}
                {posts.length ? posts.map((post) => (
                  <article className="post-card" key={post._id}>
                    <header className="post-meta">
                      <span className="post-avatar">{profile.name?.charAt(0) || "?"}</span>
                      <div><strong>{profile.name}</strong><time>{post.createdAt ? new Date(post.createdAt).toLocaleString() : "Recently"}</time></div>
                    </header>
                    {post.image && <img className="post-image" src={post.image} alt="Post" />}
                    <p className="post-caption">{post.caption}</p>
                    <footer className="post-footer"><span>{post.likes?.length || 0} appreciations</span><span>COMMONPLACE / POST</span></footer>
                  </article>
                )) : (
                  <div className="feed-empty"><p>No posts to show just yet.</p></div>
                )}
              </section>
            ) : (
              <div className="profile-private-note">
                <span className="note-flower">✳</span>
                <p>Sign in to join the conversation and see the community feed.</p>
                <Link className="button button-small" to="/login">Sign in <span>↗</span></Link>
              </div>
            )}
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

export default UserProfile;
