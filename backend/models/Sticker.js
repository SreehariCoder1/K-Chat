import mongoose from "mongoose";

const stickerSchema = new mongoose.Schema(
  {
    url: {
      type: String,
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    keywords: {
      type: [String],
      default: [],
    },
    type: {
      type: String,
      enum: ["static", "animated"],
      required: true,
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true },
);

// Index keywords for faster search
stickerSchema.index({ keywords: "text" });

const Sticker = mongoose.model("Sticker", stickerSchema);

export default Sticker;
