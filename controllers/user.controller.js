let setting = require('../config/setting');
let userDB = require('../models/user.model');
const moment = require('moment');
const jwt = require('jwt-simple');
let Promise = require('bluebird');
let Identicon = require('identicon.js');
let crypto = require('crypto');


module.exports = {
    signin: (user) => {
        return new Promise((resolve, reject) => {
            userDB.findOne({
                    username: user.username,
                    password: user.password
                })
                .then(doc => {
                    let expires = moment()
                        .add(setting.jwt.expires, 'days')
                        .valueOf();
                    let token = jwt.encode({
                        iss: user.username,
                        exp: expires
                    }, setting.jwt.secret);
                    delete doc.password;
                    return resolve({
                        error: undefined,
                        user: doc,
                        jwt: {
                            token: token,
                            expires: expires
                        }
                    });
                })
                .catch(e => {
                    return resolve({
                        error: 'unknown username or password'
                    });
                })
        });
    },

    signup: (user) => {
        return new Promise((resolve, reject) => {
            userDB.find({
                    username: user.username
                })
                .then(docs => {
                    if (docs.length === 0) {
                        let hash = crypto.createHash('md5');
                        hash.update(user.username);
                        let imgData = new Identicon(hash.digest('hex'), {
                            size: 25
                        }).toString();
                        user.avatar = imgData;
                        return userDB.insert(user)
                    } else {
                        return resolve({
                            error: 'existed username'
                        });
                    }
                })
                .then(doc => {
                    let expires = moment()
                        .add(setting.jwt.expires, 'days')
                        .valueOf();
                    let token = jwt.encode({
                        iss: user.username,
                        exp: expires
                    }, setting.jwt.secret);
                    delete doc.password;
                    return resolve({
                        error: undefined,
                        user: doc,
                        jwt: {
                            token: token,
                            expires: expires
                        }
                    });
                })
                .catch(reject);
        });
    }
}