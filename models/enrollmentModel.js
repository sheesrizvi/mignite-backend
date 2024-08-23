const mongoose = require("mongoose");

const enrollSchema = mongoose.Schema(
  {
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      req: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      req: true,
    },
    complition: {
      type: Number,
      required: true,
    },
    sectionComplition: [
      {
        section: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          req: true,
        },
        complition: { type: Number, required: true },
      },
    ],
    complitionDate: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

const Enrollment = mongoose.model("Enrollment", enrollSchema);

module.exports = Enrollment;
