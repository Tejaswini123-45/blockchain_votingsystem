/**
 * Database Seed Script
 * @description Seeds the database with sample users and candidates
 * 
 * Usage: 
 *   node scripts/seed.js          # Seed with sample data
 *   node scripts/seed.js --clear  # Clear and reseed
 */

require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User.model');
const Candidate = require('../models/Candidate');

const MONGO_URI = process.env.MONGODB_URI || process.env.MONGO_URI;

// Sample data (matching simplified User model)
const sampleUsers = [
  // Admin
  {
    userId: 'ADMIN001',
    name: 'Admin User',
    email: 'admin@college.edu',
    password: 'admin123',
    role: 'admin',
    isVerified: true,
  },
  // Students
  {
    userId: 'STU001',
    name: 'Karthik Battiprolu',
    email: 'karthik@college.edu',
    department: 'CSE',
    year: 3,
    password: 'password123',
    role: 'student',
    isVerified: true,
  },
  {
    userId: 'STU002',
    name: 'Priya Sharma',
    email: 'priya.sharma@college.edu',
    department: 'ECE',
    year: 2,
    password: 'password123',
    role: 'student',
    isVerified: true,
  },
  {
    userId: 'STU003',
    name: 'Rahul Kumar',
    email: 'rahul.kumar@college.edu',
    department: 'IT',
    year: 4,
    password: 'password123',
    role: 'student',
    isVerified: false,
  },
  {
    userId: 'STU004',
    name: 'Ananya Reddy',
    email: 'ananya.reddy@college.edu',
    department: 'AIDS',
    year: 1,
    password: 'password123',
    role: 'student',
    isVerified: true,
  },
];

const log = {
  info: (msg) => console.log(`[INFO] ${msg}`),
  success: (msg) => console.log(`[SUCCESS] ${msg}`),
  error: (msg) => console.log(`[ERROR] ${msg}`),
  warn: (msg) => console.log(`[WARN] ${msg}`),
};

// Sample candidates data
const sampleCandidates = [
  // Student President
  {
    name: 'Aditya Sharma',
    position: 'Student President',
    department: 'CSE',
    description: 'Experienced leader with a vision for student welfare and campus development.',
    image: '',
  },
  {
    name: 'Sneha Reddy',
    position: 'Student President',
    department: 'ECE',
    description: 'Passionate about student rights and creating an inclusive campus environment.',
    image: '',
  },
  // Vice President
  {
    name: 'Rohit Kumar',
    position: 'Vice President',
    department: 'IT',
    description: 'Dedicated to bridging the gap between students and administration.',
    image: '',
  },
  {
    name: 'Priya Nair',
    position: 'Vice President',
    department: 'AIDS',
    description: 'Committed to enhancing academic resources and student support systems.',
    image: '',
  },
  // General Secretary
  {
    name: 'Vikram Patel',
    position: 'General Secretary',
    department: 'MECH',
    description: 'Focused on organizing events and improving campus facilities.',
    image: '',
  },
  {
    name: 'Kavitha Menon',
    position: 'General Secretary',
    department: 'EEE',
    description: 'Experienced event organizer with strong communication skills.',
    image: '',
  },
  // Cultural Secretary
  {
    name: 'Arjun Verma',
    position: 'Cultural Secretary',
    department: 'CSE',
    description: 'Creative mind passionate about arts and cultural activities.',
    image: '',
  },
  {
    name: 'Meera Krishnan',
    position: 'Cultural Secretary',
    department: 'IT',
    description: 'Dancer and event planner with experience in cultural fests.',
    image: '',
  },
  // Sports Secretary
  {
    name: 'Kiran Singh',
    position: 'Sports Secretary',
    department: 'MECH',
    description: 'State-level athlete committed to promoting sports culture.',
    image: '',
  },
  {
    name: 'Ananya Gupta',
    position: 'Sports Secretary',
    department: 'ECE',
    description: 'Captain of college basketball team with passion for fitness.',
    image: '',
  },
  // Technical Secretary
  {
    name: 'Siddharth Rao',
    position: 'Technical Secretary',
    department: 'CSE',
    description: 'Tech enthusiast with experience in hackathons and tech events.',
    image: '',
  },
  {
    name: 'Divya Sharma',
    position: 'Technical Secretary',
    department: 'AIDS',
    description: 'AI/ML researcher passionate about innovation and workshops.',
    image: '',
  },
];

const seed = async () => {
  try {
    log.info('Connecting to MongoDB...');
    await mongoose.connect(MONGO_URI);
    log.success(`Connected to: ${mongoose.connection.name}`);

    const shouldClear = process.argv.includes('--clear');

    if (shouldClear) {
      log.warn('Clearing existing users...');
      await User.deleteMany({});
      log.success('Users cleared');
    }

    log.info('Seeding users...');
    let created = 0;
    let skipped = 0;

    for (const userData of sampleUsers) {
      const exists = await User.findByUserId(userData.userId);
      if (exists) {
        log.warn(`User ${userData.userId} already exists, skipping`);
        skipped++;
        continue;
      }

      await User.create(userData);
      log.success(`Created: ${userData.userId} (${userData.role})`);
      created++;
    }

    console.log(`\nUsers seeding complete! Created: ${created} | Skipped: ${skipped}\n`);

    // Seed Candidates
    log.info('Seeding candidates...');
    let candidatesCreated = 0;
    let candidatesSkipped = 0;

    if (shouldClear) {
      log.warn('Clearing existing candidates...');
      await Candidate.deleteMany({});
      log.success('Candidates cleared');
    }

    for (const candidateData of sampleCandidates) {
      const exists = await Candidate.findOne({ 
        name: candidateData.name, 
        position: candidateData.position 
      });
      if (exists) {
        log.warn(`Candidate ${candidateData.name} already exists, skipping`);
        candidatesSkipped++;
        continue;
      }

      await Candidate.create(candidateData);
      log.success(`Created candidate: ${candidateData.name} (${candidateData.position})`);
      candidatesCreated++;
    }

    console.log(`\nCandidates seeding complete! Created: ${candidatesCreated} | Skipped: ${candidatesSkipped}\n`);

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    log.error(`Seed failed: ${error.message}`);
    console.error(error);
    process.exit(1);
  }
};

seed();
