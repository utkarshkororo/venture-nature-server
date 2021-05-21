const express = require('express')
const { protect } = require('../controllers/authController')
const {
  getAllVentures,
  getVenture,
  deleteVenture,
  updateVenture,
  initiateUpload,
  resizeImage,
  createVenture,
  getImage
} = require('../controllers/ventureController')

const router = express.Router({ mergeParams: true })

router.get('/:id/image', getImage)

router
  .route('/')
  .get(getAllVentures)
  .post(protect, initiateUpload, resizeImage, createVenture)

router
  .route('/:id')
  .get(getVenture)
  .patch(protect, updateVenture)
  .delete(protect, deleteVenture)

module.exports = router
