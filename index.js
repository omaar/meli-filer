import express from "express";
import dotenv from "dotenv";
dotenv.config({ path: `.env.${process.env.NODE_ENV}` });

const { HTTP_PORT } = process.env;
const app = express();

import Auth from "./middlewares/auth.js";
// // Middleware para autenticar usuarios (JWT)
app.use(Auth.verify);

app.listen(HTTP_PORT, () => console.log(`Server running on port ${HTTP_PORT}`));
