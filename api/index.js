import express from "express";
import bodyParser from "body-parser";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config({ path: `.env.${process.env.NODE_ENV}` });

const { HTTP_PORT } = process.env;
const app = express();

// import Auth from "./middlewares/auth.js";
import UploadRouter from "./app/upload/routes/index.js";

app.use(cors());
// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: true }));

// parse application/json
app.use(bodyParser.json());

// // Middleware para autenticar usuarios
//  app.use(Auth.verify);
app.use("/status", (req, res, next) => {
  res.status(200).send("OK");
});

app.use("/upload", UploadRouter);

app.listen(HTTP_PORT, () => console.log(`Server running on port ${HTTP_PORT}`));
