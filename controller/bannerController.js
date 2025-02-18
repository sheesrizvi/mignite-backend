const Banner = require('../models/bannerModel.js')
const asyncHandler = require('express-async-handler')
const { S3Client } = require("@aws-sdk/client-s3")
const { DeleteObjectCommand } = require("@aws-sdk/client-s3")

const config = {
    region: process.env.AWS_BUCKET_REGION,
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY,
      secretAccessKey: process.env.AWS_SECRET_KEY,
    },
  };
  
  const s3 = new S3Client(config);
  

const createBanner = asyncHandler(async (req, res) => {
    const { title, images, type } = req.body
    
    if (!title || !images || images.length === 0) {
        return res.status(400).send({ message: 'Title and Images are required' })
    }


    const newBanner = await Banner.create({
        title,
        images,
        type
    })

    res.status(200).send({ message: 'Banner created successfully', banner: newBanner })
})

const updateBanner = asyncHandler(async (req, res) => {
  
    const { id, title, images, type } = req.body

    if (!title || !images || images.length === 0) {
        return res.status(400).send({ message: 'Title and Images are required' })
    }

    const banner = await Banner.findById(id)

    if (!banner) {
        return res.status(404).send({ message: 'Banner not found' })
    }

    banner.title = title || banner.title
    banner.images = images || banner.images
    banner.type = type || banner.type

    const updatedBanner = await banner.save()

    res.status(200).send({ message: 'Banner updated successfully', banner: updatedBanner })
})

const listBanners = asyncHandler(async (req, res) => {
    const { type = "Banner" } = req.query
    const banners = await Banner.find({ type })
    if (!banners || banners.length === 0) {
        return res.status(400).send({ message: 'Banner not found' })
    }
    res.status(200).send({ message: 'Banner found successfully', banners })
})

const deleteBanner = asyncHandler(async (req, res) => {
    const { id } = req.query
    const banner = await Banner.findOneAndDelete({ _id: id })
    if (!banner) {
        return res.status(400).send({ message: 'Banner not found' })
    }

    res.status(200).send({ message: 'Banner deleted successfully' })
})


const deleteBannerImage = async (req, res) => {
    const { bannerId } = req.query; 
  
    try {
        
       const banner = await Banner.findByIdAndDelete(bannerId)
       const fileName = banner.images.split("//")[1].split("/")[1];

       const command = new DeleteObjectCommand({
          Bucket: process.env.AWS_BUCKET,
          Key: fileName,
        });
      
       const result = await s3.send(command);
      

      res.status(200).json({ message: 'Image deleted successfully', banner });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  };
  

module.exports = {
    createBanner,
    listBanners,
    deleteBanner,
    updateBanner,
    deleteBannerImage
}
