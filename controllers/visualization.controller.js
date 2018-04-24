var path = require('path');
var formidable = require('formidable');
var unzip = require('unzip');
var ObjectId = require('mongodb').ObjectID;
let Promise = require('bluebird');
var fs = Promise.promisifyAll(require('fs'));
var xpath = require('xpath');
var dom = require('xmldom').DOMParser;
var xmlparseAsync = Promise.promisify(require('xml2js').parseString);
let setting = require('../config/setting');

let visualizationDB = require('../models/visualization.model');

module.exports = {
    batchDeploy: () => {
        let fpath = path.join(setting.visualization.path);
        fs.readdirAsync(fpath)
            .then(files => {
                Promise.map(files, file => {
                    if(file === 'upload') {
                        return Promise.resolve();
                    }
                    let fullpath = path.join(fpath, file);
                    return fs.statAsync(fullpath)
                        .then(stat => {
                            if(stat.isDirectory()) {
                                return deploy(fullpath);
                            }
                        })
                }, {
                    concurrency: 10
                });
            })
            .catch(console.log);
    }
}

deploy = (visualPath) => {
    let newPackage;
    let domDoc;
    let _id = path.basename(visualPath);
    return new Promise((resolve, reject) => {
        visualizationDB.find({
            _id: _id
        })
        .then(docs => {
            if (docs.length) {
                let msg = 'exist: ' + _id;
                console.log(msg);
                return resolve('existed');
            } else {
                newPackage = {
                    _id: _id,
                    schemas: [],
                    time: (new Date()).getTime()
                };
                let cfgPath = path.join(visualPath, 'cfg_visualization.xml');
                return fs.readFileAsync(cfgPath, 'utf8');
            }
        })
        .then(cfgStr => {
            domDoc = new dom().parseFromString(cfgStr);
            return xmlparseAsync(cfgStr, {
                explicitArray: false,
                ignoreAttrs: false
            })
        })
        .then(json => {
            var jsonStr = JSON.stringify(json);
            jsonStr = jsonStr.replace(/\"\$\"/g, '"_$"');
            newPackage.DVM = JSON.parse(jsonStr).DataVisualizationMethod;

            // save schema
            var schemaNodes = xpath.select('/DataVisualizationMethod/Params//Param/@schema', domDoc);
            // for (let i = 0; i < schemaNodes.length; i++) {
            //     var schemaPath = path.join(visualPath, schemaNodes[i].nodeValue);
            //     // TODO
            //     var schemaStr = fs.readFileAsync(schemaPath, 'utf8');
            //     newPackage.schemas.push({
            //         fname: schemaNodes[i].nodeValue,
            //         value: schemaStr
            //     });
            // }
            return Promise.map(schemaNodes, node => {
                let nodePath = path.join(visualPath, node.nodeValue);
                return new Promise((resolve, reject) => {
                    fs.readFileAsync(nodePath, 'utf8')
                        .then(str => {
                            newPackage.schemas.push({
                                fname: node.nodeValue,
                                value: str
                            });
                            return resolve();
                        })
                        .catch(e => {
                            return reject(e);
                        })
                });
            }, {
                concurrency: 10
            })
        })
        .then(() => visualizationDB.insert(newPackage))
        .then(doc => {
            return resolve('succeed');
        })
        .catch(e => {
            console.log(e);
            return reject(e);
        })
    });
}