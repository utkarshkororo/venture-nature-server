const express = require('express')
const { signup, login } = require('../controllers/authController')
const {
  initiateUpload,
  resizeAvatar,
  getAllUsers,
  getAvatar
} = require('../controllers/userController')
const ventureRouter = require('./ventureRoutes')

const router = express.Router()

router.use('/:uid/ventures', ventureRouter)

router.get('/:id/avatar', getAvatar)

router.post('/signup', initiateUpload, resizeAvatar, signup)
router.post('/login', login)

router.route('/').get(getAllUsers)

module.exports = router
