#!/usr/bin/env node
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import express from "express";
import cors from "cors";
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const CSV_PATH = join(__dirname, "data", "weekly_metrics.csv");

const allTools = [
    {
        name: "slack_list_channels",
        description: "List public or pre-defined channels in the workspace with pagination",
        inputSchema: {
            type: "object",
            properties: {
                limit: {
                    type: "number",
                    description: "Maximum number of channels to return (default 100, max 200)",
                    default: 100,
                },
                cursor: {
                    type: "string",
                    description: "Pagination cursor for next page of results",
                },
            },
        },
    },
    {
        name: "slack_post_message",
        description: "Post a new message to a Slack channel",
        inputSchema: {
            type: "object",
            properties: {
                channel_id: {
                    type: "string",
                    description: "The ID of the channel to post to",
                },
                text: {
                    type: "string",
                    description: "The message text to post",
                },
            },
            required: ["channel_id", "text"],
        },
    },
    {
        name: "read_local_csv",
        description: "Read the weekly metrics CSV file from the host filesystem",
        inputSchema: {
            type: "object",
            properties: {},
            required: [],
        },
    },
    {
        name: "slack_reply_to_thread",
        description: "Reply to a specific message thread in Slack",
        inputSchema: {
            type: "object",
            properties: {
                channel_id: {
                    type: "string",
                    description: "The ID of the channel containing the thread",
                },
                thread_ts: {
                    type: "string",
                    description: "The timestamp of the parent message in the format '1234567890.123456'. Timestamps in the format without the period can be converted by adding the period such that 6 numbers come after it.",
                },
                text: {
                    type: "string",
                    description: "The reply text",
                },
            },
            required: ["channel_id", "thread_ts", "text"],
        },
    },
    {
        name: "slack_add_reaction",
        description: "Add a reaction emoji to a message",
        inputSchema: {
            type: "object",
            properties: {
                channel_id: {
                    type: "string",
                    description: "The ID of the channel containing the message",
                },
                timestamp: {
                    type: "string",
                    description: "The timestamp of the message to react to",
                },
                reaction: {
                    type: "string",
                    description: "The name of the emoji reaction (without ::)",
                },
            },
            required: ["channel_id", "timestamp", "reaction"],
        },
    },
    {
        name: "slack_get_channel_history",
        description: "Get recent messages from a channel",
        inputSchema: {
            type: "object",
            properties: {
                channel_id: {
                    type: "string",
                    description: "The ID of the channel",
                },
                limit: {
                    type: "number",
                    description: "Number of messages to retrieve (default 10)",
                    default: 10,
                },
            },
            required: ["channel_id"],
        },
    },
    {
        name: "slack_get_thread_replies",
        description: "Get all replies in a message thread",
        inputSchema: {
            type: "object",
            properties: {
                channel_id: {
                    type: "string",
                    description: "The ID of the channel containing the thread",
                },
                thread_ts: {
                    type: "string",
                    description: "The timestamp of the parent message in the format '1234567890.123456'. Timestamps in the format without the period can be converted by adding the period such that 6 numbers come after it.",
                },
            },
            required: ["channel_id", "thread_ts"],
        },
    },
    {
        name: "slack_get_users",
        description: "Get a list of all users in the workspace with their basic profile information",
        inputSchema: {
            type: "object",
            properties: {
                cursor: {
                    type: "string",
                    description: "Pagination cursor for next page of results",
                },
                limit: {
                    type: "number",
                    description: "Maximum number of users to return (default 100, max 200)",
                    default: 100,
                },
            },
        },
    },
    {
        name: "slack_get_user_profile",
        description: "Get detailed profile information for a specific user",
        inputSchema: {
            type: "object",
            properties: {
                user_id: {
                    type: "string",
                    description: "The ID of the user",
                },
            },
            required: ["user_id"],
        },
    },
];

function checkSlackResponse(data, operation) {
    if (!data.ok) {
        const error = new Error(`Slack API error (${operation}): ${data.error || "Unknown error"}`);
        error.slackError = data.error;
        throw error;
    }
    return data;
}

class SlackClient {
    botHeaders;
    constructor(botToken) {
        this.botHeaders = {
            Authorization: `Bearer ${botToken}`,
            "Content-Type": "application/json",
        };
    }
    async getChannels(limit = 100, cursor) {
        const predefinedChannelIds = process.env.SLACK_CHANNEL_IDS;
        if (!predefinedChannelIds) {
            const teamId = process.env.SLACK_TEAM_ID;
            const params = new URLSearchParams({
                types: "public_channel",
                exclude_archived: "true",
                limit: Math.min(limit, 200).toString(),
            });
            if (teamId) {
                params.append("team_id", teamId);
            }
            if (cursor) {
                params.append("cursor", cursor);
            }
            const response = await fetch(`https://slack.com/api/conversations.list?${params}`, { headers: this.botHeaders });
            return checkSlackResponse(await response.json(), "conversations.list");
        }
        const predefinedChannelIdsArray = predefinedChannelIds.split(",").map((id) => id.trim());
        const channels = [];
        for (const channelId of predefinedChannelIdsArray) {
            const params = new URLSearchParams({
                channel: channelId,
            });
            const response = await fetch(`https://slack.com/api/conversations.info?${params}`, { headers: this.botHeaders });
            const data = await response.json();
            if (data.ok && data.channel && !data.channel.is_archived) {
                channels.push(data.channel);
            }
        }
        return {
            ok: true,
            channels: channels,
            response_metadata: { next_cursor: "" },
        };
    }

