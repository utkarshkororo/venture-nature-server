const express = require('express')
const morgan = require('morgan')

require('./mongoose')
const userRouter = require('./routes/userRoutes')
const ventureRouter = require('./routes/ventureRoutes')
const CustomError = require('./utils/CustomError')
const errorHandler = require('./middleware/errorHandler')

const app = express()

if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'))
}

app.use(express.json())
app.use(express.urlencoded({ extended: true }))

app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader(
    'Access-Control-Allow-Headers',
    'Origin, X-Requested-With, Content-Type, Accept, Authorization'
  )
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE')

  next()
})

app.use('/users', userRouter)
app.use('/ventures', ventureRouter)

app.all('*', (req, res, next) => {
  next(new CustomError(`Can't find ${req.originalUrl} on this server!`, 404))
})

app.use(errorHandler)

module.exports = app
