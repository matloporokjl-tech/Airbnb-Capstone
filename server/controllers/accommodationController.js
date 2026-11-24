import Accommodation from "../models/Accommodation.js";
import Reservation from "../models/Reservation.js";

// Escape special characters in destination searches
const escapeRegex = (value) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// Check whether a user owns a listing or is an administrator
const canManageAccommodation = (accommodation, user) => {
  return (
    user.role === "admin" ||
    accommodation.host.toString() === user._id.toString()
  );
};

export const getAccommodations = async (req, res) => {
  try {
    const {
      destination,
      guests,
      minPrice,
      maxPrice,
      type,
      checkIn,
      checkOut,
    } = req.query;

    const filter = {};


    if (destination?.trim()) {
      filter.location = {
        $regex: escapeRegex(destination.trim()),
        $options: "i",
      };
    }


    if (guests !== undefined) {
      const guestCount = Number(guests);

      if (!Number.isInteger(guestCount) || guestCount < 1) {
        return res.status(400).json({
          success: false,
          message: "Guest count must be a positive whole number.",
        });
      }

      filter.guests = { $gte: guestCount };
    }

    // Accommodation type filter
    if (type) {
      filter.type = type;
    }


    if (minPrice !== undefined || maxPrice !== undefined) {
      filter.price = {};

      if (minPrice !== undefined) {
        const minimum = Number(minPrice);

        if (!Number.isFinite(minimum) || minimum < 0) {
          return res.status(400).json({
            success: false,
            message: "Minimum price must be zero or greater.",
          });
        }

        filter.price.$gte = minimum;
      }

      if (maxPrice !== undefined) {
        const maximum = Number(maxPrice);

        if (!Number.isFinite(maximum) || maximum < 0) {
          return res.status(400).json({
            success: false,
            message: "Maximum price must be zero or greater.",
          });
        }

        filter.price.$lte = maximum;
      }

      if (
        filter.price.$gte !== undefined &&
        filter.price.$lte !== undefined &&
        filter.price.$gte > filter.price.$lte
      ) {
        return res.status(400).json({
          success: false,
          message: "Maximum price must be greater than minimum price.",
        });
      }
    }


    if (checkIn || checkOut) {
      const startDate = new Date(checkIn);
      const endDate = new Date(checkOut);

      if (
        !checkIn ||
        !checkOut ||
        Number.isNaN(startDate.getTime()) ||
        Number.isNaN(endDate.getTime()) ||
        endDate <= startDate
      ) {
        return res.status(400).json({
          success: false,
          message: "Please provide valid check-in and check-out dates.",
        });
      }

      const unavailableIds = await Reservation.distinct(
        "accommodation",
        {
          checkIn: { $lt: endDate },
          checkOut: { $gt: startDate },
          status: { $in: ["pending", "confirmed"] },
        }
      );

      filter._id = { $nin: unavailableIds };
    }


    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(
      50,
      Math.max(1, Number(req.query.limit) || 12)
    );

    const [accommodations, total] = await Promise.all([
      Accommodation.find(filter)
        .populate("host", "username")
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),

      Accommodation.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      count: accommodations.length,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      accommodations,
    });
  } catch (error) {
    console.error("Get accommodations error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to retrieve accommodation listings.",
    });
  }
};

export const getAccommodationById = async (req, res) => {
  try {
    const accommodation = await Accommodation.findById(
      req.params.id
    ).populate(
      "host",
      "username bio profileImage hostLocation"
    );

    if (!accommodation) {
      return res.status(404).json({
        success: false,
        message: "Accommodation not found.",
      });
    }

    return res.status(200).json({
      success: true,
      accommodation,
    });
  } catch (error) {
    console.error("Get accommodation error:", error);

    return res.status(400).json({
      success: false,
      message: "Invalid accommodation ID.",
    });
  }
};

