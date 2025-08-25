import mongoose from "mongoose";

const connectToDB = async () => {
  try {
    await mongoose.connect(process.env.MONGOO_URL);
    console.log("Database connected successfully...");
  } catch (error) {
    console.log("Connection failed while connecting to DB", error.message);
    process.exit(1);
  }
};

export default connectToDB;
