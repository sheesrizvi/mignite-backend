const mongoose = require("mongoose");

const sectionSchema = mongoose.Schema(
  {
    course: {
      type: mongoose.Schema.Types.ObjectId, 
      ref: "Course",
      req: true
    },
    srNumber: {
      type: Number, 
      req: true
    },
    description: {
      type: String, 
      req: true
    },
    name: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      required: true,
      enum: ["video", "assignment"]
    },
    video: {
      type: String,
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

const Section = mongoose.model("Section", sectionSchema);

module.exports = Section;
