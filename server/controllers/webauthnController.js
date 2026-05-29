const User = require("../models/User");
const {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
} = require("@simplewebauthn/server");
const generateToken = require("../utils/generateToken");

const rpName = "DevinBook";
const isProd = process.env.NODE_ENV === "production";
const rpID = process.env.RP_ID || (isProd ? "devinbook.devinsol.com" : "localhost");
const origin = process.env.NEXT_PUBLIC_APP_URL || (isProd ? `https://${rpID}` : `http://${rpID}:3000`);

/**
 * Helper to encode/decode arrays
 */
function uint8ArrayToBase64URL(uint8Array) {
  return Buffer.from(uint8Array).toString('base64url');
}

/**
 * GET /api/webauthn/generate-registration-options
 * Gets options to pass to navigator.credentials.create()
 */
exports.generateRegistrationOptions = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: "User not found" });

    const userAuthenticators = user.authenticators || [];

    const options = await generateRegistrationOptions({
      rpName,
      rpID,
      userID: new Uint8Array(Buffer.from(user._id.toString())),
      userName: user.email,
      // Don't prompt users for their authenticator if they've already registered it
      excludeCredentials: userAuthenticators.map((authenticator) => ({
        id: authenticator.credentialID,
        type: 'public-key',
        transports: authenticator.transports,
      })),
      authenticatorSelection: {
        residentKey: 'required',
        userVerification: 'preferred',
      },
    });

    // Save challenge to verify later
    user.currentChallenge = options.challenge;
    await user.save();

    res.json(options);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};

/**
 * POST /api/webauthn/verify-registration
 * Verifies the response from navigator.credentials.create()
 */
