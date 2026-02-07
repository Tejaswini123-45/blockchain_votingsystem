/**
 * Quick KYC Approval Script
 * Run: node scripts/approveKYC.js <email>
 */

const mongoose = require('mongoose');
const path = require('path');
const dotenv = require('dotenv');

// Load env
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const User = require('../models/User.model');

async function approveKYC() {
    const email = process.argv[2];
    
    if (!email) {
        console.log('Usage: node scripts/approveKYC.js <email>');
        console.log('Example: node scripts/approveKYC.js user@gmail.com');
        process.exit(1);
    }

    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        const user = await User.findOne({ email: email.toLowerCase() });
        
        if (!user) {
            console.log(`❌ User not found with email: ${email}`);
            process.exit(1);
        }

        user.kycStatus = 'approved';
        user.kycVerifiedAt = new Date();
        await user.save();

        console.log(`✅ KYC approved for: ${user.name} (${user.email})`);
        console.log(`   User ID: ${user.userId}`);
        console.log(`   KYC Status: ${user.kycStatus}`);
        
        await mongoose.connection.close();
        console.log('✅ Done!');
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

approveKYC();
