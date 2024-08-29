
import dotenv from 'dotenv';

dotenv.config({ patch: `.env.${process.env.NODE_ENV}` });