
import mongoose from "mongoose";


const priceBreakdownSchema = new mongoose.Schema(
  {
    accommodationSubtotal: {
      type: Number,
      required: true,
      min: 0,
    },

    weeklyDiscountPercent: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },

    weeklyDiscountAmount: {
      type: Number,
      default: 0,
      min: 0,
    },

    cleaningFee: {
      type: Number,
      default: 0,
      min: 0,
    },

    serviceFee: {
      type: Number,
      default: 0,
      min: 0,
    },

    occupancyTaxes: {
      type: Number,
      default: 0,
      min: 0,
    },

    total: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  { _id: false }
);

const reservationSchema = new mongoose.Schema(
  {

    accommodation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Accommodation",
      required: true,
    },


    guest: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },


    host: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    checkIn: {
      type: Date,
      required: true,
    },

    checkOut: {
      type: Date,
      required: true,
      validate: {
        validator: function (value) {
          return !this.checkIn || value > this.checkIn;
        },
        message: "Check-out must be after check-in.",
      },
    },

    guests: {
      type: Number,
      required: true,
      min: 1,
      validate: {
        validator: Number.isInteger,
        message: "Guest count must be a whole number.",
      },
    },

    nights: {
      type: Number,
      required: true,
      min: 1,
    },


    pricePerNight: {
      type: Number,
      required: true,
      min: 0,
    },

    priceBreakdown: {
      type: priceBreakdownSchema,
      required: true,
    },

    currency: {
      type: String,
      default: "ZAR",
    },

    status: {
      type: String,
      enum: ["pending", "confirmed", "cancelled", "completed"],
      default: "pending",
    },
  },
  {
    timestamps: true,
  }
);


reservationSchema.index({ guest: 1, createdAt: -1 });
reservationSchema.index({ host: 1, createdAt: -1 });
reservationSchema.index({
  accommodation: 1,
  checkIn: 1,
  checkOut: 1,
});

const Reservation =
  mongoose.models.Reservation ||
  mongoose.model("Reservation", reservationSchema);

export default Reservation;
