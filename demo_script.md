# M's Desk - Demo Script

**Target Duration:** 2 Minutes

## 1. Introduction (0:00 - 0:15)
**Speaker:** "This is M's Desk, a TrueForge-based operational agent designed to safely automate routine data reporting. Today, I'll ask it to generate our weekly status report."
**Action:** Type: *"Draft the weekly metrics report for the new-channel based on this week's CSV data."*

## 2. Sandbox Execution & UI Transparency (0:15 - 1:00)
**Speaker:** "We focused heavily on the UI. Notice the explicit state logs emitting into the chat: Planning, and now Running Sandbox Code. Instead of hallucinating numbers, the agent writes and executes a Python script in TrueForge's sandbox to parse our local CSV metrics."
**Visuals:** Click the "Executing Sandbox" thought block to show the Python script running and outputting data.

## 3. Visually Unmistakable Approval Gate (1:00 - 1:30)
**Speaker:** "Next is the human-in-the-loop requirement. Safety is paramount, so the agent halts and renders a massive, unmistakable Markdown Approval Gate. The draft stands out clearly, and the Approve/Reject pseudo-buttons make it impossible to miss."
**Visuals:** Show the styled `[DRAFT APPROVAL REQUIRED]` block with emojis and the generated metrics table.

## 4. Execution & Audit Log (1:30 - 2:00)
**Action:** Type "APPROVE" into the chat.
**Speaker:** "Once I approve, it uses the custom local Slack MCP Server we built to post the message. Immediately after, it emits a structured Audit Log Entry to confirm the payload outcome. Thanks for watching!"
**Visuals:** Show the Audit Log, then briefly flick over to the Slack workspace (or server logs) to prove it was sent.
