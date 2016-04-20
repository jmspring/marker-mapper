var socketio = require('socket.io');
var socketioclient = require('socket.io-client');

var config = require('./config/config');



var channel = {
    io: null,
    initialize: function(server) {
        io = socketio(server);
        
        var client = io
            .of('/client')
            .on('connection', function(socket) {
                // state information
                var fetchpipe = null;
                var fetchpipeconnected = false;
                var clientinfo = null;
                var statusTimeout = null;
                
                // browser-mapper socket
                // socket events
                socket.on('error', function(err) {
                    console.log('Error: ' + err);
                });
                socket.on('disconnect', function() {
                    console.log('Disconnecting from browser client.');
                    if(fetchpipe) {
                        fetchpipeconnected = false;
                        fetchpipe.disconnect();
                        fetchpipe = null;
                    }
                });

                // browser driven events
                socket.on('hello', function(data) {
                    // data is a json blob having the following structure
                    //  {
                    //      "id": "<client id>",
                    //      "lat": <latitude>,
                    //      "lon": <longitude,
                    //  }
                    console.log('Client information: ' + data);
                    clientinfo = JSON.parse(data);
                    
                    var pipeurl = 'http://' + config.fetchsvc + ':' + config.fetchport + '/points';
                    console.log('Attempting to connect to: ' + pipeurl);
                    fetchpipe = socketioclient.connect(pipeurl, {
                        'forceNew': true,
                        'reconnection': true,
                        'reconnectionDelay': 1000,
                        'reconnectionMaxDelay': 6000,
                        'reconnectionAttempts': 6
                    });
                    fetchpipe.on('connect', function() {
                        console.log('Connected to ' + pipeurl);
                        fetchpipeconnected = true;
                        fetchpipe.emit('client', data);
                        socket.emit('status');
                    });
                    fetchpipe.on('disconnect', function() {
                        console.log('Client pipe disconnected.');
                        fetchpipeconnected = false;
                    });
                    fetchpipe.on('reconnect', function() {
                        fetchpipe.emit('client', data);
                        socket.emit(status);
                    });
                    fetchpipe.on('point', function(data) {
                        console.log('Sending client point: ' + data);
                        socket.emit('point', data);
                    });
                    fetchpipe.on('done', function() {
                        console.log('Telling client done.');
                        socket.emit('done');
                        fetchpipe.disconnect();
                    });
                });
                socket.on('status', function(data) {
                    console.log('Sending browser status to fetch pipe: ' + data);
                    if(fetchpipeconnected) {
                        fetchpipe.emit('status', data)
                    }
                });
            });
    }
};

module.exports = channel;