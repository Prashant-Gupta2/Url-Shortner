
import { useState, useEffect } from "react";
import {
  useLocation,
  useNavigate,
  useParams,
} from "react-router-dom";
import axios from "axios";

const API_URL = "http://localhost:4000/api/auth";
const RESET_API_URL = "http://localhost:4000/api";

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

  async function handleSubmit(e) {
    e.preventDefault();

    setError("");
    setSuccess("");

    try {
      setLoading(true);

      // 1. Forgot password: send reset email
      if (mode === "forgot") {
        const response = await axios.post(
          `${RESET_API_URL}/forget-password`,
          {
            email: email.trim().toLowerCase(),
          }
        );

        setSuccess(
          response.data.message ||
            "If an account exists, a reset link will be sent."
        );

        return;
      }

      // 2. Reset password: submit token and new password
      if (mode === "reset") {
        if (!token) {
          setError("Reset token is missing. Please use the email link.");
          return;
        }

        const response = await axios.post(
          `${RESET_API_URL}/reset-password/${token}`,
          { password }
        );

        setSuccess(
          response.data.message || "Password reset successfully."
        );

        setPassword("");

        // Allow the success message to be displayed
        setTimeout(() => {
          navigate("/auth", {
            replace: true,
            state: { mode: "login" },
          });
        }, 1500);

        return;
      }

      // 3. Signup
      if (mode === "signup") {
        const response = await axios.post(`${API_URL}/signup`, {
          name: name.trim(),
          email: email.trim().toLowerCase(),
          password,
        });

        setSuccess(
          response.data.message ||
            "Signup successful. Please log in."
        );

        setMode("login");
        setName("");
        setEmail("");
        setPassword("");

        return;
      }

      // 4. Login
      const response = await axios.post(`${API_URL}/signin`, {
        email: email.trim().toLowerCase(),
        password,
      });

      const { token: authToken, user } = response.data;

      localStorage.setItem("token", authToken);
      localStorage.setItem("user", JSON.stringify(user));

      navigate("/");
    } catch (err) {
      console.error("Request failed:", err);
      console.log("Status:", err.response?.status);
      console.log("Backend error:", err.response?.data);

      setError(
        err.response?.data?.message ||
          "Something went wrong. Please try again."
      );
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
      >
        ← Back to home
      </button>

      <form className="auth-card" onSubmit={handleSubmit}>
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

        {/* Name field: signup only */}
        {mode === "signup" && (
          <input
            type="text"
            placeholder="Your name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        )}

        {/* Email field: hidden during password reset */}
        {mode !== "reset" && (
          <input
            type="email"
            placeholder="Email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        )}

        {/* Password field: hidden during forgot-password request */}
        {mode !== "forgot" && (
          <input
            type="password"
            placeholder={isReset ? "New password" : "Password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            minLength={6}
            autoComplete={
              isReset
                ? "new-password"
                : mode === "login"
                ? "current-password"
                : "new-password"
            }
            required
          />
        )}

        {/* Forgot password link: login only */}
        {mode === "login" && (
          <button
            type="button"
            className="text-btn forgot-btn"
            onClick={() => {
              setError("");
              setSuccess("");
              setMode("forgot");
            }}
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
              onClick={() => {
                setError("");
                setSuccess("");
                setMode("login");
              }}
            >
              ← Back to login
            </button>
          ) : mode === "reset" ? (
            <button
              type="button"
              className="text-btn"
              onClick={() => navigate("/auth")}
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
                onClick={() => {
                  setError("");
                  setSuccess("");
                  setMode(
                    mode === "login" ? "signup" : "login"
                  );
                }}
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
