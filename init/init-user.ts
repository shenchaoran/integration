import { userDB } from '../models/user.model';
import * as Promise from 'bluebird';
let debug = require('debug');
let initDebug = debug('Integration: Init');

export let initUser = (): Promise<any> => {
    return new Promise((resolve, reject) => {
        userDB.find({ username: 'Admin' })
            .then(user => {
                if (user.length >= 1) {
                    initDebug('Init account succeed!');
                    return resolve('initUser');
                } else {
                    userDB.insert({
                        username: 'Admin',
                        password: '123456',
                        email: 'shenchaoran212@gmail.com'
                    })
                        .then(rst => {
                            initDebug('Init account succeed!');
                            return resolve('initUser');
                        })
                        .catch(err => {
                            initDebug(err);
                            return reject(err);
                        });
                }
            })
            .catch(err => {
                initDebug(err);
                return reject(err);
            });
    });
};
