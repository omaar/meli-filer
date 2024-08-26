// Init AWS S3
import { S3Client } from "@aws-sdk/client-s3";
import dotenv from "dotenv";

const { NODE_ENV } = process.env;

dotenv.config({ path: `.env.${NODE_ENV}` });

const { AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_REGION } = process.env;

const s3Client = new S3Client({
  credentials: {
    accessKeyId: AWS_ACCESS_KEY_ID,
    secretAccessKey: AWS_SECRET_ACCESS_KEY,
  },
  region: AWS_REGION,
});

export default s3Client;
