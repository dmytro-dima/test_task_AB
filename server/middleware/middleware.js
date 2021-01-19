const jwt = require("jsonwebtoken");
const jwtSecret = require("../config/default.json").jwtSecret;

// middleware for check user

module.exports = (req, res, next) => {
  if (req.method === "OPTIONS") {
    return next();
  }

  const token = req.headers.authorization.split(" ")[1]; // "Bearer TOKEN"

  if (!token) {
    return res.status(401).json({ message: "Нет авторизации" });
  }

  try {
    const decoded = jwt.verify(token, jwtSecret);
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ message: "Помилка  декодування" });
  }
};
