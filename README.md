# 🏆 Dumka Sports Academy — The Coach's Desk

> A digital desk for a coach in Dumka, Jharkhand. Replaces the worn-out notebook by tracking athlete practice attendance, competitive match sheets, and identifying trial-ready talent for scouts.

---

## 📋 Problem Statement Overview & Requirements

- **Academy Context**: A single academy in Dumka. Players attend practice and matches.
- **Players**: Name, age, sport. Coach adds them.
- **Session (3 Steps)**:
  1. **Open**: Date & sport.
  2. **Mark**: Each player marked `Present` or `Absent`.
  3. **Close**: Locked session; attendance cannot be modified.
- **Match**:
  - Date, sport, opponent.
  - Each player who played has a score recorded.
  - **Rule**: *A player absent that day is not on the sheet (REFUSED).*
- **Ready Engine**:
  - `Attendance = Present sessions ÷ Sessions held`
  - `Ready = ≥ 75% attendance AND at least 2 matches`
- **Role Permissions**:
  - **Scout**: Sees **ONLY** Ready players.
  - **Player**: Sees **ONLY** their own row.
  - **Coach**: Manages players, sessions, match sheets, and readiness radar.

---

## ✅ The 4 Specification Checks

| # | Check Specification | Implementation Verification |
|---|---------------------|-----------------------------|
| **1** | Three players. One session. Two present, one absent. The absent player shows absent on their row. | Session Desk takes attendance. The player marked Absent shows **Absent** in their individual player portal row. |
| **2** | A match the same day scores the two who were present. The absent player is refused. | When creating a match on the same date, any player who was marked Absent is flagged **`REFUSED (Absent Today)`** with the checkbox/scoring disabled. |
| **3** | A player under 75% attendance is not Ready. A player at 75% with two matches is Ready. | The Readiness engine dynamically computes `(Present / Held) * 100%`. Players with < 75% or < 2 matches are categorized as "In Training". Only athletes meeting both requirements are awarded the **`TRIAL READY`** badge. |
| **4** | The scout sees only the Ready players. A player login sees only their own row. | In **Scout View**, all non-ready athletes are completely filtered out. In **Player View**, athlete is locked strictly to their personal performance sheet and practice/match logs. |

---

## 🚀 Quick Start Guide

### 1. Run the Frontend
```bash
cd frontend
npm install
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 2. Run the Backend (Optional - MongoDB Atlas API)
```bash
cd backend
npm install
npm run dev
```
Runs on [http://localhost:5000](http://localhost:5000) and connects to MongoDB Atlas.

> **Note**: The frontend has an automatic resilient hybrid architecture. If the backend is running, it connects to Atlas; if offline or deployed as a static client on Vercel, it runs seamlessly in local browser persistent storage with pre-seeded Dumka athletes.

---

## 🧪 Built-in Automated Check Runner
Click the **"Verify Checks"** button in the navbar or navigate to **Coach Desk → 4-Check Test Runner** to execute the real-time assertion suite verifying Check 1, 2, 3, and 4 with live PASS badges.
