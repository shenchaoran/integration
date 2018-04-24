let requestPromise = require('request-promise');
let request = require('request');
let setting = require('../config/setting');
let ObjectID = require('mongodb').ObjectID;
let fs = require('fs');
let path = require('path');

module.exports = RequestCtrl = {};

RequestCtrl.get = (url, form, isFullResponse, withRetry) => {
    let options = {
        url: url,
        method: 'GET',
        qs: form,
        resolveWithFullResponse: isFullResponse === true
    };
    if (withRetry) {
        let count = 0;
        return new Promise((resolve, reject) => {
            let requestRecur = () => {
                requestPromise(options)
                    .then(res => {
                        return resolve(res);
                    })
                    .catch(e => {
                        console.log(e);
                        count++;
                        if(count < 3) {
                            requestRecur();
                        }
                        else if(count === 3) {
                            return reject(e);
                        }
                    });
            };
            requestRecur();
        });
    } else {
        return requestPromise(options);
    }
};

RequestCtrl.getFile = (url) => {
    // let options = {
    //     url: url,
    //     method: 'GET',
    //     qs: form,
    //     resolveWithFullResponse: isFullResponse === true
    // };
    let fname;
    let ext = '';
    let newName = new ObjectID().toString();
    newName = path.join(__dirname, newName);
    return new Promise((resolve, reject) => {
        request
            .get(url)
            .on('response', response => {
                response.headers['content-type'];
                fname = response.headers['content-disposition'];
                if(fname) {
                    if(fname.indexOf('filename=') !== -1) {
                        fname = fname.substring(fname.indexOf('filename=') + 9);
                    }
                }
                else {
                    fname = new ObjectID().toString();
                }
                if(fname.lastIndexOf('.') !== -1) {
                    ext = fname.substr(fname.lastIndexOf('.'));
                }
                newName += ext;
            })
            .pipe(fs.createWriteStream(newName))
            .on('error', e => {
                console.log(e);
                return reject(e);
            })
            .on('close', () => {
                console.log('close');
            })
            .on('finish', () => {
                return resolve();
            });
    });
}

RequestCtrl.post = (url, body, type, withRetry) => {
    let options = {
        uri: url,
        method: 'POST'
    };
    if (type === 'JSON') {
        // 后台信息都会存在req.body中
        options.body = body;
        // must add this line
        // encode the body to stringified json
        options.json = true;
        // Is set automatically
        options.headers = {
            'content-type': 'application/json'
        };
    } else if (type === 'Form') {
        // 后台会全部放在req.body中。
        // 所以如果有文件的话，不能放在form中，headers不能为urlencoded
        options.form = body;
        // Is set automatically
        options.headers = {
            'content-type': 'application/x-www-form-urlencoded'
        };
    } else if (type === 'File') {
        // 后台不在req.body, req.params, req.query中。
        // 所以如果在req.query中取值，要把那部分单独拿出来，插入到url中
        options.formData = body;
        // Is set automatically
        options.headers = {
            'content-type': 'multipart/form-data'
        };
    }
    
    if (withRetry) {
        let count = 0;
        return new Promise((resolve, reject) => {
            let requestRecur = () => {
                requestPromise(options)
                    .then(res => {
                        return resolve(res);
                    })
                    .catch(e => {
                        console.log(e);
                        count++;
                        if(count < 3) {
                            requestRecur();
                        }
                        else if(count === 3) {
                            return reject(e);
                        }
                    });
            };
            requestRecur();
        });
    } else {
        return requestPromise(options);
    }
};