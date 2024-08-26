// Init mongoose connection

import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config({ patch: `.env.${process.env.NODE_ENV}` });

const mongo = async () => {
  try {
    const connection = await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB connected");
    return connection;
  } catch (error) {
    return new Error("Erro mongodb", error);
  }
};

export default mongo;
