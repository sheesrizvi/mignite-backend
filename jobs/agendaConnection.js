const Agenda = require('agenda');
const { sendNotificationsInsideApplicationToMultipleUser } = require('../controller/notificationController');
const LiveCourse = require('../models/liveCourseModel');
const mongoConnectionString = process.env.MONGO_URI; 

sendNotificationsInsideApplicationToMultipleUser
const agenda = new Agenda({ db: { address: mongoConnectionString, collection: 'jobs' } });


agenda.define('send notification', async (job) => {
    const { sectionId, msg } = job.attrs.data;
    const  jobId  = job.attrs._id
    const livecourse = await LiveCourse.findOne({liveSections: sectionId}).populate('enrolledStudents')
    if(!livecourse || livecourse.enrolledStudents?.length === 0) {  
       return
    }
    const users = livecourse.enrolledStudents
    console.log(`Sending notification for section ID: ${sectionId}`);
    sendNotificationsInsideApplicationToMultipleUser(users, msg)
    await agenda.cancel({ _id: jobId });
  });

  agenda.define('send-notification-before-course-start', async (job) => {
    const { courseId, msg } = job.attrs.data
    const  jobId  = job.attrs._id
    const livecourse = await LiveCourse.findOne({_id: courseId}).populate('enrolledStudents')
    if(!livecourse || livecourse.enrolledStudents?.length === 0) {  
        return
     }
     const users = livecourse.enrolledStudents
     console.log(`Sending notification for course ID: ${courseId}`);

     sendNotificationsInsideApplicationToMultipleUser(users, msg)
     await agenda.cancel({ _id: jobId });
  })



const startAgenda = async () => {
    await agenda.start();
    console.log('Agenda started');
};


module.exports = {
    agenda,
    startAgenda
};
