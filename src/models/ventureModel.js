const mongoose = require('mongoose')
const geocoder = require('../utils/geocoder')

const ventureSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String,
      required: true
    },
    address: {
      type: String,
      required: true
    },
    location: {
      //? GeoJSON Point
      type: {
        type: String,
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
    timestamps: true
  }
)

ventureSchema.index({ location: '2dsphere' })

ventureSchema.methods.toJSON = function () {
  const obj = this.toObject()
  delete obj.image
  return obj
}

//* Geocode & create location field
ventureSchema.pre('save', async function (next) {
  if (!this.isModified('address')) return next()

  const loc = await geocoder.geocode(this.address)

  this.location = {
    type: 'Point',
    coordinates: [loc[0].longitude, loc[0].latitude],
    formattedAddress: loc[0].formattedAddress,
    street: loc[0].streetName,
    city: loc[0].city,
    state: loc[0].stateCode,
    zipcode: loc[0].zipcode,
    country: loc[0].countryCode
  }

  next()
})

const Venture = mongoose.model('Venture', ventureSchema)

module.exports = Venture
