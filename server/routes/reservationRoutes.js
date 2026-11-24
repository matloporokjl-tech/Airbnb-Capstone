import express from "express";
import { body, validationResult } from "express-validator";

import {
  createReservation,
  getReservationsByUser,
  getReservationsByHost,
  getAllReservations,
  getReservationById,
  updateReservation,
  deleteReservation,
} from "../controllers/reservationController.js";

import {
  protect,
  authorizeRoles,
} from "../middleware/auth.js";

const router = express.Router();

const validateRequest = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: "Please check your reservation details.",
      errors: errors.array().map((error) => ({
        field: error.path,
        message: error.msg,
      })),
    });
  }

  next();
};


router.post(
  "/",
  protect,
  [
    body("accommodationId")
      .isMongoId()
      .withMessage("A valid accommodation ID is required."),

    body("checkIn")
      .isISO8601()
      .withMessage("A valid check-in date is required."),

    body("checkOut")
      .isISO8601()
      .withMessage("A valid check-out date is required."),

    body("guests")
      .isInt({ min: 1 })
      .withMessage("At least one guest is required.")
      .toInt(),

    validateRequest,
  ],
  createReservation
);


router.get(
  "/user",
  protect,
  getReservationsByUser
);


router.get(
  "/host",
  protect,
  authorizeRoles("host", "admin"),
  getReservationsByHost
);


router.get(
  "/admin/all",
  protect,
  authorizeRoles("admin"),
  getAllReservations
);


router.get(
  "/:id",
  protect,
  getReservationById
);


router.put(
  "/:id",
  protect,
  [
    body("checkIn")
      .optional()
      .isISO8601()
      .withMessage("Invalid check-in date."),

    body("checkOut")
      .optional()
      .isISO8601()
      .withMessage("Invalid check-out date."),

    body("guests")
      .optional()
      .isInt({ min: 1 })
      .withMessage("Guest count must be at least 1.")
      .toInt(),

    body("status")
      .optional()
      .isIn(["confirmed", "cancelled", "completed"])
      .withMessage("Invalid reservation status."),

    validateRequest,
  ],
  updateReservation
);


router.delete(
  "/:id",
  protect,
  deleteReservation
);

export default router;