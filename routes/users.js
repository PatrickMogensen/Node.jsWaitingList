const express = require('express');
const authentication = require("/Users/patrickmogensen/IdeaProjects/SWK2020/Node.jsWaitingList/util/authentication.js");

const router = express.Router();

/* GET users listing. */
router.get('/', function(req, res, next) {

  // Authenticate
  if (!authentication.authenticate(req, res, "/login")){return;}


  console.log("test mand");
  res.send('respond with a resource');
});





module.exports = router;
