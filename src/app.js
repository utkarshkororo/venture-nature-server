const express = require('express')
const cors = require('cors')
const morgan = require('morgan')
require('./services/db')
const userRouter = require('./routes/userRoutes')
const ventureRouter = require('./routes/ventureRoutes')
const AppError = require('./utils/AppError')
const errorHandler = require('./middleware/errorHandler')

const app = express()

app.set('port', process.env.PORT)

app.use(cors())
app.options('*', cors())

if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'))
}

app.use(express.json())
app.use(express.urlencoded({ extended: true }))

app.use('/users', userRouter)
app.use('/ventures', ventureRouter)

app.all('*', (req, _res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404))
})

app.use(errorHandler)

module.exports = app
