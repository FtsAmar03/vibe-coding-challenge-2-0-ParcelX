import React, { useState, useEffect } from "react";
import { api, saveSession } from "../api";

const SPORTS = ["Football", "Cricket", "Hockey", "Basketball"];

export default function Login({ onLogin }) {
  const [mode, setMode] = useState("login"); // "login" or "signup"
  const [status, setStatus] = useState({
    coachRegistered: false,
    scoutRegistered: false,
  });

  const [role, setRole] = useState("player");
  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [sport, setSport] = useState("Football");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  // Which one-time accounts (coach, scout) are already taken
  useEffect(() => {
    api
      .getSetupStatus()
      .then((r) => setStatus(r))
      .catch(() => {});
  }, []);

  const roleTaken = (r) =>
    (r === "coach" && status.coachRegistered) ||
    (r === "scout" && status.scoutRegistered);

  function switchMode(next) {
    setMode(next);
    setError("");
    setPassword("");
    setConfirm("");
    if (next === "signup" && roleTaken(role)) setRole("player");
  }

  async function handleLogin(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const data = await api.login(email, password);
      saveSession(data.token, data.user);
      onLogin(data.user);
    } catch (err) {
      setError(err.message || "Failed to log in");
    } finally {
      setBusy(false);
    }
  }

  async function handleSignup(e) {
    e.preventDefault();
    setError("");

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }

    setBusy(true);
    try {
      const body = { name: name.trim(), email, password, role };
      if (role === "player") {
        body.age = Number(age);
        body.sport = sport;
      }

      await api.signup(body);

      // Account created, log in straight away
      const data = await api.login(email, password);
      saveSession(data.token, data.user);
      onLogin(data.user);
    } catch (err) {
      setError(err.message || "Signup failed");
      if (err.status === 403) {
        setStatus((s) => ({
          ...s,
          coachRegistered: s.coachRegistered || role === "coach",
          scoutRegistered: s.scoutRegistered || role === "scout",
        }));
      }
    } finally {
      setBusy(false);
    }
  }

  const isSignup = mode === "signup";

  const roles = [
    {
      id: "coach",
      label: "Head Coach",
      icon: "🧢",
      desc: "Full Roster Desk",
    },
    {
      id: "scout",
      label: "Talent Scout",
      icon: "★",
      desc: "Ready Players",
    },
    {
      id: "player",
      label: "Athlete",
      icon: "⚽",
      desc: "Personal Row",
    },
  ];

  return (
    <main className="login-page-container">
      <div className="auth-ambient-glow auth-glow-1"></div>
      <div className="auth-ambient-glow auth-glow-2"></div>

      <div className="auth-wrapper">
        {/* Auth Card */}
        <div className="auth-card">
          <form
            onSubmit={isSignup ? handleSignup : handleLogin}
            className="auth-form"
          >
            <div className="auth-header-text">
              <h2>{isSignup ? "Create Your Account" : "Welcome Back"}</h2>
              <p>
                {isSignup
                  ? "Select your role to access training registers, match sheets, and scout boards."
                  : "Sign in with your registered email and credentials to continue."}
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="auth-error-banner">
                <span className="error-icon">⚠️</span>
                <span>{error}</span>
              </div>
            )}

            {isSignup && (
              <>
                {/* Role Selector */}
                <div className="form-group auth-field">
                  <label className="auth-label">SELECT YOUR ACADEMY ROLE</label>
                  <div className="auth-role-grid">
                    {roles.map((r) => {
                      const taken = roleTaken(r.id);
                      const isSelected = role === r.id;
                      return (
                        <button
                          key={r.id}
                          type="button"
                          disabled={taken}
                          className={`auth-role-card ${
                            isSelected ? "selected" : ""
                          } ${taken ? "taken" : ""}`}
                          onClick={() => {
                            setRole(r.id);
                            setError("");
                          }}
                        >
                          <span className="role-card-icon">{r.icon}</span>
                          <strong className="role-card-title">{r.label}</strong>
                          <span className="role-card-desc">
                            {taken ? "Claimed" : r.desc}
                          </span>
                          {isSelected && !taken && (
                            <span className="role-card-check">✓</span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                  {(status.coachRegistered || status.scoutRegistered) && (
                    <p className="auth-role-notice">
                      {status.coachRegistered &&
                        "Head Coach account is already claimed. "}
                      {status.scoutRegistered &&
                        "Scout account is already claimed."}
                    </p>
                  )}
                </div>

                {/* Player Notice */}
                {role === "player" && (
                  <div className="auth-player-tip">
                    <span className="tip-icon">ℹ️</span>
                    <div>
                      <strong>Academy Roster Match</strong>
                      <p>
                        Please use the exact name, age, and sport entered by
                        your coach on the academy roster.
                      </p>
                    </div>
                  </div>
                )}

                {/* Full Name */}
                <div className="form-group auth-field">
                  <label className="auth-label">FULL NAME</label>
                  <div className="auth-input-wrapper">
                    <span className="input-icon">👤</span>
                    <input
                      type="text"
                      placeholder="e.g. Samir Murmu"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      autoFocus
                    />
                  </div>
                </div>

                {role === "player" && (
                  <div className="form-row auth-form-row">
                    <div className="form-group auth-field">
                      <label className="auth-label">AGE (YEARS)</label>
                      <div className="auth-input-wrapper">
                        <span className="input-icon">🎂</span>
                        <input
                          type="number"
                          min="5"
                          max="60"
                          placeholder="e.g. 17"
                          value={age}
                          onChange={(e) => setAge(e.target.value)}
                          required
                        />
                      </div>
                    </div>

                    <div className="form-group auth-field">
                      <label className="auth-label">SPORT DISCIPLINE</label>
                      <div className="auth-input-wrapper">
                        <span className="input-icon">⚽</span>
                        <select
                          value={sport}
                          onChange={(e) => setSport(e.target.value)}
                        >
                          {SPORTS.map((s) => (
                            <option key={s} value={s}>
                              {s}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}

            {/* Email Field */}
            <div className="form-group auth-field">
              <label className="auth-label">EMAIL ADDRESS</label>
              <div className="auth-input-wrapper">
                <span className="input-icon">✉️</span>
                <input
                  type="email"
                  placeholder="name@dumka-academy.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoFocus={!isSignup}
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="form-group auth-field">
              <label className="auth-label">PASSWORD</label>
              <div className="auth-input-wrapper">
                <span className="input-icon">🔒</span>
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder={
                    isSignup ? "At least 6 characters" : "Enter your password"
                  }
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  className="password-toggle-btn"
                  onClick={() => setShowPassword(!showPassword)}
                  title={showPassword ? "Hide password" : "Show password"}
                  aria-label="Toggle password visibility"
                >
                  {showPassword ? "👁️" : "👁️‍🗨️"}
                </button>
              </div>
            </div>

            {/* Confirm Password (Signup only) */}
            {isSignup && (
              <div className="form-group auth-field">
                <label className="auth-label">CONFIRM PASSWORD</label>
                <div className="auth-input-wrapper">
                  <span className="input-icon">🔐</span>
                  <input
                    type={showConfirm ? "text" : "password"}
                    placeholder="Re-enter your password"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    className="password-toggle-btn"
                    onClick={() => setShowConfirm(!showConfirm)}
                    title={showConfirm ? "Hide password" : "Show password"}
                    aria-label="Toggle confirm password visibility"
                  >
                    {showConfirm ? "👁️" : "👁️‍🗨️"}
                  </button>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <button type="submit" className="auth-submit-btn" disabled={busy}>
              {busy ? (
                <>
                  <span className="auth-spinner"></span>
                  <span>
                    {isSignup ? "Creating Account..." : "Signing In..."}
                  </span>
                </>
              ) : (
                <>
                  <span>
                    {isSignup
                      ? "Complete Registration"
                      : "Sign In to Academy Desk"}
                  </span>
                  <span className="btn-arrow">→</span>
                </>
              )}
            </button>
          </form>

          {/* Footer toggle */}
          <div className="auth-footer-toggle">
            {isSignup ? (
              <p>
                Already have an account?{" "}
                <button
                  type="button"
                  className="auth-text-link"
                  onClick={() => switchMode("login")}
                >
                  Sign in here
                </button>
              </p>
            ) : (
              <p>
                New coach, scout or athlete?{" "}
                <button
                  type="button"
                  className="auth-text-link"
                  onClick={() => switchMode("signup")}
                >
                  Create an account
                </button>
              </p>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
