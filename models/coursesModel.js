const mongoose = require("mongoose");

const courseSchema = mongoose.Schema(
  {
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      req: true,
    },
    instructor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Instructor",
      req: true,
    },
    name: {
      type: String,
      required: true,
    },
    image: {
      type: String,
    },
    details: {
      type: String,
      // required: true,
    },
    price: {
      type: Number
    },
    description: {
      type: String,
      required: true,
    },
    requirement: {
      type: String,
      required: true,
    },
    duration: {
      type: Number,
    },
    durationType: {
      type: String,
      enum: ['months', 'year', 'lifetime'],
      default: 'lifetime'
    },
    enrolledStudents: [
      { 
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      }
    ],
    enrolledStudentsCount: {
      type: Number,
      default: 0
    },
    plan: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Plan'
      }
    ],
    sections: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Section",
      },
    ],
  },
  {
    timestamps: true,
  }
);

const Course = mongoose.model("Course", courseSchema);

module.exports = Course;
