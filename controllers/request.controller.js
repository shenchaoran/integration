let requestPromise = require('request-promise');
let request = require('request');
let setting = require('../config/setting');
let ObjectID = require('mongodb').ObjectID;
let Promise = require('bluebird');
let fs = Promise.promisifyAll(require('fs'));
let path = require('path');
let http = require('http');

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

RequestCtrl.getFile = (url, newName) => {
    let fname;
    let ext = '';
    // let buf1 = new Buffer(0);
    // let buf2;
    // let strBuf = '';
    return new Promise((resolve, reject) => {
        http.get(url, response => {
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
            // distPath += '-1' + ext;
            newName += ext;
            let distPath = path.join(setting.geo_data.path, newName);
            let fd = fs.openSync(distPath, 'w');

            response.on('data', chunk => {
                fs.writeSync(fd, chunk, 0, chunk.length);
                // buf1 = Buffer.concat([buf1, chunk]);
                // strBuf += chunk.toString('ascii');
            });

            response.on('end', chunk => {
                fs.closeSync(fd);
                return resolve({
                    fname: fname,
                    newName: newName
                });
                // buf2 = Buffer.from(strBuf, 'ascii');
                // fs.writeFileSync(distPath + '-2' + ext, buf1);
                // fs.writeFileSync(distPath + '-3' + ext, buf2);
            });

            response.on('error', e => {
                console.log(e);
                return reject(e);
            });
        })
            .on('error', e => {
                console.log(e);
                return reject(e);
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