const User = require('../models/User');
const crypto = require('crypto');
const transporter = require('../config/transporter');


const forgetPassword = async (req, res) => {
  try {
    const email = req.body.email?.trim().toLowerCase();

    if (!email) {
      return res.status(400).json({
        message: "Email is required"
      });
    }

    const user = await User.findOne({ email });

    // Use the same response whether the account exists or not.
    const message =
      "If an account exists with this email, a reset link will be sent.";

    if (!user) {
      return res.status(200).json({ message });
    }

    const resetToken = crypto.randomBytes(32).toString("hex");

    user.resetPasswordToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");

    user.resetPasswordExpires = new Date(
      Date.now() + 15 * 60 * 1000
    );

    await user.save();

    const resetURL =
      `${process.env.BASE_URL}/reset-password/${resetToken}`;

    try {
      await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: user.email,
        subject: "Reset Your Password",
        text: `Use this link to reset your password: ${resetURL}\n\nThis link expires in 15 minutes. If you did not request this, ignore this email.`,
        html: `
          <h2>Reset Your Password</h2>
          <p>Click the link below to reset your password:</p>
          <p>
            <a href="${resetURL}">Reset Password</a>
          </p>
          <p>This link expires in 15 minutes.</p>
          <p>If you did not request this, ignore this email.</p>
        `
      });
    } catch (emailError) {
      user.resetPasswordToken = null;
      user.resetPasswordExpires = null;

      await user.save();
      throw emailError;
    }

    return res.status(200).json({ message });

  } catch (err) {
    console.error("Forgot password error:", err.message);

    return res.status(500).json({
      message: "Failed to process password reset request."
    });
  }
};

const resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    if (!token) {
      return res.status(400).json({
        message: "Reset token is missing.",
      });
    }

    if (typeof password !== "string" || password.length < 6) {
      return res.status(400).json({
        message: "Password must be at least 6 characters.",
      });
    }

    // Hash the raw token to find its stored hash
    const hashedToken = crypto
      .createHash("sha256")
      .update(token)
      .digest("hex");

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: new Date() },
    });

    if (!user) {
      return res.status(400).json({
        message: "Invalid or expired reset link.",
      });
    }

    // IMPORTANT:
    // The User model's pre-save hook hashes this password.
    // Do not call bcrypt.hash() here.
    user.password = password;

    // Invalidate the reset link after use
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;

    await user.save();

    // Verify that the saved password matches
    const updatedUser = await User.findById(user._id);

    const passwordMatches = await updatedUser.comparePassword(password);

    if (!passwordMatches) {
      console.error("Password verification failed after reset.");

      return res.status(500).json({
        message: "Password was saved but verification failed.",
      });
    }

    return res.status(200).json({
      message: "Password reset successfully. Please log in.",
    });
  } catch (error) {
    console.error("Reset password error:", error);

    return res.status(500).json({
      message: "Unable to reset your password.",
    });
  }
};


module.exports ={forgetPassword,resetPassword};