/**
 * Created by Administrator on 4.19.
 */
let Mongoose = require('./mongoose.base');
let mongoose = require('mongoose');
let solutionDB = require('./solution.model');
let Promise = require('bluebird');
let _ = require('lodash');
var moment = require('moment');
let ObjectID = require('mongodb').ObjectID;

let schema = {
    taskCfg: {
        driver: String,
        solutionID: String,
        dataList: [{
            from: {
                host: String,
                port: String,
                posType: String, // LOCAL/MSC/DSC   
                id: String
            },
            to: {
                host: String,
                port: String,
                serviceType: String, // model/data map/data refactor
            },
            state: String,

            isMid: Boolean,
            isInput: Boolean,

            eventName: String,
            stateID: String,
            MSID: String,

            fname: String,
            pid: String,
            id: String // id on MSC/DSC
        }]
    },
    taskInfo: {
        name: String,
        desc: String,
        author: [{
            _id: String,
            avatar: String,
            username: String
        }]
    },
    taskState: String,
    MSState: Array,
    time: Number
};
let collectionName = 'Task';
let taskDB = new Mongoose(schema, collectionName);

taskDB.getTaskDetail = (id) => {
    let task;
    return taskDB.findOne({
            _id: id
        })
        .then(doc => {
            task = doc;
            return Promise.resolve();
        })
        .then(() => {
            return solutionDB.findOne({
                _id: task.taskCfg.solutionID
            });
        })
        .then(doc => {
            task.solutionDetail = doc;
            return Promise.resolve(task);
        })
        .catch(e => {
            return Promise.reject(e);
        });
}

taskDB.save = (newTask, isSaveAs) => {
    newTask.time = new Date().getTime();
    _.map(newTask.taskCfg.dataList, data => {
        if (data.posType === 'LOCAL') {
            data.host = global.centerHost;
            data.port = global.centerPort;
        }
    });
    if (isSaveAs || !newTask._id) {
        newTask._id = new ObjectID();
        return taskDB.insert(newTask)
            .then(rst => {
                return Promise.resolve(rst._id);
            })
            .catch(e => {
                return Promise.reject(e);
            });
    } else {
        return taskDB.findOne({
                _id: newTask._id
            })
            .then(oldTask => {
                // 更新datalist和state
                // datalist只更新 __isInput的
                // state 只更新 unready, pause
                // 其他的由后台来维护
                oldTask.taskInfo = newTask.taskInfo;
                oldTask.time = newTask.time;
                let oldDataList = oldTask.taskCfg.dataList;
                let newDataList = newTask.taskCfg.dataList;
                // for(let j=0;j<newDataList.length;j++){
                //     let hasInserted = false;
                //     for(let i=0;i<oldDataList.length;i++){
                //         if(newDataList[j].MSID == oldDataList[i].MSID &&
                //             newDataList[j].stateID == oldDataList[i].stateID &&
                //             newDataList[j].eventName == oldDataList[i].eventName){
                //             hasInserted = true;
                //             oldDataList[i] = newDataList[j];
                //             break;
                //         }
                //     }
                //     if(!hasInserted){
                //         oldDataList.push(newDataList[j])
                //     }
                // }
                for (let i = 0; i < oldDataList.length; i++) {
                    if (oldDataList[i].isInput) {
                        oldDataList.splice(i, 1);
                        i--;
                    }
                }
                oldTask.taskCfg.dataList = oldDataList.concat(newDataList);

                let stateFailedList = [];
                let oldMSState = oldTask.MSState;
                let newMSState = newTask.MSState;
                for (let i = 0; i < newMSState.length; i++) {
                    if (newMSState[i].state == 'PAUSE' || newMSState[i].state == 'UNREADY') {
                        for (let j = 0; j < oldMSState.length; j++) {
                            if (newMSState[i].MSID == oldMSState[j].MSID) {
                                if (oldMSState[j].state == 'PAUSE' || oldMSState[j].state == 'UNREADY') {
                                    oldMSState[j].state = newMSState[i].state;
                                    break;
                                } else {
                                    stateFailedList.push({
                                        MSID: oldMSState[j].MSID,
                                        state: oldMSState[j].state
                                    });
                                }
                            }
                        }
                    }
                }
                return Promise.resolve(newTask);
            })
            .then(newTask => {
                return taskDB.update({
                    _id: newTask._id
                }, newTask);
            })
            .then(rst => {
                // TODO return id
                return Promise.resolve(newTask._id);
            })
            .catch(e => {
                return Promise.reject(e);
            });
    }
}

taskDB.getReducedDocs = () => {
    return taskDB.find({})
        .then(docs => {
            return Promise.map(docs, (item) => {
                    return solutionDB.findOne({
                            _id: item.taskCfg.solutionID
                        })
                        .then(sln => {
                            // item.taskInfo.time = moment(item.time).format('YYYY-MM-DD HH:mm');
                            // sln.solutionInfo.time = moment(sln.time).format('YYYY-MM-DD HH:mm');
                            return Promise.resolve({
                                _id: item._id,
                                name: item.taskInfo.name,
                                desc: item.taskInfo.desc,
                                time: moment(item.time).format('YYYY-MM-DD HH:mm'),
                                author: item.taskInfo.author
                                // taskInfo: item.taskInfo,
                                // taskState: item.taskState,
                                // solutionInfo: sln.solutionInfo
                            });
                        })
                        .catch(e => {
                            // 不因为一个出错而直接崩掉
                            return Promise.resolve({
                                _id: item._id,
                                taskInfo: item.taskInfo,
                                taskState: item.taskState
                            });
                        });
                }, {
                    concurrency: 30
                })
                .then(rsts => {
                    return Promise.resolve(rsts);
                });
        })
        .catch(e => {
            return Promise.reject(e);
        });
}

module.exports = taskDB;