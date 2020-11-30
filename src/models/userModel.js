const mongoose = require('mongoose')
const validator = require('validator')
const bcrypt = require('bcryptjs')

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
      required: true
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      validate: validator.isEmail
    },
    password: {
      type: String,
      required: true,
      minlength: 8,
      select: false
    },
    avatar: {
      type: Buffer,
      required: true,
      select: false
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
)

userSchema.virtual('ventures', {
  ref: 'Venture',
  localField: '_id',
  foreignField: 'creator'
})

userSchema.methods.toJSON = function () {
  const obj = this.toObject()
  delete obj.password
  delete obj.avatar
  return obj
}

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next()

  this.password = await bcrypt.hash(this.password, 10)

  next()
})

userSchema.methods.correctPassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password)
}

userSchema.pre('remove', async function (next) {
  await this.model('Venture').deleteMany({ creator: this._id })
  next()
})

const User = mongoose.model('User', userSchema)

module.exports = User
