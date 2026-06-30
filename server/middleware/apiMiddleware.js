const User = require("../models/User");

const protectApiKey = async (req, res, next) => {
    const apiKey = req.headers["x-api-key"] || req.query.apiKey;
    if (!apiKey) return res.status(401).json({ message: "Not authorized, no API key provided" });

    try {
        const user = await User.findOne({ apiKey }).select("-passwordHash");
        if (!user) {
            return res.status(401).json({ message: "Not authorized, invalid API key" });
        }
        req.user = user;
        next();
    } catch (err) {
        res.status(500).json({ message: "Server error during authentication" });
    }
};

module.exports = { protectApiKey };
