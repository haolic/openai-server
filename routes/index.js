var express = require('express');
// var path = require('path');
var router = express.Router();

router.get('/', function (req, res) {
  res.type('html');
  res.sendFile('/index.html');
});

module.exports = router;