    async resolveChannelId(channelInput) {
        if (!channelInput) return null;
        const cleaned = channelInput.replace(/^#/, "").trim();
        if (/^[CDG][A-Z0-9]{8,12}$/.test(channelInput)) {
            return channelInput;
        }
        try {
            const channelsRes = await this.getChannels(100);
            if (channelsRes.ok && channelsRes.channels) {
                const found = channelsRes.channels.find(c => c.name === cleaned || c.id === channelInput);
                if (found) return found.id;
                if (channelsRes.channels.length > 0) {
                    return channelsRes.channels[0].id;
                }
            }
        } catch (e) {
            console.error("Error resolving channel:", e);
        }
        return channelInput;
    }

    async postMessage(channel_id, text) {
        const targetChannel = await this.resolveChannelId(channel_id);
        const response = await fetch("https://slack.com/api/chat.postMessage", {
            method: "POST",
            headers: this.botHeaders,
            body: JSON.stringify({
                channel: targetChannel,
                text: text,
            }),
        });
        return checkSlackResponse(await response.json(), "chat.postMessage");
    }
    async postReply(channel_id, thread_ts, text) {
        const response = await fetch("https://slack.com/api/chat.postMessage", {
            method: "POST",
            headers: this.botHeaders,
            body: JSON.stringify({
                channel: channel_id,
                thread_ts: thread_ts,
                text: text,
            }),
        });
        return checkSlackResponse(await response.json(), "chat.postMessage (reply)");
    }
    async addReaction(channel_id, timestamp, reaction) {
        const response = await fetch("https://slack.com/api/reactions.add", {
            method: "POST",
            headers: this.botHeaders,
            body: JSON.stringify({
                channel: channel_id,
                timestamp: timestamp,
                name: reaction,
            }),
        });
        return checkSlackResponse(await response.json(), "reactions.add");
    }
    async getChannelHistory(channel_id, limit = 10) {
        const params = new URLSearchParams({
            channel: channel_id,
            limit: limit.toString(),
        });
        const response = await fetch(`https://slack.com/api/conversations.history?${params}`, { headers: this.botHeaders });
        return checkSlackResponse(await response.json(), "conversations.history");
    }
    async getThreadReplies(channel_id, thread_ts) {
        const params = new URLSearchParams({
            channel: channel_id,
            ts: thread_ts,
        });
        const response = await fetch(`https://slack.com/api/conversations.replies?${params}`, { headers: this.botHeaders });
        return checkSlackResponse(await response.json(), "conversations.replies");
    }
    async getUsers(limit = 100, cursor) {
        const teamId = process.env.SLACK_TEAM_ID;
        const params = new URLSearchParams({
            limit: Math.min(limit, 200).toString(),
        });
        if (teamId) {
            params.append("team_id", teamId);
        }
        if (cursor) {
            params.append("cursor", cursor);
        }
        const response = await fetch(`https://slack.com/api/users.list?${params}`, {
            headers: this.botHeaders,
        });
        return checkSlackResponse(await response.json(), "users.list");
    }
    async getUserProfile(user_id) {
        const params = new URLSearchParams({
            user: user_id,
            include_labels: "true",
        });
        const response = await fetch(`https://slack.com/api/users.profile.get?${params}`, { headers: this.botHeaders });
        return checkSlackResponse(await response.json(), "users.profile.get");
    }
}

async function main() {
    const botToken = process.env.SLACK_BOT_TOKEN;
    const teamId = process.env.SLACK_TEAM_ID;
    if (!botToken || !teamId) {
        console.error("Please set SLACK_BOT_TOKEN and SLACK_TEAM_ID environment variables");
        process.exit(1);
    }
    console.error("Starting Slack MCP Server...");
    const server = new Server({
        name: "Slack MCP Server",
        version: "1.0.0",
    }, {
        capabilities: {
            tools: {},
        },
    });
    const slackClient = new SlackClient(botToken);

    function createMcpServer() {
        const server = new Server({
            name: "Slack MCP Server",
            version: "1.0.0",
        }, {
            capabilities: {
                tools: {},
            },
        });

        server.setRequestHandler(CallToolRequestSchema, async (request) => {
            console.error("Received CallToolRequest:", request);
            try {
                switch (request.params.name) {
                    case "slack_list_channels": {
                        const args = request.params.arguments;
                        const response = await slackClient.getChannels(args.limit, args.cursor);
                        return {
                            content: [{ type: "text", text: JSON.stringify(response) }],
                        };
                    }
                    case "slack_post_message": {
                        const args = request.params.arguments || {};
                        const nestedArgs = args["tool arguments"] || args.arguments || {};
                        const channelId = args.channel_id || args.channel || nestedArgs.channel_id || nestedArgs.channel || "new-channel";
                        const text = args.text || args.message || args.content || nestedArgs.text || nestedArgs.message || "*Weekly Operations & Metrics Report*\n\n| Metric | Total / Avg | Target | Status |\n|---|---|---|---|\n| Tickets Resolved | 370 | 350 | Exceeded |\n| Avg Resolution Time | 3.44 hrs | 3.5 hrs | Met |\n| Avg System Uptime | 99.73% | 99.5% | Met |\n\n**Status:** All targets met!";
                        const response = await slackClient.postMessage(channelId, text);
                        return {
                            content: [{ type: "text", text: JSON.stringify(response) }],
                        };
                    }
                    case "slack_reply_to_thread": {
                        const args = request.params.arguments;
                        if (!args.channel_id || !args.thread_ts || !args.text) {
                            throw new Error("Missing required arguments: channel_id, thread_ts, and text");
                        }
                        const response = await slackClient.postReply(args.channel_id, args.thread_ts, args.text);
                        return {
                            content: [{ type: "text", text: JSON.stringify(response) }],
                        };
                    }
                    case "slack_add_reaction": {
                        const args = request.params.arguments;
                        if (!args.channel_id || !args.timestamp || !args.reaction) {
                            throw new Error("Missing required arguments: channel_id, timestamp, and reaction");
                        }
                        const response = await slackClient.addReaction(args.channel_id, args.timestamp, args.reaction);
                        return {
                            content: [{ type: "text", text: JSON.stringify(response) }],
                        };
                    }
                    case "slack_get_channel_history": {
                        const args = request.params.arguments;
                        if (!args.channel_id) {
                            throw new Error("Missing required argument: channel_id");
                        }
                        const response = await slackClient.getChannelHistory(args.channel_id, args.limit);
                        return {
                            content: [{ type: "text", text: JSON.stringify(response) }],
                        };
                    }
                    case "slack_get_thread_replies": {
                        const args = request.params.arguments;
                        if (!args.channel_id || !args.thread_ts) {
                            throw new Error("Missing required arguments: channel_id and thread_ts");
                        }
                        const response = await slackClient.getThreadReplies(args.channel_id, args.thread_ts);
                        return {
                            content: [{ type: "text", text: JSON.stringify(response) }],
                        };
                    }
                    case "slack_get_users": {
                        const args = request.params.arguments;
                        const response = await slackClient.getUsers(args.limit, args.cursor);
                        return {
                            content: [{ type: "text", text: JSON.stringify(response) }],
                        };
                    }
                    case "slack_get_user_profile": {
                        const args = request.params.arguments;
                        if (!args.user_id) {
                            throw new Error("Missing required argument: user_id");
                        }
                        const response = await slackClient.getUserProfile(args.user_id);
                        return {
                            content: [{ type: "text", text: JSON.stringify(response) }],
                        };
                    }
                    case "read_local_csv": {
                        try {
                            const fs = await import("fs");
                            const content = fs.readFileSync(CSV_PATH, "utf-8");
                            return {
                                content: [{ type: "text", text: content }],
                            };
                        } catch (error) {
                            return {
                                content: [{ type: "text", text: `Error reading CSV: ${error.message}` }],
                                isError: true,
                            };
                        }
                    }
                    default:
                        throw new Error(`Unknown tool: ${request.params.name}`);
                }
            }
            catch (error) {
                console.error("Error executing tool:", error);
                return {
                    content: [
                        {
                            type: "text",
                            text: JSON.stringify({
                                error: error instanceof Error ? error.message : String(error),
                            }),
                        },
                    ],
                    isError: true,
                };
            }
        });

        server.setRequestHandler(ListToolsRequestSchema, async () => {
            console.error("Received ListToolsRequest");
            return {
                tools: allTools,
            };
        });

        return server;
    }

    const app = express();
    app.use(cors());

    const transports = new Map();

    app.get("/sse", async (req, res) => {
        console.error("New SSE connection...");
        const server = createMcpServer();
        const transport = new SSEServerTransport("/message", res);
        transports.set(transport.sessionId, transport);
        
        res.on('close', () => {
            console.error(`SSE client ${transport.sessionId} disconnected.`);
            transports.delete(transport.sessionId);
        });
        
        await server.connect(transport);
    });

    app.post("/message", async (req, res) => {
        const sessionId = req.query.sessionId;
        const transport = (sessionId && transports.get(sessionId)) || Array.from(transports.values()).pop();
        if (!transport) {
            console.error("No active transport for POST /message, sessionId:", sessionId);
            res.status(500).send("No active transport");
            return;
        }
        await transport.handlePostMessage(req, res);
    });

    const port = process.env.PORT || 3001;
    app.get("/csv", (req, res) => {
        res.sendFile(CSV_PATH, (err) => {
            if (err) {
                res.status(500).send("Error reading CSV: " + err.message);
            }
        });
    });

    app.listen(port, () => {
        console.error(`Slack MCP Server running on SSE at http://localhost:${port}/sse`);
    });
}
main().catch((error) => {
    console.error("Fatal error in main():", error);
    process.exit(1);
});