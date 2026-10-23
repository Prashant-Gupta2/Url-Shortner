import { useState, useEffect } from "react";
import {
  useLocation,
  useNavigate,
  useParams,
} from "react-router-dom";
import axios from "axios";

const BASE_URL = import.meta.env.VITE_API_URL?.replace(/\/+$/, "");

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
  },
});

export default function Auth() {
  const location = useLocation();
  const navigate = useNavigate();
  const { token } = useParams();

  const [mode, setMode] = useState(
    token ? "reset" : location.state?.mode || "login"
  );

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (token) {
      setMode("reset");
    }
  }, [token]);

  // Clear previous messages when changing modes.
  function changeMode(nextMode) {
    setError("");
    setSuccess("");
    setMode(nextMode);
  }

  async function handleSubmit(e) {
    e.preventDefault();

    if (loading) return;

    setError("");
    setSuccess("");

    if (!BASE_URL) {
      setError("Server configuration error. Please try again later.");
      return;
    }

    const normalizedEmail = email.trim().toLowerCase();
    const trimmedName = name.trim();

    if (mode !== "reset" && !normalizedEmail) {
      setError("Please enter your email address.");
      return;
    }

    if (mode === "signup" && !trimmedName) {
      setError("Please enter your name.");
      return;
    }

    if (
      ["signup", "reset"].includes(mode) &&
      (password.length < 8 || password.length > 128)
    ) {
      setError("Password must be between 8 and 128 characters.");
      return;
    }

    if (["login", "signup"].includes(mode) && !password) {
      setError("Please enter your password.");
      return;
    }

    setLoading(true);

    try {
      // 1. Forgot password
      if (mode === "forgot") {
        const response = await api.post("/api/forget-password", {
          email: normalizedEmail,
        });

        setSuccess(
          response.data?.message ||
            "If an account exists, a reset link will be sent."
        );

        return;
      }

      // 2. Reset password
      if (mode === "reset") {
        if (!token) {
          setError(
            "Reset token is missing. Please use the link from your email."
          );
          return;
        }

        const response = await api.post(
          `/api/reset-password/${encodeURIComponent(token)}`,
          { password }
        );

        setPassword("");
        setSuccess(
          response.data?.message || "Password reset successfully."
        );

        // Remove the token from the address bar immediately.
        navigate("/auth", {
          replace: true,
          state: {
            mode: "login",
            resetMessage:
              response.data?.message ||
              "Password reset successfully. Please log in.",
          },
        });

        return;
      }

      // 3. Signup
      if (mode === "signup") {
        const response = await api.post("/api/auth/signup", {
          name: trimmedName,
          email: normalizedEmail,
          password,
        });

        setSuccess(
          response.data?.message ||
            "Signup successful. Please log in."
        );

        setMode("login");
        setName("");
        setEmail("");
        setPassword("");

        return;
      }

      // 4. Login
      const response = await api.post("/api/auth/signin", {
        email: normalizedEmail,
        password,
      });

      const { token: authToken, user } = response.data || {};

      if (!authToken || !user) {
        throw new Error("Invalid authentication response.");
      }

      // Retained for compatibility with your current application.
      localStorage.setItem("token", authToken);
      localStorage.setItem("user", JSON.stringify(user));

      navigate("/", { replace: true });
    } catch (err) {
      // Do not log credentials, tokens, reset links, or response bodies.
      if (err.response) {
        setError(
          err.response.data?.message ||
            "Request failed. Please try again."
        );
      } else if (err.code === "ECONNABORTED") {
        setError(
          "The request timed out. Please try again."
        );
      } else if (err instanceof Error &&
                 err.message === "Invalid authentication response.") {
        setError(
          "Unable to log in. Please try again."
        );
      } else {
        setError(
          "Unable to connect to the server. Please try again."
        );
      }
    } finally {
      setLoading(false);
    }
  }

  const isReset = mode === "reset";

  return (
    <div className="auth-page">
      <button
        type="button"
        className="back-btn"
        onClick={() => navigate("/")}
        disabled={loading}
      >
        ← Back to home
      </button>

      <form
        className="auth-card"
        onSubmit={handleSubmit}
        noValidate
      >
        <h2>
          {mode === "login"
            ? "Welcome back!"
            : mode === "signup"
            ? "Create account"
            : mode === "forgot"
            ? "Forgot password?"
            : "Reset your password"}
        </h2>

        <p>
          {mode === "login"
            ? "Log in to create your short links."
            : mode === "signup"
            ? "Create your account to get started."
            : mode === "forgot"
            ? "Enter your email to receive a reset link."
            : "Enter your new password below."}
        </p>

        {error && (
          <p className="error-message" role="alert">
            {error}
          </p>
        )}

        {success && (
          <p className="success-message" role="status">
            {success}
          </p>
        )}

        {mode === "signup" && (
          <input
            type="text"
            placeholder="Your name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoComplete="name"
            maxLength={100}
            required
            disabled={loading}
          />
        )}

        {mode !== "reset" && (
          <input
            type="email"
            placeholder="Email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            maxLength={254}
            required
            disabled={loading}
          />
        )}

        {mode !== "forgot" && (
          <input
            type="password"
            placeholder={
              isReset ? "New password" : "Password"
            }
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            minLength={
              ["signup", "reset"].includes(mode) ? 8 : undefined
            }
            maxLength={128}
            autoComplete={
              isReset
                ? "new-password"
                : mode === "login"
                ? "current-password"
                : "new-password"
            }
            required
            disabled={loading}
          />
        )}

        {mode === "login" && (
          <button
            type="button"
            className="text-btn forgot-btn"
            onClick={() => changeMode("forgot")}
            disabled={loading}
          >
            Forgot password?
          </button>
        )}

        <button
          className="signup-btn full-btn"
          type="submit"
          disabled={loading}
        >
          {loading
            ? "Please wait..."
            : mode === "login"
            ? "Log in"
            : mode === "signup"
            ? "Create account"
            : mode === "forgot"
            ? "Send reset link"
            : "Reset password"}
        </button>

        <p className="switch-text">
          {mode === "forgot" ? (
            <button
              type="button"
              className="text-btn"
              onClick={() => changeMode("login")}
              disabled={loading}
            >
              ← Back to login
            </button>
          ) : mode === "reset" ? (
            <button
              type="button"
              className="text-btn"
              onClick={() =>
                navigate("/auth", {
                  replace: true,
                  state: { mode: "login" },
                })
              }
              disabled={loading}
            >
              ← Back to login
            </button>
          ) : (
            <>
              {mode === "login"
                ? "Don't have an account?"
                : "Already have an account?"}{" "}

              <button
                type="button"
                className="text-btn"
                onClick={() =>
                  changeMode(
                    mode === "login" ? "signup" : "login"
                  )
                }
                disabled={loading}
              >
                {mode === "login" ? "Sign up" : "Log in"}
              </button>
            </>
          )}
        </p>
      </form>
    </div>
  );
}
