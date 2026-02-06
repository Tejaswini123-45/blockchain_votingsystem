/**
 * Seed Script for Students
 * @description Populates the database with sample student data
 * @author Senior MERN Developer
 * 
 * Usage: node seed.students.js
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Student = require('./models/Student.model');

// Load environment variables
dotenv.config();

// Sample students data
const studentsData = [
  {
    studentId: 'STU001',
    name: 'Karthik Battiprolu',
    email: 'karthik@college.edu',
    department: 'CSE',
    year: 3,
    password: 'password123',
    role: 'student',
  },
  {
    studentId: 'STU002',
    name: 'Priya Sharma',
    email: 'priya.sharma@college.edu',
    department: 'ECE',
    year: 2,
    password: 'password123',
    role: 'student',
  },
  {
    studentId: 'STU003',
    name: 'Rahul Kumar',
    email: 'rahul.kumar@college.edu',
    department: 'IT',
    year: 4,
    password: 'password123',
    role: 'student',
  },
  {
    studentId: 'STU004',
    name: 'Ananya Reddy',
    email: 'ananya.reddy@college.edu',
    department: 'AIDS',
    year: 1,
    password: 'password123',
    role: 'student',
  },
  {
    studentId: 'ADMIN001',
    name: 'Vikram Singh',
    email: 'vikram.singh@college.edu',
    department: 'MECH',
    year: 3,
    password: 'admin123',
    role: 'admin',
  },
];

// Seed function
const seedDatabase = async () => {
  try {
    // Connect to MongoDB
    console.log('🔗 Connecting to MongoDB Atlas...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB Atlas!\n');

    // Clear existing students
    console.log('🗑️  Clearing existing students...');
    await Student.deleteMany({});
    console.log('✅ Cleared existing students\n');

    // Create students
    console.log('👥 Creating 5 student records...\n');

    for (const studentData of studentsData) {
      const student = await Student.create(studentData);
      console.log(
        `   ✅ Created: ${student.name} (${student.studentId}) - ${student.department} - Year ${student.year}`
      );
    }

    console.log('\n========================================');
    console.log('🎉 DATABASE SEEDED SUCCESSFULLY!');
    console.log('========================================\n');

    console.log('📋 Login Credentials:');
    console.log('----------------------------------------');
    studentsData.forEach((s) => {
      console.log(`   Student ID: ${s.studentId}`);
      console.log(`   Email: ${s.email}`);
      console.log(`   Password: ${s.password}`);
      console.log(`   Role: ${s.role}`);
      console.log('   ---');
    });
    console.log('----------------------------------------\n');

    // Disconnect
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB\n');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error.message);
    console.error(error);
    process.exit(1);
  }
};

// Run seed
seedDatabase();
