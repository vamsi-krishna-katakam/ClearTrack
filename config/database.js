import mongoose from 'mongoose';

let cachedConnection = null;

// Connect to MongoDB Atlas with connection caching for both local and serverless environments
async function connectDB() {
  if (cachedConnection && mongoose.connection.readyState === 1) {
    return cachedConnection;
  }

  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error('MONGODB_URI is not defined in the environment variables');
  }

  try {
    const conn = await mongoose.connect(uri, { family: 4, serverSelectionTimeoutMS: 5000 });
    cachedConnection = conn;
    console.log(`[Database] Connected successfully to: ${conn.connection.host}/${conn.connection.name}`);
    return conn;
  } catch (err) {
    console.error(`[Database Error] Failed to connect: ${err.message}`);
    if (process.env.VERCEL !== '1') {
      process.exit(1);
    }
    throw err;
  }
}

export default connectDB;