exports.verifyRegistration = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: "User not found" });

    const expectedChallenge = user.currentChallenge;
    const body = req.body;

    let verification;
    try {
      verification = await verifyRegistrationResponse({
        response: body,
        expectedChallenge,
        expectedOrigin: origin,
        expectedRPID: rpID,
      });
    } catch (error) {
      console.error(error);
      return res.status(400).send({ error: error.message });
    }

    const { verified, registrationInfo } = verification;

    if (verified && registrationInfo) {
      // @simplewebauthn/server v10+ structure
      const credentialID = registrationInfo.credential ? registrationInfo.credential.id : registrationInfo.credentialID;
      const credentialPublicKey = registrationInfo.credential ? registrationInfo.credential.publicKey : registrationInfo.credentialPublicKey;
      const counter = registrationInfo.credential ? registrationInfo.credential.counter : registrationInfo.counter;
      const { credentialDeviceType, credentialBackedUp } = registrationInfo;

      const newAuthenticator = {
        credentialID: Buffer.from(credentialID),
        credentialPublicKey: Buffer.from(credentialPublicKey),
        counter,
        credentialDeviceType,
        credentialBackedUp,
        transports: body.response.transports || [],
      };

      if (!user.authenticators) {
        user.authenticators = [];
      }
      user.authenticators.push(newAuthenticator);
      user.currentChallenge = undefined; // clear challenge
      await user.save();

      return res.json({ verified: true });
    }

    res.status(400).json({ error: "Verification failed" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};

const authChallenges = new Map(); // Store anonymous challenges in memory temporarily

/**
 * POST /api/webauthn/generate-authentication-options
 * Body: { email } (optional)
 * Gets options to pass to navigator.credentials.get()
 */
exports.generateAuthenticationOptions = async (req, res) => {
  try {
    const { email } = req.body;
    let userAuthenticators = [];
    let user = null;

    if (email) {
      user = await User.findOne({ email });
      if (!user) return res.status(404).json({ message: "User not found" });
      userAuthenticators = user.authenticators || [];
    }

    const options = await generateAuthenticationOptions({
      rpID,
      allowCredentials: userAuthenticators.length > 0 ? userAuthenticators.map((authenticator) => {
        const idStr = authenticator.credentialID.toString('utf8');
        const isBase64Url = /^[A-Za-z0-9\-_]+$/.test(idStr);
        return {
          id: isBase64Url ? idStr : uint8ArrayToBase64URL(authenticator.credentialID),
          type: 'public-key',
          transports: authenticator.transports,
        };
      }) : undefined,
      userVerification: 'preferred',
    });

    if (user) {
      user.currentChallenge = options.challenge;
      await user.save();
    } else {
      // Save challenge in memory for anonymous login
      authChallenges.set(options.challenge, Date.now());
      // Cleanup old challenges
      for (const [chal, time] of authChallenges.entries()) {
        if (Date.now() - time > 5 * 60 * 1000) authChallenges.delete(chal);
      }
    }

    res.json(options);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};

/**
 * POST /api/webauthn/verify-authentication
 * Body: { email, response }
 * Verifies the response from navigator.credentials.get() and logs the user in
 */
exports.verifyAuthentication = async (req, res) => {
  try {
    const { email, response: body } = req.body;

    let user;
    let expectedChallenge;

    if (email) {
      user = await User.findOne({ email });
      if (!user) return res.status(404).json({ message: "User not found" });
      expectedChallenge = user.currentChallenge;
    } else {
      // Decode challenge from clientDataJSON
      const clientDataJSON = Buffer.from(body.response.clientDataJSON, 'base64url').toString('utf8');
      const clientData = JSON.parse(clientDataJSON);
      expectedChallenge = clientData.challenge;

      if (!authChallenges.has(expectedChallenge)) {
        return res.status(400).json({ error: "Challenge expired or invalid" });
      }
      authChallenges.delete(expectedChallenge);
      
      // Find user that has this credentialID
      const allUsers = await User.find({ "authenticators.0": { $exists: true } });
      for (const u of allUsers) {
        const foundAuth = u.authenticators.find(auth => {
          const idStr = auth.credentialID.toString('utf8');
          const isBase64Url = /^[A-Za-z0-9\-_]+$/.test(idStr);
          return (isBase64Url ? idStr : uint8ArrayToBase64URL(auth.credentialID)) === body.id;
        });
        if (foundAuth) {
          user = u;
          break;
        }
      }

      if (!user) return res.status(404).json({ message: "No user found for this authenticator" });
    }

    const userAuthenticators = user.authenticators || [];

    // Find the authenticator used by the client
    let matchedIdStr = '';
    const authenticator = userAuthenticators.find(
      (auth) => {
        const idStr = auth.credentialID.toString('utf8');
        const isBase64Url = /^[A-Za-z0-9\-_]+$/.test(idStr);
        const resolvedId = isBase64Url ? idStr : uint8ArrayToBase64URL(auth.credentialID);
        if (resolvedId === body.id) {
          matchedIdStr = resolvedId;
          return true;
        }
        return false;
      }
    );

    if (!authenticator) {
      return res.status(400).json({ error: "Authenticator is not registered with this site" });
    }

    let verification;
    try {
      verification = await verifyAuthenticationResponse({
        response: body,
        expectedChallenge,
        expectedOrigin: origin,
        expectedRPID: rpID,
        credential: {
          id: matchedIdStr,
          publicKey: new Uint8Array(authenticator.credentialPublicKey),
          counter: authenticator.counter,
          transports: authenticator.transports,
        },
      });
    } catch (error) {
      console.error(error);
      return res.status(400).json({ error: error.message });
    }

    const { verified, authenticationInfo } = verification;

    if (verified) {
      // Update the authenticator's counter
      authenticator.counter = authenticationInfo.newCounter;
      user.currentChallenge = undefined; // clear challenge
      await user.save();

      // Helper function matching authController
      const formatUser = (u) => ({
        id: u._id,
        name: u.name,
        email: u.email,
        plan: u.plan || "free",
        planActivatedAt: u.planActivatedAt || null,
        planExpiresAt: u.planExpiresAt || null,
        theme: u.theme || "light",
      });

      // Login successful!
      return res.json({
        verified: true,
        token: generateToken(user._id),
        user: formatUser(user),
      });
    }

    res.status(400).json({ error: "Verification failed" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};

/**
 * DELETE /api/webauthn/remove-credentials
 * Clear all authenticators for the user
 */
exports.removeCredentials = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: "User not found" });

    user.authenticators = [];
    await user.save();

    res.json({ message: "All biometric credentials removed" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/**
 * GET /api/webauthn/status
 * Check if current user has biometrics enabled
 */
exports.checkStatus = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: "User not found" });

    const hasBiometrics = user.authenticators && user.authenticators.length > 0;
    res.json({ enabled: hasBiometrics });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
