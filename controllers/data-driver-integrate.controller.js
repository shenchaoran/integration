let RequestCtrl = require('./request.controller');
let DataCtrl = require('./data.controller');
let solutionDB = require('../models/solution.model');
let taskDB = require('../models/task.model');
let setting = require('../config/setting');
let uuid = require('node-uuid');
let WebSocketCtrl = require('./web-socket.controller');
let TaskInstanceManager = require('../models/task-instance.model');
let postal = require('postal');
let ServiceCtrl = require('./service.controller');

let Path = require('path');
let fs = require('fs');
let ObjectID = require('mongodb').ObjectID;
let qs = require('querystring');
let _ = require('lodash');
let Promise = require('bluebird');

// DataState = READY PENDING.FETCH PENDING.DISPATCH RECEIVED FAILED
// TaskState = CONFIGURED RUNNING END FINISHED COLLAPSED PAUSE
// MSState = UNREADY PENDING PAUSE RUNNING COLLAPSED SUCCEED

module.exports = function DataDriver(task) {
    this.channel = postal.channel(task._id);
    this.task = task;

    _emit = (event, msg) => {
        WebSocketCtrl.emit(this.task._id, event, JSON.stringify(msg));
    }

    _updateInstance = () => {
        return taskDB.updateDoc(this.task);
    }

    // 传输数据，每完成一步都要更新到数据库中
    transferData = () => {
        let toDispatchedStub = [];
        _
            .chain(this.task.MSState)
            .filter(msState => msState.state === 'UNREADY')
            .map(msState => {
                toDispatchedStub = _
                    .chain(this.task.taskCfg.dataList)
                    .filter(stub => stub.MSID === msState.MSID && stub.state === 'READY')
                    .concat(toDispatchedStub)
                    .value();
            })
            .value();

        if (toDispatchedStub.length) {
            Promise.map(toDispatchedStub, (stub) => {
                let geodata;
                return new Promise((resolve, reject) => {
                    stub.state = 'PENDING.FETCH';
                    _updateInstance()
                        .then(rst => {
                            _emit('data dispatched', {
                                error: null,
                                dispatchRst: [{
                                    gdid: stub.id,
                                    MSID: stub.MSID,
                                    stateID: stub.stateID,
                                    eventName: stub.eventName,
                                    error: null
                                }]
                            });
                            return DataCtrl.fetchData(stub);
                        })
                        .then(dataDoc => {
                            geodata = dataDoc;
                            stub.state = 'PENDING.DISPATCH';
                            stub._id = dataDoc._id.toString();
                            return _updateInstance()
                        })
                        .then(rst => {
                            // _emit('')
                            return DataCtrl.dispatchData(geodata, stub.to);
                        })
                        .then((res) => {
                            stub.id = res.id;
                            stub.pid = res.pid;
                            stub.fname = res.fname;
                            stub.state = 'RECEIVED';
                            return _updateInstance()
                        })
                        .then(rst => {
                            _emit('data downloaded', {
                                error: null,
                                downloadRst: {
                                    // gdid: stub.id,
                                    MSID: stub.MSID,
                                    stateID: stub.stateID,
                                    eventName: stub.eventName,
                                    state: 'RECEIVED'
                                }
                            });
                            return Promise.resolve();
                        })
                        .then(() => {
                            let service = _.find(this.task.solution.solutionCfg.serviceList, item => item._id === stub.MSID);
                            let rst = _isServiceReady(service);
                            if (rst.ready) {
                                invokeService(service.host, service.port, rst.form, service.serviceType);
                            }
                        })
                        .catch(e => {
                            stub.state = 'FAILED';
                            return _updateInstance()
                                .then(rst => {
                                    // _emit('')
                                    return resolve();
                                });
                            console.log(e);
                        })
                });
            }, {
                concurrency: 5
            });
        }

        _.map(this.task.solution.solutionCfg.serviceList, service => {
            let item = _.find(this.task.MSState, msState => msState.state === 'UNREADY' && msState.MSID === service._id);
            if (item) {
                let rst = _isServiceReady(service);
                if (rst.ready) {
                    invokeService(service.host, service.port, rst.form, service.serviceType);
                }
            }
        });
    };

    invokeService = (host, port, form, serviceType) => {
        let url;
        let msState = _.find(this.task.MSState, state => state.MSID === form.insID);
        msState.state = 'PENDING';
        _updateInstance()
            .then(rst => {
                _emit('service starting', {
                    error: null,
                    MSinsID: form.insID
                });
                if (serviceType === 'model') {
                    url = `http://${host}:${port}/modelser/${form.id}`;
                } else if (serviceType === 'data map') {
                    url = `http://${host}:${port}/datamap/use/call`;
                } else if (serviceType === 'data refactor') {
                    url = `http://${host}:${port}/refactor/call`;
                }
                console.log(url, form);
                return RequestCtrl.get(url, form, false, true)
            })
            .then(res => {
                let msr_id;
                if(serviceType === 'model') {
                    res = JSON.parse(res);

                    if (res.result === 'suc') {
                        msr_id = res.data;
                    } else {
                        return Promise.reject(res);
                    }
                }
                else {
                    msr_id = res;
                }
                scanProgress(host, port, serviceType, msr_id, form.insID, form.callType);
            })
            .catch(e => {
                // TODO retry
                console.log(e);
                msState.state = 'COLLAPSED';
                _updateInstance()
                    .then(rst => {
                        _emit('service stoped', {
                            error: null,
                            MSinsID: form.insID,
                            MSState: 'COLLAPSED',
                            newDataList: []
                        });
                    });
            });
    };

    scanProgress = (host, port, serviceType, cfg, MSinsID, callType) => {
        let url;
        let form;
        // 0: unfinished;   1: run succeed;     -1: run failed
        let end;
        let output = [];
        if (serviceType === 'model') {
            url = `http://${host}:${port}/modelserrun/json/${cfg}`;
            form = undefined;
            end = (res) => {
                res = JSON.parse(res);
                if (res.result == 'err') {
                    console.log(res.message);
                    return 0;
                } else if (res.result == 'suc') {
                    let msr = res.data;
                    if (msr.msr_span !== 0) {
                        output = msr.msr_output;
                        return msr.msr_status;
                    } else {
                        return 0;
                    }
                }
            };
        } else {
            if (serviceType === 'data map') {
                url = `http://${host}:${port}/common/records`;
                form = {
                    type: 'datamap',
                    guid: cfg
                };
            }
            else if (serviceType === 'data refactor') {
                url = `http://${host}:${port}/common/records`;
                form = {
                    type: 'refactor',
                    guid: cfg
                };
            }
            end = (res) => {
                if (res === '[]' || res === '') {
                    return 0;
                } else {
                    res = JSON.parse(res);
                    let msr = res[0];
                    output = msr.output;
                    if(serviceType === 'data map') {
                        _.map(output, output => {
                            output.Event = callType === 'udx2src'? 'Source': 'UDX'
                        });
                    }
                    else if(serviceType === 'data refactor') {

                    }
                    return msr.status === '1' ? 1 : -1;
                }
            }
        }

        let polling = () => {
            RequestCtrl.get(url, form, false, true)
                .then(res => {
                    let endState = end(res);
                    if (endState === 0) {
                        setTimeout(polling, 5000);
                    } else {
                        let newStubs;
                        if (endState === 1) {
                            msState.state = 'SUCCEED';
                            newStubs = _output2Stubs(host, port, MSinsID, output, serviceType);
                            this.task.taskCfg.dataList = _.concat(this.task.taskCfg.dataList, newStubs);
                        } else if (endState === -1) {
                            msState.state = 'COLLAPSED';
                        }

                        _updateInstance()
                            .then(() => {
                                _emit('service stoped', {
                                    error: null,
                                    MSinsID: MSinsID,
                                    MSState: endState === 1 ? 'SUCCEED' : 'COLLAPSED',
                                    newDataList: newStubs
                                });

                                transferData();
                            });
                    }
                })
                .catch(e => {
                        console.log(e);
                });
        };

        let msState = _.find(this.task.MSState, state => state.MSID === MSinsID);
        msState.state = 'RUNNING';
        _updateInstance()
            .then(rst => {
                _emit('service started', {
                    error: null,
                    MSinsID: MSinsID
                });
                polling();
            })
    };

    // 检查模型运行数据是否准备完成
    _isServiceReady = (service) => {
        let ready = false;
        let form;
        var url;
        if (service.serviceType === 'model') {
            let inputs = [];
            let outputs = [];
            let events = ServiceCtrl.getEvents(service);
            ready = true;
            _.map(events, event => {
                if (!ready) {
                    return;
                }
                if (event._$.type === 'response') {
                    let stub = _
                        .chain(this.task.taskCfg.dataList)
                        .find(stub => stub.MSID === service._id && stub.stateID === event.stateID && stub.eventName === event._$.name)
                        .value();
                    if (stub && stub.state === 'RECEIVED') {
                        inputs.push({
                            DataId: stub.id,
                            Event: event._$.name,
                            Optional: parseInt(event._$.optional),
                            StateId: event.stateID,
                            StateName: event.stateName,
                            StateDes: event.stateDes
                        });
                    } else if (
                        event._$.optional === 0 
                        || event._$.optional === undefined 
                        || event._$.optional === '0' 
                        || event._$.optional === false 
                        || event._$.optional === 'false'
                        || event._$.optional === 'False'
                    ) {
                        ready = false;
                    }
                    else {
                        inputs.push({
                            DataId: '',
                            Event: event._$.name,
                            Optional: 1,
                            StateId: event.stateID,
                            StateName: event.stateName,
                            StateDes: event.stateDes
                        })
                    }
                } else if (event._$.type === 'noresponse') {
                    outputs.push({
                        StateName: event.stateName,
                        StateDes: event.stateDes,
                        StateId: event.stateID,
                        Event: event._$.name,
                        Tag: ''
                    });
                }
            });
            form = {
                ac: 'run',
                inputdata: JSON.stringify(inputs),
                outputdata: JSON.stringify(outputs),
                // 除了调用时用到的是原始id，其他地方用到的全是 instance id
                id: service.MS._id,
                insID: service._id
            };
        } else if (service.serviceType === 'data map') {
            let events = ServiceCtrl.getEvents(service);
            _.map(events, event => {
                if (ready) {
                    return;
                }
                if (event.type === 'in') {
                    var stub = _
                        .chain(this.task.taskCfg.dataList)
                        .find(stub => stub.MSID === service._id && stub.stateID === event.stateID && stub.eventName === event.name)
                        .value();
                    if (stub && stub.state === 'RECEIVED') {
                        ready = true;
                        form = {
                            id: service.DS._id,
                            insID: service._id,
                            in_oid: stub.id,
                            in_filename: stub.fname,
                            out_dir: stub.pid ? stub.pid : -1,
                            // TODO file MIME type 写死了
                            out_filename: (new ObjectID().toHexString()) + '.xml',
                            callType: service.callType
                        };
                    }
                }
            });
        } else if (service.serviceType === 'data refactor') {
            let params = [];
            let events = ServiceCtrl.getEvents(service);
            let pid;
            ready = true;
            _.map(events, event => {
                if (!ready) {
                    return;
                }
                if (event.type === 'in') {
                    let stub = _
                        .chain(this.task.taskCfg.dataList)
                        .find(stub => stub.MSID === service._id && stub.stateID === event.stateID && stub.eventName === event.name)
                        .value();
                    if (stub && stub.state === 'RECEIVED') {
                        pid = stub.pid;
                        params.push({
                            oid: stub.id,
                            filename: stub.fname,
                            pid: stub.pid ? stub.pid : -1,
                            iotype: 'in'
                        });
                    } else {
                        ready = false;
                    }
                } else if (event.type === 'out') {
                    params.push({
                        // TODO file MIME type 写死了
                        filename: (new ObjectID().toHexString()) + '.xml',
                        pid: pid ? pid : -1,
                        iotype: 'out'
                    });
                }
            });

            form = {
                id: service.DS._id,
                insID: service._id,
                method: service.DS.method,
                params: params
            };
        }

        return {
            ready: ready,
            form: form
        };
    };

    _output2Stubs = (host, port, MSinsID, outputs, serviceType) => {
        var stubs = [];
        if (serviceType === 'model') {
            _.map(outputs, output => {
                stubs.push({
                    from: {
                        host: host,
                        port: port,
                        posType: 'MSC',
                        id: output.DataId
                    },
                    state: 'RECEIVED',
                    isMid: true,
                    isInput: false,
                    eventName: output.Event,
                    stateID: output.StateId,
                    MSID: MSinsID,
                    id: output.DataId
                });
                let toNodes = _get2Node(MSinsID, output.StateId, output.Event);
                _.map(toNodes, toNode => {
                    stubs.push({
                        from: {
                            host: host,
                            port: port,
                            posType: 'MSC',
                            id: output.DataId
                        },
                        to: {
                            host: toNode.host,
                            port: toNode.port,
                            serviceType: toNode.serviceType
                        },
                        state: (toNode.host === host && toNode.port === port) ? 'RECEIVED' : 'READY',
                        isInput: false,
                        eventName: toNode.eventName,
                        stateID: toNode.stateID,
                        MSID: toNode.MSID,
                        id: output.DataId
                    });
                });
            });
        } else {
            let stateID;
            let service = _.find(this.task.solution.solutionCfg.serviceList, service => service._id === MSinsID);
            let events = ServiceCtrl.getEvents(service, {
                type: 'out'
            });
            if (serviceType === 'data map') {
                stateID = 'data map state';
            }
            else if (serviceType === 'data refactor') {
                stateID = 'data refactor state';
            }
            _.map(outputs, (output, i) => {
                stubs.push({
                    from: {
                        host: host,
                        port: port,
                        posType: 'DSC',
                        id: output.oid
                    },
                    state: 'RECEIVED',
                    isInput: false,
                    isMid: true,
                    // TODO 映射都是一个输入一个输出，所以eventName 固定为 Source/UDX
                    eventName: events[i].name,
                    stateID: stateID,
                    MSID: MSinsID,
                    id: output.oid,
                    fname: output.filename
                });
                let toNodes = _get2Node(MSinsID, stateID, events[i].name);
                _.map(toNodes, toNode => {
                    stubs.push({
                        from: {
                            host: host,
                            port: port,
                            posType: 'DSC',
                            id: output.oid
                        },
                        to: {
                            host: toNode.host,
                            port: toNode.port,
                            serviceType: toNode.serviceType
                        },
                        state: (toNode.host === host && toNode.port === port) ? 'RECEIVED' : 'READY',
                        isInput: false,
                        eventName: toNode.eventName,
                        stateID: toNode.stateID,
                        MSID: toNode.MSID,
                        id: output.oid,
                        fname: output.filename
                    });
                });
            });
        } 
        return stubs;
    }

    _get2Node = (MSinsID, stateID, eventName) => {
        var toNodes = [];
        let relations = _.get(this.task, 'solution.solutionCfg.relationList');
        if (relations) {
            _
                .chain(relations)
                .map(relation => {
                    var from = relation.from;
                    if (from.MSID === MSinsID && from.stateID === stateID && from.eventName === eventName) {
                        let service = _.find(this.task.solution.solutionCfg.serviceList, service => service._id === relation.to.MSID);
                        toNodes.push({
                            host: service.host,
                            port: service.port,
                            serviceType: service.serviceType,
                            MSID: service._id,
                            stateID: relation.to.stateID,
                            eventName: relation.to.eventName
                        });
                    }
                })
                .value();
        }
        return toNodes;
    }

    this.start = () => {
        transferData();
    };
}