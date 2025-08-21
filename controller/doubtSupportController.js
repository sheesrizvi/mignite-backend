const mongoose = require('mongoose')
const asyncHandler = require('express-async-handler')
const { AskYourDoubt, Message } = require('../models/doubtSupportModel.js')
const Section = require('../models/sectionModel.js')
const LiveSection = require('../models/liveSectionModel.js')

const createDoubtMessages = asyncHandler(async (req, res) => {
  const { studentId, instructorId, senderType, sectionId, messageText, attachments } = req.body

  if(!studentId || !instructorId || !senderType || !sectionId ) {
    return res.status(400).send({ message: "Mandatory Fields are required" })
  }

  if(!messageText && (!attachments || attachments.length === 0)) {
    return res.status(400).send({ message: 'Either MessageText or Attachment is required' })
  }

  let sectionType = null
  let courseType = null
  let courseId = null
  const section = await Section.findOne({ _id: sectionId })

  if(section) {
    if(!section.course) {
      return res.status(400).send({ message: "Course details not found inside section" })
    }
    sectionType = 'Section'
    courseType = 'Course'
    courseId = section.course

  } else {
    const liveSection = await LiveSection.findOne({ _id: sectionId })

    if(!liveSection) {
      return res.status(400).send({ message: 'Section Details not found' })
    }

    if(!liveSection.liveCourse) {
      return res.status(400).send({ message: "Course details not found inside section" })
    }
    sectionType = 'LiveSection'
    courseType = 'LiveCourse'
    courseId = liveSection.liveCourse
  }


  let thread = await AskYourDoubt.findOne({ 'sectionInfo.section': sectionId, student: studentId, instructor: instructorId })
  
  if(!thread) {
    thread = await AskYourDoubt.create({ 
      courseInfo: {
        course: courseId,
        courseType: courseType
      },
      sectionInfo: {
        section: sectionId,
        sectionType
      },
      student: studentId,
      instructor: instructorId
     })
  }

  const messageThread = await Message.create({
    thread: thread._id,
    student: studentId,
    instructor: instructorId,
    senderType: senderType,
    messageText,
    attachments
  })

  res.status(200).send({ message: "Doubt Request Created", messageThread })

})

const getAllThreadsOfInstructor = asyncHandler(async (req, res) => {
  const { instructorId, sectionId } = req.query;

  if (!instructorId) {
    return res.status(400).json({ message: "Instructor ID is required" });
  }

  const query = { instructor: instructorId };

  if (sectionId) {
    query['sectionInfo.section'] = sectionId;
  }

  const threads = await AskYourDoubt.find(query)
    .populate('courseInfo.course', 'title')
    .populate('sectionInfo.section', 'name')
    .populate('student', 'name');

  const enrichedThreads = await Promise.all(
    threads.map(async (thread) => {
  
      const messages = await Message.find({ thread: thread._id })
        .sort({ createdAt: -1 }) 
        .populate('student', 'name')
        .populate('instructor', 'name');

      return {
        thread: thread._id,
        student: thread.student,
        instructor: thread.instructor,
        courseInfo: thread.courseInfo,
        sectionInfo: thread.sectionInfo,
        messages
      };
    })
  );

  res.json({ threads: enrichedThreads });
});



const getMessagesByThread = asyncHandler(async (req, res) => {
  const { threadId, studentId, sectionId, pageNumber = 1, limit = 200 } = req.query;

  let thread;

  if (threadId) {
    thread = await AskYourDoubt.findById(threadId);
    if (!thread) {
      return res.status(404).json({
        message: {
          en: "Thread not found",
          ar: "الموضوع غير موجود"
        }
})

     }
  } else if (studentId && sectionId) {
    thread = await AskYourDoubt.findOne({
      student: studentId,
      'sectionInfo.section': sectionId
    });
    if (!thread) {
      return res.status(404).json({
        message: {
          en: "No thread found for this student and section",
          ar: "لم يتم العثور على موضوع لهذا الطالب وهذا القسم"
        }
      })

    }
  } else {
    return res.status(400).json({
        message: {
          en: "Please provide either threadId or both studentId and sectionId",
          ar: "يرجى تقديم threadId أو كل من studentId و sectionId"
        }
      })
  }

  const skip = (parseInt(pageNumber) - 1) * parseInt(limit);

  const messages = await Message.find({ thread: thread._id })
    .populate('student', 'name avatar')
    .populate('instructor', 'name avatar')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit));

  const totalMessages = await Message.countDocuments({ thread: thread._id });
  const pageCount = Math.ceil(totalMessages/limit)
  res.json({
    thread: {
      ...thread.toObject(),
      messages
    },
    pageCount
  });
});


