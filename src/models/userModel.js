const mongoose = require('mongoose')
const { isEmail } = require('validator')
const bcrypt = require('bcryptjs')

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      validate: isEmail
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
    toJSON: {
      virtuals: true,
      versionKey: false,
      transform: (_doc, ret) => {
        delete ret._id
        delete ret.password
        delete ret.avatar
      }
    },
    toObject: {
      virtuals: true,
      versionKey: false,
      transform: (_doc, ret) => {
        delete ret._id
        delete ret.password
        delete ret.avatar
      }
    }
  }
)

userSchema.virtual('ventures', {
  ref: 'Venture',
  localField: '_id',
  foreignField: 'creator'
})

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next()

  this.password = await bcrypt.hash(this.password, 10)

  next()
})

userSchema.methods.correctPassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password)
}

userSchema.pre('remove', async function (next) {
  await this.model('Venture').deleteMany({ creator: this.id })
  next()
})

const User = mongoose.model('User', userSchema)

module.exports = User
