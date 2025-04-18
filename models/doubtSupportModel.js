const mongoose = require('mongoose')

const DoubtThreadSchema = new mongoose.Schema({
    courseInfo: {
      course: { type: mongoose.Schema.Types.ObjectId, refPath: "courseType" },
      courseType: {
        type: String,
        enum: ['Course', 'LiveCourse']
      }
    },
    sectionInfo: {
      section: { type: mongoose.Schema.Types.ObjectId, refPath: 'sectionType' },
      sectionType: { type: String, enum: ['Section', 'LiveSection'] }
    },
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    instructor: { type: mongoose.Schema.Types.ObjectId, ref: 'Instructor', required: true },
  }, { timestamps: true });
  
  
  const MessageSchema = new mongoose.Schema({
    thread: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'DoubtThread',
      required: true
    },
    senderType: {
      type: String,
      enum: ['user', 'instructor'],
      required: true
    },
    student: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User'
    },
    instructor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Instructor',
        required: true
    },
    messageText: {
      type: String,
      required: true
    },
    attachments: [String],
  }, {timestamps: true});
  

const AskYourDoubt = mongoose.model('AskYourDoubt', DoubtThreadSchema)
const Message = mongoose.model('Message', MessageSchema)

module.exports = {
  AskYourDoubt,
  Message
}