let ObjectID = require('mongodb').ObjectID;
let Mongoose = require('./mongoose.base');
let mongoose = require('mongoose');
let _ = require('lodash');
let moment = require('moment');
let Promise = require('bluebird');

let schema = {
    layoutCfg: mongoose.Schema.Types.Mixed,
    solutionCfg: {
        serviceList: mongoose.Schema.Types.Mixed,
        relationList: [{
            from: mongoose.Schema.Types.Mixed,
            to: mongoose.Schema.Types.Mixed,
            _id: String
        }]
    },
    solutionInfo: {
        name: String,
        author: [{
            _id: String,
            avatar: String,
            username: String
        }],
        desc: String
    },
    time: Number
};
let collectionName = 'Solution';
let solutionDB = new Mongoose(schema, collectionName);

solutionDB.getServiceByMSID = function (_id, MSID, cb) {
    return solutionDB.findOne({
            _id: _id
        })
        .then(doc => {
            let service = _.find(doc.solutionCfg.serviceList, service => service._id === MSID);
            return Promise.resolve(service);
        })
        .catch(err => {
            return Promise.reject(err);
        });
};

solutionDB.getReducedDocs = () => {
    return solutionDB.find({})
        .then(docs => {
            let reduced = _.map(docs, doc => {
                return {
                    time: moment(doc.time).format('YYYY-MM-DD HH:mm'),
                    _id: doc._id,
                    name: _.get(doc, 'solutionInfo.name'),
                    desc: _.get(doc, 'solutionInfo.desc'),
                    author: _.get(doc, 'solutionInfo.author')
                };
            });
            return Promise.resolve(reduced);
        })
        .catch(err => {
            return Promise.reject(err);
        });
}

solutionDB.save = (sln, isSaveAs) => {
    sln.time = new Date().getTime();
    _.map(sln.solutionCfg.serviceList, service => {
        if (service.host === 'localhost' || service.host === '127.0.0.1') {
            service.host = global.centerHost;
            service.port = global.centerPort;
        }
    });
    if (isSaveAs || !sln._id) {
        // delete sln._id;
        sln._id = new ObjectID();
        return solutionDB.insert(sln)
            .then(rst => {
                return Promise.resolve(rst._id);
            })
            .catch(e => {
                return Promise.reject(e);
            });
    } else {
        return solutionDB.update({
                _id: sln._id
            }, sln)
            .then(rst => {
                return Promise.resolve(sln._id);
            })
            .catch(e => {
                return Promise.reject(e);
            });
    }
}

module.exports = solutionDB;