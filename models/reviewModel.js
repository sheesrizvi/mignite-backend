const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema({
    course: { type: mongoose.Schema.Types.ObjectId, required: true,  refPath: 'courseType'},  
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },      
    rating: { type: Number, min: 1, max: 5 },
    review: { type: String },
    courseType: { type: String, enum: ['Course', 'LiveCourse'], required: true },  
    createdAt: { type: Date, default: Date.now }
});


reviewSchema.pre('validate', function(next) {
    if (!this.rating && !this.review) {
      return next(new Error('A review must contain either a rating or a review text'));
    }
    next();
});

const Review = mongoose.model('Review', reviewSchema);

module.exports = Review;
