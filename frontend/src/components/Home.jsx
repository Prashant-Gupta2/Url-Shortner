
import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL;

export default function Home() {
  const [url, setUrl] = useState("");
  const [shortUrl, setShortUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const navigate = useNavigate();
  const location = useLocation();

 async function createShortUrl(originalUrl) {
  const token = localStorage.getItem("token");

  if (!token) {
    navigate("/auth", {
      state: { url: originalUrl, mode: "login" },
    });
    return;
  }

  try {
    setLoading(true);
    setError("");
    setShortUrl("");

  
const response = await axios.post(
  `${import.meta.env.VITE_API_URL}/api/shorten`,
  { originalUrl },
  {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  }
);


    // Use the short URL returned by your backend.
   
const result = response.data.shortUrl
  ? response.data.shortUrl.startsWith("http")
    ? response.data.shortUrl
    : `${API_URL}/api/shorten`
  : `${API_URL}/api/${response.data.shortCode}`;


    setShortUrl(result);
  } 
  catch (err) {
    setError(
      err.response?.data?.message || "Failed to shorten URL."
    );
  } finally {
    setLoading(false);
  }
}

  function handleShorten() {
    if (!url.trim()) {
      setError("Please enter a URL.");
      return;
    }

    try {
      const parsedUrl = new URL(url.trim());

      if (!["http:", "https:"].includes(parsedUrl.protocol)) {
        setError("Please enter a valid HTTP or HTTPS URL.");
        return;
      }

      setError("");
      createShortUrl(parsedUrl.href);
    } catch {
      setError("Please enter a valid URL, including https://");
    }
  }

  return (
    <div className="page">
      <nav className="navbar">
        <h2 className="logo">🔗 URL Shortener</h2>

        <div className="nav-actions">
          {localStorage.getItem("token") ? (
            <button
              className="login-btn"
              onClick={() => {
                localStorage.removeItem("token");
                localStorage.removeItem("user");
                setShortUrl("");
                navigate("/");
              }}
            >
              Log out
            </button>
          ) : (
            <>
              <button
                className="login-btn"
                onClick={() => navigate("/auth")}
              >
                Log in
              </button>

              <button
                className="signup-btn"
                onClick={() =>
                  navigate("/auth", {
                    state: { mode: "signup" },
                  })
                }
              >
                Sign up
              </button>
            </>
          )}
        </div>
      </nav>

      <main className="hero">
        <span className="tagline">
          SHORT LINKS. BIG POSSIBILITIES.
        </span>

        <h1>
          Make every link <span>count.</span>
        </h1>

        <p>
          Create short, memorable links in seconds.
          Simple, fast, and easy to share.
        </p>

        <div className="url-form">
          <input
            type="url"
            placeholder="Paste your long URL here..."
            value={url}
            onChange={(e) => setUrl(e.target.value)}
          />

          <button onClick={handleShorten} disabled={loading}>
            {loading ? "Shortening..." : "Shorten URL →"}
          </button>
        </div>

        {error && <p className="url-error">{error}</p>}

        {shortUrl && (
          <div className="short-result">
            <p>Your short URL is ready!</p>
            <a href={shortUrl} target="_blank" rel="noreferrer">
               {shortUrl}
            </a>
            <button className="copy-btn"
              onClick={() =>
                navigator.clipboard.writeText(shortUrl)
              }
            >
               Copy URL
            </button>
          </div>
        )}

        <small className="secure-text">
          🔒 Log in or sign up to create your short link
        </small>
      </main>

      <section className="features">
        <article className="feature-card">
          <h3>⚡ Fast & Simple</h3>
          <p>Turn long URLs into short links in seconds.</p>
        </article>

        <article className="feature-card">
          <h3>🔒 Secure Links</h3>
          <p>Keep your links organized and accessible.</p>
        </article>

        <article className="feature-card">
          <h3>📊 Click Analytics</h3>
          <p>Track clicks on your shortened links.</p>
        </article>
      </section>
    </div>
  );
}
