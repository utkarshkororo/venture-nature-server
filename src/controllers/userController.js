const multer = require('multer')
const sharp = require('sharp')
const NodeCache = require('node-cache')
const asyncHandler = require('../middleware/asyncHandler')
const User = require('../models/userModel')
const CustomError = require('../utils/CustomError')

const cache = new NodeCache({ stdTTL: 3600, useClones: false })

const multerStorage = multer.memoryStorage()

const multerFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image')) cb(null, true)
  else cb(new CustomError('Not an image!', 400), false)
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
  const imgBuffer = cache.get(`user ${req.params.uid}`)

  if (imgBuffer) {
    res.set('Content-Type', 'image/png')
    res.send(imgBuffer)
    return
  }

  const user = await User.findById(req.params.uid).select('+avatar')

  if (!user) return next(new CustomError('No user found with that ID!', 404))

  cache.set(`user ${user.id.toString()}`, user.avatar)

  res.set('Content-Type', 'image/png')
  res.send(user.avatar)
})

exports.getAllUsers = asyncHandler(async (req, res, next) => {
  const users = await User.find({})

  res.status(200).json({
    status: 'success',
    results: users.length,
    data: users
  })
})
