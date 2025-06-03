import mongoose from 'mongoose';
import dbConnect from './db';
import { User } from '../models/User';

async function seedUser() {
  try {
    await dbConnect();
    
    // Check if user already exists
    const existingUser = await User.findOne({ username: 'centralvod' });
    if (existingUser) {
      console.log('Default user already exists');
      process.exit(0);
    }
    
    // Create default user
    const user = new User({
      username: 'centralvod',
      password: 'blazevods@',
      createdAt: new Date()
    });
    
    await user.save();
    
    console.log('Default user created successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding user:', error);
    process.exit(1);
  }
}

seedUser();