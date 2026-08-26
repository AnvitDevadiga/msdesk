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
## 4. Phase 5: UI Polish & Transparency (2:00 - 2:45)
*Highlight the distinct states and the highly-styled approval gate.*
**Speaker:** "We focused heavily on the UI for Phase 5. Notice the distinct state updates emitted by the agent as it works: Planning, Running Sandbox Code, and Waiting for Approval. There's no guessing what the agent is doing."
**Visuals:** Point out the explicit `[STATE: ...]` logs in the chat.
**Speaker:** "Then, look at this Approval Gate. It is visually unmistakable. The draft stands out clearly, and the Approve/Reject pseudo-buttons make the human-in-the-loop requirement impossible to miss."

## 5. Execution & Audit Log (2:45 - 3:00)
*Show the completed action and the post-run audit log.*
**Action:** Type "APPROVE" into the chat. 
**Speaker:** "Once I approve, the agent uses the custom local Slack MCP Server we built to post the message. Immediately after, it emits a structured Audit Log Entry right in the chat to confirm the timestamp and outcome of the action. Thanks for watching!"
