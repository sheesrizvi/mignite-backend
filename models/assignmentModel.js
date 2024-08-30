const mongoose = require("mongoose");

const assignmentSchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    // type: {
    //   type: String,
    //   required: true,
    //   enum: ["mcq", "image"],
    // },
    // image: {
    //   type: String,
    //   required: true,
    // },
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true,
    },
    level: {
      type: String,
      required: true,
    },
    number: {
      type: Number,
      required: true,
    },
    section: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Section",
    },
    questions: [
      {
        text: {
          type: String,
          required: true,
        },
        options: [{ type: String }],
        correctAnswer: { type: String, required: true },
        hint: { type: String },
      },
    ],
  },
  {
    timestamps: true,
  }
);

const Assignment = mongoose.model("Assignment", assignmentSchema);

module.exports = Assignment;
