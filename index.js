const express = require('express');
const path = require('path');

const app = express(),
    http = require('http').Server(app),
    io = require('socket.io')(http),
    port = process.env.PORT || 5000;

// Serve static files from the React app
app.use(express.static(path.join(__dirname, 'client/build')));

// Put all API endpoints under '/api'
app.get('/api/data', (req, res) => {
    res.json({users: [
            {username: 'John', id: 251},
            {username: 'Jane', id: 904}
        ]});
    console.log(`request /api/data`);
});

app.get('/api/file.dxf', (req, res) => {
    res.sendFile(path.join(__dirname+'/dxf/sample20-ok.dxf'));
    console.log(`request /api/file.dxf`);
});


// The "catchall" handler: for any request that doesn't
// match one above, send back React's index.html file.
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname+'/client/build/index.html'));
});

io.on('connection', function(socket) {
    socket.emit('welcome', {hello: 'there'});

    socket.on('update-delta', function(delta) {
        //send to all
        // io.emit('update-delta', delta);

        //send to all, except sender
        socket.broadcast.emit('update-delta', delta);
    });

    socket.on('update-camera', function(camera) {
        socket.broadcast.emit('update-camera', camera);
    });
});

http.listen(port, function () {
    console.log(`Server running at localhost:${port}`);
});
