
const customerOnly = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: "Authentication required. Please log in.",
    });
  }

  if (req.user.role !== "user") {
    return res.status(403).json({
      success: false,
      message: "Only customer accounts can use this feature.",
    });
  }

  next();
};

module.exports = customerOnly;