export const getMyAccommodations = async (req, res) => {
  try {
    const accommodations = await Accommodation.find({
      host: req.user._id,
    })
      .populate("host", "username")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: accommodations.length,
      accommodations,
    });
  } catch (error) {
    console.error("Error fetching host accommodations:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to retrieve your listings.",
    });
  }
};

export const createAccommodation = async (req, res) => {
  try {
    const accommodation = await Accommodation.create({
      title: req.body.title,
      location: req.body.location,
      description: req.body.description,
      type: req.body.type,

      guests: req.body.guests,
      bedrooms: req.body.bedrooms,
      bathrooms: req.body.bathrooms,


      sleepingArrangements:
        req.body.sleepingArrangements ?? "",

      amenities: req.body.amenities || [],
      images: req.body.images || [],

      price: req.body.price,
      weeklyDiscount: req.body.weeklyDiscount ?? 0,
      cleaningFee: req.body.cleaningFee ?? 0,
      serviceFee: req.body.serviceFee ?? 0,
      occupancyTaxes: req.body.occupancyTaxes ?? 0,

      enhancedCleaning: req.body.enhancedCleaning ?? false,
      selfCheckIn: req.body.selfCheckIn ?? false,

      houseRules: req.body.houseRules ?? "",
      safetyInfo: req.body.safetyInfo ?? "",
      cancellationPolicy: req.body.cancellationPolicy ?? "",

      host: req.user._id,
    });

    return res.status(201).json({
      success: true,
      message: "Accommodation created successfully.",
      accommodation,
    });
  } catch (error) {
    console.error("Create accommodation error:", error);

    if (error.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      message: "Unable to create accommodation.",
    });
  }
};

export const updateAccommodation = async (req, res) => {
  try {
    const accommodation = await Accommodation.findById(
      req.params.id
    );

    if (!accommodation) {
      return res.status(404).json({
        success: false,
        message: "Accommodation not found.",
      });
    }

    if (!canManageAccommodation(accommodation, req.user)) {
      return res.status(403).json({
        success: false,
        message: "You cannot update this accommodation.",
      });
    }

    const allowedFields = [
      "title",
      "location",
      "description",
      "type",
      "guests",
      "bedrooms",
      "bathrooms",


      "sleepingArrangements",
      "houseRules",
      "safetyInfo",
      "cancellationPolicy",


      "amenities",
      "images",
      "price",
      "weeklyDiscount",
      "cleaningFee",
      "serviceFee",
      "occupancyTaxes",
      "enhancedCleaning",
      "selfCheckIn",
    ];

    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        accommodation[field] = req.body[field];
      }
    });

    await accommodation.save();

    return res.status(200).json({
      success: true,
      message: "Accommodation updated successfully.",
      accommodation,
    });
  } catch (error) {
    console.error("Update accommodation error:", error);

    if (error.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    return res.status(400).json({
      success: false,
      message: "Unable to update accommodation.",
    });
  }
};

export const deleteAccommodation = async (req, res) => {
  try {
    const accommodation = await Accommodation.findById(
      req.params.id
    );

    if (!accommodation) {
      return res.status(404).json({
        success: false,
        message: "Accommodation not found.",
      });
    }


    if (!canManageAccommodation(accommodation, req.user)) {
      return res.status(403).json({
        success: false,
        message: "You cannot delete this accommodation.",
      });
    }


    const activeReservations = await Reservation.exists({
      accommodation: accommodation._id,
      checkOut: { $gt: new Date() },
      status: { $in: ["pending", "confirmed"] },
    });

    if (activeReservations) {
      return res.status(409).json({
        success: false,
        message:
          "This property has active reservations and cannot be deleted.",
      });
    }

    await accommodation.deleteOne();

    return res.status(200).json({
      success: true,
      message: "Accommodation deleted successfully.",
    });
  } catch (error) {
    console.error("Delete accommodation error:", error);

    return res.status(400).json({
      success: false,
      message: "Unable to delete accommodation.",
    });
  }
};