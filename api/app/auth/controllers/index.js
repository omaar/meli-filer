import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import mongo from "../../helpers/db";

dotenv.config({ path: `.env.${process.env.NODE_ENV}` });

const { JWT_SECRET, JWT_EXPIRATION = "2h" } = process.env;

const Login = {
  auth: async (req, res, next) => {
    const { user, password } = req.body;

    if (!(user && password))
      return res
        .status(403)
        .json({ status: 403, message: "Usuario y contraseña son requeridas" });

    const cryptpass = crypto.createHash("sha1").update(password).digest("hex");

    mongo.users.findOne(
      {
        user: user,
        pass: cryptpass,
      },
      (err, _user) => {
        if (err)
          return res
            .status(500)
            .json({ status: 500, message: "Error de autenticación" });

        if (!_user)
          return res
            .status(403)
            .json({ status: 403, message: "Credenciales invalidas" });

        const token = jwt.sign({ user: _user._id }, JWT_SECRET, {
          expiresIn: JWT_EXPIRATION,
        });

        res.status(200).json({
          status: 200,
          token: token,
        });
      }
    );
  },
};

export default Login;
