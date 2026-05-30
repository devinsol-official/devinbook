require("dotenv").config();
const mongoose = require("mongoose");
const User = require("./models/User");

mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
}).then(async () => {
    console.log("Connected to MongoDB");
    
    const result = await User.updateMany({ plan: "pro" }, {
        $set: {
            plan: "free",
            planActivatedAt: null,
            planExpiresAt: null
        }
    });
    console.log(`Successfully deactivated ${result.modifiedCount} Pro subscriptions!`);
    
    process.exit(0);
}).catch(err => {
    console.error("Connection error:", err);
    process.exit(1);
});
