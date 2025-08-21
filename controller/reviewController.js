const Course = require("../models/coursesModel.js");
const LiveCourse = require("../models/liveCourseModel.js");
const Review = require("../models/reviewModel.js");
const asyncHandler = require('express-async-handler');
const mongoose = require("mongoose");
const User = require("../models/userModel.js");

const addReview = asyncHandler(async (req, res) => {
    const { userId, courseId, courseType, rating, review } = req.body;
  
    if (!rating && !review) {
      return res.status(400).send({
        status: false,
        message: {
          en: "Either review or rating is required",
          ar: "إما المراجعة أو التقييم مطلوب"
        }
      })
    }
  
    if (!mongoose.Types.ObjectId.isValid(courseId)) {
      return res.status(400).json({
        status: false,
        message: {
          en: "Invalid course ID",
          ar: "معرّف المقرر غير صالح"
        }
      })
    }
  
    const existingReview = await Review.findOne({ course: courseId, user: userId });
    if (existingReview) {
     return res.status(400).send({
      status: false,
      message: {
        en: "You have already reviewed this course",
        ar: "لقد قمت بمراجعة هذا المقرر بالفعل"
      }
    })
    }
  
    const newReview = new Review({ course: courseId, user: userId, rating, review, courseType });
    await newReview.save();
  
    await User.findByIdAndUpdate(userId, { $push: { reviews: newReview._id } });
  
    const reviews = await Review.find({ course: courseId });
    const totalReviews = reviews.length;
    const averageRating = totalReviews > 0 
      ? reviews.reduce((sum, review) => sum + review.rating, 0) / totalReviews 
      : 0;
  
    const Model = courseType === 'LiveCourse' ? LiveCourse : Course;
    await Model.findByIdAndUpdate(courseId, { averageRating, totalReviews, $push: { reviews: newReview._id } });
  
    return res.status(201).send({ 
      status: true, 
      message: {
        en: "Review created successfully",
        ar: "تم إنشاء المراجعة بنجاح"
      },
      review: newReview
     });
  });
  
  const updateReview = asyncHandler(async (req, res) => {
    const { reviewId, userId, rating, review } = req.body;
  
    if (!rating && !review) {
      return res.status(400).send({ status: false, message: 'Either Review or Rating is required' });
    }
  
    if (!mongoose.Types.ObjectId.isValid(reviewId)) {
      return res.status(400).json({ status: false, message: 'Invalid Review Id' });
    }
    
    const existingReview = await Review.findById(reviewId);
    if (!existingReview) {
      return res.status(404).json({ status: false, message: 'Review not found' });
    }
  
    if (existingReview.user.toString() !== userId.toString()) {
      return res.status(403).json({ status: false, message: 'User not authorized to update this review' });
    }
  
    existingReview.rating = rating || existingReview.rating;
    existingReview.review = review || existingReview.review;
    await existingReview.save();
  
    const courseId = existingReview.course;
    const courseType = existingReview.courseType;
  
    const reviews = await Review.find({ course: courseId });
    const totalReviews = reviews.length;
    const averageRating = totalReviews > 0
      ? reviews.reduce((sum, review) => sum + review.rating, 0) / totalReviews
      : 0;
  
    const Model = courseType === 'LiveCourse' ? LiveCourse : Course;
    await Model.findByIdAndUpdate(courseId, { averageRating, totalReviews });
  
    res.status(200).json({ status: true, message: 'Review updated successfully', updatedReview: existingReview });
  });
  


const deleteReview = asyncHandler(async (req, res) => {
  const { reviewId, userId, courseType } = req.body;

  const reviewToDelete = await Review.findById(reviewId);
  if (!reviewToDelete) {
    return res.status(404).json({ status: false, message: 'Review not found' });
  }

  if (reviewToDelete.user.toString() !== userId.toString()) {
    return res.status(403).json({ status: false, message: 'User not authorized to delete this review' });
  }

  await Review.findByIdAndDelete(reviewId);
  await User.findByIdAndUpdate(userId, { $pull: { reviews: reviewToDelete._id } });

  const Model = courseType === 'LiveCourse' ? LiveCourse : Course;
  const reviews = await Review.find({ course: reviewToDelete.course, courseType });
  const totalReviews = reviews.length;
  const averageRating = totalReviews > 0 ? reviews.reduce((sum, review) => sum + review.rating, 0) / totalReviews : 0;

  await Model.findByIdAndUpdate(reviewToDelete.course, { averageRating, totalReviews, $pull: { reviews: reviewToDelete._id } });

  res.status(200).json({ status: true, message: 'Review deleted successfully' });
});

const getSingleCourseAllReviews = asyncHandler(async (req, res) => {
  const { courseId } = req.body;

  if (!mongoose.Types.ObjectId.isValid(courseId)) {
    return res.status(400).send({ status: false, message: 'Not a Valid Course Id' });
  }

  const reviews = await Review.find({ course: courseId }).populate('user course');
  
  if (reviews.length < 1) {
    return res.status(400).send({ status: false, message: 'No Reviews Found' });
  }

  return res.status(200).send({ status: true, message: 'Fetched All Reviews for the course', reviews });
});

const getSingleReview = asyncHandler(async (req, res) => {
  const { reviewId } = req.body;

  if (!mongoose.Types.ObjectId.isValid(reviewId)) {
    return res.status(400).send({ status: false, message: 'Not a Valid Review Id' });
  }

  const review = await Review.findById(reviewId).populate('user course');
  if (!review) {
    return res.status(400).send({ status: false, message: 'Review not Found' });
  }

  return res.status(200).send({ status: true, message: 'Fetched the review', review });
});

module.exports = { addReview, updateReview, deleteReview, getSingleCourseAllReviews, getSingleReview };
