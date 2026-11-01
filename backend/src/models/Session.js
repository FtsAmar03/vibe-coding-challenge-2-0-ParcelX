import mongoose from "mongoose";

const sessionSchema = new mongoose.Schema(
  {
    date: {
      type: String,
      required: true,
    },
    sport: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ["open", "closed"],
      default: "open",
    },
    attendance: {
      type: Map,
      of: {
        type: String,
        enum: ["Present", "Absent"],
      },
      default: {},
    },
    notes: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  },
);

sessionSchema.virtual("id").get(function () {
  return this._id.toHexString();
});
sessionSchema.set("toJSON", { virtuals: true });

export default mongoose.model("Session", sessionSchema);
