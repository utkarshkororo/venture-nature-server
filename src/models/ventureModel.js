const mongoose = require('mongoose')
const { geocode } = require('../services/geocoder')

const ventureSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String,
      required: true,
      trim: true
    },
    address: {
      type: String,
      required: true,
      trim: true
    },
    location: {
      // GeoJSON Point
      type: {
        type: String,
        default: 'Point',
        enum: ['Point']
      },
      coordinates: [Number],
      formattedAddress: String,
      street: String,
      city: String,
      state: String,
      zipcode: String,
      country: String
    },
    image: {
      type: Buffer,
      required: true,
      select: false
    },
    creator: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: true
    }
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      versionKey: false,
      transform: (_doc, ret) => {
        delete ret._id
        delete ret.image
      }
    },
    toObject: {
      virtuals: true,
      versionKey: false,
      transform: (_doc, ret) => {
        delete ret._id
        delete ret.image
      }
    }
  }
)

ventureSchema.index({ location: '2dsphere' })

// Geocode & create location field
ventureSchema.pre('save', async function (next) {
  if (!this.isModified('address')) return next()

  const {
    lat,
    lng,
    country,
    state,
    city,
    street,
    zipcode,
    address: formattedAddress
  } = await geocode(this.address)

  this.location = {
    type: 'Point',
    coordinates: [lng, lat],
    formattedAddress,
    street,
    city,
    state,
    zipcode,
    country
  }

  next()
})

const Venture = mongoose.model('Venture', ventureSchema)

module.exports = Venture
