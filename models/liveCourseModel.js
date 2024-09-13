const mongoose = require("mongoose");

const livecourseSchema = mongoose.Schema(
  {
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      req: true,
    },
    name: {
      type: String,
      required: true,
    },
    instructor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Instructor",
      req: true,
    },
    details: {
      type: String,
      // required: true,
    },
    image: {
      type: String,
    },
    price: {
      type: Number,
      required: true,
    },
    discount: {
      type: Number,
      // required: true,
    },
    description: {
      type: String,
      required: true,
    },
    batchSize: {
      type: Boolean,
      required: true,
    },
    requirement: {
      type: String,
      required: true,
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    plan: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Plan'
      }
    ],
    liveSections: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "LiveSection",
      },
    ],
  },
  {
    timestamps: true,
  }
);

const LiveCourse = mongoose.model("LiveCourse", livecourseSchema);

module.exports = LiveCourse;
