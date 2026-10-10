const express = require("express");
const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const User = require("../models/User");
const OAuthClient = require("../models/OAuthClient");
const OAuthCode = require("../models/OAuthCode");

const router = express.Router();

// 1. Metadata discovery
router.get("/.well-known/oauth-authorization-server", (req, res) => {
  const protocol = req.headers['x-forwarded-proto'] || req.protocol;
  const host = req.headers['x-forwarded-host'] || req.get("host");
  const baseUrl = `${protocol}://${host}`;
  res.json({
    issuer: baseUrl,
    authorization_endpoint: `${baseUrl}/api/oauth/authorize`,
    token_endpoint: `${baseUrl}/api/oauth/token`,
    registration_endpoint: `${baseUrl}/api/oauth/register`,
    scopes_supported: ["read", "write"],
    response_types_supported: ["code"],
    grant_types_supported: ["authorization_code"],
    token_endpoint_auth_methods_supported: ["client_secret_post", "client_secret_basic"],
    code_challenge_methods_supported: ["S256"],
  });
});

// 2. Dynamic Client Registration (DCR)
router.post("/register", async (req, res) => {
  try {
    const { client_name, redirect_uris } = req.body;
    
    // Generate credentials
    const clientId = "client_" + crypto.randomBytes(16).toString("hex");
    const clientSecret = "secret_" + crypto.randomBytes(32).toString("hex");

    const newClient = await OAuthClient.create({
      clientId,
      clientSecret,
      clientName: client_name || "Unknown Client",
      redirectUris: redirect_uris || [],
    });

    res.status(201).json({
      client_id: newClient.clientId,
      client_secret: newClient.clientSecret,
      client_id_issued_at: Math.floor(newClient.createdAt.getTime() / 1000),
      client_secret_expires_at: 0,
      client_name: newClient.clientName,
      redirect_uris: newClient.redirectUris,
      grant_types: ["authorization_code"],
      response_types: ["code"],
      token_endpoint_auth_method: "client_secret_post"
    });
  } catch (err) {
    console.error("DCR Error:", err);
    res.status(500).json({ error: "server_error" });
  }
});

// 3. Authorization Endpoint (Serve Login Form)
router.get("/authorize", async (req, res) => {
  const { client_id, redirect_uri, state, code_challenge, code_challenge_method } = req.query;

  if (!client_id || !redirect_uri) {
    return res.status(400).send("Missing client_id or redirect_uri");
  }

  // Redirect to frontend login page
  const clientUrl = process.env.CLIENT_URL || `http://localhost:3000`;
  const frontendUrl = new URL(`${clientUrl}/login`);
  frontendUrl.searchParams.set("client_id", client_id);
  frontendUrl.searchParams.set("redirect_uri", redirect_uri);
  if (state) frontendUrl.searchParams.set("state", state);
  
  res.redirect(frontendUrl.toString());
});

// 4. Authorization Endpoint (Process Login & Generate Code)
router.post("/authorize", async (req, res) => {
  const { email, password, client_id, redirect_uri, state } = req.body;
  const token = req.headers.authorization?.split(" ")[1];

  try {
    let user;
    if (token) {
      const jwt = require("jsonwebtoken");
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      user = await User.findById(decoded.id);
      if (!user) {
        return res.status(401).json({ error: "invalid_token" });
      }
    } else {
      user = await User.findOne({ email });
      if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
        // Return JSON error for api calls
        if (req.headers.accept?.includes("application/json")) {
           return res.status(401).json({ error: "invalid_credentials" });
        }
        // Redirect back to login with error
        const errUrl = new URL(`${req.protocol}://${req.get("host")}/api/oauth/authorize`);
        errUrl.searchParams.set("client_id", client_id);
        errUrl.searchParams.set("redirect_uri", redirect_uri);
        if (state) errUrl.searchParams.set("state", state);
        errUrl.searchParams.set("error", "invalid_credentials");
        return res.redirect(errUrl.toString());
      }
    }

    // Ensure the user has an API key (generate if missing, though typically they have one)
    if (!user.apiKey) {
      user.apiKey = crypto.randomBytes(32).toString("hex");
      await user.save();
    }

    // Generate Auth Code
    const code = crypto.randomBytes(16).toString("hex");
    
    await OAuthCode.create({
      code,
      userId: user._id,
      clientId: client_id,
      redirectUri: redirect_uri,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000) // 10 minutes expiry
    });

    // Redirect to client callback
    const redirectUrl = new URL(redirect_uri);
    redirectUrl.searchParams.set("code", code);
    if (state) {
      redirectUrl.searchParams.set("state", state);
    }

    if (req.headers.accept?.includes("application/json") || token) {
      return res.json({ redirect_url: redirectUrl.toString() });
    }

    res.redirect(redirectUrl.toString());

  } catch (err) {
    console.error("Authorize POST Error:", err);
    res.status(500).send("Server Error");
  }
});

// 5. Token Endpoint (Exchange Code for API Key)
router.post("/token", async (req, res) => {
  try {
    const { grant_type, code, client_id, redirect_uri } = req.body;

    if (grant_type !== "authorization_code") {
      return res.status(400).json({ error: "unsupported_grant_type" });
    }

    const oauthCode = await OAuthCode.findOne({ code, clientId: client_id });
    if (!oauthCode) {
      return res.status(400).json({ error: "invalid_grant", error_description: "Invalid or expired code" });
    }

    if (oauthCode.redirectUri !== redirect_uri) {
      return res.status(400).json({ error: "invalid_grant", error_description: "Redirect URI mismatch" });
    }

    const user = await User.findById(oauthCode.userId);
    if (!user) {
      return res.status(400).json({ error: "invalid_grant", error_description: "User not found" });
    }

    // Delete the used code
    await OAuthCode.deleteOne({ _id: oauthCode._id });

    // Return the user's API Key as the access token
    // This makes it fully compatible with your existing MCP authentication!
    res.json({
      access_token: user.apiKey,
      token_type: "Bearer",
      expires_in: 31536000, // 1 year
    });

  } catch (err) {
    console.error("Token Error:", err);
    res.status(500).json({ error: "server_error" });
  }
});

module.exports = router;
