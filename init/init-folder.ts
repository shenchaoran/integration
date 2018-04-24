import * as Promise from 'bluebird';
let debug = require('debug');
let initDebug = debug('Integration: Init');
let _ = require('lodash');
import * as fs from 'fs';
import * as path from 'path';

export let initFolders = (): Promise<any> => {
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

let initFolder = (fpath: string): Promise<any> => {
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
