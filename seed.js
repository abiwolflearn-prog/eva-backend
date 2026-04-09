const mongoose = require('mongoose');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
const Teacher = require('./models/Teacher');
const Evaluation = require('./models/Evaluation');

dotenv.config();

const seedDatabase = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    
    // Clear existing data
    await User.deleteMany({ email: { $in: ['student@eva.com', 'admin@eva.com'] } });
    await Teacher.deleteMany({});
    await Evaluation.deleteMany({});

    // Create Student
    await User.create({
      name: 'Alex Student',
      email: 'student@eva.com',
      password: 'password123',
      role: 'student'
    });
    console.log('Created Student: student@eva.com / password123');

    // Create Admin
    await User.create({
      name: 'Eva Admin',
      email: 'admin@eva.com',
      password: 'password123',
      role: 'admin'
    });
    console.log('Created Admin: admin@eva.com / password123');

    // Create Sample Teachers
    const teachers = [
      {
        name: 'Dr. John Smith',
        college: 'College of Engineering and Technology',
        program: 'Software Engineering',
        courseName: 'Web Development II',
        year: 3,
        semester: 1,
        averageRating: 4.5,
        totalEvaluations: 10
      },
      {
        name: 'Inst. Sarah Johnson',
        college: 'College of Medicine and Health Sciences',
        program: 'Medicine',
        courseName: 'Human Anatomy',
        year: 2,
        semester: 1,
        averageRating: 4.8,
        totalEvaluations: 8
      },
      {
        name: 'Dr. Robert Brown',
        college: 'College of Engineering and Technology',
        program: 'Computer Science',
        courseName: 'Algorithms & Data Structures',
        year: 2,
        semester: 2,
        averageRating: 4.2,
        totalEvaluations: 15
      },
      {
        name: 'Inst. Emily White',
        college: 'College of Agriculture',
        program: 'Animal Sciences',
        courseName: 'Animal Nutrition',
        year: 1,
        semester: 1,
        averageRating: 3.9,
        totalEvaluations: 5
      }
    ];

    await Teacher.insertMany(teachers);
    console.log('Seed: Added 4 sample teachers across different colleges');

    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
};

seedDatabase();
