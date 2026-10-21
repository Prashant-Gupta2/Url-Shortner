const express = require("express");
const router = express.Router();

const {
  forgetPassword,
  resetPassword
} = require("../controllers/ResetPassController");

router.post("/forget-password", forgetPassword);
router.post("/reset-password/:token", resetPassword);

module.exports = router;