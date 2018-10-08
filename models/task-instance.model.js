// 用于管理内存中的task instance
// 同时将更新保存到数据库中
// 要维持实例和db中的内容相同，更改后要保存到数据库中

// TODO 下一版将所有运行需要维护的信息都放在这里，统一维护和更新这里的数据

let ObjectID = require('mongodb').ObjectID;
let taskDB = require('../models/task.model');
let solutionDB = require('../models/solution.model');
// let AggreTaskModal = require('./aggreTask');
// let AggreSolutionModal = require('./aggreSolution');

let TaskInstanceManager = function () {

};

// TaskInstance 的构造函数，与model/Task 相同
// 此处把solution也放进来了，为了调用端异步流程的方便管理
TaskInstanceManager.TaskInstance = function (taskInstance) {
    if(taskInstance){
        for(let key in taskInstance){
            this[key] = taskInstance[key];
        }
        if(!taskInstance._id){
            this._id = new ObjectID();
        }
    }
    else{
        this._id = new ObjectID();
        this.taskCfg = {};
        this.taskInfo = {};
        this.taskState = {};
        this.MSState = [];
        this.time = (new Date()).getTime();
        this.solution = {};
    }
};

TaskInstanceManager.get = function (_id) {
    for(let i=0;i<global.taskInstanceColl.length;i++){
        if(global.taskInstanceColl[i]._id == _id){
            return global.taskInstanceColl[i];
        }
    }
    return null;
};

TaskInstanceManager.delete = function (_id, cb) {
    for(let i=0;i<global.taskInstanceColl.length;i++){
        if(global.taskInstanceColl[i]._id == _id){
            AggreTaskModal.update(global.taskInstanceColl[i],function (err, rst) {
                if(err){
                    return cb(err);
                }
                else{
                    global.taskInstanceColl.splice(i,1);
                    return cb(null,rst);
                }
            });
        }
    }
};

// 浅拷贝，共享内存
TaskInstanceManager.add = function (taskInstance) {
    if(TaskInstanceManager.get(taskInstance._id) == null){
        global.taskInstanceColl.push(taskInstance);
    }
};

// 同时更新 instance 和 db
TaskInstanceManager.update = function (taskInstance, cb) {
    for(let i=0;i<global.taskInstanceColl.length;i++){
        if(global.taskInstanceColl[i]._id == taskInstance._id){
            global.taskInstanceColl[i] = taskInstance;
            AggreTaskModal.update(taskInstance,function (err, rst) {
                if(err){
                    return cb(err);
                }
                else{
                    return cb(null,rst);
                }
            });
            break;
        }
    }
};

TaskInstanceManager.updateByID = function (_id, cb) {
    let taskInstance = TaskInstanceManager.get(_id);
    AggreTaskModal.update(taskInstance,function (err, rst) {
        if(err){
            return cb(err);
        }
        else{
            return cb(null,rst);
        }
    });
};

// deprecated
TaskInstanceManager.save = function (_id, cb) {
    let taskInstance = TaskInstanceManager.get(_id);
    AggreTaskModal.save(taskInstance,function (err, rst) {
        if(err){
            return cb(err);
        }
        else {
            return cb(rst);
        }
    })
};

// 调用情景：点击开始运行、某一个MS崩溃掉、运行结束
TaskInstanceManager.updateTaskState = function (_id, state, cb) {
    let task = TaskInstanceManager.get(_id);
    if(task){
        task.taskState = state;
        AggreTaskModal.update(task,function (err, rst) {
            if(err){
                return cb(err);
            }
            else{
                return cb(null,rst);
            }
        });
    }
    else{
        return cb('Can\'t find this task by id');
    }
};

// 调用情景：开始分发、分发成功、分发失败
TaskInstanceManager.updateDataListState = function (_id, dispatchRst, cb) {
    let task = TaskInstanceManager.get(_id);
    if(task){
        for(let i=0;i<dispatchRst.length;i++){
            for(let j=0;j<task.taskCfg.dataList.length;j++){
                let data = task.taskCfg.dataList[j];
                if(data.gdid == dispatchRst[i].gdid){
                    if(dispatchRst[i].error){
                        data.state = DataState.failed;
                    }
                    else{
                        if(data.state == DataState.ready)
                            data.state = DataState.pending;
                    }
                    break;
                }
            }
        }
        AggreTaskModal.update(task,function (err, rst) {
            if(err){
                return cb(err);
            }
            else{
                return cb(null,rst);
            }
        });
    }
    else{
        return cb('Can\'t find this task by id');
    }
};

// 调用情景：开始分发、分发成功、分发失败
TaskInstanceManager.updateDataState = function (_id, gdid, state, cb) {
    let task = TaskInstanceManager.get(_id);
    if(task){
        for(let j=0;j<task.taskCfg.dataList.length;j++){
            let data = task.taskCfg.dataList[j];
            if(data.gdid == gdid && (data.isMid != null && data.isMid != true)){
                data.state = state;
                break;
            }
        }
        AggreTaskModal.update(task,function (err, rst) {
            if(err){
                return cb(err);
            }
            else{
                return cb(null,rst);
            }
        });
    }
    else{
        return cb('Can\'t find this task by id');
    }
};

// 调用情景：数据分发完成、取消断点、运行崩溃、运行结束
TaskInstanceManager.updateMSState = function (_id, MSID, state, cb) {
    let task = TaskInstanceManager.get(_id);
    let MSStateList = task.MSState;
    let hasFound = false;
    for(let i=0;i<MSStateList.length;i++){
        let msState = MSStateList[i];
        if(msState.MSID == MSID){
            hasFound = true;
            msState.state = state;
            break;
        }
    }
    if(!hasFound){
        MSStateList.push({
            MSID: MSID,
            state: state
        });
    }
    if(state == MSState.running){
        task.taskState = TaskState.running;
    }
    AggreTaskModal.update(task,function (err, rst) {
        if(err){
            return cb(err);
        }
        else{
            return cb(null,rst);
        }
    });
};

TaskInstanceManager.getServiceByID = function (_id, MSID, cb) {
    let task = TaskInstanceManager.get(_id);
    let solutionID = task.taskCfg.solutionID;
    AggreSolutionModal.getByOID(solutionID,function (err, solution) {
        if(err){
            return cb(err);
        }
        else{
            for(let i=0;i<solution.solutionCfg.serviceList.length;i++){
                let service = solution.solutionCfg.serviceList[i];
                if(service._id == MSID){
                    return cb(null,service);
                }
            }
            return cb(null,null);
        }
    })
};

TaskInstanceManager.getSolution = function (_id, cb) {
    let task = TaskInstanceManager.get(_id);
    let solutionID = task.taskCfg.solutionID;
    AggreSolutionModal.getByOID(solutionID,function (err, solution) {
        if(err){
            return cb(err);
        }
        else{
            return cb(null,solution);
        }
    })
};

module.exports = TaskInstanceManager;