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
      type: Number
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
      type: Number,
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
    averageRating: { 
      type: Number, 
      default: 0
     },
    totalReviews: {
       type: Number, 
       default: 0 
      },
      reviews: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Review'
      }],
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
