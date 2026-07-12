const mongoose = require('mongoose');
require('dotenv').config();

const User = require('../models/User');
const Account = require('../models/Account');
const Transaction = require('../models/Transaction');

async function resetMilkGuy() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        const user = await User.findOne({ email: 'tabarakyaseen46@gmail.com' });
        if (!user) {
            console.log('User not found');
            process.exit(1);
        }
        console.log(`Found user: ${user._id}`);

        const account = await Account.findOne({ userId: user._id, name: 'Milk Guy' });
        if (!account) {
            console.log('Account "Milk Guy" not found');
            process.exit(1);
        }
        console.log(`Found account "Milk Guy": ${account._id}`);

        const result = await Transaction.deleteMany({
            userId: user._id,
            accountId: account._id,
            type: 'expense'
        });

        console.log(`Deleted ${result.deletedCount} expense transactions for Milk Guy account`);

        // Let's also check if there are any income transactions just in case
        const incomeResult = await Transaction.deleteMany({
            userId: user._id,
            accountId: account._id,
            type: 'income'
        });

        console.log(`Deleted ${incomeResult.deletedCount} income transactions for Milk Guy account`);

        console.log('Reset complete!');
        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

resetMilkGuy();
