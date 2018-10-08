let io = require('socket.io');

let WebSocketCtrl = {
    init: (server, app) => {
        this.server = server;
        this.app = app;

        io = io(server);
        let taskServer = io.of('/integrate/task');
        app.websocket = {
            io: io,
            taskServer: taskServer
        };
        taskServer.on('connection',function (socket) {
            console.log('------------------------------a new client connected------------------------------');
    
            socket.on('dispatch room',function (taskID) {
                socket.join(taskID);
            });
    
            socket.on('message',function (msg) {
                console.log(msg);
            });
    
            socket.on('disconnect',function () {
                console.log('------------------------------a client disconnected------------------------------');
            });
        });
    },

    emit: (room, eventName, emitMsg, cb) => {
        console.log(eventName, ':', emitMsg);
        this.app.websocket.taskServer.in(room).emit(eventName,emitMsg);
    }
};

module.exports = WebSocketCtrl;