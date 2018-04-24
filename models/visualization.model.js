/**
 * Created by SCR on 2017/8/9.
 */

let Mongoose = require('./mongoose.base');
let mongoose = require('mongoose');
let formidable = require('formidable');
let ObjectID = require('mongodb').ObjectID;
let unzip = require('unzip');
let Promise = require('bluebird');
let _ = require('lodash');
var moment = require('moment');

let schema = {
    DVM: mongoose.Schema.Types.Mixed,
    schemas: Array,
    time: Number
};
let collectionName = 'VisualizationPackage';
let visualizationDB = new Mongoose(schema, collectionName);

module.exports = visualizationDB;

visualizationDB.getReducedDocs = () => {
    return visualizationDB.find({})
        .then(docs => {
            let reduced = _.map(docs, doc => {
                let localization = _.get(doc, 'DVM.Localizations.Localization');
                let enAbstract;
                if(localization) {
                    if (localization instanceof Array) {
                        let enLocal = _.find(localization, item => item._$.local === 'EN_US');
                        enAbstract = enLocal ? enLocal.Abstract : undefined;
                    } else {
                        enAbstract = localization.Abstract;
                    }
                }
                return {
                    _id: doc._id,
                    wkname: doc.DVM._$.wkname,
                    version: doc.DVM._$.version,
                    enAbstract: enAbstract,
                    time: moment(doc.time).format('YYYY-MM-DD HH:mm')
                };
            });
            return Promise.resolve(reduced);
        })
        .catch(e => {
            return Promise.reject(e);
        });
}

visualizationDB.upload = (fields, files) => {
    return new Promise((resolve, reject) => {
        let _id = new ObjectID();
        let newPackage = {
            _id: _id,
            time: (new Date()).getTime()
        };
        let packagePath = files.package.path;
        let filename = files.package.name;
        let ext = filename.substr(filename.lastIndexOf('.'));
        let unzipPath = path.join(setting.visualization.path, _id.toString());
        if (ext === '.zip') {
            fs
                .createReadStream(packagePath)
                .pipe(unzip.Extract({
                    path: unzipPath
                }))
                .on('error', err => {
                    return reject(err);
                })
                .on('close', () => {
                    let cfgPath = path.join(unzipPath, 'DataVisualizationMethod.xml');
                    fs.readFile(cfgPath, 'utf8', function (err, cfgStr) {
                        if (err) {
                            return reject(err);
                        }
                        cfgStr = cfgStr.toString();
                        // let doc = new dom().parseFromString(cfgStr);
                        // let rootNode = xpath.select('/DataVisualizationMethod',doc)[0];
                        // newPackage.guid = xpath.select('string(//@id)', rootNode);
                        // newPackage.wkname = xpath.select('string(//@wkname)', rootNode);
                        // newPackage.version = xpath.select('string(//@version)', rootNode);
                        //
                        //
                        // let zhLocalization = xpath.select('//Localization[@local=\'ZH_CN\']', rootNode)[0];
                        // let zhName = xpath.select('string(//@localName)', zhLocalization);
                        // let zhAbstract = xpath.select('string(//Abstract)', zhLocalization);
                        //
                        // let enLocalization = xpath.select('//Localization[@local=\'EN_US\']', rootNode)[0];
                        // let enName = xpath.select('string(//@localName)', enLocalization);
                        // let enAbstract = xpath.select('string(//Abstract)', enLocalization);
                        xmlparse(cfgStr, {
                            explicitArray: false,
                            ignoreAttrs: false
                        }, function (err, json) {
                            if (err) {
                                console.log('Error in parse DataVisualizationMethod.xml : ' + err);
                                return reject(err);
                            }
                            newPackage.DVM = json;
                            visualizationDB.insert(newPackage)
                                .then(doc => {
                                    return resolve(doc._id);
                                })
                                .catch(reject);
                        });
                    });
                });
        }
        else {
            return resolve();
        }
    });
}