const express = require('express');
const { isUser } = require('../middleware/authMiddleware.js');
const { addReview , updateReview, deleteReview, getSingleCourseAllReviews, getSingleReview } = require('../controller/reviewController.js');


const router = express.Router();


router.get('/get-review-by-courses', getSingleCourseAllReviews);
router.get('/get-review-by-id', getSingleReview);


router.post('/create', isUser, addReview);
router.patch('/update', isUser,  updateReview);
router.delete('/delete', isUser, deleteReview);

module.exports = router;

