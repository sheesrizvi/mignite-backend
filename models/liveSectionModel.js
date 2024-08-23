const mongoose = require("mongoose");

const liveSectionSchema = mongoose.Schema(
  {
    liveCourse: {
      type: mongoose.Schema.Types.ObjectId, 
      ref: "LiveCourse",
      req: true
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
      enum: ["live", "assignment"]
    },
    link: {
      type: String,
    },
    time: { 
      type: Date,
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
