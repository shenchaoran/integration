let express = require('express');
let logger = require('morgan');
let cookieParser = require('cookie-parser');
let bodyParser = require('body-parser');
let compression = require('compression');
let expressValidator = require('express-validator');
let session = require('express-session');
let jwt = require('jwt-simple');
let path = require('path');
let favicon = require('serve-favicon');
let setting = require('../config/setting');

module.exports = (app) => {
    app.set("views", path.join(__dirname, "../views"));
    app.set("view engine", "ejs");
    // 私钥
    app.set('jwtTokenSecret', setting.jwt.secret)
        // 压缩网页
    app.use(compression());
    // 打印到调试控制台
    app.use(logger('dev'));
    app.use(bodyParser.json({limit: '50mb'}));
    app.use(bodyParser.urlencoded({limit: '50mb', extended: true}));
    // // 解析json格式的http请求体，通过req.body使用
    // app.use(bodyParser.json());
    // // 解析文本格式的http请求体，通过req.body使用
    // app.use(bodyParser.urlencoded({ extended: true }));
    // 验证用户提交的数据，通过req.checkBody, checkParams, checkQuery ...使用
    app.use(expressValidator());
    // 处理session的中间件，通过req.session使用
    // router.use(session({
    //     resave: true,
    //     saveUninitialized: true,
    //     secret: process.env.session_secret,
    //     cookie: { maxAge: 3600000 * 2}
    //     // store: new MongoStore({
    //     //   url: process.env.MONGODB_URI || process.env.MONGOLAB_URI,
    //     //   autoReconnect: true
    //     // })
    //   }));

    // 解析cookie，通过req.cookies使用
    app.use(cookieParser());

    // favicon
    app.use(favicon(path.join(__dirname, '..', 'public/images/favicon.png')));

    // 加载静态资源中间件，前后端分离就不要了
    app.use('/integration', express.static(path.join(__dirname, '..', 'public')));
    app.use('/visualization', express.static(path.join(__dirname, '../visualization_service')));

    // all cross origin
    app.all('*', function(req, res, next) {
        // TODO 为防止CSRF攻击，应设置为前端所在的域名
        res.header('Access-Control-Allow-Origin', '*');
        res.header(
            'Access-Control-Allow-Headers',
            'Content-Type,Content-Length, Authorization, Accept,X-Requested-With'
        );
        res.header(
            'Access-Control-Allow-Methods',
            'PUT,POST,GET,DELETE,OPTIONS'
        );
        if (req.method == 'OPTIONS') {
            // 预检请求直接返回
            return res.sendStatus(200);
        } else {
            return next();
        }
    });
}