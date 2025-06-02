import mongoose from 'mongoose';
import dbConnect from './db';
import { Server } from '../models/Server';

const sampleServers = [
  {
    url: "http://5.39.64.31:8080",
    username: "carlosbastos",
    password: "14022020c"
  },
  {
    url: "http://assistaiptvplay.com",
    username: "05183314248",
    password: "fe5nasUk"
  }
];

async function seedDatabase() {
  try {
    await dbConnect();
    
    // Clean existing data
    await Server.deleteMany({});
    
    // Insert sample data
    await Server.insertMany(
      sampleServers.map(server => ({
        ...server,
        createdAt: new Date()
      }))
    );
    
    console.log('Database seeded successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
}

seedDatabase();