require("dotenv").config();
const mongoose = require("mongoose");
const User = require("./models/User");
const SubscriptionLog = require("./models/SubscriptionLog");

mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
}).then(async () => {
    console.log("Connected to MongoDB");
    
    // 1. Delete all subscription history logs
    const deletedLogs = await SubscriptionLog.deleteMany({});
    console.log(`Deleted ${deletedLogs.deletedCount} SubscriptionLogs.`);

    // 2. Set all users to Free plan
    const updatedUsers = await User.updateMany({}, {
        $set: {
            plan: "free",
            planActivatedAt: null,
            planExpiresAt: null
        }
    });
    console.log(`Reset ${updatedUsers.modifiedCount} users back to the Free plan.`);
    
    process.exit(0);
}).catch(err => {
    console.error("Connection error:", err);
    process.exit(1);
});
