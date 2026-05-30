require("dotenv").config();
const mongoose = require("mongoose");
const Coupon = require("./models/Coupon");

mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
}).then(async () => {
    console.log("Connected to MongoDB");
    
    // create a sample coupon
    await Coupon.create({
        code: "DEVINPRO30",
        durationDays: 30,
        isActive: true,
        maxUses: 100
    });
    
    console.log("Coupon DEVINPRO30 created successfully!");
    process.exit(0);
}).catch(err => {
    console.error("Connection error:", err);
    process.exit(1);
});
