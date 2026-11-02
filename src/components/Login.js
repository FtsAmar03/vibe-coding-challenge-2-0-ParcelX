import React, { useState } from "react";
import { api, saveSession } from "../api";

export default function Login({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const data = await api.login(email, password);
      saveSession(data.token, data.user);
      onLogin(data.user);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
      }}
    >
      <form
        onSubmit={handleSubmit}
        className="player-form"
        style={{ width: "100%", maxWidth: "400px" }}
      >
        <div className="modal-header">
          <h2>Sports Academy Desk</h2>
        </div>
        <p className="modal-subtitle">
          Log in as coach, scout or player. Dumka Sports Academy.
        </p>

        <div className="form-group">
          <label>Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoFocus
          />
        </div>

        <div className="form-group">
          <label>Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        {error && <p style={{ color: "#c0392b", margin: "8px 0" }}>{error}</p>}

        <div className="form-actions">
          <button type="submit" className="btn-primary" disabled={busy}>
            {busy ? "Logging in..." : "Log in"}
          </button>
        </div>
      </form>
    </main>
  );
}
