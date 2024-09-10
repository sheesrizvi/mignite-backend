const { startMeeting, endMeeting } = require("../middleware/meetingLinkGenerate")
const LiveSection = require("../models/liveSectionModel")
const asyncHandler = require("express-async-handler")

const startLiveMeeting = asyncHandler(async (req, res) => {
    const instructor = req.user
    const { meetingId } = req.query

    if(!meetingId) {
        return res.status(400).send({status: true, message: 'Not a Valid Link '})
    }

   const liveSection =  await LiveSection.findOne({instructor: instructor._id, link: meetingId})
   if(!liveSection) {
    return res.status(400).send({status: false, message: "Section not found for this meeting"})
   }
   if(liveSection) {
        const result = await startMeeting(meetingId)
        if(!result) {
           return  res.status(400).send({status: false, messgae: 'Unable to live'})
        }
        res.status(200).send({status: true, message: 'Meeting is now live'}) 
   }
})


const endLiveMeeting = asyncHandler(async (req, res) => {
    const instructor = req.user
    const { meetingId } = req.query

    if(!meetingId) {
        return res.status(400).send({status: true, message: 'Not a Valid Link '})
    }

   const liveSection =  await LiveSection.findOne({instructor: instructor._id, link: meetingId})
   if(!liveSection) {
    return res.status(400).send({status: false, message: "Section not found for this meeting"})
   }
   if(liveSection) {
        const result = await endMeeting(meetingId)
        if(!result) {
           return  res.status(400).send({status: false, messgae: 'Unable to close'})
        }
        res.status(200).send({status: true, message: 'Meeting is closed now'}) 
   }
})

module.exports = {
    startLiveMeeting,
    endLiveMeeting
}