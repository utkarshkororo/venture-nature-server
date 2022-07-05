const axios = require('axios')

const geocoder = axios.create({
  baseURL: `https://www.mapquestapi.com/geocoding/v1/address`,
  params: {
    key: process.env.GEOCODING_API_KEY,
    maxResults: 1,
    thumbMaps: false
  }
})

const geocode = async (location) => {
  const {
    data: {
      results: [
        {
          locations: [
            {
              latLng: { lat, lng },
              adminArea1: country,
              adminArea3: state,
              adminArea5: city,
              street,
              postalCode: zipcode
            }
          ]
        }
      ]
    }
  } = await geocoder({
    params: {
      location
    }
  })

  return {
    lat,
    lng,
    country,
    state,
    city,
    street,
    zipcode,
    address: [street, city, `${state} ${zipcode}`.trim(), country]
      .filter(Boolean)
      .join(', ')
  }
}

module.exports = {
  geocoder,
  geocode
}
