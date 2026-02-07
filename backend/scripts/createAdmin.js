/**
 * Create Admin User Script
 * Run: node scripts/createAdmin.js
 */

const mongoose = require('mongoose');
const path = require('path');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');

// Load env
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const User = require('../models/User.model');

async function createAdmin() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        // Check if admin already exists
        const existingAdmin = await User.findOne({ role: 'admin' });
        if (existingAdmin) {
            console.log(`⚠️ Admin already exists: ${existingAdmin.email}`);
            console.log(`   User ID: ${existingAdmin.userId}`);
            await mongoose.connection.close();
            return;
        }

        // Create admin user
        const adminData = {
            userId: 'ADMIN001',
            name: 'System Admin',
            email: 'admin@clgvote.com',
            password: 'admin123',  // Will be hashed by pre-save hook
            role: 'admin',
            kycStatus: 'approved',
            kycVerifiedAt: new Date(),
        };

        const admin = await User.create(adminData);
        
        console.log('✅ Admin user created successfully!');
        console.log('');
        console.log('   Login Credentials:');
        console.log('   ─────────────────────');
        console.log(`   Email: ${admin.email}`);
        console.log('   Password: admin123');
        console.log(`   User ID: ${admin.userId}`);
        console.log('');
        
        await mongoose.connection.close();
        console.log('✅ Done!');
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

createAdmin();
