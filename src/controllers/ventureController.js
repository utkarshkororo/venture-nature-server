const multer = require('multer')
const sharp = require('sharp')
const User = require('../models/userModel')
const Venture = require('../models/ventureModel')
const asyncHandler = require('../middleware/asyncHandler')
const AppError = require('../utils/AppError')
const cache = require('../services/cache')

const multerStorage = multer.memoryStorage()

const multerFilter = (_req, file, cb) => {
  if (file.mimetype.startsWith('image')) cb(null, true)
  else cb(new AppError('Not an image!', 400), false)
}

const upload = multer({
  limits: {
    fileSize: 5000000
  },
  storage: multerStorage,
  fileFilter: multerFilter
})

exports.initiateUpload = upload.single('image')

exports.resizeImage = asyncHandler(async (req, _res, next) => {
  if (!req.file) return next()

  req.file.buffer = await sharp(req.file.buffer)
    .resize(1084, 610)
    .png({ quality: 80 })
    .toBuffer()

  next()
})

exports.getImage = asyncHandler(async (req, res, next) => {
  const imgBuffer = cache.get(`venture ${req.params.id}`)

  if (imgBuffer) {
    res.set('Content-Type', 'image/png')
    return res.send(imgBuffer)
  }

  const venture = await Venture.findById(req.params.id).select('+image')

  if (!venture) {
    return next(new AppError('No venture found with that ID!', 404))
  }

  cache.set(`venture ${venture.id}`, venture.image)

  res.set('Content-Type', 'image/png')
  res.send(venture.image)
})

exports.createVenture = asyncHandler(async (req, res, _next) => {
  const venture = await Venture.create({
    ...req.body,
    creator: req.userData.userId,
    image: req.file?.buffer
  })

  res.status(201).json({
    data: venture
  })
})

exports.getAllVentures = asyncHandler(async (req, res, next) => {
  let filter = {}

  if (req.params.uid) {
    const user = await User.findById(req.params.uid)

    if (!user) return next(new AppError('No user found with that ID!', 404))

    filter = { creator: req.params.uid }
  }

  const ventures = await Venture.find(filter)

  res.status(200).json({
    data: ventures
  })
})

exports.getVenture = asyncHandler(async (req, res, next) => {
  const venture = await Venture.findById(req.params.id)

  if (!venture) {
    return next(new AppError('No venture found with that ID!', 404))
  }

  res.status(200).json({
    data: venture
  })
})

exports.deleteVenture = asyncHandler(async (req, res, next) => {
  const venture = await Venture.findById(req.params.id)

  if (!venture) {
    return next(new AppError('No venture found with that ID!', 404))
  }

  if (venture.creator.toString() !== req.userData.userId) {
    return next(
      new AppError('You are not authorized to delete this venture!', 401)
    )
  }

  await venture.remove()

  res.status(200).json({
    data: venture
  })
})

exports.updateVenture = asyncHandler(async (req, res, next) => {
  const updates = Object.keys(req.body)
  const allowedUpdates = ['title', 'description']

  const venture = await Venture.findById(req.params.id)

  if (!venture) {
    return next(new AppError('No venture found with that ID!', 404))
  }

  const isValidOperation = updates.every((update) =>
    allowedUpdates.includes(update)
  )

  if (!isValidOperation) return next(new AppError('Invalid updates!', 400))

  if (venture.creator.toString() !== req.userData.userId) {
    return next(
      new AppError('You are not authorized to update this venture!', 401)
    )
  }

  updates.forEach((update) => (venture[update] = req.body[update]))

  await venture.save()

  res.status(200).json({
    data: venture
  })
})
