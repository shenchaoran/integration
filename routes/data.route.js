/**
 * Created by SCR on 2017/6/29.
 */
let DataCtrl = require('../controllers/data.controller');
let TaskCtrl = require('../controllers/task.controller');
let request = require('request');
let express = require('express');
let formidable = require('formidable');
let setting = require('../config/setting');
let router = express.Router();
let db = require('../models/data.model');
module.exports = router;

router.route('/')
    .get(function (req, res, next) {
        let taskID = req.query.taskID;
        let gdid = req.query.gdid;
        let msid = req.query.msid;
        let stateID = req.query.stateID;
        let eventName = req.query.eventName;
        TaskCtrl.getDataUrl(taskId, gdid, msid, stateID, eventName)
            .then(url => {
                // res.setHeader('Content-Disposition', 'attachment;filename=' + encodeURIComponent(fileName));
                // res.set({
                //     'Content-Type': 'file/xml',
                //     'Content-Length': msg.length
                // });
                // return res.end(msg);

                // request(rmtURL, function(err, response, body) {
                //     if (err) {
                //         console.log(err);
                //         let data = JSON.stringify({ error: err });
                //         return res.end(data);
                //     } else {
                //         res.set({
                //             'Content-Type': response.headers['Content-Type'],
                //             'Content-Length': response.headers['Content-Length']
                //         });
                //         res.setHeader('Content-Disposition', response.headers['content-disposition']);
                //         return res.end(new Buffer(body));
                //     }
                // })

                // TODO try catch
                return request.get(url).on('error', () => {
                        res.end('error');
                    })
                    .pipe(res)
                    .on('error', () => {
                        res.end('error');
                    });
            })
            .catch(next);
    });

router.route('/')
    .post((req, res, next) => {
        let form = new formidable.IncomingForm();
		form.encoding = 'utf-8';
		form.uploadDir = setting.geo_data.path;
		form.keepExtensions = true;
		form.maxFieldsSize = setting.geo_data.max_size;
		form.parse(req, (err, fields, files) => {
			if (err) {
				return next(err);
            }
            else {
                DataCtrl.insert(fields, files)
                    .then(rst => {
                        return res.json(rst);
                    })
                    .catch(next);
            }
        });
    });

router.route('/:id')
    .get((req, res, next) => {
        DataCtrl.download(req.params.id)
            .then(rst => {
                res.set({
                    'Content-Type': 'file/*',
                    'Content-Length': rst.length,
                    'Content-Disposition': 'attachment;filename=' +
                        encodeURIComponent(rst.filename)
                });
                return res.end(rst.data);
            });
    });