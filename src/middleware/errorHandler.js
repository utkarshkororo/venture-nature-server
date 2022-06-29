const AppError = require('../utils/AppError')

const errorHandler = (err, _req, res, _next) => {
  let error = { ...err }

  error.message = err.message

  error.statusCode = error.statusCode || 500
  error.status = error.status || 'error'

  // Mongoose Bad ObjectId
  if (err.name === 'CastError') {
    error = new AppError(`Resource not found`, 404)
  }

  // Mongoose Duplicate key
  if (err.code === 11000) {
    error = new AppError(`Duplicate field value entered`, 400)
  }

  // Mongoose Validation error
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors).map(({ message }) => message)
    error = new AppError(message, 400)
  }

  res.status(error.statusCode).json({
    status: error.status,
    message: error.message
  })
}

module.exports = errorHandler
