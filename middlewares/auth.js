import dotenv from "dotenv";

dotenv.config({ path: `.env.${process.env.NODE_ENV}` });

const { RECAPTCHA_SECRET_KEY } = process.env;

const Auth = {
  verify: async (req, res, next) => {
    const recaptchaToken = req.body.recaptchaToken;
    // console.log("secret:", RECAPTCHA_SECRET_KEY);
    // console.log("recaptchaToken", recaptchaToken);

    if (!recaptchaToken) {
      return res.status(401).json({ status: 401, message: "Unauthorized" });
    }

    try {
      // Verify reCAPTCHA token with Google
      const verificationResponse = await fetch(
        `https://www.google.com/recaptcha/api/siteverify`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: `secret=${RECAPTCHA_SECRET_KEY}&response=${recaptchaToken}`,
        }
      );

      const verificationData = await verificationResponse.json();

      // console.log("verificationData", verificationData);

      if (verificationData.success) {
        return next();
      } else {
        return res
          .status(401)
          .json({ status: 401, message: "Unauthorized token" });
      }
    } catch (error) {
      return res
        .status(500)
        .json({ status: 500, message: "Eror on Auth Method" });
    }
  },
};

export default Auth;
