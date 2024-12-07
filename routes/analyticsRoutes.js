const express = require('express')
const { shareDashboardData } = require('../controller/analyticsController')

const router = express.Router()

router.get('/get-dashboard-data', shareDashboardData)

module.exports = router