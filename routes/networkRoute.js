/**
 * Created by SCR on 2017/8/1.
 */
let networkDB = require('../models/network.model');
let NetworkCtrl = require('../controllers/network.controller');
let express = require('express');
let router = express.Router();

module.exports = router;

// region service operation
// 获取一个 server 下的所有服务
router.route('/services')
    .get(function (req, res, next) {
        let host = req.query.host;
        let port = req.query.port;
        let type = req.query.type;
        let func;
        if (type) {
            if (type === 'model') {
                func = NetworkCtrl.getMS;
            } else if (type === 'data' || type === 'data map' || type === 'data refactor') {
                func = NetworkCtrl.getDS;
            } else {
                return res.end('invalid');
            }
            func(host, port)
                .then(v => {
                    return res.end(JSON.stringify({
                        error: null,
                        services: v
                    }));
                })
                .catch(e => {
                    return res.end(JSON.stringify({
                        error: e
                    }));
                });
        } else {
            return res.end('invalid');
        }
    });

// 获取一个 refactor dll 下的所有方法
router.route('/dataRefactorMethods')
    .get((req, res, next) => {
        let host = req.query.host;
        let port = req.query.port;
        let id = req.query.id;
        if (host && port && id) {
            NetworkCtrl.getDataRefactorMethods(host, port, id)
                .then(methods => {
                    return res.end(JSON.stringify({
                        error: null,
                        methods: methods
                    }));
                })
                .catch(err => {
                    return res.end(JSON.stringify({
                        error: err
                    }));
                })
        } else {
            return res.end('invalid');
        }
    });

// 获取 service list 的 IO 详情
router.route('/serviceListDetail')
    .get(function (req, res, next) {
        let type = req.query.type;
        let func;
        let services = req.query.services;
        if (type) {
            if (type === 'model') {
                func = NetworkCtrl.getMSListDetail;
            } else if (type === 'data map') {
                func = NetworkCtrl.getDataMapListDetail;
            } else if (type === 'data refactor') {
                func = NetworkCtrl.getDataRefactorListDetail;
            }
            func(services)
                .then(rst => {
                    return res.end(JSON.stringify({
                        error: null,
                        serviceListDetail: rst
                    }));
                })
                .catch(err => {
                    return res.end(JSON.stringify({
                        error: err
                    }));
                })
        } else {
            res.end(JSON.stringify({
                error: 'invalid'
            }));
        }
    });

// TODO 容器需要
router.route('/getMSDetail')
    .get(function (req, res, next) {
        let _id = req.query._id;
        NetworkCtrl.getMSDetail(_id, function (err, rst) {
            err ? res.end(JSON.stringify({
                    error: err
                })) :
                res.end(JSON.stringify({
                    error: null,
                    MSDetail: rst
                }));
        })
    });
// endregion

router.route('/')
    .get((req, res, next) => {
        return res.render('network/networkList');
    })
    .delete(function (req, res, next) {
        let _id = req.body._id;
        networkDB.remove({
                _id: _id
            })
            .then(rst => {
                return res.end(JSON.stringify({
                    error: null,
                    result: rst
                }));
            })
            .catch(next);
    })
    .post(function (req, res, next) {
        let newNetwork = req.body;
        if (newNetwork) {
            networkDB.insert(newNetwork)
                .then(rst => {
                    return res.end(JSON.stringify({
                        error: null,
                        result: rst
                    }));
                })
                .catch(next);
        } else {
            return next(new Error('invalid request body, please attach the new network!'));
        }
    });

router.route('/:id')
    .get(function (req, res, next) {
        let _id = req.params._id;
        networkDB.findOne({
                _id: _id
            })
            .then(doc => {
                return res.end(JSON.stringify({
                    error: null,
                    network: doc
                }));
            })
            .catch(next);
    });

router.route('/:ac')
    .get(function (req, res, next) {
        let ac = req.params.ac;
        if (ac == 'new') {
            return res.render('network/network');
        }
        // TODO
        else if (ac == 'edit' || ac == 'detail') {
            let _id = req.query._id;
            networkDB.findOne({
                    _id: _id
                })
                .then(doc => {
                    if (ac == 'edit') {
                        return res.render('network/network', {
                            network: JSON.stringify(doc)
                        });
                    } else if (ac == 'detail') {
                        return res.render('network/network', {
                            network: JSON.stringify(doc)
                        });
                    }
                })
                .catch(next);
        } else {
            return next();
        }
    });