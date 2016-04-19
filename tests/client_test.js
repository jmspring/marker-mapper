var io = require('socket.io-client');
var uuid = require('node-uuid');

console.log(io);

var info = {
    id: uuid.v4(),
    lat: 39.2616, 
    lon: -121.0161
};
var markerseq = 0;

var client = io.connect('http://localhost:3000/client');
client.on('connect', function() {    
    client.emit('hello', JSON.stringify(info));
}); 
client.on('status', function() {
    client.emit('status', JSON.stringify( { markerseq: markerseq } ));
});
client.on('point', function(info) {
    console.log("Got point: " + info);
    markerseq++;
});
    
function wait () {
   setTimeout(wait, 1000);
}
wait();    