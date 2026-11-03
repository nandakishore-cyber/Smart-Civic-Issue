const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const User = require('./models/User');

if (!process.env.MONGO_URI) {
  throw new Error('MONGO_URI is missing. Configure it before running the seed command.');
}

const seedAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB Connected for seeding...');

    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: 'admin@civic.com' });

    if (existingAdmin) {
      console.log('Admin user already exists:');
      console.log('  Email: admin@civic.com');
      console.log('  Role:', existingAdmin.role);
      console.log('Skipping admin creation.');
    } else {
      // Create admin user
      const admin = await User.create({
        name: 'Admin',
        email: 'admin@civic.com',
        password: 'admin123',
        phone: '9999999999',
        role: 'admin',
      });

      console.log('Admin user created successfully!');
      console.log('================================');
      console.log('  Name:     Admin');
      console.log('  Email:    admin@civic.com');
      console.log('  Password: admin123');
      console.log('  Phone:    9999999999');
      console.log('  Role:     admin');
      console.log('================================');
    }

    const existingOfficer = await User.findOne({ email: 'officer@civic.com' });
    if (!existingOfficer) {
      await User.create({
        name: 'Government Officer',
        email: 'officer@civic.com',
        password: 'officer123',
        phone: '9999999998',
        role: 'govOfficer',
      });
      console.log('Gov. Officer created: officer@civic.com / officer123');
    } else {
      console.log('Gov. Officer already exists: officer@civic.com');
    }

    await mongoose.connection.close();
    console.log('Database connection closed.');
    process.exit(0);
  } catch (error) {
    console.error('Seeding error:', error.message);
    process.exit(1);
  }
};

seedAdmin();
