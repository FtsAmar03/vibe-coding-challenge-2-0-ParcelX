import mongoose from "mongoose";

const playerSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    age: {
      type: Number,
      required: true,
      min: 5,
      max: 60,
    },
    sport: {
      type: String,
      required: true,
      trim: true,
    },

    position: {
      type: String,
    },
    academy: {
      type: String,
      default: "Dumka Sports Academy",
    },

    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },
  },
  {
    timestamps: true,
  },
);

// Virtual for id
playerSchema.virtual("id").get(function () {
  return this._id.toHexString();
});
playerSchema.set("toJSON", { virtuals: true });

export default mongoose.model("Player", playerSchema);
