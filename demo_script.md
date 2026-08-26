# M's Desk - Demo Script

**Target Duration:** 3 Minutes

## 1. Introduction (0:00 - 0:20)
*State the job in one sentence.*
**Speaker:** "This is M's Desk, a TrueForge-based operational agent designed to take over mundane reporting tasks safely. Today, I'm going to ask it to generate our weekly project status report for Slack."

## 2. Capability 1 & 2: Reach & Sandbox Execution (0:20 - 1:15)
*Show the agent reaching the tool + running sandboxed code.*
**Action:** Type in TrueForge Sandbox: *"Draft the weekly metrics report for the team-status channel based on this week's CSV data."*
**Speaker:** "First, the agent uses its Code Execution Sandbox. Instead of hallucinating numbers, it writes and executes a Python script to parse our `weekly_metrics.csv` data directly from the filesystem to calculate total tickets and SLA breaches."
**Visuals:** Click on the "Executing Sandbox" thought block in TrueForge's UI to show the Python script it wrote and the console output, proving it actually ran code.

## 3. Phase 5 & Capability 3: Visually Unmistakable Approval Gate (1:15 - 2:00)
*Show the approval gate pausing and being approved on camera.*
**Speaker:** "Next, notice the Approval Gate. TrueForge agents are powerful, but safety is paramount. The agent halts and renders a highly visible Markdown draft of exactly what it intends to post, waiting for my explicit 'Approve' signal."
**Visuals:** Show the styled `[DRAFT APPROVAL REQUIRED]` block with emojis, the generated markdown table of metrics, and the clear `To/Channel: team-status` designation.

## 4. Execution & Log Verification (2:00 - 2:30)
*Show the completed action and the log.*
**Action:** Type "Approve" into the chat. 
**Speaker:** "Once I approve, the agent uses the custom local Slack MCP Server we built to post the message."
**Visuals:** Show the success message in TrueForge, then briefly switch to the Slack workspace (or the proxy terminal logs) to prove the payload was successfully transmitted.

## 5. Phase 4 Preview (Optional / Later) (2:30 - 3:00)
**Speaker:** "In the full version, we also use Subagent Delegation to have a 'Reviewer' agent double-check the tone before it even reaches my desk, and a Gmail MCP integration to simultaneously email the client. Thanks for watching!"
