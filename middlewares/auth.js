import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config({ path: `.env.${process.env.NODE_ENV}` });

const { JWT_SECRET } = process.env;

const Auth = {
  verify: async (req, res, next) => {
    (req, res, next) => {
      const token = req.headers["authorization"];
      if (!token)
        return res.status(401).json({ status: 401, msg: "Access Denied" });

      jwt.verify(token, JWT_SECRET, (err, decoded) => {
        if (err)
          return res.status(403).json({ status: 403, msg: "Invalid Token" });
        req.user = decoded;
        next();
      });
    };
  },
};

export default Auth;
