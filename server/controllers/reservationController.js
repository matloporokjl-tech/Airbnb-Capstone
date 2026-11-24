
import mongoose from "mongoose";
import Accommodation from "../models/Accommodation.js";
import Reservation from "../models/Reservation.js";

// Calculate the number of nights between two dates
const getBookingDates = (checkInValue, checkOutValue) => {
  if (
    typeof checkInValue !== "string" ||
    typeof checkOutValue !== "string" ||
    !/^\d{4}-\d{2}-\d{2}$/.test(checkInValue) ||
    !/^\d{4}-\d{2}-\d{2}$/.test(checkOutValue)
  ) {
    return null;
  }

  const checkIn = new Date(`${checkInValue}T00:00:00.000Z`);
  const checkOut = new Date(`${checkOutValue}T00:00:00.000Z`);

  if (
    Number.isNaN(checkIn.getTime()) ||
    Number.isNaN(checkOut.getTime()) ||
    checkOut <= checkIn
  ) {
    return null;
  }

  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  if (checkIn < today) {
    return null;
  }

  const nights = Math.round(
    (checkOut - checkIn) / (1000 * 60 * 60 * 24)
  );

  return { checkIn, checkOut, nights };
};

const calculatePrice = (accommodation, nights) => {
  const accommodationSubtotal = accommodation.price * nights;

  const weeklyDiscountPercent =
    nights >= 7 ? accommodation.weeklyDiscount || 0 : 0;

  const weeklyDiscountAmount =
    accommodationSubtotal * weeklyDiscountPercent / 100;

  const cleaningFee = accommodation.cleaningFee || 0;
  const serviceFee = accommodation.serviceFee || 0;
  const occupancyTaxes = accommodation.occupancyTaxes || 0;

  const total =
    accommodationSubtotal -
    weeklyDiscountAmount +
    cleaningFee +
    serviceFee +
    occupancyTaxes;

  return {
    accommodationSubtotal: Number(accommodationSubtotal.toFixed(2)),
    weeklyDiscountPercent,
    weeklyDiscountAmount: Number(weeklyDiscountAmount.toFixed(2)),
    cleaningFee,
    serviceFee,
    occupancyTaxes,
    total: Number(total.toFixed(2)),
  };
};

const hasBookingConflict = async (
  accommodationId,
  checkIn,
  checkOut,
  excludeReservationId = null
) => {
  const query = {
    accommodation: accommodationId,
    status: { $in: ["pending", "confirmed"] },
    checkIn: { $lt: checkOut },
    checkOut: { $gt: checkIn },
  };

  if (excludeReservationId) {
    query._id = { $ne: excludeReservationId };
  }

  return Reservation.exists(query);
};

const populateReservation = (query) =>
  query
    .populate("accommodation", "title location images price")
    .populate("guest", "username email")
    .populate("host", "username email");

export const createReservation = async (req, res) => {
  try {
    const { accommodationId, checkIn, checkOut, guests } = req.body;

    if (!mongoose.isValidObjectId(accommodationId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid accommodation ID.",
      });
    }

    const dates = getBookingDates(checkIn, checkOut);

    if (!dates) {
      return res.status(400).json({
        success: false,
        message: "Please select valid future check-in and check-out dates.",
      });
    }

    if (!Number.isInteger(guests) || guests < 1) {
      return res.status(400).json({
        success: false,
        message: "Guest count must be a positive whole number.",
      });
    }

    const accommodation = await Accommodation.findById(accommodationId);

    if (!accommodation) {
      return res.status(404).json({
        success: false,
        message: "Accommodation not found.",
      });
    }

    if (guests > accommodation.guests) {
      return res.status(400).json({
        success: false,
        message: "Guest count exceeds the property's capacity.",
      });
    }

    if (
      accommodation.host.toString() === req.user._id.toString()
    ) {
      return res.status(400).json({
        success: false,
        message: "Hosts cannot reserve their own property.",
      });
    }

    const conflict = await hasBookingConflict(
      accommodation._id,
      dates.checkIn,
      dates.checkOut
    );

    if (conflict) {
      return res.status(409).json({
        success: false,
        message: "This property is unavailable for the selected dates.",
      });
    }

    const priceBreakdown = calculatePrice(
      accommodation,
      dates.nights
    );

    const reservation = await Reservation.create({
      accommodation: accommodation._id,
      guest: req.user._id,
      host: accommodation.host,
      checkIn: dates.checkIn,
      checkOut: dates.checkOut,
      guests,
      nights: dates.nights,
      pricePerNight: accommodation.price,
      priceBreakdown,
      currency: "ZAR",
      status: "pending",
    });

    const result = await populateReservation(
      Reservation.findById(reservation._id)
    );

    return res.status(201).json({
      success: true,
      message: "Reservation created successfully.",
      reservation: result,
    });
  } catch (error) {
    console.error("Create reservation error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to create reservation.",
    });
  }
};

export const getReservationsByUser = async (req, res) => {
  try {
    const reservations = await populateReservation(
      Reservation.find({ guest: req.user._id }).sort({ createdAt: -1 })
    );

    return res.status(200).json({
      success: true,
      count: reservations.length,
      reservations,
    });
  } catch (error) {
    console.error("Get user reservations error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to retrieve your reservations.",
    });
  }
};

