const mongoose = require("mongoose");
const { Plan } = require('./planModel')
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
      type: Number,
      required: true
    },
    description: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending'
  },
    requirement: {
      type: String,
      required: true,
    },
    duration: {
      type: Number,
    },
    discount: {
      type: Number,
      required: false
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
    courseType: {
        type: String,
        enum: ["Course"],
        default: "Course"
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


courseSchema.pre('remove', async function (next) {
  await Plan.updateMany({}, { $pull: { courses: this._id } });
  next();
});


const Course = mongoose.model("Course", courseSchema);

module.exports = Course;
