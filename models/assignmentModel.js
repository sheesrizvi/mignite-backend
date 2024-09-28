const mongoose = require("mongoose");
const LiveSection = require("./liveSectionModel");

const assignmentSchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
    },
    livecourse: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'LiveCourse'
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
    livesection: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'LiveSection'
    },
    questions: [
      {
        question_no: { type: String },
        question_type: { type: String },
        question_text: {
          type: String,
          required: true,
        },
        Options: [{ type: String }],
        topics: [{ type: String }],
        correct_answer: { type: String, required: true },
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
