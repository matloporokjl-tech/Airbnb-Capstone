import jwt from "jsonwebtoken";
import User from "../models/User.js";


const generateToken = (user) => {
  return jwt.sign(
    { sub: user._id.toString() },
    process.env.JWT_SECRET,
    { expiresIn: "1d" }
  );
};

const formatUser = (user) => ({
  id: user._id,
  username: user.username,
  email: user.email,
  role: user.role,
});

export const registerUser = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "An account with this email already exists.",
      });
    }

    const user = await User.create({
      username,
      email,
      password,
      role: "user",
    });

    const token = generateToken(user);

    return res.status(201).json({
      success: true,
      message: "Account created successfully.",
      token,
      user: formatUser(user),
    });
  } catch (error) {
    console.error("Registration error:", error);

    if (error.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      message: "Unable to register your account.",
    });
  }
};

export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select("+password");

    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password.",
      });
    }

    const token = generateToken(user);

    return res.status(200).json({
      success: true,
      message: "Login successful.",
      token,
      user: formatUser(user),
    });
  } catch (error) {
    console.error("Login error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to log in. Please try again.",
    });
  }
};

export const getCurrentUser = async (req, res) => {
  try {
    return res.status(200).json({
      success: true,
      user: {
        _id: req.user._id,
        username: req.user.username,
        email: req.user.email,
        role: req.user.role,
        bio: req.user.bio || "",
        profileImage: req.user.profileImage || "",
        hostLocation: req.user.hostLocation || "",
      },
    });
  } catch (error) {
    console.error("Get current user error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to retrieve your account.",
    });
  }
};

export const updateUserProfile = async (req, res) => {
  try {
    const updates = {};


    if (req.body.bio !== undefined) {
      const bio = String(req.body.bio).trim();

      if (bio.length > 500) {
        return res.status(400).json({
          success: false,
          message: "Your biography cannot exceed 500 characters.",
        });
      }

      updates.bio = bio;
    }


    if (req.body.hostLocation !== undefined) {
      const hostLocation = String(req.body.hostLocation).trim();

      if (hostLocation.length > 120) {
        return res.status(400).json({
          success: false,
          message: "Your host location cannot exceed 120 characters.",
        });
      }

      updates.hostLocation = hostLocation;
    }


    if (req.body.profileImage !== undefined) {
      const profileImage = String(req.body.profileImage).trim();

      if (profileImage) {
        let imageUrl;

        try {
          imageUrl = new URL(profileImage);
        } catch {
          return res.status(400).json({
            success: false,
            message: "Please enter a valid profile image URL.",
          });
        }

        if (!["http:", "https:"].includes(imageUrl.protocol)) {
          return res.status(400).json({
            success: false,
            message: "Profile images must use HTTP or HTTPS URLs.",
          });
        }
      }

      updates.profileImage = profileImage;
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      { $set: updates },
      {
        new: true,
        runValidators: true,
      }
    );

    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message: "User account not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Host profile updated successfully.",
      user: {
        _id: updatedUser._id,
        username: updatedUser.username,
        email: updatedUser.email,
        role: updatedUser.role,
        bio: updatedUser.bio,
        profileImage: updatedUser.profileImage,
        hostLocation: updatedUser.hostLocation,
      },
    });
  } catch (error) {
    console.error("Update host profile error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to update your host profile.",
    });
  }
};
