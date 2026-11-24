
import express from "express";
import { body, validationResult } from "express-validator";

import {
  registerUser,
  loginUser,
  getCurrentUser,
  updateUserProfile,
} from "../controllers/userController.js";

import {
  protect,
  authorizeRoles,
}from "../middleware/auth.js";

const router = express.Router();

const validateRequest = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: "Please check your submitted information.",
      errors: errors.array().map((error) => ({
        field: error.path,
        message: error.msg,
      })),
    });
  }

  next();
};

router.post(
  "/register",
  [
    body("username")
      .isString()
      .withMessage("Username must be text.")
      .bail()
      .trim()
      .isLength({ min: 2, max: 50 })
      .withMessage("Username must contain 2–50 characters."),

    body("email")
      .isEmail()
      .withMessage("Please enter a valid email address.")
      .normalizeEmail(),

    body("password")
      .isString()
      .withMessage("Password must be text.")
      .bail()
      .isLength({ min: 8, max: 128 })
      .withMessage("Password must contain at least 8 characters."),

    validateRequest,
  ],
  registerUser
);

router.post(
  "/login",
  [
    body("email")
      .isEmail()
      .withMessage("Please enter a valid email address.")
      .normalizeEmail(),

    body("password")
      .isString()
      .withMessage("Password is required."),

    validateRequest,
  ],
  loginUser
);


router.get("/me", protect, getCurrentUser);
router.put(
  "/profile",
  protect,
  authorizeRoles("host", "admin"),
  updateUserProfile
);

export default router;
