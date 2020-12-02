const multer = require('multer')
const sharp = require('sharp')
const NodeCache = require('node-cache')
const Venture = require('../models/ventureModel')
const asyncHandler = require('../middleware/asyncHandler')
const CustomError = require('../utils/CustomError')

const cache = new NodeCache({ stdTTL: 3600, useClones: false })

const multerStorage = multer.memoryStorage()

const multerFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image')) cb(null, true)
  else cb(new CustomError('Not an image!', 400), false)
}

const upload = multer({
  limits: {
    fileSize: 5000000
  },
  storage: multerStorage,
  fileFilter: multerFilter
})

exports.initiateUpload = upload.single('image')

exports.resizeImage = asyncHandler(async (req, res, next) => {
  if (!req.file) return next()

  req.file.buffer = await sharp(req.file.buffer)
    .resize(1084, 610)
    .png({ quality: 80 })
    .toBuffer()

  next()
})

exports.getImage = asyncHandler(async (req, res, next) => {
  const imgBuffer = cache.get(`venture ${req.params.vid}`)

  if (imgBuffer) {
    res.set('Content-Type', 'image/png')
    res.send(imgBuffer)
    return
  }

  const venture = await Venture.findById(req.params.vid).select('+image')

  if (!venture)
    return next(new CustomError('No venture found with that ID!', 404))

  cache.set(`venture ${venture.id.toString()}`, venture.image)

  res.set('Content-Type', 'image/png')
  res.send(venture.image)
})

exports.createVenture = asyncHandler(async (req, res, next) => {
  const venture = await Venture.create({
    ...req.body,
    creator: req.userData.userId,
    image: req.file && req.file.buffer
  })

  res.status(201).json({
    status: 'success',
    data: venture
  })
})

exports.getAllVentures = asyncHandler(async (req, res, next) => {
  let filter = {}
  if (req.params.uid) filter = { creator: req.params.uid }

  const ventures = await Venture.find(filter)

  res.status(200).json({
    status: 'success',
    results: ventures.length,
    data: ventures
  })
})

exports.getVenture = asyncHandler(async (req, res, next) => {
  const venture = await Venture.findById(req.params.id)

  if (!venture)
    return next(new CustomError('No venture found with that ID!', 404))

  res.status(200).json({
    status: 'success',
    data: venture
  })
})

exports.deleteVenture = asyncHandler(async (req, res, next) => {
  const venture = await Venture.findById(req.params.id)

  if (!venture)
    return next(new CustomError('No venture found with that ID!', 404))

  if (venture.creator.toString() !== req.userData.userId.toString())
    return next(
      new CustomError('You are not authorized to delete this venture!', 401)
    )

  await venture.remove()

  res.status(204).json({
    status: 'success',
    data: null
  })
})

exports.updateVenture = asyncHandler(async (req, res, next) => {
  const updates = Object.keys(req.body)
  const allowedUpdates = ['title', 'description']

  const venture = await Venture.findById(req.params.id)

  if (!venture)
    return next(new CustomError('No venture found with that ID!', 404))

  const isValidOperation = updates.every((update) =>
    allowedUpdates.includes(update)
  )

  if (!isValidOperation) return next(new CustomError('Invalid updates!', 400))

  if (venture.creator.toString() !== req.userData.userId.toString())
    return next(
      new CustomError('You are not authorized to update this venture!', 401)
    )

  updates.forEach((update) => (venture[update] = req.body[update]))

  await venture.save()

  res.status(200).json({
    status: 'success',
    data: venture
  })
})
