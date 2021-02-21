const express = require('express')
const authentication = require('./util/authentication.js')

const router = express.Router()

/* GET users listing. */
router.get('/', function (req, res, next) {
  // Authenticate
  if (!authentication.authenticate(req, res, '/login')) { return }

  console.log('test mand')
  res.send('respond with a resource')
})

module.exports = router
