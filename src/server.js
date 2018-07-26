const app = require('http').Server(serverHandler);
const fs = require('fs');

//require and configuring socket io
const io = require('socket.io')(app, {
    //origins: 'ticket.loc:*'
});

const port = 9000;
const indexFile = '../dist/index.html';

function serverHandler(request, response) {
    fs.readFile(`${__dirname}/${indexFile}`, (error, data) => {
        if (error) {
            response.writeHead(500);
            return response.end('Error of loading index file');
        }

        response.writeHead(200, {'Content-Type': 'text/html'});
        response.end(data);
    });
}

let connections = {};
let messages = [];

io.on('connection', socket => { //socket - interface for user and server interaction
    console.log('User connected');

    //add a new connection
    const connectionId = Math.random();
    connections[connectionId] = socket;

    //listeners
    socket.on('message', function (data, cb) {
        if (data.message === 'exit') {
            socket.disconnect();
            return;
        }

        if (connections[connectionId].readyState === socket.OPEN){
            const message = { message: data.message, user: connections[connectionId].userName };
            //similar as socket.emit('message', () => {})
            socket.broadcast.send(message);
            messages.push(message);

            cb(message);
        }
    });

    socket.on('disconnect', function () {
        console.log('User disconnected');
        delete connections[connectionId];
    });

    socket.on('error', function (error) {
        console.log(error);
    });

    socket.on('messages_load', function () {
        socket.emit('messages_loaded', messages);
    });

    socket.on('join_user', function (data) {
        if (data.userName !== null && connections[connectionId].connected) {
            connections[connectionId].userName = data.userName;

            const message = { message: `${connections[connectionId].userName} has joined the server` };
            /**
             * broadcasting messages
             * instead of socket.broadcast.send(...)
             */
            io.emit('message', message);

            messages.push(message);
        }
    });

    socket.on('detach_user', function () {
        const message = { message: `User ${connections[connectionId].userName} detached from the chat` };
        io.emit('message', message);
        messages.push(message);
    });


});


app.listen(port, function () {
    console.log(`Application is running on port ${port}`);
});
