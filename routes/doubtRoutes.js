const express = require('express')
const { 
    createDoubtMessages,
    getAllThreadsOfInstructor,
    getMessagesByThread,
    getStudentThreads,
    getAllThreadsByCourse,
    getAllThreadsForStudentByCourse,
    getAllThreadsForInstructorBySection
 } = require('../controller/doubtSupportController.js')
const router = express.Router()

// post doubt messages
router.post('/create-doubt-messages', createDoubtMessages)
// get all messages threads available to instructor
router.get('/get-all-threads-of-instructor', getAllThreadsOfInstructor)
// Get Messages By Thread or Get messages by student and section id (either pass thread or (student & section Id) )
router.get('/get-messages-by-thread', getMessagesByThread)
// get all threads messages by students
router.get('/get-student-threads', getStudentThreads)
// get all threads for instructor by course
router.get('/get-all-threads-by-course', getAllThreadsByCourse)
// get all threads for students by course
router.get('/get-all-threads-for-students-by-course', getAllThreadsForStudentByCourse)
// get all threads for instructor by section
router.get('/get-all-threads-for-instructor-by-section', getAllThreadsForInstructorBySection)

module.exports = router