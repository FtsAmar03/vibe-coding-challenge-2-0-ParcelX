import mongoose from "mongoose";

const scoreSchema = new mongoose.Schema(
  {
    playerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Player",
      required: true,
    },
    playerName: {
      type: String,
      default: "",
    },
    score: {
      type: Number,
      default: 0,
    },
    note: {
      type: String,
      default: "",
    },
  },
  { _id: false },
);

const matchSchema = new mongoose.Schema(
  {
    date: {
      type: String,
      required: true,
    },
    sport: {
      type: String,
      required: true,
    },
    opponent: {
      type: String,
      required: true,
      trim: true,
    },
    venue: {
      type: String,
      default: "",
    },
    result: {
      type: String,
      default: "",
    },
    scores: [scoreSchema],
  },
  {
    timestamps: true,
  },
);

matchSchema.virtual("id").get(function () {
  return this._id.toHexString();
});
matchSchema.set("toJSON", { virtuals: true });

export default mongoose.model("Match", matchSchema);
