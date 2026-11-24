import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: [true, "Username is required"],
      trim: true,
      minlength: 2,
      maxlength: 50,
    },

    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
    },

    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: 8,
      select: false,
    },

    role: {
      type: String,
      enum: ["user", "host", "admin"],
      default: "user",
    },


    bio: {
      type: String,
      trim: true,
      maxlength: 500,
      default: "",
    },


    profileImage: {
      type: String,
      trim: true,
      default: "",
    },


    hostLocation: {
      type: String,
      trim: true,
      maxlength: 120,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);


userSchema.pre("save", async function () {
  if (!this.isModified("password")) return;

  this.password = await bcrypt.hash(this.password, 12);
});


userSchema.methods.comparePassword = function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

const User =
  mongoose.models.User || mongoose.model("User", userSchema);

export default User;