const getStudentThreads = asyncHandler(async (req, res) => {
  const { studentId } = req.query;

  if (!studentId) {
    return res.status(400).json({ message: 'Student ID is required' });
  }

  const threads = await AskYourDoubt.find({ student: studentId })
    .populate('courseInfo.course', 'title')
    .populate('sectionInfo.section', 'name')
    .populate('instructor', 'name');

  const enrichedThreads = await Promise.all(
    threads.map(async (thread) => {
      const messages = await Message.find({ thread: thread._id })
        .sort({ createdAt: -1 }) 
        .populate('student', 'name')
        .populate('instructor', 'name');

      return {
        thread: thread._id,
        instructor: thread.instructor,
        courseInfo: thread.courseInfo,
        sectionInfo: thread.sectionInfo,
        messages
      };
    })
  );

  res.status(200).json({ threads: enrichedThreads });
});

const getAllThreadsByCourse = asyncHandler(async (req, res) => {
  const { instructorId, courseId } = req.query;

  if (!instructorId || !courseId) {
    return res.status(400).json({ message: "Instructor ID and Course ID are required" });
  }

  const threads = await AskYourDoubt.find({
    instructor: instructorId,
    'courseInfo.course': courseId
  })
    .populate('courseInfo.course', 'title')
    .populate('sectionInfo.section', 'name')
    .populate('student', 'name');

  const enrichedThreads = await Promise.all(
    threads.map(async (thread) => {
      const messages = await Message.find({ thread: thread._id })
        .sort({ createdAt: -1 }) 
        .populate('student', 'name')
        .populate('instructor', 'name');

      return {
        thread: thread._id,
        courseInfo: thread.courseInfo,
        sectionInfo: thread.sectionInfo,
        student: thread.student,
        instructor: thread.instructor,
        messages
      };
    })
  );

  res.status(200).json({ threads: enrichedThreads });
});


const getAllThreadsForStudentByCourse = asyncHandler(async (req, res) => {
  const { studentId, courseId } = req.query;

  if (!studentId || !courseId) {
    return res.status(400).json({ message: "Student ID and Course ID are required" });
  }

  const threads = await AskYourDoubt.find({
    student: studentId,
    'courseInfo.course': courseId
  })
    .populate('courseInfo.course', 'title')
    .populate('sectionInfo.section', 'name')
    .populate('instructor', 'name');

  const enrichedThreads = await Promise.all(
    threads.map(async (thread) => {
      const messages = await Message.find({ thread: thread._id })
        .sort({ createdAt: -1 })
        .populate('student', 'name')
        .populate('instructor', 'name');

      return {
        threadId: thread._id,
        courseInfo: thread.courseInfo,
        sectionInfo: thread.sectionInfo,
        instructor: thread.instructor,
        messages
      };
    })
  );

  res.status(200).json({ threads: enrichedThreads });
});


const getAllThreadsForInstructorBySection = asyncHandler(async (req, res) => {
  const { instructorId, sectionId } = req.query;

  if (!instructorId || !sectionId) {
    return res.status(400).json({ message: "Instructor ID and Section ID are required" });
  }

  const threads = await AskYourDoubt.find({
    instructor: instructorId,
    'sectionInfo.section': sectionId
  })
    .populate('courseInfo.course', 'title')
    .populate('sectionInfo.section', 'name')
    .populate('student', 'name');

  const enrichedThreads = await Promise.all(
    threads.map(async (thread) => {
      const messages = await Message.find({ thread: thread._id })
        .sort({ createdAt: -1 })
        .populate('student', 'name')
        .populate('instructor', 'name');

      return {
        thread: thread._id,
        courseInfo: thread.courseInfo,
        sectionInfo: thread.sectionInfo,
        student: thread.student,
        instructor: thread.instructor,
        messages
      };
    })
  );

  res.status(200).json({ threads: enrichedThreads });
});


module.exports = {
    createDoubtMessages,
    getAllThreadsOfInstructor,
    getMessagesByThread,
    getStudentThreads,
    getAllThreadsByCourse,
    getAllThreadsForStudentByCourse,
    getAllThreadsForInstructorBySection
}