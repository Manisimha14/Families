import {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Link } from "react-router-dom";
import { postInstance, storyInstance } from "../../lib/axiosinstance.js";
import { getCloudinaryImageProps } from "../../lib/cloudinaryImage.js";
import userContext from "../context/user.context.js";

const getMessage = (error, fallback) =>
  error.response?.data?.message || fallback;

function HomeDashboard() {
  const { user, loading: sessionLoading, error: sessionError } =
    useContext(userContext);
  const [posts, setPosts] = useState([]);
  const [stories, setStories] = useState([]);
  const [caption, setCaption] = useState("");
  const [postImage, setPostImage] = useState(null);
  const [storyCaption, setStoryCaption] = useState("");
  const [storyImage, setStoryImage] = useState(null);
  const [activeStoryIndex, setActiveStoryIndex] = useState(null);
  const [likingPosts, setLikingPosts] = useState({});
  const [likeError, setLikeError] = useState("");
  const [feedMode, setFeedMode] = useState("all");
  const [feedLoading, setFeedLoading] = useState(false);
  const [feedError, setFeedError] = useState("");
  const [storyError, setStoryError] = useState("");
  const [postError, setPostError] = useState("");
  const [posting, setPosting] = useState(false);
  const [sharingStory, setSharingStory] = useState(false);
  const storyFileRef = useRef(null);
  const postFileRef = useRef(null);
  const storyPreview = useMemo(
    () => (storyImage ? URL.createObjectURL(storyImage) : ""),
    [storyImage],
  );
  const postPreview = useMemo(
    () => (postImage ? URL.createObjectURL(postImage) : ""),
    [postImage],
  );

  useEffect(() => {
    return () => {
      if (storyPreview) URL.revokeObjectURL(storyPreview);
      if (postPreview) URL.revokeObjectURL(postPreview);
    };
  }, [postPreview, storyPreview]);

  const loadSocialContent = useCallback(async () => {
    setFeedLoading(true);
    setFeedError("");
    setStoryError("");
    const [postResult, storyResult] = await Promise.allSettled([
      postInstance.get(feedMode === "circle" ? "/feed" : "/posts"),
      storyInstance.get("/getStory"),
    ]);

    if (postResult.status === "fulfilled") {
      setPosts(postResult.value.data.posts || []);
    } else {
      setFeedError(
        getMessage(postResult.reason, "Could not load posts. Please retry."),
      );
    }

    if (storyResult.status === "fulfilled") {
      setStories(storyResult.value.data.stories || []);
    } else {
      setStoryError(
        getMessage(storyResult.reason, "Could not load stories. Please retry."),
      );
    }
    setFeedLoading(false);
  }, [feedMode]);

  useEffect(() => {
    if (!user) return undefined;
    const timer = window.setTimeout(() => loadSocialContent(), 0);
    return () => window.clearTimeout(timer);
  }, [loadSocialContent, user]);

  useEffect(() => {
    if (activeStoryIndex === null) return undefined;
    const handleKeyDown = (event) => {
      if (event.key === "Escape") setActiveStoryIndex(null);
      if (event.key === "ArrowRight") {
        setActiveStoryIndex((index) =>
          index === null ? null : Math.min(index + 1, stories.length - 1),
        );
      }
      if (event.key === "ArrowLeft") {
        setActiveStoryIndex((index) =>
          index === null ? null : Math.max(index - 1, 0),
        );
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeStoryIndex, stories.length]);

  const createPost = async (event) => {
    event.preventDefault();
    setPosting(true);
    setPostError("");
    try {
      const data = new FormData();
      data.append("caption", caption.trim());
      if (postImage) data.append("image", postImage);
      await postInstance.post("/post", data);
      setCaption("");
      setPostImage(null);
      if (postFileRef.current) postFileRef.current.value = "";
      await loadSocialContent();
    } catch (error) {
      setPostError(getMessage(error, "Your post could not be published."));
    } finally {
      setPosting(false);
    }
  };

  const toggleLike = async (postId) => {
    if (likingPosts[postId]) return;
    setLikingPosts((current) => ({ ...current, [postId]: true }));
    setLikeError("");
    try {
      const response = await postInstance.post(`/${postId}/like`);
      const { liked, totallikes } = response.data;
      setPosts((currentPosts) =>
        currentPosts.map((post) => {
          if (post._id !== postId) return post;
          const currentLikes = post.likes || [];
          const userAlreadyInList = currentLikes.some(
            (likedUser) =>
              String(likedUser?._id || likedUser) === String(user._id),
          );
          let nextLikes = currentLikes;
          if (liked && !userAlreadyInList) {
            nextLikes = [...currentLikes, user._id];
          } else if (!liked && userAlreadyInList) {
            nextLikes = currentLikes.filter(
              (likedUser) =>
                String(likedUser?._id || likedUser) !== String(user._id),
            );
          }
          return {
            ...post,
            likes: nextLikes,
            likeCount: totallikes,
          };
        }),
      );
    } catch (error) {
      setLikeError(getMessage(error, "Your like could not be saved. Please retry."));
    } finally {
      setLikingPosts((current) => ({ ...current, [postId]: false }));
    }
  };

  const createStory = async (event) => {
    event.preventDefault();
    if (!storyImage || !storyCaption.trim()) {
      setStoryError("Choose an image and add a caption to share a story.");
      return;
    }
    if (storyImage.size > 10 * 1024 * 1024) {
      setStoryError("Choose an image smaller than 10 MB.");
      return;
    }
    const data = new FormData();
    data.append("caption", storyCaption);
    data.append("image", storyImage);
    setSharingStory(true);
    setStoryError("");
    try {
      await storyInstance.post("/createStory", data);
      setStoryCaption("");
      setStoryImage(null);
      if (storyFileRef.current) storyFileRef.current.value = "";
      await loadSocialContent();
    } catch (error) {
      setStoryError(getMessage(error, "Your story could not be shared."));
    } finally {
      setSharingStory(false);
    }
  };

  return (
    <div className="app-shell feed-shell">
      <header className="topbar">
        <Link className="wordmark" to="/">
          COMMON<span>PLACE</span>
        </Link>
        <span className="topbar-note">A little room for what matters</span>
        <nav className="topbar-actions" aria-label="Main navigation">
          {user ? (
            <>
              <Link className="nav-link" to="/discover">Find people</Link>
              <Link className="nav-link profile-nav-link" to="/profile">Your profile</Link>
              <Link aria-label="Your profile" className="nav-avatar" to="/profile">
                {user.name?.charAt(0) || "?"}
              </Link>
            </>
          ) : (
            <>
              <Link className="nav-link" to="/login">Sign in</Link>
              <Link className="button button-small" to="/register">Join us</Link>
            </>
          )}
        </nav>
      </header>
      {sessionError && (
        <div className="session-notice" role="alert">{sessionError}</div>
      )}

      {!user ? (
        <main className="landing">
          <section className="landing-copy">
            <p className="eyebrow"><span className="eyebrow-dot" /> YOUR SOCIAL SPACE</p>
            <h1>A place to<br />be <em>in the mix.</em></h1>
            <p className="landing-intro">
              Share small moments, catch up with your people, and keep a little
              record of the things you want to remember.
            </p>
            <div className="landing-actions">
              <Link className="button" to="/register">Make your space <span>↗</span></Link>
              <Link className="quiet-link" to="/login">Already have an account? Sign in</Link>
            </div>
            <div className="landing-footnote">NO NOISE. JUST YOUR CORNER OF THE INTERNET.</div>
          </section>
          <aside className="landing-art" aria-label="A glimpse of the Commonplace community">
            <div className="art-orbit orbit-one" />
            <div className="art-orbit orbit-two" />
            <div className="art-sun" />
            <div className="art-note note-top">good things<br />grow together</div>
            <div className="art-note note-bottom">a softer place<br />to show up</div>
            <div className="art-index">FIELD NOTES&nbsp; / &nbsp;001</div>
          </aside>
        </main>
      ) : (
        <main className="dashboard">
          <section className="welcome-line">
            <div>
              <p className="eyebrow"><span className="eyebrow-dot" /> YOUR COMMONPLACE</p>
              <h1>Good to see you, <em>{user.name?.split(" ")[0]}.</em></h1>
            </div>
            <p className="welcome-date">
              {new Intl.DateTimeFormat(undefined, {
                weekday: "long",
                month: "long",
                day: "numeric",
              }).format(new Date())}
            </p>
          </section>

          <section className="stories-section">
            <div className="section-heading">
              <div>
                <p className="eyebrow">THE LAST 24 HOURS</p>
                <h2>Little moments</h2>
              </div>
              <span className="section-count">{stories.length.toString().padStart(2, "0")} STORIES</span>
            </div>
            <div className="story-row">
              <form className="story-create" onSubmit={createStory}>
                <label className="story-image-picker" htmlFor="story-image">
                  {storyImage ? (
                    <img src={storyPreview} alt="Selected story preview" />
                  ) : (
                    <span className="story-add">+</span>
                  )}
                  <span>{storyImage ? "Change image" : "Add a moment"}</span>
                </label>
                <input
                  className="visually-hidden"
                  ref={storyFileRef}
                  id="story-image"
                  type="file"
                  accept="image/*"
                  onChange={(event) => setStoryImage(event.target.files?.[0] || null)}
                />
                {storyImage && (
                  <div className="story-caption-row">
                    <input
                      aria-label="Story caption"
                      maxLength={200}
                      placeholder="A few words…"
                      value={storyCaption}
                      required
                      onChange={(event) => setStoryCaption(event.target.value)}
                    />
                    <button className="text-button" disabled={sharingStory}>
                      {sharingStory ? "Sharing…" : "Share"}
                    </button>
                  </div>
                )}
              </form>
              {stories.map((story, index) => (
                <button
                  className="story-tile"
                  key={story._id}
                  type="button"
                  onClick={() => setActiveStoryIndex(index)}
                  aria-label={`View story by ${story.author?.user_name || "community member"}`}
                >
                  {story.image ? (
                    <img
                      {...getCloudinaryImageProps(story.image, [128, 256], "(max-width: 600px) 72px, 180px")}
                      alt=""
                      loading="lazy"
                      decoding="async"
                    />
                  ) : (
                    <span className="story-placeholder">A moment</span>
                  )}
                  <span className="story-tile-caption">
                    <span>@{story.author?.user_name || "someone"}</span>
                    {story.caption && <span className="story-tile-text">{story.caption}</span>}
                  </span>
                </button>
              ))}
              {!stories.length && !feedLoading && (
                <div className="empty-stories">The first story could be yours.</div>
              )}
            </div>
            {storyError && <div className="notice notice-error" role="alert">{storyError}</div>}
          </section>

          <div className="content-grid">
            <section className="feed-section">
              <div className="section-heading">
                <div>
                  <p className="eyebrow">FROM AROUND HERE</p>
                  <h2>The feed</h2>
                </div>
                <div className="feed-controls">
                  <div className="feed-toggle" role="group" aria-label="Choose feed">
                    <button
                      className={feedMode === "all" ? "active" : ""}
                      onClick={() => setFeedMode("all")}
                      aria-pressed={feedMode === "all"}
                    >
                      All posts
                    </button>
                    <button
                      className={feedMode === "circle" ? "active" : ""}
                      onClick={() => setFeedMode("circle")}
                      aria-pressed={feedMode === "circle"}
                    >
                      My circle
                    </button>
                  </div>
                  <button className="text-button" onClick={loadSocialContent} disabled={feedLoading}>
                    {feedLoading ? "Refreshing…" : "Refresh ↻"}
                  </button>
                </div>
              </div>

              <form className="compose-card" onSubmit={createPost}>
                <div className="compose-heading">
                  <span className="nav-avatar">{user.name?.charAt(0) || "?"}</span>
                  <div><strong>Put something out there.</strong><span>Keep it under 500 characters.</span></div>
                </div>
                <textarea
                  aria-label="Post caption"
                  maxLength={500}
                  placeholder="What’s on your mind?"
                  value={caption}
                  onChange={(event) => setCaption(event.target.value)}
                  required
                />
                <div className="post-image-compose">
                  <label className="image-attach-button" htmlFor="post-image">
                    <span aria-hidden="true">＋</span> Add photo
                  </label>
                  <input
                    ref={postFileRef}
                    className="visually-hidden"
                    id="post-image"
                    type="file"
                    accept="image/*"
                    onChange={(event) => {
                      const image = event.target.files?.[0] || null;
                      if (image && !image.type.startsWith("image/")) {
                        setPostError("Choose an image file to attach.");
                        setPostImage(null);
                        event.target.value = "";
                        return;
                      }
                      if (image && image.size > 10 * 1024 * 1024) {
                        setPostError("Choose an image smaller than 10 MB.");
                        setPostImage(null);
                        event.target.value = "";
                        return;
                      }
                      setPostImage(image);
                      setPostError("");
                    }}
                  />
                  {postImage && (
                    <div className="post-image-preview">
                      <img src={postPreview} alt="Selected post image preview" />
                      <div>
                        <span>{postImage.name}</span>
                        <button
                          className="text-button"
                          type="button"
                          onClick={() => {
                            setPostImage(null);
                            if (postFileRef.current) postFileRef.current.value = "";
                          }}
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  )}
                </div>
                <p className="upload-guidance">Optional image · up to 10 MB</p>
                <div className="compose-footer">
                  <span>{caption.length}/500</span>
                  <button className="button button-small" disabled={posting || !caption.trim()}>
                    {posting ? "Publishing…" : "Publish post"} <span>↗</span>
                  </button>
                </div>
                {postError && <p className="form-error" role="alert">{postError}</p>}
              </form>

              {feedError && (
                <div className="notice notice-error" role="alert">
                  {feedError} <button className="text-button" onClick={loadSocialContent}>Try again</button>
                </div>
              )}
              {likeError && (
                <div className="notice notice-error" role="alert">{likeError}</div>
              )}
              {feedLoading && <div className="feed-empty">Gathering the latest…</div>}
              {!feedLoading && !feedError && posts.length === 0 && (
                <div className="feed-empty">
                  <span className="empty-spark">✳</span>
                  <h3>It’s quiet here.</h3>
                  <p>Share a thought to start the conversation.</p>
                </div>
              )}
              {!feedLoading && posts.map((post) => {
                const liked = (post.likes || []).some(
                  (likedUser) =>
                    String(likedUser?._id || likedUser) === String(user._id),
                );
                const count = post.likeCount ?? post.likes?.length ?? 0;

                return (
                  <article className="post-card" key={post._id}>
                    <header className="post-meta">
                      <span className="post-avatar">{post.author?.name?.charAt(0) || "?"}</span>
                      <div>
                        <strong>{post.author?.name || "Community member"}</strong>
                        <time>{post.createdAt ? new Date(post.createdAt).toLocaleString() : "Just now"}</time>
                      </div>
                      <span className="post-mark">✳</span>
                    </header>
                    {post.image && (
                      <img
                        className="post-image"
                        {...getCloudinaryImageProps(post.image, [480, 768, 1200], "(max-width: 700px) 100vw, 600px")}
                        alt="Post"
                        loading="lazy"
                        decoding="async"
                      />
                    )}
                    <p className="post-caption">{post.caption}</p>
                    <footer className="post-footer">
                      <button
                        className={`like-button${liked ? " is-liked" : ""}`}
                        type="button"
                        onClick={() => toggleLike(post._id)}
                        disabled={Boolean(likingPosts[post._id])}
                        aria-pressed={liked}
                        title={liked ? "Unlike this post" : "Like this post"}
                      >
                        <span aria-hidden="true">{liked ? "♥" : "♡"}</span>
                        {count} appreciations
                      </button>
                      <span>COMMONPLACE / POST</span>
                    </footer>
                  </article>
                );
              })}
            </section>

            <aside className="sidebar">
              <section className="profile-mini">
                <p className="eyebrow">YOUR CORNER</p>
                <div className="profile-mini-avatar">
                  {user.profileImage ? (
                    <img
                      {...getCloudinaryImageProps(user.profileImage, [128, 256], "128px")}
                      alt=""
                      loading="lazy"
                      decoding="async"
                    />
                  ) : user.name?.charAt(0)}
                </div>
                <h3>{user.name}</h3>
                <p>@{user.user_name}</p>
                {user.bio && <p className="profile-bio">{user.bio}</p>}
                <div className="profile-stats">
                  <span><strong>{user.posts?.length || 0}</strong> posts</span>
                  <span><strong>{user.followers?.length || 0}</strong> followers</span>
                </div>
                <Link className="outline-link" to="/profile">View your profile <span>↗</span></Link>
              </section>
              <div className="sidebar-note">
                <span className="note-flower">✳</span>
                <p>Good things happen when we make room for each other.</p>
                <span className="note-signature">— THE COMMONPLACE IDEA</span>
              </div>
              <div className="sidebar-caption">A SMALL SOCIAL NETWORK FOR YOUR PEOPLE.</div>
            </aside>
          </div>
        </main>
      )}

      {activeStoryIndex !== null && stories[activeStoryIndex] && (
        <div
          className="story-viewer-backdrop"
          role="presentation"
          onClick={(event) => {
            if (event.target === event.currentTarget) setActiveStoryIndex(null);
          }}
        >
          <section
            className="story-viewer"
            role="dialog"
            aria-modal="true"
            aria-label={`Story by ${stories[activeStoryIndex].author?.user_name || "community member"}`}
          >
            <div className="story-progress" aria-hidden="true">
              {stories.map((story, index) => (
                <span key={story._id} className={index <= activeStoryIndex ? "is-seen" : ""} />
              ))}
            </div>
            <header className="story-viewer-header">
              <span className="story-viewer-avatar">
                {stories[activeStoryIndex].author?.user_name?.charAt(0) || "?"}
              </span>
              <strong>@{stories[activeStoryIndex].author?.user_name || "someone"}</strong>
              <button
                className="story-close"
                type="button"
                onClick={() => setActiveStoryIndex(null)}
                aria-label="Close story"
              >
                ×
              </button>
            </header>
            {stories[activeStoryIndex].image && (
              <img
                className="story-viewer-image"
                {...getCloudinaryImageProps(stories[activeStoryIndex].image, [480, 768, 1200], "(max-width: 600px) 100vw, 480px")}
                alt={stories[activeStoryIndex].caption || "Story"}
                decoding="async"
              />
            )}
            {stories[activeStoryIndex].caption && (
              <p className="story-viewer-caption">{stories[activeStoryIndex].caption}</p>
            )}
            {activeStoryIndex > 0 && (
              <button
                className="story-nav story-nav-prev"
                type="button"
                onClick={() => setActiveStoryIndex((index) => Math.max(index - 1, 0))}
                aria-label="Previous story"
              >
                ‹
              </button>
            )}
            {activeStoryIndex < stories.length - 1 && (
              <button
                className="story-nav story-nav-next"
                type="button"
                onClick={() =>
                  setActiveStoryIndex((index) =>
                    Math.min(index + 1, stories.length - 1),
                  )
                }
                aria-label="Next story"
              >
                ›
              </button>
            )}
          </section>
        </div>
      )}

      {sessionLoading && <div className="session-progress" aria-label="Checking session" />}
      <footer className="site-footer">
        <span>COMMONPLACE © {new Date().getFullYear()}</span>
        <span>MADE FOR BEING HERE</span>
      </footer>
    </div>
  );
}

export default HomeDashboard;
