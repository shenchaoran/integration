// import { connect2MSC } from './connect-MSC';
// import { initUser } from './init-user';
let initFolders = require('./init-folder');
let IPUtil = require('../utils/ip.utils');
let setting = require('../config/setting');
let Promise = require('bluebird');
let VisualizationDB = require('../controllers/visualization.controller');

module.exports = () => {
    return new Promise((resolve, reject) => {
        Promise.all([
            // connect2MSC(), 
            // initUser(),
            IPUtil.getLocalIP()
                .then(ip => {
                    global.centerHost = ip;
                    global.centerPort = setting.port;
                    global.taskInstanceColl = [];
                    return Promise.resolve();
                }),
            initFolders(),
            VisualizationDB.batchDeploy()
                .catch(e => {
                    return Promise.resolve();
                })
        ])
            .then((rsts) => {
                return resolve(rsts);
            })
            .catch(err => {
                return reject(err);
            })
    });
}