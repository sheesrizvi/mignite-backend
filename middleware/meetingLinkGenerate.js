require('dotenv').config()
const asyncHandler = require("express-async-handler");
const { StreamClient, StreamChat } = require('@stream-io/node-sdk');

const client = new StreamClient(process.env.STREAM_SECRET_ACCESS_KEY, process.env.STREAM_SECRET_TOKEN, {
  timeout: 30000
});
const schedule = require('node-schedule');

const generateLiveStreamToken = asyncHandler(async (req, res) => {
  const { id } = req.query
 // const streamToken = client.createToken(id)
  const streamToken = client.generateUserToken({ user_id:  id, validity_in_seconds: 60 * 60 })
  return res.send({ streamToken })
})


const scheduleMeeting = asyncHandler(async (callId, startTime) => {
  schedule.scheduleJob(startTime, () => {
    startMeeting(callId);
  });
})

async function startMeeting(callId) {
  const call = client.video.call('livestream', callId);

  await call.goLive({
    start_hls: true,
    start_recording: true
  });
  console.log('Meeting is now live!');
  return true
}

const endMeeting = asyncHandler(async (callId) => {
  const call = client.video.call('livestream', callId);
  await call.end()
  console.log('Meeting is closed now!');
  return true
})


const createMeeting = asyncHandler(async (instructorId, time) => {
  const callId = 'meeting-id-' + Math.random().toString(36).slice(2, 11);
  const call = client.video.call('livestream', callId)
 
  const meetingData = await call.getOrCreate({
    data: {
      created_by_id: instructorId,
      members: []
    }
  });
  
  scheduleMeeting(callId, time);
  return { callId, meetingData }

})


const callIdStatus = asyncHandler(async (req, res) => {
  const { callId } = req.query
 
  const result = await client.video.queryCalls({
    filter_conditions: {
      $and: [
        { id: { $eq: callId } },
        { ongoing: { $eq: true } },
      ],
    },
  });
  
  
  res.status(200).send({ result })
})

module.exports = {
  createMeeting,
  scheduleMeeting,
  generateLiveStreamToken,
  startMeeting,
  endMeeting,
  client,
  callIdStatus
}

