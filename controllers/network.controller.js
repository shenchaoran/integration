let RequestCtrl = require('./request.controller');
let xmlparse = require('xml2js').parseString;
let Promise = require('bluebird');
let _ = require('lodash');

module.exports = {
    getMS: function (host, port, cb) {
        return RequestCtrl.get('http://' + host + ':' + port + '/modelser/json/all', {})
            .then(msList => {
                msList = JSON.parse(msList);
                msList = msList.data;
                _.map(msList, item => {
                    item.host = host;
                    item.port = port;
                    item.value = item.ms_model.m_name
                });
                return Promise.resolve(msList);
            })
            .catch(e => {
                return Promise.reject(e);
            });
    },

    getDS: function (host, port, cb) {
        let count = 0;
        let refactorServices = {
            error: null
        };
        let dataMapServices = {
            error: null
        };

        // let dataServiceURL = 'http://'+host+':'+port+'/common/services?pageamount=10&page=0&username=admin&ids=all&type=data';
        let dataMapServiceURL = 'http://' + host + ':' + port + '/common/services?username=admin&ids=all&type=datamap';
        let refactorServiceURL = 'http://' + host + ':' + port + '/common/services?username=admin&ids=all&type=refactor';

        return Promise.all([
                RequestCtrl.get(dataMapServiceURL, null)
                .then(list => {
                    list = JSON.parse(list);
                    return Promise.resolve({
                        data: list,
                        error: undefined
                    });
                })
                .catch(e => {
                    return Promise.resolve({
                        error: e
                    });
                }),
                RequestCtrl.get(refactorServiceURL, null)
                .then(list => {
                    list = JSON.parse(list);
                    return Promise.resolve({
                        data: list,
                        error: undefined
                    });
                })
                .catch(e => {
                    return Promise.resolve({
                        error: e
                    });
                })
            ])
            .then(rsts => {
                return Promise.resolve({
                    dataMapServices: rsts[0],
                    refactorServices: rsts[1]
                });
            });
    },

    getMSListDetail: function (services) {
        return Promise.map(services, (service) => {
                // TODO mdl api
                let url = 'http://' + service.host + ':' + service.port + '/modelser/json/' + service._id;
                return new Promise((resolve, reject) => {
                    RequestCtrl.get(url, undefined, false)
                        .then(res => {
                            if (typeof res === 'string') {
                                res = JSON.parse(res);
                            }
                            var strMDL = res.data.ms_xml;
                            // res is the string content of mdl
                            // xmlparse(res, {
                            //     explicitArray: false,
                            //     ignoreAttrs: false
                            // }, function (err, MDL) {
                            //     if (err) {
                            //         return resolve({
                            //             error: err
                            //         });
                            //     }
                            // let strMDL = JSON.stringify(MDL);
                            strMDL = strMDL.replace(/\"\$\"/g, '"_$"');
                            MDL = JSON.parse(strMDL);
                            return resolve({
                                error: null,
                                detail: {
                                    MDL: MDL,
                                    host: service.host,
                                    port: service.port,
                                    _id: service._id
                                }
                            });
                            // });
                        })
                        .catch(err => {
                            return resolve({
                                error: err
                            });
                        });
                });
            }, {
                concurrency: 20
            })
            .then(rsts => {
                return Promise.resolve(rsts);
            });
    },

    // unused
    getDataMapListDetail: (services, cb) => {
        return Promise.map(services, (service) => {
                let url = `http://${service.host}:${service.port}`;
                return RequestCtrl.get(url, undefined, false)
            }, {
                concurrency: 20
            })
            .then(rsts => {

            });
    },

    // unused
    getDataRefactorListDetail: (services, cb) => {

    },

    // unused
    getDataRefactorMethods: (host, port, id) => {
        let url = `http://${host}:${port}/refactor/methods?id=${id}`;
        return RequestCtrl.get(url, undefined, false)
            .then(res => {
                res = JSON.parse(res);
                return Promise.resolve(res.RefactorMethodInfo)
            })
            .catch(err => {
                return Promise.reject(err);
            });
    }
}