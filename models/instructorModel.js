const mongoose = require("mongoose");
const bycrypt = require("bcryptjs");

const instructorSchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
    phone: {
      type: Number,
      required: true,
    },
    description: {
      type: String,
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending'
    },
      rejectedAt: {
        type: Date,
        default: null,
        index: {expires: '7d'}
    },
    active: {
      type: Boolean,
      required: true,
      default: false
    },
    type: {
      type: String,
      required: true,
      default: "instructor"
    },
    courses: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Course'
      }
    ],
    livecourses: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'LiveCourse'
      }
    ],
    otp: {
      type: String
    },
    resume: {
      type: String
    },
    profileImage: {
      type: String
    },
    isDeleted: {
      type: Boolean,
      default: false
    },
  },
  
  {
    timestamps: true,
  }
);

instructorSchema.methods.matchPassword = async function (enteredPassword) {
  return await bycrypt.compare(enteredPassword, this.password);
};

instructorSchema.pre("save", async function (next) {
  if (!this.isModified("password")) {
    next();
  }
  const salt = await bycrypt.genSalt(10);
  this.password = await bycrypt.hash(this.password, salt);
});

const Instructor = mongoose.model("Instructor", instructorSchema);

module.exports = Instructor;
