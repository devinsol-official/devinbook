const express = require("express");
const User = require("../models/User");
const { createMcpServer } = require("../mcp/index");
const { StreamableHTTPServerTransport } = require("@modelcontextprotocol/sdk/server/streamableHttp.js");

const router = express.Router();

// MCP Auth Middleware using personal access token (apiKey)
const mcpAuth = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Not authorized, no token provided" });
  }

  const token = authHeader.split(" ")[1];
  try {
    const user = await User.findOne({ apiKey: token });
    if (!user) {
      return res.status(401).json({ message: "Not authorized, invalid token" });
    }
    
    // Check subscription if applicable, though for MCP we might just allow if they have an apiKey
    if (user.plan !== "pro") {
      // Optional: uncomment if you want to restrict MCP to pro users only
      // return res.status(403).json({ message: "MCP access requires Pro subscription" });
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(500).json({ message: "Server error during authentication" });
  }
};

// Route handles all POST requests from MCP client
router.post("/", mcpAuth, async (req, res) => {
  try {
    const user = req.user;
    
    // Create scoped server for this user
    const mcpServer = createMcpServer(user);
    
    // Create stateless HTTP transport (session generator undefined)
    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: undefined
    });
    
    // Connect them
    await mcpServer.connect(transport);
    
    // Handle the request
    // transport.handleRequest takes (req, res, parsedBody)
    await transport.handleRequest(req, res, req.body);
    
  } catch (err) {
    console.error("MCP Request Error:", err);
    if (!res.headersSent) {
      res.status(500).json({ error: "MCP server error" });
    }
  }
});

module.exports = router;
