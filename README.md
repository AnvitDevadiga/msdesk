# M's Desk - TrueForge Hackathon Submission

M's Desk is a trusted, human-in-the-loop operational reporting agent built on [TrueForge](https://trueforge.com/). It automates routine operational workflows (such as parsing weekly support metrics from local CSV files and posting polished reports to Slack) while strictly enforcing safety approval gates.

---

## 🏗️ System Architecture

```mermaid
graph TD
    %% Custom Styling
    classDef userStyle fill:#1e1e2e,stroke:#cba6f7,stroke-width:2px,color:#cdd6f4;
    classDef agentStyle fill:#1e1e2e,stroke:#89b4fa,stroke-width:2px,color:#cdd6f4;
    classDef toolStyle fill:#1e1e2e,stroke:#a6e3a1,stroke-width:2px,color:#cdd6f4;
    classDef sandboxStyle fill:#1e1e2e,stroke:#fab387,stroke-width:2px,color:#cdd6f4;
    classDef gateStyle fill:#1e1e2e,stroke:#f38ba8,stroke-width:2px,color:#cdd6f4;
    classDef slackStyle fill:#1e1e2e,stroke:#f9e2af,stroke-width:2px,color:#cdd6f4;

    A["👤 User"]:::userStyle -->|"1. Triggers Weekly Report"| B["🤖 M's Desk Agent (TrueForge)"]:::agentStyle
    
    B -->|"2. Queries Tool via SSE"| C["🔌 Slack MCP Server"]:::toolStyle
    C -->|"3. Reads Local CSV"| D[("📁 data/weekly_metrics.csv")]:::toolStyle
    D -->|"4. Returns Raw Telemetry"| B
    
    B -->|"5. Dispatches Python Execution"| E["🧪 Isolated Code Sandbox"]:::sandboxStyle
    E -->|"6. Computes Totals & SLA Metrics"| B
    
    B -->|"7. Halts & Renders Safety Gate"| F["🛑 Markdown Approval Gate"]:::gateStyle
    A -->|"8. Grants Authorization ('APPROVE')"| F
    
    F -->|"9. Triggers Slack Dispatch"| C
    C -->|"10. Posts Formatted Report"| G["💬 Slack Workspace (#new-channel)"]:::slackStyle
    C -->|"11. Emits Structured Audit Log"| A
```

---

## 🏆 Judging Criteria Tracks Achieved

1. **Reach (Connecting the Agent):** Custom Model Context Protocol (MCP) server (`slack-sse-server.mjs`) running over Server-Sent Events (SSE) with multi-session support and host filesystem CSV access (`read_local_csv`).
2. **Sandbox (Code Execution):** Executes real Python scripts in the TrueForge sandbox to parse `data/weekly_metrics.csv` and calculate exact totals, averages, and SLA adherence without hallucination.
3. **Approval (Human-in-the-Loop):** System prompt strictly prohibits irreversible write actions (posting to Slack) without human authorization, halting execution at a distinct Markdown Approval Gate.
4. **Best UI & Transparency:** Real-time state logging in the chat trace, clear sandbox code inspector, and post-action structured Audit Logs (`✅ ACTION EXECUTED`).
5. **Real Impact:** Converts raw operational telemetry into stakeholder-ready Slack summaries in seconds.
6. **Technical Excellence:** Dual LLM provider support (Ollama local inference with zero rate limits + Groq API proxy handling token rate limit capping).

---

## 🚀 How to Run Locally

### 1. Prerequisites & Environment Setup
Clone the repository and install Node dependencies:
```bash
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
2. Inspect the Python sandbox execution computing the metrics.
3. Review the Markdown Approval Gate.
4. Type **`APPROVE`** to post the message directly to Slack!
