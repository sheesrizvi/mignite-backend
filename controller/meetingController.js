const { startMeeting, endMeeting } = require("../middleware/meetingLinkGenerate")
const LiveSection = require("../models/liveSectionModel")
const asyncHandler = require("express-async-handler")

const startLiveMeeting = asyncHandler(async (req, res) => {
    
    const { meetingId, instructor } = req.body

    if (!meetingId) {
        return res.status(400).send({
            status: false,
            message: {
                en: "Not a valid link",
                ar: "الرابط غير صالح"
            }
    });

    }

    const liveSection = await LiveSection.findOne({ instructor , link: meetingId })
    if (!liveSection) {
      return res.status(400).send({
        status: false,
        message: {
            en: "Live section not found with this instructor for the given meeting link",
            ar: "لم يتم العثور على قسم مباشر لهذا المدرس بالرابط المقدم للاجتماع"
        }
        });
    }
    if (liveSection) {
        const result = await startMeeting(meetingId)
        if (!result) {
            return res.status(400).send({
                status: false,
                message: {
                    en: "Unable to go live",
                    ar: "غير قادر على البث المباشر"
                }
            });
        }
      
        return res.status(200).send({
        status: true,
        message: {
            en: "Meeting is now live",
            ar: "الاجتماع الآن مباشر"
        }
        });

    }
})


const endLiveMeeting = asyncHandler(async (req, res) => {
   
    const { meetingId, instructor } = req.body

    if (!meetingId) {
       return res.status(400).send({
            status: false,
            message: {
                en: "Not a valid link",
                ar: "الرابط غير صالح"
            }
            });
    }

    const liveSection = await LiveSection.findOne({ instructor , link: meetingId })
    if (!liveSection) {
        return res.status(400).send({
            status: false,
            message: {
                en: "Live section not found with this instructor for the given meeting link",
                ar: "لم يتم العثور على قسم مباشر لهذا المدرس بالرابط المقدم للاجتماع"
            }
            });
    }
    if (liveSection) {
        const result = await endMeeting(meetingId)
        if (!result) {
            return res.status(400).send({
            status: false,
            message: {
                en: "Unable to close",
                ar: "غير قادر على الإغلاق"
            }
            });

        }
        return res.status(200).send({
            status: true,
            message: {
                en: "Meeting is closed now",
                ar: "تم إغلاق الاجتماع الآن"
            }
            });
    }
})

module.exports = {
    startLiveMeeting,
    endLiveMeeting
}