export const getReservationsByHost = async (req, res) => {
  try {
    const filter =
      req.user.role === "admin"
        ? {}
        : { host: req.user._id };

    const reservations = await populateReservation(
      Reservation.find(filter).sort({ createdAt: -1 })
    );

    return res.status(200).json({
      success: true,
      count: reservations.length,
      reservations,
    });
  } catch (error) {
    console.error("Get host reservations error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to retrieve host reservations.",
    });
  }
};

export const getReservationById = async (req, res) => {
  try {
    const reservation = await populateReservation(
      Reservation.findById(req.params.id)
    );

    if (!reservation) {
      return res.status(404).json({
        success: false,
        message: "Reservation not found.",
      });
    }

    const isOwner =
      reservation.guest._id.toString() === req.user._id.toString();

    const isHost =
      reservation.host._id.toString() === req.user._id.toString();

    if (!isOwner && !isHost && req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "You cannot access this reservation.",
      });
    }

    return res.status(200).json({
      success: true,
      reservation,
    });
  } catch (error) {
    console.error("Get reservation error:", error);

    return res.status(400).json({
      success: false,
      message: "Invalid reservation ID.",
    });
  }
};

export const updateReservation = async (req, res) => {
  try {
    const reservation = await Reservation.findById(req.params.id);

    if (!reservation) {
      return res.status(404).json({
        success: false,
        message: "Reservation not found.",
      });
    }

    const isGuest =
      reservation.guest.toString() === req.user._id.toString();

    const isHost =
      reservation.host.toString() === req.user._id.toString();

    const isAdmin = req.user.role === "admin";

    if (!isGuest && !isHost && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: "You cannot update this reservation.",
      });
    }

    const hasDateChanges =
      req.body.checkIn !== undefined ||
      req.body.checkOut !== undefined ||
      req.body.guests !== undefined;

    if (hasDateChanges) {
      if (!isGuest || reservation.status !== "pending") {
        return res.status(403).json({
          success: false,
          message: "Only the guest can edit a pending reservation.",
        });
      }

      const accommodation = await Accommodation.findById(
        reservation.accommodation
      );

      if (!accommodation) {
        return res.status(404).json({
          success: false,
          message: "Accommodation no longer exists.",
        });
      }

      const dates = getBookingDates(
        req.body.checkIn ??
          reservation.checkIn.toISOString().slice(0, 10),
        req.body.checkOut ??
          reservation.checkOut.toISOString().slice(0, 10)
      );

      const guests = req.body.guests ?? reservation.guests;

      if (!dates || !Number.isInteger(guests) || guests < 1) {
        return res.status(400).json({
          success: false,
          message: "Please provide valid dates and guest numbers.",
        });
      }

      if (guests > accommodation.guests) {
        return res.status(400).json({
          success: false,
          message: "Guest count exceeds the property's capacity.",
        });
      }

      const conflict = await hasBookingConflict(
        accommodation._id,
        dates.checkIn,
        dates.checkOut,
        reservation._id
      );

      if (conflict) {
        return res.status(409).json({
          success: false,
          message: "This property is unavailable for those dates.",
        });
      }

      reservation.checkIn = dates.checkIn;
      reservation.checkOut = dates.checkOut;
      reservation.guests = guests;
      reservation.nights = dates.nights;
      reservation.priceBreakdown = calculatePrice(
        accommodation,
        dates.nights
      );
    }

    if (req.body.status !== undefined) {
      const newStatus = req.body.status;

      if (isGuest) {
        if (
          newStatus !== "cancelled" ||
          !["pending", "confirmed"].includes(reservation.status)
        ) {
          return res.status(403).json({
            success: false,
            message: "Guests may only cancel active reservations.",
          });
        }
      } else if (
        !["confirmed", "cancelled", "completed"].includes(newStatus)
      ) {
        return res.status(400).json({
          success: false,
          message: "Invalid reservation status update.",
        });
      }

      reservation.status = newStatus;
    }

    if (!hasDateChanges && req.body.status === undefined) {
      return res.status(400).json({
        success: false,
        message: "No valid reservation changes were provided.",
      });
    }

    await reservation.save();

    const result = await populateReservation(
      Reservation.findById(reservation._id)
    );

    return res.status(200).json({
      success: true,
      message: "Reservation updated successfully.",
      reservation: result,
    });
  } catch (error) {
    console.error("Update reservation error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to update reservation.",
    });
  }
};

export const deleteReservation = async (req, res) => {
  try {
    const reservation = await Reservation.findById(req.params.id);

    if (!reservation) {
      return res.status(404).json({
        success: false,
        message: "Reservation not found.",
      });
    }

    const isGuest =
      reservation.guest.toString() === req.user._id.toString();

    const isHost =
      reservation.host.toString() === req.user._id.toString();

    if (!isGuest && !isHost && req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "You cannot delete this reservation.",
      });
    }

    await reservation.deleteOne();

    return res.status(200).json({
      success: true,
      message: "Reservation deleted successfully.",
    });
  } catch (error) {
    console.error("Delete reservation error:", error);

    return res.status(400).json({
      success: false,
      message: "Unable to delete reservation.",
    });
  }
};
export const getAllReservations = async (req, res) => {
  try {
    const reservations = await Reservation.find({})
      .populate("accommodation", "title location images price")
      .populate("guest", "username email")
      .populate("host", "username email")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: reservations.length,
      reservations,
    });
  } catch (error) {
    console.error("Get all reservations error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to retrieve reservations.",
    });
  }
};