const router = require("express").Router();
const User = require("../models/users");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const jwtSecret = require("../config/default.json").jwtSecret;
const { check, validationResult } = require("express-validator");

// registration new user path: /api/auth/registration

router.post(
  "/registration",
  [
    check("name", "коректний name").exists(),
    check("email", "коректний email").isEmail(),
    check("password", "коректний password").isLength({ min: 6 }),
  ],
  async (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(400).json({
        errors: errors.array(),
        message: `Введіть: ${errors.errors.map((err) => err.msg).join(", ")}`,
      });
    }

    try {
      const { email, password, name } = req.body;

      const candidate = await User.findOne({ email });

      if (candidate) {
        return res.status(400).json({ message: "такий користувач вже існує" });
      }

      const hashedPassword = await bcrypt.hash(password, 12);
      const user = new User({
        name,
        email,
        password: hashedPassword,
      });

      const token = jwt.sign({ userId: user.id }, jwtSecret, {
        expiresIn: "1h",
      });

      await user.save();

      res.status(201).json({ token, userId: user._id, name: user.name });
    } catch (err) {
      res.status(500).json({ message: "звязок з сервером перервано" });
    }
  }
);

// login user path: /api/auth/login

router.post(
  "/login",
  [
    check("email", "коректний email").normalizeEmail().isEmail(),
    check("password", "коректний password").exists(),
    check("password", "пароль має містити більше 6 символів").isLength({
      min: 6,
    }),
  ],
  async (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(400).json({
        errors: errors.array(),
        message: `Введіть: ${errors.errors.map((err) => err.msg).join(", ")}`,
      });
    }

    try {
      const { email, password } = req.body;
      const user = await User.findOne({ email: email });

      if (!user) res.status(400).json({ message: "користувач не знайдений" });

      const isMatch = await bcrypt.compare(password, user.password);

      const token = jwt.sign({ userId: user.id }, jwtSecret, {
        expiresIn: "1h",
      });

      if (isMatch)
        res.status(201).json({ token, userId: user.id, name: user.name });
      else res.status(400).json({ message: "невірний пароль" });
    } catch (err) {
      res.status(500).json({ message: "звязок з сервером перервано" });
    }
  }
);

// get all users  path:/api/auth/users

router.get("/users", async (req, res) => {
  try {
    const users = await User.find({});
    res.status(201).json(users);
  } catch (err) {
    res.status(500).json({ message: "звязок з сервером перервано" });
  }
});

module.exports = router;
