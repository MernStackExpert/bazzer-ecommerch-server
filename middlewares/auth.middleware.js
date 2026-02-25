const jwt = require("jsonwebtoken");

const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).send({ 
      success: false, 
      message: "Unauthorised access! Please login first." 
    });
  }

  const token = authHeader.split(" ")[1];

  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).send({ 
        success: false, 
        message: "Forbidden access! Invalid or expired token." 
      });
    }
    req.user = decoded; 
    next();
  });
};


module.exports = { verifyToken};