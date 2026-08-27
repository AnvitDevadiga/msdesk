# M's Desk - TrueForge Hackathon Submission

M's Desk is a highly-trusted, human-in-the-loop operational agent built on [TrueForge](https://trueforge.com/). It automates routine operational tasks (like parsing weekly support metrics and reporting them to Slack) while adhering to strict safety and UI standards.

## 🏆 Judging Criteria Tracks Achieved

This repository was meticulously engineered to hit all of the hackathon's judging tracks:

1. **Reach (Connecting the Agent):** We built a custom `slack-sse-server.mjs` MCP server that proxies standard Model Context Protocol JSON-RPC over Server-Sent Events (SSE) so TrueForge can consume it easily without WebSockets.
2. **Sandbox (Code Execution):** M's Desk is instructed to use the TrueForge Code Sandbox to read a local `data/weekly_metrics.csv` file, write a Python script to compute SLA breaches and totals, and generate an ASCII chart rather than hallucinating numbers.
3. **Approval (Human-in-the-Loop):** The agent's system prompt forbids irreversible actions (like sending a Slack message) without explicit human consent. It strictly halts execution to wait for approval.
4. **Best UI:** We implemented highly distinct visible states (`⚙️ [STATE: Planning]`, `📊 [STATE: Running Sandbox Code]`). We also engineered a massive, visually unmistakable Markdown Approval Gate and post-action structured Audit Logs using only prompt engineering!
5. **Real Impact:** M's Desk solves a real, tedious business problem: turning raw CSV data into a polished, stakeholder-ready Slack summary automatically.
6. **Technical Excellence:** We bypassed complex Slack OAuth overhead for local testing by building a lightweight proxy server that intercepts LLM reasoning tokens (via `groq-proxy.mjs`) to prevent 400 errors from strict providers, and mapped MCP directly to TrueForge's SSE requirement.

## 🚀 How to Run Locally

### 1. Environment Setup
Create a `.env` file in the root directory and add your credentials:
```env
# Proxy API Key
GROQ_API_KEY=gsk_your_key_here

# Slack Credentials
SLACK_BOT_TOKEN=xoxb-your-bot-token
SLACK_TEAM_ID=your-team-id
```

### 2. Start the Background Services
You need to run two lightweight Node scripts to handle the LLM proxying and the Slack MCP server:
```bash
# Start the Groq Anti-Reject Proxy (Strips unsupported schema elements)
node --env-file=.env groq-proxy.mjs

# Start the Slack SSE MCP Server
node --env-file=.env slack-sse-server.mjs
```

### 3. Start TrueForge
Run TrueForge locally:
```bash
npx -y @truefoundry/trueforge
```
- Add the Groq proxy as an OpenAI-compatible custom provider (`http://localhost:3002/v1`).
- Add the Slack MCP connector (`http://localhost:3001/sse`).
- Create an Agent named **"M's Desk"**, paste the contents of `prompts/agent_mission.md` into the System Prompt, and attach the Slack tool and Sandbox tool.

### 4. Run the Demo
Start a chat with M's Desk and type:
> *"Draft the weekly metrics report for the team-status channel based on this week's CSV data in the data folder."*

Watch the UI states change, see the sandbox code execute in the trace, and wait for the massive Approval Gate!
