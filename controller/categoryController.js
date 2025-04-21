const asyncHandler = require("express-async-handler");
const Category = require("../models/category");
const Course = require("../models/coursesModel");
const LiveCourse = require("../models/liveCourseModel");
const { DeleteObjectCommand } = require("@aws-sdk/client-s3");
const multerS3 = require("multer-s3");
const { S3Client } = require("@aws-sdk/client-s3");

const config = {
  region: process.env.AWS_BUCKET_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY,
    secretAccessKey: process.env.AWS_SECRET_KEY,
  },
};

const s3 = new S3Client(config);


const createCategory = asyncHandler(async (req, res) => {
  const { name, type, image } = req.body;

  const category = await Category.create({
    name,
    type,
    image,
  });
  if (category) {
    res.status(201).json(category);
  } else {
    res.status(404);
    throw new Error("Error");
  }
});

const getCategoryByType = asyncHandler(async (req, res) => {
  const { type } = req.query;


  if (typeof type !== 'string') {
    return res.status(400).json({ error: 'Invalid type format' });
  }

  const categories = await Category.find({ type });

  if (categories.length > 0) {
    res.status(200).json(categories);
  } else {
    res.status(404).json({ error: 'Category not found' });
  }
});

const getCategory = asyncHandler(async (req, res) => {
  const category = await Category.find({});
  if (category) {
    res.status(201).json(category);
  } else {
    res.status(404);
    throw new Error("Error");
  }
});

const getAllCategory = asyncHandler(async (req, res) => {
  const { pageNumber = 1, pageSize = 20 } = req.query
  const categories = await Category.find({}).sort({ createdAt: -1 }).skip((pageNumber - 1) * pageSize).limit(pageSize)

  if(!categories || categories.length === 0) {
    return res.status(400).send({ message: "No Categories Found" })
  }
  const totalDocuments = await Category.countDocuments({})
  const pageCount = Math.ceil(totalDocuments/pageSize)

  if (categories) {
    res.status(201).json({ categories, pageCount });
  } else {
    res.status(404);
    throw new Error("Error");
  }
});

const deleteCategory = asyncHandler(async (req, res) => {

  const subid = req.query.id;
  const sub = await Category.findById(subid);

  const f1 = sub.image;

  if (f1) {
    const fileName = f1.split("//")[1].split("/")[1];

    const command = new DeleteObjectCommand({
      Bucket: process.env.AWS_BUCKET,
      Key: fileName,
    });
    const response = await s3.send(command);
  }

  await Category.deleteOne({ _id: req.query.id });
  res.json("deleted");
});

const updateCategory = asyncHandler(async (req, res) => {
  const { id, name, type, image } = req.body;

  const categories = await Category.find({ _id: id });

  if (categories.length > 0) {
    categories[0].name = name;
    categories[0].type = type;
    categories[0].image = image ? image : categories[0].image;
    const updatedCategory = await categories[0].save();

    res.json(updatedCategory);
  } else {
    res.status(404);
    throw new Error("Error");
  }
});





module.exports = {
  createCategory,
  getCategory,
  getAllCategory,
  getCategoryByType,
  updateCategory,
  deleteCategory
}
