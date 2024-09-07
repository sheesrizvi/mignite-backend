require('dotenv').config()
const asyncHandler = require("express-async-handler");
const { StreamClient } = require('@stream-io/node-sdk');
const client = new StreamClient(process.env.STREAM_SECRET_ACCESS_KEY, process.env.STREAM_SECRET_TOKEN);
const schedule = require('node-schedule');


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
  }

const createMeeting = asyncHandler(async (instructorId, time) => {
  const callId = 'meeting-id-' + Math.random().toString(36).slice(2, 11);
  const call = client.video.call('livestream', callId);
  const meetingData = await call.getOrCreate({
    data: {
      created_by_id: instructorId,
      members: [] 
    }
  });
 
  scheduleMeeting(callId, time);
  return { callId , meetingData }; 
})




module.exports = {
    createMeeting,
    scheduleMeeting
}

