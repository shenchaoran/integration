let os = require('os');
let exec = require('child_process').exec;
let setting = require('../config/setting');

let IPCtrl = {};
module.exports = IPCtrl;

IPCtrl.getLocalIP = function (cb) {
    return new Promise((resolve, reject) => {
        //windows disk
        if (setting.platform == 1) {
            let hasFind = false;
            let interfaces = os.networkInterfaces();
            let IPv4 = '127.0.0.1';
            if (interfaces['本地连接']) {
                interfaces['本地连接'].forEach(function (details) {
                    if (details.family == 'IPv4') {
                        if (details.address != '127.0.0.1') {
                            IPv4 = details.address;
                            hasFind = true;
                            return resolve(IPv4);
                        }
                    }
                });
            }
            for (let key in interfaces) {
                if (
                    key.match(/\s*vmware\s*network\s*adapter/i) ||
                    key.match(/\s*vethernet/i)
                )
                    continue;
                let alias = 0;
                interfaces[key].forEach(function (details) {
                    if (details.family == 'IPv4') {
                        if (details.address != '127.0.0.1') {
                            // if (
                            //     details.address.indexOf('10.') == 0
                            // ) {
                            IPv4 = details.address;
                            hasFind = true;
                            return resolve(IPv4);
                            // }
                        }
                    }
                });
            }
            if (!hasFind) {
                return reject();
            }
        } else if (setting.platform == 2) {
            //TODO get ip of linux
        }
    });
};