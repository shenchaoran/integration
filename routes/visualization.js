/**
 * Created by SCR on 2017/8/9.
 */

let path = require('path');
let formidable = require('formidable');
let setting = require('../config/setting');
let rimraf = require('rimraf');
let express = require('express');
let router = express.Router();
let visualizationDB = require('../models/visualization.model');
module.exports = router;

router.route('/')
    .get(function (req, res, next) {
        visualizationDB.getReducedDocs()
            .then(rst => {
                return res.render('visualization/visualLib', {
                    error: '',
                    visualList: JSON.stringify(rst)
                });
            })
            .catch(next);
    })
// .delete(function(req, res, next) {
//     let _id = req.body._id;
//     VisualModel.delete(_id, function(err, rst) {
//         if (err) {
//             return res.end(JSON.stringify({ error: err }));
//         } else {
//             let fpath = path.join(__dirname, '../visualization_service', _id);
//             rimraf(fpath, function(err) {
//                 if (err) {
//                     return res.end(JSON.stringify({ error: err }));
//                 } else {
//                     return res.end(JSON.stringify({ error: null, result: rst }));
//                 }
//             });
//         }
//     });
// });

router.route('/:ac')
    .get(function (req, res, next) {
        let ac = req.params.ac;
        if (ac == 'new') {
            let form = new formidable.IncomingForm();
            form.encoding = 'utf-8';
            form.uploadDir = setting.visualization.path;
            form.keepExtensions = true;
            form.maxFieldsSize = setting.visualization.max_size;

            form.parse(req, function (err, fields, files) {
                if (err) {
                    return next(err);
                }
                visualizationDB.upload(fields, files)
                    .then(_id => {
                        return res.end(JSON.stringify({
                            error: null,
                            _id: _id
                        }));
                    })
                    .catch(next);
            });
        } else {
            return next();
        }
    });

router.route('/:id')
    .get((req, res, next) => {
        visualizationDB.findOne({_id: req.params.id})
            .then(doc => {
                return res.render('visualization/visualDetail', {
                    error: '',
                    visualService: doc
                });
            })
            .catch(next)
    });