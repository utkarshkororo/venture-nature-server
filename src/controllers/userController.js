const multer = require('multer')
const sharp = require('sharp')
const User = require('../models/userModel')
const asyncHandler = require('../middleware/asyncHandler')
const AppError = require('../utils/AppError')
const cache = require('../services/cache')

const multerStorage = multer.memoryStorage()

const multerFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image')) cb(null, true)
  else cb(new AppError('Not an image!', 400), false)
}

const upload = multer({
  limits: {
    fileSize: 2000000
  },
  storage: multerStorage,
  fileFilter: multerFilter
})

exports.initiateUpload = upload.single('avatar')

exports.resizeAvatar = asyncHandler(async (req, res, next) => {
  if (!req.file) return next()

  req.file.buffer = await sharp(req.file.buffer)
    .resize(500, 500)
    .png({ quality: 90 })
    .toBuffer()

  next()
})

exports.getAvatar = asyncHandler(async (req, res, next) => {
  const imgBuffer = cache.get(`user ${req.params.id}`)

  if (imgBuffer) {
    res.set('Content-Type', 'image/png')
    res.send(imgBuffer)
    return
  }

  const user = await User.findById(req.params.id).select('+avatar')

  if (!user) return next(new AppError('No user found with that ID!', 404))

  cache.set(`user ${user.id}`, user.avatar)

  res.set('Content-Type', 'image/png')
  res.send(user.avatar)
})

exports.getAllUsers = asyncHandler(async (req, res, next) => {
  const users = await User.find({}).populate('ventures')

  res.status(200).json({
    status: 'success',
    results: users.length,
    data: users
  })
})
