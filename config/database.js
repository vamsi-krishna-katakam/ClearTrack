import mongoose from 'mongoose';

// Connect to MongoDB Atlas or local MongoDB instance
async function connectDB() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error('MONGODB_URI is not defined in the environment variables');
  }

  try {
    const conn = await mongoose.connect(uri, { family: 4 });
    console.log(`[Database] Connected successfully to: ${conn.connection.host}/${conn.connection.name}`);
    return conn;
  } catch (err) {
    console.error(`[Database Error] Failed to connect: ${err.message}`);
    process.exit(1);
  }
}

export default connectDB;
