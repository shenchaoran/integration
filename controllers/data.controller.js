let Promise = require('bluebird');
let path = require('path');
let ObjectID = require('mongodb').ObjectID;
let fs = Promise.promisifyAll(require('fs'));
let unzip = require('unzip');
let setting = require('../config/setting');
let geoDataDB = require('../models/data.model');
let RequestCtrl = require('./request.controller');
let WebSocketCtrl = require('./web-socket.controller');
let _ = require('lodash');

module.exports = {
    /**
     * 条目保存到数据库，文件移动到geo_data中
     * 如果数据为zip则解压
     */
    insert: (fields, files) => {
        if (!files['myfile']) {
            return Promise.reject('invalid request body!');
        }
        let file = files['myfile'];
        let filename = file.name;
        let ext = filename.substr(filename.lastIndexOf('.'));
        let oid = new ObjectID();
        let newName = oid + ext;

        let newPath = path.join(
            setting.geo_data.path,
            newName
        );
        return fs.renameAsync(file.path, newPath)
            .then(() => {
                return new Promise((resolve, reject) => {
                    if (ext !== '.zip') {
                        return resolve();
                    }
                    let unzipPath = path.join(
                        setting.geo_data.path,
                        oid.toHexString()
                    );
                    // console.log(newPath);
                    // console.log(unzipPath);
                    fs
                        .createReadStream(newPath)
                        .pipe(unzip.Extract({
                            path: unzipPath
                        }))
                        .on('error', reject)
                        .on('close', () => {
                            // TODO 为什么这里会崩？？？
                            return resolve();
                        });
                });
            })
            .then(() => geoDataDB.insert({
                _id: oid,
                fname: filename,
                path: newName,
                desc: fields.desc
            }))
            .then(doc => Promise.resolve({
                res: 'suc',
                gd_id: doc._id,
                fname: doc.fname
            }))
            .catch(Promise.reject);
    },

    download: (id) => {
        let fname;
        let fpath;
        let doc;
        return new Promise((resolve, reject) => {
            geoDataDB
                .findOne({
                    _id: id
                })
                .then(v => {
                    doc = v;
                    fname = doc.fname;
                    let ext = fname.substr(fname.lastIndexOf('.'));
                    fpath = path.join(
                        setting.geo_data.path,
                        doc.path,
                    );
                    return fs.statAsync(fpath);
                })
                .then(stats => fs.readFileAsync(fpath))
                .then(data => resolve({
                    length: data.length,
                    filename: doc.fname,
                    data: data
                }))
                .catch(reject);
        });
    },

    // 获取 数据服务器/模型服务器 上的数据，并缓存到本地
    fetchData: (stub) => {
        let url;
        let newName = new ObjectID().toString();
        if (stub.from.posType === 'LOCAL') {
            return geoDataDB.findOne({
                _id: stub.from.id
            });
        } else if (stub.from.posType === 'MSC') {
            url = `http://${stub.from.host}:${stub.from.port}/geodata/${stub.from.id}?`;
        } else if (stub.from.posType === 'DSC') {
            url = `http://${stub.from.host}:${stub.from.port}/user/download?dataId=${stub.from.id}`;
        }
        return RequestCtrl.getFile(url, newName)
            .then(rst => geoDataDB.insert({
                fname: rst.fname,
                posType: stub.from.posType,
                path: rst.newName
            }))
            .then(doc => Promise.resolve(doc))
            .catch(e => {
                console.log(e);
                return Promise.reject(e);
            });
    },

    // 将数据分发到 数据服务器/模型服务器
    dispatchData: (dataDoc, destination) => {
        let func;
        let fsStream = fs.createReadStream(path.join(setting.geo_data.path, dataDoc.path));
        if (destination.serviceType === 'model') {
            url = `http://${destination.host}:${destination.port}/geodata?type=file`;
            form = {
                gd_tag: dataDoc.fname,
                myfile: fsStream
            };
            return RequestCtrl.post(url, form, 'File', true)
                .then(res => {
                    res = JSON.parse(res);
                    return Promise.resolve({
                        id: res.gd_id
                    })
                });
        } else if (destination.serviceType === 'data map' || destination.serviceType === 'data refactor') {
            let parentid;
            return createDSCFolder(destination.host, destination.port)
                .then(pid => {
                    parentid = pid;
                    url = `http://${destination.host}:${destination.port}/user/uploadfile`;
                    form = {
                        parentid: pid,
                        files: fsStream
                    };
                    return RequestCtrl.post(url, form, 'File', true)
                })
                .then(res => {
                    if(res) {
                        res = res.substr(2);
                        return Promise.resolve({
                            fname: dataDoc.path,
                            pid: parentid,
                            id: res
                        });
                    }
                });
        }
    }
}

createDSCFolder = (host, port) => {
    let url = `http://${host}:${port}/user/addFolder?parentid=-1&foldername=integration-controller-dispatch-folder`;
    return RequestCtrl.get(url, undefined, false)
        .then(res => {
            if (res === '1') {
                return RequestCtrl.get(`http://${host}:${port}/user/files?getAll=1&parentid=-1`)
                    .then(list => {
                        list = JSON.parse(list);
                        let item = _.find(list, item => item.name === 'integration-controller-dispatch-folder' && item.format === 'folder');
                        return item ? Promise.resolve(item._id) : Promise.reject();
                    });
            } else {
                // 'ok|...'
                return Promise.resolve(res.substr(3));
            }
        });
}