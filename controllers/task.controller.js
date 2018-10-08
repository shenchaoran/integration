let taskDB = require('../models/task.model');
let solutionDB = require('../models/solution.model');
let WebSocketCtrl = require('./web-socket.controller');
let TaskInstanceManager = require('../models/task-instance.model');
let DataDriver = require('./data-driver-integrate.controller');

module.exports = {
    run: (task) => {
        let theTask;
        return new Promise((resolve, reject) => {
                taskDB.save(task, false)
                    .then(rst => taskDB.findOne({_id: task._id}))
                    .then(task => {
                        theTask = task;
                        return solutionDB.findOne({_id: task.taskCfg.solutionID});
                    })
                    .then(solution => {
                        // 添加task instance
                        delete solution.layoutCfg;
                        theTask.solution = solution;
                        // TaskInstanceManager.add(theTask);
                        // 更新task state，更新失败时将错误给前台
                        // TaskInstanceManager.updateTaskState(theTask._id, 'RUNNING', function (err, rst) {
                        //     if (err) {
                        //         reject(err);
                        //         return WebSocketCtrl.emit(theTask._id, 'error', JSON.stringify({
                        //             error: err
                        //         }));
                        //     } else {
                        //         return resolve(theTask._id);
                        //     }
                        // });
                        // 遍历模型，分发数据，驱动运算
                        var driver = new DataDriver(theTask);
                        driver.start();
                        return resolve(theTask._id);
                    })
                    .catch(reject);
            })
    },

    breakpoint: (taskID, MSID, ac) => {
        let oldState = null;
        let newState = null;
        if (ac == 'add') {
            oldState = 'UNREADY';
            newState = 'PAUSE';
        } else if (ac == 'remove') {
            oldState = 'PAUSE';
            newState = 'UNREADY';
        }
        return taskDB.findOne({
                _id: taskID
            })
            .then(task => {
                let MSState = task.MSState;
                let state = _.find(MSState, state => state.MSID === MSID);
                if (state) {
                    if (state.state != 'UNREADY' && state.state != 'PAUSE') {
                        return Promise.reject('Can\'t add break point on this service!');
                    } else {
                        state.state = newState;
                        taskDB.update({
                                _id: task._id
                            }, task)
                            .then(rst => {
                                let taskInstance = TaskInstanceManager.get(task._id);
                                if (taskInstance != null) {
                                    let instanceState = _.find(taskInstance.MSState, state => state.MSID === MSID);
                                    if (instanceState) {
                                        instanceState.state = newState;
                                        return Promise.resolve('success');
                                    }
                                } else {
                                    return Promise.resolve('success');
                                }
                            })
                            .catch(e => {
                                return Promise.reject(e);
                            });
                    }
                } else {
                    return Promise.reject('Can\'t find this service!');
                }
            })
            .catch(e => {
                return Promise.reject(e);
            });
    },

    getDataUrl: (taskID, gdid, msid, stateID, eventName) => {
        return taskDB.findOne({_id: taskID})
            .then(doc => {
                let event = _.find(doc.taskCfg.dataList, event => event.MSID === msid && event.gdid === gdid && event.stateID === stateID && event.eventName === eventName);
                if(event) {
                    let url = event.posType === 'LOCAL'? `http://${event.host}:${event.port}/geodata/${event.gdid}`
                        : event.posType === 'MODEL SERVICE'? `http://${event.host}:${event.port}/geodata/${event.gdid}`
                        : event.posType === 'DATA SERVICE'? `http://${event.host}:${event.port}/user/download?username=admin&filename=${event.oid}`
                        : '';
                    return url === ''? Promise.reject('invalid data position type, not in local server or model service server or data server server!')
                        : Promise.resolve(url);
                }
            })
            .catch(e => {
                return Promise.reject(e);
            })
    }
}