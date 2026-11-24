import mongoose from "mongoose";

const accommodationSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Property title is required"],
      trim: true,
      maxlength: 120,
    },

    location: {
      type: String,
      required: [true, "Location is required"],
      trim: true,
    },

    description: {
      type: String,
      required: [true, "Description is required"],
      trim: true,
    },

    type: {
      type: String,
      required: true,
      enum: [
        "Entire place",
        "Private room",
        "Shared room",
        "Hotel room",
      ],
    },

    guests: {
      type: Number,
      required: true,
      min: 1,
    },

    bedrooms: {
      type: Number,
      required: true,
      min: 0,
    },

    bathrooms: {
      type: Number,
      required: true,
      min: 0,
    },

    sleepingArrangements: {
      type: String,
      trim: true,
      maxlength: 500,
      default: "",
    },

    amenities: {
      type: [String],
      default: [],
    },

    images: {
      type: [String],
      default: [],
    },

    price: {
      type: Number,
      required: true,
      min: 0,
    },

    weeklyDiscount: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
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

    rating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },

    reviews: {
      type: Number,
      default: 0,
      min: 0,
    },

    enhancedCleaning: {
      type: Boolean,
      default: false,
    },

    selfCheckIn: {
      type: Boolean,
      default: false,
    },


    houseRules: {
      type: String,
      trim: true,
      maxlength: 1000,
      default: "",
    },

    safetyInfo: {
      type: String,
      trim: true,
      maxlength: 1000,
      default: "",
    },

    cancellationPolicy: {
      type: String,
      trim: true,
      maxlength: 1000,
      default: "",
    },

    host: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const Accommodation =
  mongoose.models.Accommodation ||
  mongoose.model("Accommodation", accommodationSchema);

export default Accommodation;