const mongoose = require("mongoose");

const userassignmentSchema = mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    assignment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Assignment",
      required: true,
    },
    answer: [
      {
        text: {
          type: String,
          required: true,
        },
        options: [{ type: String }],
        answer: { type: String, required: true },
        selected: { type: String, required: true },
      },
    ],
    percentCorrect: {
      type: Number,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const Assignment = mongoose.model("Assignment", userassignmentSchema);

module.exports = Assignment;
