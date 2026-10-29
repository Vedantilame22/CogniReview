# 🚀 CogniReview — The Self-Learning PR & Codebase Reviewer

<div align="center">

  <img src="https://img.shields.io/badge/Language-TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Parser-Babel_AST-F9DC3E?style=for-the-badge&logo=babel&logoColor=black" alt="Babel AST" />
  <img src="https://img.shields.io/badge/Engine-Express.js-000000?style=for-the-badge&logo=express&logoColor=white" alt="Express" />
  <img src="https://img.shields.io/badge/Quality-SonarQube_Grade-4B9CD3?style=for-the-badge&logo=sonarqube&logoColor=white" alt="SonarQube Grade" />
  <img src="https://img.shields.io/badge/License-MIT-green?style=for-the-badge" alt="MIT License" />

  <p align="center">
    <strong>An adaptive static and semantic code audit platform that combines SonarQube-grade code quality checks with a compound learning loop that eliminates false positives as your team uses it.</strong>
  </p>

</div>

---

## 💡 Why CogniReview?

Standard linters and SonarQube tools are static and rigid. They repeatedly flag the same false positives on code patterns your team deliberately allows.

**CogniReview is built around a Compound Learning Flywheel:**
1. **Deterministic Static AST Scanning:** Audits files in **10 milliseconds** on your CPU with zero AI token cost.
2. **Architectural Boundary Enforcement:** Prevents client-side components from leaking database drivers or crossing domain boundaries.
3. **Sonar-Grade Security & Smells:** Flags live API keys, empty `catch` blocks, and cognitive complexity spikes.
4. **Self-Adapting Memory:** When senior engineers accept or dismiss a suggestion, CogniReview records the intent and dynamically adapts its rule confidence—permanently eliminating false positives!

---

## 🏛️ The 4 Review Pillars

```
┌────────────────────────────────────────────────────────────────────────┐
│                        CogniReview Engine                              │
├──────────────────┬──────────────────┬──────────────────┬───────────────┤
│ 1. Architecture  │ 2. Casing & Code │ 3. Sonar-Level   │ 4. The Self-  │
│    & File Tree   │    Conventions   │    Code Health   │    Learning   │
│                  │                  │                  │    Engine     │
├──────────────────┼──────────────────┼──────────────────┼───────────────┤
│ • Folder layout  │ • camelCase vars │ • Bug risks &    │ • Learns from │
│ • File naming    │ • PascalCase     │   race conditions│   PR feedback │
│ • File colocation│   components     │ • Security holes │ • Auto-detects│
│ • Barrel exports │ • SCREAMING_SNAKE│ • Memory leaks   │   repo style  │
│ • Depth limits   │   constants      │ • Complexity     │ • Eliminates  │
│                  │ • Type signatures│   (Cognitive/    │   false       │
│                  │                  │    Cyclomatic)   │   positives   │
└──────────────────┴──────────────────┴──────────────────┴───────────────┘
```

### 1. 📁 File & Folder Architecture Auditing
- **File Naming Standards:** Enforces `PascalCase` on React components (`UserCard.tsx`), `kebab-case` on utilities, and `use[Name].ts` on custom hooks.
- **Architectural Boundary Protection:** Flags critical architectural violations (e.g. frontend UI components directly importing database drivers like `mongoose`, `pg`, or `prisma`).
- **Hierarchy Depth Limiter:** Flags deeply nested spaghetti folder hierarchies exceeding 7 levels.

### 2. 🔤 Code Writing & Casing Standards (Babel AST)
- **Mutable Variables:** Enforces `camelCase` (flags `user_total_credits` ➔ suggests `userTotalCredits`).
- **Classes & Components:** Strictly enforces `PascalCase` (`class PaymentGateway`, `function UserProfile`).
- **Constants:** Validates top-level constants follow `UPPER_SNAKE_CASE` or `camelCase`.

