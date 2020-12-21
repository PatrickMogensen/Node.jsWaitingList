const express = require('express');
const authentication = require("/Users/patrickmogensen/IdeaProjects/SWK2020/Node.jsWaitingList/util/authentication.js");

const router = express.Router();

/* GET users listing. */
router.get('/login', function(req, res, next) {
    res.sendfile('public/login.html');
});





module.exports = router;
