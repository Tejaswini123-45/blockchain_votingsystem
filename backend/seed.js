const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// User Schema (same as models/User.js)
const userSchema = new mongoose.Schema({
  studentId: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  department: {
    type: String,
    required: true,
    enum: ['CSE', 'ECE', 'EEE', 'MECH', 'CIVIL', 'IT', 'AIDS', 'AIML', 'CSM']
  },
  year: {
    type: String,
    required: true,
    enum: ['1st Year', '2nd Year', '3rd Year', '4th Year']
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  role: {
    type: String,
    enum: ['student', 'admin'],
    default: 'student'
  },
  hasVoted: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

const User = mongoose.model('User', userSchema);

// 5 Sample Students Data
const studentsData = [
  {
    studentId: 'STU001',
    name: 'Karthik Battiprolu',
    email: 'karthik@college.edu',
    department: 'CSE',
    year: '3rd Year',
    password: 'password123',
    role: 'student'
  },
  {
    studentId: 'STU002',
    name: 'Priya Sharma',
    email: 'priya.sharma@college.edu',
    department: 'ECE',
    year: '2nd Year',
    password: 'password123',
    role: 'student'
  },
  {
    studentId: 'STU003',
    name: 'Rahul Kumar',
    email: 'rahul.kumar@college.edu',
    department: 'IT',
    year: '4th Year',
    password: 'password123',
    role: 'student'
  },
  {
    studentId: 'STU004',
    name: 'Ananya Reddy',
    email: 'ananya.reddy@college.edu',
    department: 'AIDS',
    year: '1st Year',
    password: 'password123',
    role: 'student'
  },
  {
    studentId: 'STU005',
    name: 'Vikram Singh',
    email: 'vikram.singh@college.edu',
    department: 'MECH',
    year: '3rd Year',
    password: 'password123',
    role: 'admin'
  }
];

// Seed Function
const seedDatabase = async () => {
  try {
    // Connect to MongoDB Atlas
    console.log('🔗 Connecting to MongoDB Atlas...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB Atlas successfully!\n');

    // Clear existing users
    console.log('🗑️  Clearing existing users...');
    await User.deleteMany({});
    console.log('✅ Cleared existing users\n');

    // Hash passwords and create users
    console.log('👥 Creating 5 student records...\n');
    
    for (const student of studentsData) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(student.password, salt);
      
      const newUser = await User.create({
        ...student,
        password: hashedPassword
      });
      
      console.log(`   ✅ Created: ${student.name} (${student.studentId}) - ${student.department}`);
    }

    console.log('\n========================================');
    console.log('🎉 DATABASE SEEDED SUCCESSFULLY!');
    console.log('========================================\n');
    console.log('📋 Login Credentials:');
    console.log('----------------------------------------');
    studentsData.forEach(s => {
      console.log(`   Email: ${s.email}`);
      console.log(`   Password: password123`);
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
    process.exit(1);
  }
};

// Run the seed function
seedDatabase();
