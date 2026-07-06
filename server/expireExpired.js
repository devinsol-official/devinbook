require("dotenv").config();
const mongoose = require("mongoose");
const User = require("./models/User");
const SubscriptionLog = require("./models/SubscriptionLog");

mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
}).then(async () => {
    console.log("Connected to MongoDB");
    const now = new Date();
    
    const expiredUsers = await User.find({
        plan: "pro",
        planExpiresAt: { $lt: now }
    });

    if (expiredUsers.length === 0) {
        console.log("No expired users found.");
        process.exit(0);
    }

    console.log(`Found ${expiredUsers.length} expired users. Expiring them now...`);

    for (const user of expiredUsers) {
        user.plan = "free";
        user.planActivatedAt = null;
        user.planExpiresAt = null;
        await user.save();

        await SubscriptionLog.create({
            user: user._id,
            action: "Expired",
            details: "Manual database script sweep",
        });
        
        console.log(`Expired user: ${user.name} (${user.email})`);
    }

    console.log(`Successfully expired ${expiredUsers.length} users.`);
    process.exit(0);
}).catch(err => {
    console.error("Connection error:", err);
    process.exit(1);
});
