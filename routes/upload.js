const path = require("path");
const express = require("express");
const multer = require("multer");

const router = express.Router();

const multerS3 = require("multer-s3");


const { S3Client } = require("@aws-sdk/client-s3");
const { DeleteObjectCommand } = require("@aws-sdk/client-s3");
const { auth, admin, isAdminorInstructor } = require("../middleware/authMiddleware");

const config = {
  region: process.env.AWS_BUCKET_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY,
    secretAccessKey: process.env.AWS_SECRET_KEY,
  },
};

const s3 = new S3Client(config);

const upload = multer({
  storage: multerS3({
    s3,
    bucket: process.env.AWS_BUCKET,
    contentType: multerS3.AUTO_CONTENT_TYPE,
    key: (req, file, cb) => {
      const fileName = `${Date.now()}_${Math.round(Math.random() * 1e9)}`;
      cb(null, `${fileName}${path.extname(file.originalname)}`);
    },
  }),
  limits: { fieldSize: 2 * 1024 * 1024 }
});

router.post("/uploadMultiple", upload.array("image", 150), async (req, res) => {
  const result = req.files;

  let arr = [];
  result.forEach((single) => {
    arr.push(single.location);
  });

  //define what to do if result is empty
  res.send(arr);
});

router.post(
  "/uploadSingleImage",
  isAdminorInstructor,
  upload.single("image"),
  async (req, res) => {
    const result = req.file;
    //define what to do if result is empty
    res.send(`${result.location}`);
  }
);

router.delete("/deleteImage", isAdminorInstructor, async (req, res) => {
  const image = req.query.image;
  // console.log(image);

  const fileName = image.split("//")[1].split("/")[1];

  const command = new DeleteObjectCommand({
    Bucket: process.env.AWS_BUCKET,
    Key: fileName,
  });
  const response = await s3.send(command);
  // console.log(response);
});

module.exports = router;
