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

  // A simple HTML form to log in
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Authorize Access</title>
      <style>
        body { font-family: system-ui, -apple-system, sans-serif; background: #f9fafb; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; }
        .card { background: white; padding: 2rem; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); width: 100%; max-width: 400px; }
        h2 { margin-top: 0; color: #111827; }
        .form-group { margin-bottom: 1rem; }
        label { display: block; margin-bottom: 0.5rem; color: #374151; font-weight: 500; }
        input { width: 100%; padding: 0.75rem; border: 1px solid #d1d5db; border-radius: 4px; box-sizing: border-box; }
        button { width: 100%; padding: 0.75rem; background: #2563eb; color: white; border: none; border-radius: 4px; font-weight: bold; cursor: pointer; }
        button:hover { background: #1d4ed8; }
        .error { color: #dc2626; margin-bottom: 1rem; font-size: 0.875rem; }
      </style>
    </head>
    <body>
      <div class="card">
        <h2>Connect with Devinbook</h2>
        <p style="color: #6b7280; font-size: 0.875rem; margin-bottom: 1.5rem;">Log in to authorize this application to connect to your account.</p>
        ${req.query.error ? '<div class="error">Invalid email or password</div>' : ''}
        <form method="POST" action="/api/oauth/authorize">
          <input type="hidden" name="client_id" value="${client_id}">
          <input type="hidden" name="redirect_uri" value="${redirect_uri}">
          <input type="hidden" name="state" value="${state || ''}">
          <div class="form-group">
            <label>Email</label>
            <input type="email" name="email" required placeholder="you@example.com">
          </div>
          <div class="form-group">
            <label>Password</label>
            <input type="password" name="password" required>
          </div>
          <button type="submit">Log In & Authorize</button>
        </form>
      </div>
    </body>
    </html>
  `);
});

// 4. Authorization Endpoint (Process Login & Generate Code)
router.post("/authorize", async (req, res) => {
  const { email, password, client_id, redirect_uri, state } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      // Redirect back to login with error
      const errUrl = new URL(`${req.protocol}://${req.get("host")}/api/oauth/authorize`);
      errUrl.searchParams.set("client_id", client_id);
      errUrl.searchParams.set("redirect_uri", redirect_uri);
      if (state) errUrl.searchParams.set("state", state);
      errUrl.searchParams.set("error", "invalid_credentials");
      return res.redirect(errUrl.toString());
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
