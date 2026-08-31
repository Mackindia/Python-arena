import mongoose from "mongoose";

const MessageSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
      index: true,
    },
    userName: {
      type: String,
      required: true,
    },
    userRole: {
      type: String,
      default: "student",
    },
    subject: {
      type: String,
      default: "General",
    },
    messages: [
      {
        senderId: { type: String, required: true },
        sender: { type: String, required: true },
        senderRole: { type: String, default: "student" },
        text: { type: String, required: true },
        readBy: [
          {
            userId: { type: String, required: true },
            readAt: { type: Date, default: Date.now },
          },
        ],
        createdAt: { type: Date, default: Date.now },
      },
    ],
    status: {
      type: String,
      enum: ["open", "replied", "closed"],
      default: "open",
    },
    unreadByAdmin: {
      type: Boolean,
      default: true,
    },
    unreadByUser: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

export default mongoose.models.Message ||
  mongoose.model("Message", MessageSchema);
