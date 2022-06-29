const jwt = require('jsonwebtoken')
const User = require('../models/userModel')
const asyncHandler = require('../middleware/asyncHandler')
const AppError = require('../utils/AppError')

const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN
  })
}

exports.signup = asyncHandler(async (req, res, _next) => {
  const user = await User.create({
    ...req.body,
    avatar: req.file?.buffer
  })

  const token = signToken(user.id)

  res.status(201).json({
    token,
    data: user
  })
})

exports.login = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body

  if (!email || !password) {
    return next(new AppError('Please provide email and password', 400))
  }

  const user = await User.findOne({ email }).select('+password')

  if (!user || !(await user.correctPassword(password))) {
    return next(new AppError('Incorrect email or password', 401))
  }

  const token = signToken(user.id)

  res.status(200).json({
    token,
    data: user
  })
})

exports.protect = asyncHandler(async (req, _res, next) => {
  const token =
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer ') &&
    req.headers.authorization.replace('Bearer ', '')

  if (!token) return next(new AppError('Authentication failed!', 401))

  const { id } = jwt.verify(token, process.env.JWT_SECRET)

  req.userData = { userId: id }
  next()
})
