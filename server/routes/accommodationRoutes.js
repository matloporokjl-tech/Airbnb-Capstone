import express from "express";
import {
  body,
  param,
  query,
  validationResult,
} from "express-validator";

import {
  getAccommodations,
  getAccommodationById,
  getMyAccommodations,
  createAccommodation,
  updateAccommodation,
  deleteAccommodation,
} from "../controllers/accommodationController.js";

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
      message: "Validation failed.",
      errors: errors.array(),
    });
  }

  next();
};


const accommodationValidation = [
  body("title")
    .trim()
    .notEmpty()
    .withMessage("Property title is required."),

  body("location")
    .trim()
    .notEmpty()
    .withMessage("Location is required."),

  body("description")
    .trim()
    .notEmpty()
    .withMessage("Description is required."),

  body("type")
    .optional()
    .isIn(["Entire place", "Private room", "Shared room", "Hotel room"])
    .withMessage("Invalid property type."),

  body("guests")
    .isInt({ min: 1 })
    .withMessage("At least one guest is required."),

  body("bedrooms")
    .isInt({ min: 0 })
    .withMessage("Bedrooms must be zero or more."),

  body("bathrooms")
    .isFloat({ min: 0 })
    .withMessage("Bathrooms must be zero or more."),

  body("price")
    .isFloat({ min: 0.01 })
    .withMessage("A valid nightly price is required."),

  body("weeklyDiscount")
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage("Weekly discount must be between 0 and 100."),

  body("cleaningFee")
    .optional()
    .isFloat({ min: 0 }),

  body("serviceFee")
    .optional()
    .isFloat({ min: 0 }),

  body("occupancyTaxes")
    .optional()
    .isFloat({ min: 0 }),

  body("amenities")
    .optional()
    .isArray(),

  body("images")
    .optional()
    .isArray(),
];


const updateValidation = [
  body("title").optional().trim().notEmpty(),
  body("location").optional().trim().notEmpty(),
  body("description").optional().trim().notEmpty(),

  body("type")
    .optional()
    .isIn(["Entire place", "Private room", "Shared room", "Hotel room"]),

  body("guests").optional().isInt({ min: 1 }),
  body("bedrooms").optional().isInt({ min: 0 }),
  body("bathrooms").optional().isFloat({ min: 0 }),
  body("price").optional().isFloat({ min: 0.01 }),
  body("weeklyDiscount").optional().isFloat({ min: 0, max: 100 }),
  body("cleaningFee").optional().isFloat({ min: 0 }),
  body("serviceFee").optional().isFloat({ min: 0 }),
  body("occupancyTaxes").optional().isFloat({ min: 0 }),
  body("amenities").optional().isArray(),
  body("images").optional().isArray(),
];


router.get(
  "/",
  [
    query("guests").optional().isInt({ min: 1 }),
    query("minPrice").optional().isFloat({ min: 0 }),
    query("maxPrice").optional().isFloat({ min: 0 }),
    query("checkIn").optional().isISO8601(),
    query("checkOut").optional().isISO8601(),
  ],
  validateRequest,
  getAccommodations
);


router.get(
  "/host/me",
  protect,
  authorizeRoles("host", "admin"),
  getMyAccommodations
);


router.get(
  "/:id",
  param("id").isMongoId().withMessage("Invalid property ID."),
  validateRequest,
  getAccommodationById
);


router.post(
  "/",
  protect,
  authorizeRoles("host", "admin"),
  accommodationValidation,
  validateRequest,
  createAccommodation
);


router.put(
  "/:id",
  protect,
  authorizeRoles("host", "admin"),
  param("id").isMongoId().withMessage("Invalid property ID."),
  updateValidation,
  validateRequest,
  updateAccommodation
);


router.delete(
  "/:id",
  protect,
  authorizeRoles("host", "admin"),
  param("id").isMongoId().withMessage("Invalid property ID."),
  validateRequest,
  deleteAccommodation
);

export default router;