import mongoose from 'mongoose';

async function connectDB() {
  try {
    const connectionInstance = await mongoose.connect(process.env.MONGO_URL, {
      dbName: process.env.DB_NAME,
      // useNewUrlParser: true,
      // useUnifiedTopology: true
    });
    console.log(`MongoDB Connected: ${connectionInstance.connection.host}`);
  } catch (error) {
    console.error('MongoDB Connection Error:', error);
    process.exit(1);
  }
}

export default connectDB;
