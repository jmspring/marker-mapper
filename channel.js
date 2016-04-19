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
                var clientpipe;
                var pipeconnected = false;
                socket.on('hello', function(data) {
                    // data is a json blob having the following structure
                    //  {
                    //      "id": "<client id>",
                    //      "lat": <latitude>,
                    //      "lon": <longitude,
                    //  }
                    console.log("Client information: " + data);
                    
                    // now open pipe to data service
                    clientpipe = socketioclient.connect('http://' + config.fetchsvc + ':' + config.fetchport + '/points');
                    clientpipe.on('connect', function() {
                        console.log("Connected to client pipe.");
                        pipeconnected = true;
                        clientpipe.emit('client', data);
                        socket.emit('status');
                    });
                    clientpipe.on('point', function(data) {
                        console.log("Sending client point: " + data);
                        socket.emit('point', data);
                    });
                    clientpipe.on('disconnect', function() {
                        console.log("Client pipe disconnected.");
                        pipeconnected = false;
                    });
                });
                socket.on('status', function(data) {
                    console.log("Sending status to client pipe: " + data);
                    if(pipeconnected) {
                        clientpipe.emit('status', data)
                    } else {
                        setTimeout(function() {
                            socket.emit('status')
                        }, 500);
                    }
                });
                socket.on('disconnect', function() {
                    if(clientpipe) {
                        clientpipe.disconnect();
                        clientpipe = null;
                        pipeconnected = false;
                    }
                });
            });
    }
};

module.exports = channel;