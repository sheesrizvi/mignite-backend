const express = require('express')
const {  
    createBanner,
    listBanners,
    deleteBanner, 
    updateBanner,
    deleteBannerImage} = require('../controller/bannerController.js')
const router = express.Router();

router.route('/create-banner').post(createBanner)
router.route('/delete-banner').delete(deleteBanner)
router.route('/list-banner').get(listBanners)
router.route('/post-banner').post(updateBanner)
router.route('/delete-banner-image').delete(deleteBannerImage)

module.exports = router