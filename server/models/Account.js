const mongoose = require("mongoose");

const accountSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    name: { type: String, required: true },
    type: { type: String, enum: ["cash", "bank", "person", "regular billing", "other"], default: "cash" },
    isDefault: { type: Boolean, default: false },
    isFeatured: { type: Boolean, default: false },
    lastReportSentAt: { type: Date, default: null },
    autoLog: { type: Boolean, default: false },
    defaultItems: [{
        name: { type: String, required: true },
        quantity: { type: Number, required: true },
        unit: { type: String, default: "kg" },
        pricePerUnit: { type: Number, required: true }
    }]
}, {
    timestamps: true,
    toJSON: {
        virtuals: true,
        versionKey: false,
        transform: (doc, ret) => {
            ret.id = ret._id;
            delete ret._id;
        }
    }
});

accountSchema.index({ userId: 1 });

module.exports = mongoose.model("Account", accountSchema);
