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
    var markerpath = (process.env.MARKER_PATH == null ? '' : process.env.MARKER_PATH)

    res.render('map', { 
        mapdata: {
            clientid: uuid.v4(),
            key: config.mapkey,
            lat: config.locations[config.defaultLocation].lat,
            lon: config.locations[config.defaultLocation].lon,            
        },
        host: {
            container: process.env.HOSTNAME,
            agentip: process.env.HOST,
            agentport: process.env.PORT0
        },
        markerdata: {
            path: markerpath  
        }
    });
});

module.exports = router;
