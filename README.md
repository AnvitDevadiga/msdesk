# M's Desk — TrueForge Hackathon Submission (TF-007)

> **Autonomous Operational Reporting Agent with Human-in-the-Loop Safety & MCP Integration**  
> Built on [TrueForge](https://trueforge.dev/introduction) for the **WeMakeDevs & TrueFoundry Agent Harness Hackathon**.

[![TrueForge Powered](https://img.shields.io/badge/Harness-TrueForge-7C3AED?style=for-the-badge&logo=ai&logoColor=white)](https://trueforge.dev)
[![Qodo Reviewed](https://img.shields.io/badge/Code%20Review-Qodo%20Verified-00C7B7?style=for-the-badge&logo=github&logoColor=white)](https://github.com/AnvitDevadiga/msdesk/pulls?q=is%3Apr)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg?style=for-the-badge)](LICENSE)

---

## 📺 Demo Video

🎥 **Watch the 2-Minute Walkthrough**: [M's Desk Demo Video](https://youtu.be/placeholder-demo-link) *(replace with your public YouTube/Loom link)*  
*Demonstrates dynamic CSV ingestion, sandboxed Python computation, human-in-the-loop Markdown approval gating, and Slack dispatch with structured audit logging.*

---

## 🏗️ System Architecture

```mermaid
graph LR
    %% Modern Card Styles
    classDef userStyle fill:#1e1e2e,stroke:#cba6f7,stroke-width:2px,color:#cdd6f4;
    classDef agentStyle fill:#1e1e2e,stroke:#89b4fa,stroke-width:2px,color:#cdd6f4;
    classDef toolStyle fill:#1e1e2e,stroke:#a6e3a1,stroke-width:2px,color:#cdd6f4;
    classDef sandboxStyle fill:#1e1e2e,stroke:#fab387,stroke-width:2px,color:#cdd6f4;
    classDef gateStyle fill:#1e1e2e,stroke:#f38ba8,stroke-width:2px,color:#cdd6f4;
    classDef slackStyle fill:#1e1e2e,stroke:#f9e2af,stroke-width:2px,color:#cdd6f4;

    A["👤 User"]:::userStyle -->|"1. Asks for report"| B["🤖 M's Desk Agent"]:::agentStyle
    B -->|"2. Requests metrics"| C["🔌 Slack MCP Server"]:::toolStyle
    C -->|"3. Reads file"| D[("📊 weekly_metrics.csv")]:::toolStyle
    D -->|"4. Returns data"| B
    B -->|"5. Runs Python code"| E["🧪 Code Sandbox"]:::sandboxStyle
    E -->|"6. Computes totals"| B
    B -->|"7. Shows draft table"| F["🛑 Approval Gate"]:::gateStyle
    A -->|"8. Types 'APPROVE'"| F
    F -->|"9. Dispatches report"| C
    C -->|"10. Posts message"| G["💬 Slack Channel"]:::slackStyle
    G -->|"11. Audit confirmation"| A
```

---

## 🛡️ Qodo Code Review Evidence

> **Mandatory Submission Requirement (Hackathon Rule 10)**  
> All project enhancements and refactors were reviewed by **Qodo** across dedicated pull requests to ensure strict security, robust error handling, and high-quality open-source standards.

- **Primary Reviewed Pull Request:** [PR #3 — Complete M's Desk ops reporting agent](https://github.com/AnvitDevadiga/msdesk/pull/3) & [PR #4 — Qodo Remediation & Code Quality Polish](https://github.com/AnvitDevadiga/msdesk/pull/4)
- **What Qodo Surfaced & Remediated:**
  1. **Reasoning Leak & Role Scoping:** Qodo flagged that reasoning/thinking tag stripping was being applied universally across all messages. We refactored `groq-proxy.mjs` to scope tag stripping strictly to `assistant` messages and preserve authentic user prompts.
  2. **Rate Limit Resilience:** Qodo identified missing backoff mechanisms under API pressure. Added an exponential retry budget (`MAX_RETRIES = 5`) with dynamic `retry-after` header inspection.
  3. **Transport Security & Session Isolation:** Qodo caught session fallback across clients on SSE `/message`. Updated `slack-sse-server.mjs` to strictly validate `sessionId` parameters and reject unmatched sessions with standard 400/404 HTTP codes.
  4. **Data Surface Minimization:** Removed the unauthenticated direct `/csv` route, ensuring data access is exclusively brokered via authorized MCP tool flows.
- **Review Cycle History:**
  - Initial Architecture & UI Polish: [PR #1](https://github.com/AnvitDevadiga/msdesk/pull/1)
  - Documentation & Workflow Hardening: [PR #2](https://github.com/AnvitDevadiga/msdesk/pull/2)
  - End-to-End Implementation: [PR #3](https://github.com/AnvitDevadiga/msdesk/pull/3)
  - Quality Polish & Qodo Findings Resolution: [PR #4](https://github.com/AnvitDevadiga/msdesk/pull/4)

---

## 🏆 Target Tracks & Technical Alignment

1. **Double-O Track (Best Use of TrueForge):**
   - **Reach (Real Tools):** Custom Model Context Protocol (MCP) server (`slack-sse-server.mjs`) running over Server-Sent Events (SSE) with local filesystem CSV tool integration (`read_local_csv`).
   - **Sandbox (Code Execution):** Executes real Python scripts in the TrueForge sandbox to parse `data/weekly_metrics.csv` and calculate exact totals, averages, and SLA adherence without hallucination.
   - **Approval (Human-in-the-Loop):** System instructions strictly prohibit irreversible write actions (posting to Slack) without human authorization, halting execution at a distinct Markdown Approval Gate.
2. **Q Branch Track (Best Code Quality):**
   - Production-grade code review trail with Qodo, modular architecture, strict session handling, and clean TypeScript/ESM integration.
3. **Savile Row Track (Best UI & Transparency):**
   - Real-time state logging in chat (`Planning`, `Executing Sandbox`), an unmistakable Markdown Approval Gate (`🛑 [ DRAFT APPROVAL REQUIRED ] 🛑`), and structured post-execution Audit Logs (`✅ ACTION EXECUTED`).

---

## 🚀 How to Run Locally

### 1. Prerequisites & Environment Setup
Clone the repository and install Node dependencies:
```bash
git clone https://github.com/AnvitDevadiga/msdesk.git
cd msdesk
npm install
```

Create a `.env` file in the root directory:
```env
# Slack Bot Credentials
SLACK_BOT_TOKEN=xoxb-your-slack-bot-token
SLACK_TEAM_ID=your-slack-team-id

# Optional: Groq API Key (if using Cloud Model instead of Ollama)
GROQ_API_KEY=gsk_your_groq_api_key
```

---

### 2. Choose Your Model Provider

#### Option A: Ollama (Recommended — 100% Local, Fast & Free)
1. Install Ollama and pull `qwen2.5:7b`:
   ```bash
   ollama pull qwen2.5:7b
   ```
2. In TrueForge Settings → Models, add Provider:
   - **Base URL:** `http://localhost:11434/v1`
   - **Model ID:** `qwen2.5:7b` (or `qwen2.5-32k`)
   - **Max output tokens:** `4096`
   - **Context length:** `32768`

#### Option B: Groq API (Cloud)
Start the Groq Anti-Rate-Limit Proxy:
```bash
npm run proxy
```
In TrueForge Settings → Models:
- **Base URL:** `http://localhost:3002/v1`
- **Model ID:** `openai/gpt-oss-20b` or `qwen/qwen3.6-27b`

---

### 3. Start the Slack MCP Server
Start the local Slack SSE MCP Server:
```bash
npm start
```

---

### 4. Start TrueForge
Launch TrueForge:
```bash
npx -y @truefoundry/trueforge
```
- **Connectors:** Add SSE connector pointing to `http://localhost:3001/sse`.
- **Agents:** Create an agent named **M's Desk**, paste `prompts/agent_mission.md` into Instructions, and attach the `slack` connector.

---

### 5. Run the Workflow
Start a chat and prompt:
> *"Draft the weekly metrics report for the new-channel based on this week's CSV data."*

1. Watch the agent fetch local CSV data via `read_local_csv`.
2. Inspect the Python sandbox execution computing the metrics dynamically from `data/weekly_metrics.csv`.
3. Review the Markdown Approval Gate.
4. Type **`APPROVE`** to post the message directly to Slack!
