/**
 * Created by SCR on 2017/6/29.
 */
let formidable = require('formidable');
let taskDB = require('../models/task.model');
let solutionDB = require('../models/solution.model');
let taskCtrl = require('../controllers/task.controller');
let request = require('request');
let express = require('express');
let router = express.Router();
module.exports = router;


router.route('/')
    .get((req, res, next) => {
        return res.render('integration/taskList')
    })
    .post(function (req, res, next) {
        let isSaveAs = req.query.isSaveAs;
        let task = req.body;
        isSaveAs = parseInt(isSaveAs);
        taskDB.save(task, isSaveAs)
            .then(rst => {
                return res.json({
                    error: null,
                    _id: rst
                });
            })
            .catch(next);
    })
    .delete(function (req, res, next) {
        let _id = req.body._id;
        taskDB.remove({_id: _id})
            .then(rst => {
                return res.end(JSON.stringify({
                    error: null,
                    result: rst
                }));
            })
            .catch(next);
    });

router.route('/new')
    .get(function (req, res, next) {
        let solutionID = req.query.solutionID;
        if (!solutionID || solutionID == undefined) {
            return res.end('invalid solution id!');
        }
        solutionDB.findOne({_id: solutionID})
            .then(doc => {
                return res.render('integration/task', {
                    solution: JSON.stringify(doc),
                    solutionName: doc.solutionInfo.name
                });
            })
            .catch(next);
    })

// edti task
// task detail
router.route('/:ac')
    .get(function (req, res, next) {
        let ac = req.params.ac;
        if (ac == 'edit' || ac == 'detail') {
            let taskID = req.query._id;
            if (!taskID) {
                return res.end('invalid task id!');
            } else {
                taskDB.getTaskDetail(taskID)
                    .then(doc => {
                        if (doc) {
                            return res.render('integration/task', {
                                task: JSON.stringify(doc),
                                taskName: doc.taskInfo.name
                            });
                        } else {
                            return res.render('integration/task', {
                                task: '',
                                taskName: 'query error!'
                            });
                        }
                    })
                    .catch(next);
            }
        } else {
            return next();
        }
    });

router.route('/:id')
    .get(function (req, res, next) {
        let _id = req.params.id;
        let isComplete = req.query.isComplete;
        if (!_id) {
            return res.end('Can\'t find this task!');
        }
        if (!isComplete) {
            return res.end('Please specify the "isComplete" field!');
        }
        if (_id == 'all' && isComplete == 'false') {
            taskDB.getReducedDocs()
                .then(docs => {
                    return res.end(JSON.stringify({
                        error: null,
                        tasksSegment: docs
                    }));
                })
                .catch(next);
        }
    });

// TODO 发送给各个子节点kill命令
router.route('/kill')
    .post(function (req, res, next) {

    });

// 点击运行按钮触发
router.route('/run')
    .post(function (req, res, next) {
        let task = req.body;
        taskCtrl.run(task)
            .then(_id => {
                return res.end(JSON.stringify({
                    error: null,
                    _id: _id
                }));
            })
            .catch(next);
    });

router.route('/breakpoint')
    .post(function (req, res, next) {
        let ac = req.query.ac;
        let taskID = req.body.taskID;
        let MSID = req.body.MSID;
        taskCtrl.breakpoint(taskID, MSID, ac)
            .then(rst => {
                return res.end(JSON.stringify({
                    error: null,
                    result: rst
                }));
            })
            .catch(next);
    });