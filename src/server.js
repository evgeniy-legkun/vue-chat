const app = require('http').Server(serverHandler);
const io = require('socket.io')(app);
const fs = require('fs');

app.listen(9000);

const indexFile = 'main.js';

function serverHandler(request, response) {
    fs.readFile(`${__dirname}/${indexFile}`, (error, data) => {
        if (error) {
            response.writeHead(500);
            return response.end('Error of loading index file');
        }

        response.writeHead(200);
        response.end(data);
    });
}

let clients = {};

//configuring
io.set('origins', 'ticket.loc:*'); // return 403 error for not allowed resources


io.on('connection', socket => {
    //add new client
    const clientId = Math.random();
    clients[clientId] = socket;

    //listeners
    socket.on('join', function (data) {
        if (data.clientName !== null) {
            clients[clientId].name = data.clientName;
            console.log('client name ', clients[clientId].name);
            socket.broadcast.send({ message: `${clients[clientId].name} has joined the server !` });
            return;
        }

        socket.close();
    });

    socket.on('message', function (data, cb) {
        if (data.message === 'exit') {
            socket.conn.close();
            return;
        }

        if (clients[clientId].readyState === socket.OPEN){
            const message = { message: data.message, user: clients[clientId].name };

            //similar as socket.emit('message', () => {})
            socket.broadcast.send({ message: data.message, user: clients[clientId].name });
            cb(message);
        }
    });

    socket.on('disconnect', function () {
        socket.emit('error', { message: 'user disconnected' });
        delete clients[clientId];
    });

    socket.on('error', function (error) {
        console.log(`Server error - ${error.message}`);
    });
});
