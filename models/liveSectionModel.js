const mongoose = require("mongoose");
const { instructor } = require("../middleware/authMiddleware");

const liveSectionSchema = mongoose.Schema(
  {
    liveCourse: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "LiveCourse",
      req: true
    },
    description: {
      type: String,
    },
    srNumber: {
      type: Number,
      req: true
    },
    name: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      required: true,
      enum: ['live', 'assignment']
    },
    link: {
      type: String,
    },
    startTime: {
      type: Date
    },
    endTime: {
      type: Date
    },
    duration: {
      type: String
    },
    
    instructor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Instructor'
    },
    assignment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Assignment",
    },
  },
  {
    timestamps: true,
  }
);

const LiveSection = mongoose.model("LiveSection", liveSectionSchema);

module.exports = LiveSection;
