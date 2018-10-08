let Promise = require('bluebird');
let debug = require('debug');
let initDebug = debug('Integration: Init');
let _ = require('lodash');
let fs = require('fs');
let path = require('path');

let initFolder = (fpath) => {
    return new Promise((resolve, reject) => {
        fs.stat(fpath, (err, stats) => {
            if (err) {
                initDebug(err);
                if (err.code === 'ENOENT') {
                    fs.mkdir(fpath, err => {
                        if (err) {
                            return reject(err);
                        } else {
                            return resolve();
                        }
                    });
                } else {
                    return reject(err);
                }
            } else {
                if (stats.isDirectory()) {
                    return resolve();
                } else {
                    fs.mkdir(fpath, err => {
                        if (err) {
                            initDebug(err);
                            return reject(err);
                        } else {
                            return resolve();
                        }
                    });
                }
            }
        });
    });
};

module.exports = () => {
    let folders = ['geo_data'];
    return new Promise((resolve, reject) => {
        Promise.all(_.map(folders, initFolder))
            .then(rsts => {
                return resolve();
            })
            .catch(error => {
                return reject(error);
            });
    });
};