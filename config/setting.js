let os = require('os');
let fs = require('fs');
let path = require('path');

module.exports = {
    app: {
        name: 'Integration',
        version: 'v0.01'
    },
    auth: false,
    port: '6868',
    jwt: {
        secret: 'asdl;fjl;asdjflasjkfsl;jfdl;asdfjl;asdjkflsda',
        expires: 7
    },
    platform: (function() {
        let platform = 1;
        if (os.type() == 'Linux') {
            platform = 2;
        }
        return platform;
    })(),
    mongodb: {
        name: 'Integration',
        host: '172.21.212.7',
        port: '27017'
    },
    geo_data: {
        path: path.join(__dirname, '../geo_data'),
        max_size: 500 * 1024 * 1024
    },
    visualization: {
        path: path.join(__dirname, '../visualization_service'),
        max_size: 500 * 1024 * 1024
    }
};