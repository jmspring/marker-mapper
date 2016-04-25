var uuid = require('node-uuid');
var express = require('express');
var router = express.Router();

var config = require('../config/config');

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});


/* GET Map page. */
router.get('/map', function(req,res) {
    var db = req.db;
    console.log("\n\n\n\n\n");
    console.log(process.env);
    console.log("\n\n\n\n\n");
    res.render('map', { 
        mapdata: {
            clientid: uuid.v4(),
            key: config.mapkey,
            lat: config.locations[config.defaultLocation].lat,
            lon: config.locations[config.defaultLocation].lon,            
        },
        host: {
            name: process.env.AGENT_HOSTNAME
        }
    });
});

module.exports = router;
