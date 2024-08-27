const asyncHandler = require("express-async-handler");
const Category = require("../models/category");

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

  const category = await Category.find({ type });
  if (category) {
    res.status(201).json(category);
  } else {
    res.status(404);
    throw new Error("Error");
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
    const {id, name, type, image } = req.body;
  const category = await Category.findById({id});
  if (category) {
    category.name == name;
    category.type == type;
    category.image == image ? image : category.image;
    const updatedCategory = await category.save();
    res.json(updatedCategory);
  } else {
    res.status(404);
    throw new Error("Error");
  }
});

module.exports = {
    createCategory,
    getCategory,
    getCategoryByType,
    updateCategory,
    deleteCategory
}