### 3. 🛡️ SonarQube-Grade Security & Code Smells
- **Hardcoded Secret Detection:** Scans for exposed live API tokens (`sk_live_...`, `ghp_...`, `AKIA...`) and flags them as **CRITICAL**.
- **Swallowed Exceptions:** Detects empty `catch (error) {}` blocks that mask silent production failures.
- **Cognitive Complexity & Giant Functions:** Calculates cyclomatic & cognitive branches; flags monolithic functions exceeding 80 lines.
- **Production Cleanliness:** Flags lingering `console.log` statements before merging.

### 4. 🧠 The Compound Learning Engine
- Stores repository-specific conventions and confidence ratings in a structured rulebook.
- Whenever a developer accepts or overrides an alert, CogniReview recalculates rule confidence scores so the reviewer grows smarter with every interaction.

---

## ⚡ 3 Ways to Review Code

| Mode | Workflow | Use Case |
| :--- | :--- | :--- |
| **📝 Snippet Inspector** | Paste or type code directly in the web dashboard | Instant code snippet & anti-pattern testing |
| **📁 Local Folder Scanner** | Enter an absolute folder path on your machine | Audits an entire multi-file project in 2 seconds with zero copy-pasting |
| **🚀 Automated GitHub PR Bot** | Connects to GitHub via Webhooks | Fully automated: posts review comments directly on pull requests |

---

## 🛠️ Project Structure

```
cognireview/
├── src/
│   ├── index.ts                     # Express API Server & Webhook Handler
│   ├── views/
│   │   └── index.html               # Professional Landing Page & Studio UI
│   ├── analyzer/                    # Core Deterministic AST Engine
│   │   ├── index.ts                 # Main Orchestrator & Health Scorer
│   │   ├── naming/                  # File & Folder naming auditor
│   │   ├── casing/                  # Babel AST Code casing auditor
│   │   ├── structure/               # Architectural boundary auditor
│   │   └── complexity/              # Cognitive complexity & Sonar smells
│   ├── memory/                      # Knowledge Store & Learned Rules
│   │   └── ruleStore.ts             # In-memory + persistent rule storage
│   └── types/                       # TypeScript interfaces (audit, rules)
├── test-run.ts                      # Automated verification test suite
├── package.json
└── tsconfig.json
```

---

## 🚀 Getting Started

### 1. Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher)
- npm or pnpm

### 2. Installation
```bash
# Clone the repository
git clone https://github.com/Vedantilame22/CogniReview.git
cd CogniReview

# Install dependencies
npm install
```

### 3. Run Self-Verification Test Suite
```bash
npm test
```

### 4. Launch the Interactive Studio
```bash
npm run dev
# Or start directly
npx tsx src/index.ts
```
Open **[http://localhost:4000](http://localhost:4000)** in your browser to view the interactive studio and landing page!

---

## 📡 REST API Reference

| Endpoint | Method | Payload / Params | Description |
| :--- | :--- | :--- | :--- |
| `/api/audit/directory` | `POST` | `{ dirPath: string }` | Audits an entire local directory recursively (zero copy-paste). |
| `/api/audit/file` | `POST` | `{ path: string, content: string }` | Audits a single file content string with path context. |
| `/api/audit/codebase` | `POST` | `{ files: Array<{path, content}> }` | Audits an array of files and returns an aggregated health score (0-100). |
| `/api/rules` | `GET` | `?repository=default` | Fetches active learned rules and confidence scores for a repo. |
| `/api/rules/feedback` | `POST` | `{ ruleId, repository, action }` | Records developer acceptance or override to refine rule confidence. |
| `/api/webhooks/github` | `POST` | GitHub Webhook Payload | GitHub webhook listener for real-time PR opened/updated events. |

---

## 🤖 GitHub Webhook Integration

To connect CogniReview directly to your GitHub repository for automated pull request audits:

1. Navigate to your GitHub repository: **Settings ➔ Webhooks ➔ Add webhook**.
2. **Payload URL:** `http://your-server-domain:4000/api/webhooks/github`
3. **Content type:** `application/json`
4. **Events:** Select **Let me select individual events** and check **Pull requests**.
5. Click **Add webhook**. CogniReview will now automatically review all incoming pull requests!

---

## 📜 License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.

---

<div align="center">
  <sub>Built with precision &amp; passion by <b>Vedant Ilame</b> • 2026</sub>
</div>
