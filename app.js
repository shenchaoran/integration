const _ = require('lodash');
const preReqMid = require('./middlewares/pre-request.middleware');
const postResMid = require('./middlewares/post-response.middleware');
const express = require('express');
const app = express();
const path = require('path');
const util = require('util');
const http = require('http');
var createError = require('http-errors');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
const debug = require('debug');
const serverDebug = debug('Integration: Server');
const initDebug = debug('Integration: Init');

var indexRouter = require('./routes/index');
var setting = require('./config/setting');
var WebSocketCtrl = require('./controllers/web-socket.controller');
// scr
let init = require('./init');
// 

init()
    .then(() => {
        //////////////////////////////////////router
        // (<any>global).app = app;
        app.set('port', setting.port || 3000);

        // pre-request
        preReqMid(app);
        // request/response
        app.use('/', indexRouter);
        // post-response
        postResMid(app);
        //////////////////////////////////////
        const server = http.createServer(app);
        WebSocketCtrl.init(server, app);
        server.listen(app.get('port'));
        server.on('error', (error) => {
            const port = app.get('port');
            if (error.syscall !== 'listen') {
                throw error;
            }

            const bind = typeof port === 'string' ? 'Pipe ' + port : 'Port ' + port;

            // handle specific listen errors with friendly messages
            switch (error.code) {
                case 'EACCES':
                    console.error(bind + ' requires elevated privileges');
                    process.exit(1);
                    break;
                case 'EADDRINUSE':
                    console.error(bind + ' is already in use');
                    process.exit(1);
                    break;
                default:
                    throw error;
            }
        });
        server.on('listening', () => {
            const addr = server.address();
            const bind =
                typeof addr === 'string' ?
                'Pipe: ' + addr :
                'Port: ' + addr.port;
            serverDebug(bind);
        });
    });


module.exports = app;