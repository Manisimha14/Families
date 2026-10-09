import { useContext, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { authinstance } from "../../lib/axiosinstance.js";
import { getCloudinaryImageProps } from "../../lib/cloudinaryImage.js";
import userContext from "../context/user.context.js";

function Discover() {
  const { user } = useContext(userContext);
  const [query, setQuery] = useState("");
  const [searchState, setSearchState] = useState({
    query: "",
    results: [],
    loading: false,
    error: "",
  });
  const [recommendations, setRecommendations] = useState([]);
  const [loadingRecommendations, setLoadingRecommendations] = useState(true);
  const [recommendationError, setRecommendationError] = useState("");
  const [followError, setFollowError] = useState("");
  const [pendingUsers, setPendingUsers] = useState({});
  const normalizedQuery = query.trim();
  const isSearchMode = normalizedQuery.length >= 2;

  useEffect(() => {
    let active = true;
    authinstance
      .get("/recommendations")
      .then((response) => {
        if (active) setRecommendations(response.data.users || []);
      })
      .catch((error) => {
        if (active) {
          setRecommendationError(
            error.response?.data?.message ||
              "Recommendations could not be loaded. Please try again.",
          );
        }
      })
      .finally(() => {
        if (active) setLoadingRecommendations(false);
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!isSearchMode) return undefined;

    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setSearchState({
        query: normalizedQuery,
        results: [],
        loading: true,
        error: "",
      });
      try {
        const response = await authinstance.get("/search", {
          params: { q: normalizedQuery },
          signal: controller.signal,
        });
        if (!controller.signal.aborted) {
          setSearchState({
            query: normalizedQuery,
            results: response.data.users || [],
            loading: false,
            error: "",
          });
        }
      } catch (error) {
        if (
          !controller.signal.aborted &&
          error.name !== "CanceledError" &&
          error.code !== "ERR_CANCELED"
        ) {
          setSearchState({
            query: normalizedQuery,
            results: [],
            loading: false,
            error:
              error.response?.data?.message ||
              "People could not be searched right now.",
          });
        }
      }
    }, 250);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [isSearchMode, normalizedQuery]);

  const activeSearch = searchState.query === normalizedQuery;
  const results = activeSearch ? searchState.results : [];
  const searching = isSearchMode && (!activeSearch || searchState.loading);
  const searchError = activeSearch ? searchState.error : "";

  const reloadRecommendations = async () => {
    setLoadingRecommendations(true);
    setRecommendationError("");
    try {
      const response = await authinstance.get("/recommendations");
      setRecommendations(response.data.users || []);
    } catch (error) {
      setRecommendationError(
        error.response?.data?.message ||
          "Recommendations could not be loaded. Please try again.",
      );
    } finally {
      setLoadingRecommendations(false);
    }
  };

  const toggleFollow = async (person) => {
    if (pendingUsers[person._id]) return;
    setPendingUsers((current) => ({ ...current, [person._id]: true }));
    setFollowError("");
    try {
      const endpoint = `/${encodeURIComponent(person._id)}/follow`;
      const response = person.isFollowing
        ? await authinstance.delete(endpoint)
        : await authinstance.post(endpoint);
      const isFollowing = response.data.following;
      const updatePerson = (candidate) =>
        candidate._id === person._id
          ? {
              ...candidate,
              isFollowing,
              followerCount: Math.max(
                0,
                candidate.followerCount + (isFollowing ? 1 : -1),
              ),
            }
          : candidate;
      setSearchState((current) => ({
        ...current,
        results: current.results.map(updatePerson),
      }));
      setRecommendations((current) => current.map(updatePerson));
    } catch (error) {
      setFollowError(
        error.response?.data?.message ||
          "That follow update could not be saved. Please try again.",
      );
    } finally {
      setPendingUsers((current) => ({ ...current, [person._id]: false }));
    }
  };

  const people = isSearchMode ? results : recommendations;

  return (
    <div className="app-shell feed-shell discover-shell">
      <header className="topbar">
        <Link className="wordmark" to="/">
          COMMON<span>PLACE</span>
        </Link>
        <nav className="topbar-actions" aria-label="Main navigation">
          <Link aria-current="page" className="nav-link" to="/discover">Find people</Link>
          <Link className="nav-link profile-nav-link" to="/profile">Your profile</Link>
          <Link aria-label="Your profile" className="nav-avatar" to="/profile">
            {user?.name?.charAt(0) || "?"}
          </Link>
        </nav>
      </header>

      <main className="discover-page">
        <div className="discover-intro">
          <p className="eyebrow">COMMONPLACE / PEOPLE</p>
          <h1>Find your people.</h1>
          <p>Search for someone you know, or meet a few new corners of the community.</p>
        </div>

        <form className="discover-search" role="search" onSubmit={(event) => event.preventDefault()}>
          <label htmlFor="people-search">Search people</label>
          <div className="discover-search-control">
            <span aria-hidden="true" className="search-glyph">⌕</span>
            <input
              autoComplete="off"
              id="people-search"
              maxLength={80}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Name or @username"
              type="search"
              value={query}
            />
            {query && (
              <button
                aria-label="Clear search"
                className="discover-clear"
                onClick={() => setQuery("")}
                type="button"
              >
                Clear
              </button>
            )}
          </div>
          <p className="discover-hint">Type at least 2 characters to search.</p>
        </form>

        <section aria-labelledby="people-heading" className="discover-results">
          <div className="discover-section-heading">
            <div>
              <p className="eyebrow">{isSearchMode ? "SEARCH RESULTS" : "A GOOD PLACE TO START"}</p>
              <h2 id="people-heading">
                {isSearchMode ? `People matching “${normalizedQuery}”` : "People you might like"}
              </h2>
            </div>
            {!isSearchMode && (
              <button
                className="discover-refresh"
                disabled={loadingRecommendations}
                onClick={reloadRecommendations}
                type="button"
              >
                Refresh suggestions
              </button>
            )}
          </div>

          {followError && <p className="discover-error" role="alert">{followError}</p>}
          {searchError && <p className="discover-error" role="alert">{searchError}</p>}
          {recommendationError && !isSearchMode && (
            <div className="discover-error-panel" role="alert">
              <p>{recommendationError}</p>
              <button className="discover-refresh" onClick={reloadRecommendations} type="button">
                Try again
              </button>
            </div>
          )}

          {(searching || (!isSearchMode && loadingRecommendations)) && (
            <p className="discover-status" role="status">
              {isSearchMode ? "Looking for people…" : "Finding people you may know…"}
            </p>
          )}

          {!searching && !searchError && isSearchMode && results.length === 0 && (
            <div className="discover-empty">
              <span aria-hidden="true">⌕</span>
              <h3>No matches yet</h3>
              <p>Try a different name or username.</p>
            </div>
          )}

          {!isSearchMode && !loadingRecommendations && !recommendationError && recommendations.length === 0 && (
            <div className="discover-empty">
              <span aria-hidden="true">◎</span>
              <h3>You’re all caught up</h3>
              <p>Search for someone by name or username to find them here.</p>
            </div>
          )}

          {people.length > 0 && (
            <ul className="people-grid">
              {people.map((person) => (
                <li className="person-card" key={person._id}>
                  <Link
                    aria-label={`View ${person.name}'s profile`}
                    className="person-avatar"
                    to={`/profile/${encodeURIComponent(person.user_name)}`}
                  >
                    {person.profileImage ? (
                      <img
                        {...getCloudinaryImageProps(person.profileImage, [96, 192], "64px")}
                        alt=""
                        loading="lazy"
                        decoding="async"
                      />
                    ) : (
                      <span>{person.name?.charAt(0) || "?"}</span>
                    )}
                  </Link>
                  <div className="person-details">
                    <Link className="person-name" to={`/profile/${encodeURIComponent(person.user_name)}`}>
                      {person.name}
                    </Link>
                    <p className="person-handle">@{person.user_name}</p>
                    {person.bio && <p className="person-bio">{person.bio}</p>}
                    <p className="person-context">
                      {person.mutualCount > 0
                        ? `${person.mutualCount} mutual ${person.mutualCount === 1 ? "connection" : "connections"}`
                        : person.reason === "Popular in Commonplace"
                          ? person.reason
                          : `${person.followerCount} ${person.followerCount === 1 ? "follower" : "followers"}`}
                    </p>
                  </div>
                  <button
                    aria-label={`${person.isFollowing ? "Unfollow" : "Follow"} ${person.name}`}
                    aria-pressed={person.isFollowing}
                    aria-busy={Boolean(pendingUsers[person._id])}
                    className={`person-follow${person.isFollowing ? " is-following" : ""}`}
                    disabled={Boolean(pendingUsers[person._id])}
                    onClick={() => toggleFollow(person)}
                    type="button"
                  >
                    {pendingUsers[person._id]
                      ? "Saving…"
                      : person.isFollowing
                        ? "Following"
                        : "Follow"}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>

      <footer className="site-footer">
        <span>COMMONPLACE © {new Date().getFullYear()}</span>
        <span>MADE FOR BEING HERE</span>
      </footer>
    </div>
  );
}

export default Discover;
