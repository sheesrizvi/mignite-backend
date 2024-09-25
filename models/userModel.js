const mongoose = require("mongoose");
const bycrypt = require("bcryptjs");
const { Subscription } = require("./subscriptionModel");

const userSchema = mongoose.Schema(
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
    aboutme: {
      type: String,
    },
    aspiration: {
      type: String,
    },
    expectation: {
      type: String,
    },
    phone: {
      type: Number,
      required: true,
    },
    age: {
      type: Number,
      required: true,
    },
    education: {
      type: String,
      required: true,
    },
    address: {
      address: { type: String },
      street: { type: String },
      zone: { type: String },
      landmark: { type: String },
      area: { type: String },
    },
    country: {
      type: String,
    },
    gender: {
      type: String,
    },
    pushToken: {
      type: String,
    },
    profile: {
      type: String,
    },
    active: {
      type: Boolean,
      required: true,
      default: true,
    },
    type: {
      type: String,
      default: 'user'
    },
    purchasedCourses: [
      {
        course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course' },
        livecourse: { type: mongoose.Schema.Types.ObjectId, ref: 'LiveCourse'},
        startedAt: { type: Date, default: Date.now() },
        expiresAt: { type: Date },
        status: {
          type: String,
          enum: [ "Enrolled", "In Progress", "Completed", "Expired"],
          default: 'Enrolled'
        }
      }
    ],
    
  },
  {
    timestamps: true,
  }
);

userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bycrypt.compare(enteredPassword, this.password);
};

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) {
    next();
  }
  const salt = await bycrypt.genSalt(10);
  this.password = await bycrypt.hash(this.password, salt);
});

const User = mongoose.model("User", userSchema);

module.exports = User;
