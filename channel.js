var socketio = require('socket.io');
var socketioclient = require('socket.io-client');
var request = require('request');

var config = require('./config/config');

var RETRY_ATTEMPTS = 15;
var RETRY_DELAY = 1000;
var RETRY_MAX_DELAY = 3000;

function initiate_pipe_reconnect(pipe) {
    var retry_pipe = pipe;
    
    if(retry_pipe.retry_attempts > 0) {
        retry_pipe.retry_attempts--;
        var delay = (RETRY_ATTEMPTS - retry_pipe.retry_attempts) * RETRY_DELAY;
        if(delay > RETRY_MAX_DELAY) {
            delay = RETRY_MAX_DELAY;
        }

        console.log('scheduling retry: ' + delay / 1000 + 'secs');
        retry_pipe.timer = setTimeout(function() {
            retry_pipe.timer = null;
            retry_pipe.connect(function(err) {
                if(err) {
                    initiate_pipe_reconnect(retry_pipe);
                }
            });
        }, delay);
    } else {
        retry_pipe.timer = null;
        retry_pipe.mark_dead();
    }
}


var fetch_pipe = {
    connected: false,
    cookies: null,
    baseurl: null,
    fetchurl: null,
    pipe: null,
    emit_socket: null,
    clientinfo: null,
    done: false,
    retry_timer: null,
    retry_attempts: RETRY_ATTEMPTS,
    
    initialize: function(host, port, socket, clientinfo) {
        this.baseurl = 'http://' + host + ':' + port;
        this.fetchurl = this.baseurl + '/points'
        this.emit_socket = socket;
        this.clientinfo = clientinfo;
    },
    
    connect: function(callback) {
        this.connected = false;
        if(this.retry_timer) {
            clearTimeout(this.retry_timer);
        }
            
        var pipe = this;
        request
            .get(pipe.baseurl)
            .on('response', function(res) {
                console.log("\n\n------------------------------------------------");
                console.log(res.headers);
                console.log("------------------------------------------------\n\n");
                if (res.headers && res.headers['set-cookie'] && res.headers['set-cookie'].length > 0) {
                    pipe.cookies = res.headers['set-cookie'].join(';');
                }
                
                if(pipe.cookies) {
                    console.log('setting pipe up with cookies.');
                    console.log('cookies -- ' + pipe.cookies);
                    pipe.pipe = socketioclient.connect(pipe.fetchurl, {
                        'reconnection': false,
                        'extraHeaders': {
                            'Cookie': pipe.cookies
                        }
                    });
                } else {
                    console.log('setting pipe up without cookies.');
                    pipe.pipe = socketioclient.connect(pipe.fetchurl, {
                        'reconnection': false
                    });
                }
                pipe.pipe.on('connect', function() {
                    console.log('fetch pipe connected.');
                    pipe.connected = true;
                    pipe.retry_attempts = RETRY_ATTEMPTS
                    pipe.pipe.emit('client', JSON.stringify(pipe.clientinfo));
                    pipe.emit_socket.emit('status');
                });
                pipe.pipe.on('disconnect', function() {
                    console.log('fetch pipe disconnected.');
                    if(pipe.connected) {
                        pipe.connected = false;
                    }
                    if(!pipe.done) {
                        console.log('fetch pipe attempting to reconnect.');
                        if(!pipe.retry_timer) {
                            initiate_pipe_reconnect(pipe);
                        } else {
                            console.log('fetch pipe retry timer already in process');
                        }   
                    } else {
                        console.log('fetch pipe done, no need to reconnect.');
                        if(pipe.retry_timer) {
                            clearTimeout(pipe.retry_timer);
                            pipe.retry_timer = null;
                        }
                    }
                });
                pipe.pipe.on('point', function(pdata) {
                    console.log('sending client point: ' + pdata);
                    pipe.emit_socket.emit('point', pdata);
                });
                pipe.pipe.on('done', function() {
                    console.log('telling client done.');
                    pipe.done = true;
                    pipe.emit_socket.emit('done');
                    pipe.pipe.disconnect();
                });
            })
            .on('end', function() {
                callback();
            })
            .on('error', function(err) {
                callback(err);
            });
    },
    
    disconnect: function(teardown) {
        if(this.pipe != null) {
            if(teardown) {
                this.done = true;
            }
            this.connected = false;
            this.pipe.disconnect();
        }
    },
    
    emit: function(topic, data) {
        if(this.pipe != null && this.connected) {
            if(data) {
                this.pipe.emit(topic, data);
            } else {
                this.pipe.emit(topic);
            }
        }
    },
    
    mark_dead: function() {
        console.log('marking pipe dead.  telling client done.');
        if(this.emit_socket) {
            this.emit_socket.emit('done');
        }  
    }
}

function get_fetch_pipe(host, port, socket, clientinfo) {
    var pipe = Object.create(fetch_pipe);
    pipe.initialize(host, port, socket, clientinfo);
    return pipe;
}

var channel = {
    io: null,
    initialize: function(server) {
        io = socketio(server);
        
        var client = io
            .of('/client')
            .on('connection', function(socket) {
                // state information
                var fetchpipe = null;
                var clientinfo = null;
                
                // browser-mapper socket
                // socket events
                socket.on('error', function(err) {
                    console.log('Error: ' + err);
                });
                socket.on('disconnect', function() {
                    console.log('Disconnecting from browser client.');
                    if(fetchpipe) {
                        fetchpipe.disconnect(true);
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
                    
                    fetchpipe = get_fetch_pipe(config.fetchsvc, config.fetchport, socket, clientinfo);
                    if(fetchpipe) {
                        fetchpipe.connect(function(err) {
                            socket.on('status', function(sdata) {
                                console.log('Sending browser status to fetch pipe: ' + sdata);
                                if(fetchpipe) {
                                    fetchpipe.emit('status', sdata)
                                }
                            });
                        });
                    }
                });
            });
    }
};

module.exports = channel;