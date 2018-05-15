/**
 * Created by SCR on 2017/8/2.
 */
/*jshint esversion: 6 */
let CanvasJS = require('./CanvasJS');

module.exports = (function () {
    __HeaderHeight = 40;
    __SubHeaderHeight = 40;

    __webixModelList = null;
    __webixDataList = null;

    __webixSelectedModelList = null;
    __webixSelectedDataMapList = null;
    __webixSelectedDataRefactorList = null;

    adjustWebixTreeHeight = (id) => {
        let height = $($$(id).$view).find('.webix_scroll_cont').height();
        if (height < 400) {
            $$(id).define('height', height);
            $$(id).resize();
        }
    }

    onTreeItemChecked = (webixTree, withChild, webixBtn) => {
        webixTree.attachEvent('onItemClick', function (id) {
            let hasChecked = false;
            let checked = this.getChecked();
            for (let i = 0; i < checked.length; i++) {
                if (checked[i] == id) {
                    hasChecked = true;
                    break;
                }
            }
            if (!hasChecked) {
                this.checkItem(id);
            } else {
                this.uncheckItem(id);
            }

            if (withChild) {
                if (webixTree.getItem(id).open) {
                    webixTree.close(id);
                } else {
                    webixTree.open(id);
                }
            }
        });
        webixTree.attachEvent('onItemCheck', function (id) {
            if (this.getChecked().length == 0)
                $(webixBtn.$view).find('button').attr('disabled', true);
            else
                $(webixBtn.$view).find('button').attr('disabled', false);
        });
    };

    getServiceListDetail = (type, services, cb) => {
        $('#global-loading-div').show();
        $.ajax({
                url: '/integration/network/serviceListDetail?type=' + type,
                type: 'GET',
                dataType: 'json',
                data: {
                    services: _.map(services, item => {
                        return {
                            _id: item._id,
                            host: item.host,
                            port: item.port
                        };
                    })
                }
            })
            .done(function (res) {
                $('#global-loading-div').hide();
                _.map(services, service => {
                    _.map(res.serviceListDetail, detail => {
                        if(service._id === detail.detail._id) {
                            detail.detail.MS = service;
                        }
                    });
                });
                return cb(null, res.serviceListDetail);
            })
            .fail(function (err) {
                $('#global-loading-div').hide();
                __addNotice(__NoticeType.warning, 'Get services detail information failed!<br><pre>' + JSON.stringify(err, null, 4) + '</pre>');
                return cb(err);
            });
    };

    // ajax request service list
    ajaxGetServices = (type, cb) => {
        if (type == 'model') {
            formID = '#div-model-Node form';
        } else if (type == 'data' || type == 'data map' || type == 'data refactor') {
            formID = '#div-data-Node form';
        }

        let formData = __serialize(formID);
        $.ajax({
                url: `/integration/network/services?type=${type}&${$(formID).serialize()}`,
                type: 'GET',
                dataType: 'json'
            })
            .done(function (res) {
                $('#global-loading-div').hide();
                if (res.error) {
                    __addNotice(__NoticeType.warning, 'Fail to get ' + type + ' services of \'' + formData.host + '\'!<br><pre>' + JSON.stringify(res.error, null, 4) + '</pre>');
                    return cb(res.error);
                } else {
                    __addNotice(__NoticeType.notice, 'Fetch ' + type + ' services successed!');
                    let itemData = {
                        host: formData.host,
                        port: formData.port,
                        serviceList: res.services
                    };

                    return cb(null, type, itemData);
                }
            })
            .fail(function (error) {
                $('#global-loading-div').hide();
                __addNotice(__NoticeType.warning, 'Fetch ' + type + ' services failed!<br><pre>' + JSON.stringify(error, null, 4) + '</pre>');
                return cb(error);
            });
    };

    return {
        __buildTab12List: function (type, itemData, cb) {
            let self = this;

            if (type == 'model') {
                let accoItems = __webixModelList.getChildViews();
                for (let i = 0; i < accoItems.length; i++) {
                    accoItems[i].collapse();
                }

                let templateKey = '#value#';
                let __webixList = __webixModelList;
                let __webixSelectedList = __webixSelectedModelList;
                let serviceList = itemData.serviceList;
                let width = $$('div-model-list-accordion').config.width;
                let accordionItem = {
                    id: itemData.host + ':' + itemData.port,
                    view: 'accordionitem',
                    header: itemData.host + ':' + itemData.port,
                    headerHeight: __HeaderHeight,
                    headerAltHeight: __HeaderHeight,
                    // width: width,
                    body: {
                        rows: [
                            {
                                rows: [
                                    {
                                        id: itemData.host + '-' + itemData.port + '-filter',
                                        view: 'text',
                                        placeholder: 'Filter',
                                        width: width
                                    },
                                    {
                                        id: itemData.host + '-' + itemData.port + '-tree',
                                        view: 'tree',
                                        // width: width,
                                        select: true,
                                        multiselect: true,
                                        // height: 400,
                                        autoheight: true,
                                        maxHeight: 400,
                                        // autowidth: true,
                                        // autoheight: true,
                                        editable: false,
                                        data: serviceList,
                                        filterMode: {
                                            showSubItems: true,
                                            level: 1
                                        },
                                        template: "{common.checkbox()}<span>" + templateKey + "</span>"
                                    }
                                ]
                            },
                            {
                                margin: 15,
                                cols: [{},
                                    {
                                        id: itemData.host + '-' + itemData.port + '-btn',
                                        view: 'button',
                                        value: 'Add',
                                        width: 80,
                                        inputWidth: 60
                                    }
                                ]
                            }
                        ]
                    }
                };

                __webixList.addView(accordionItem);
                adjustWebixTreeHeight(itemData.host + '-' + itemData.port + '-tree');
                $$(itemData.host + '-' + itemData.port + '-filter').attachEvent('onTimedKeyPress', function () {
                    $$(itemData.host + '-' + itemData.port + '-tree').filter(templateKey, this.getValue());
                });
                let webixBtn = $$(itemData.host + '-' + itemData.port + '-btn');
                let webixTree = $$(itemData.host + '-' + itemData.port + '-tree');
                onTreeItemChecked(webixTree, false, webixBtn);

                webixBtn.attachEvent('onItemClick', function () {
                    self.__addSelectedClick('model', webixTree, itemData.host, itemData.port);
                });
            } else if (type == 'data') {
                let accoItems = __webixDataList.getChildViews();
                for (let i = 0; i < accoItems.length; i++) {
                    accoItems[i].collapse();
                }

                let templateKey = '#name#';
                let mapServiceList = itemData.serviceList.dataMapServices;
                let refactorServiceList = itemData.serviceList.refactorServices;

                if (mapServiceList.error != null) {
                    __addNotice(__NoticeType.warning, 'Fetch data services failed!<br><pre>' + JSON.stringify(mapServiceList.error, null, 4) + '</pre>');
                }
                if (refactorServiceList.error != null) {
                    __addNotice(__NoticeType.warning, 'Fetch data services failed!<br><pre>' + JSON.stringify(refactorServiceList.error, null, 4) + '</pre>');
                }

                let mapTreeCfg = mapServiceList.error ? {
                    template: 'Error'
                } : mapServiceList.data.length === 0 ? {
                    template: 'No data'
                } : {
                    id: itemData.host + '-' + itemData.port + '-data-map-tree',
                    view: 'tree',
                    select: true,
                    type: {
                        height: 'auto'
                    },
                    multiselect: true,
                    minHeight: 150,
                    // height: 400,
                    // maxHeight: 200,
                    autoheight: true,
                    editable: false,
                    data: mapServiceList.data,
                    filterMode: {
                        showSubItems: true,
                        level: 1
                    },
                    template: " {common.checkbox()}<span>" + templateKey + "</span>"
                };
                let refactorTreeCfg = refactorServiceList.error ? {
                    template: 'Error'
                } : refactorServiceList.data.length === 0 ? {
                    template: 'No data'
                } : {
                    id: itemData.host + '-' + itemData.port + '-data-refactor-tree',
                    view: 'tree',
                    template: (obj, common) => {
                        if (obj.$level === 1) {
                            return common.icon(obj, common) + '<span>' + obj.name + '</span>'
                        } else {
                            return common.icon(obj, common) + common.checkbox(obj, common) + '<span>' + obj.name + '</span>'
                        }
                    },
                    editable: false,
                    select: true,
                    type: {
                        height: 'auto'
                    },
                    multiselect: true,
                    minHeight: 150,
                    // height: 400,
                    // maxHeight: 200,
                    autoheight: true,
                    data: _.map(refactorServiceList.data, service => {
                        return {
                            id: service._id,
                            name: service.name,
                            webix_kids: true
                            // data: [],
                            // service: service
                        };
                    }),
                    filterMode: {
                        showSubItems: true,
                        level: 1
                    }
                }

                let accordionItem = {
                    id: itemData.host + ':' + itemData.port,
                    view: 'accordionitem',
                    header: itemData.host + ':' + itemData.port,
                    headerHeight: __HeaderHeight,
                    headerAltHeight: __HeaderHeight,
                    adjust: true,
                    body: {
                        rows: [{
                                height: 400,
                                rows: [
                                    // {
                                    //     id: itemData.host + '-' + itemData.port + '-data-map-filter',
                                    //     view: 'text',
                                    //     placeholder: 'Filter'
                                    // },
                                    {
                                        rows: [{
                                                autoheight: true,
                                                template: 'Data Map List'
                                            },
                                            mapTreeCfg
                                        ]
                                    },
                                    {
                                        view: 'resizer'
                                    },
                                    // {
                                    //     id: itemData.host + '-' + itemData.port + '-data-refactor-filter',
                                    //     view: 'text',
                                    //     placeholder: 'Filter'
                                    // },
                                    {
                                        rows: [{
                                                autoheight: true,
                                                template: 'Data Refactor List'
                                            },
                                            refactorTreeCfg
                                        ]
                                    },
                                ]
                            },
                            {
                                minHeight: 40,
                                cols: [{},
                                    {
                                        id: itemData.host + '-' + itemData.port + '-data-btn',
                                        view: 'button',
                                        value: 'Add',
                                        width: 80,
                                        inputWidth: 60
                                    }
                                ]
                            }
                        ]
                    }
                };
                __webixDataList.addView(accordionItem);
                adjustWebixTreeHeight(itemData.host + '-' + itemData.port + '-data-map-tree');
                adjustWebixTreeHeight(itemData.host + '-' + itemData.port + '-data-refactor-tree');

                let webixBtn = $$(itemData.host + '-' + itemData.port + '-data-btn');
                let mapTree = $$(itemData.host + '-' + itemData.port + '-data-map-tree');
                let refactorTree = $$(itemData.host + '-' + itemData.port + '-data-refactor-tree');
                if (mapServiceList.error == null && mapServiceList.data.length != 0) {
                    // filter
                    // $$(itemData.host + '-' + itemData.port + '-data-map-filter').attachEvent('onTimedKeyPress', function() {
                    //     $$(itemData.host + '-' + itemData.port + '-data-map-tree').filter(templateKey, this.getValue());
                    // });
                    onTreeItemChecked(mapTree, false, webixBtn);
                }
                if (!refactorServiceList.error && refactorServiceList.data.length) {
                    onTreeItemChecked(refactorTree, true, webixBtn);
                    // refactorTree.attachEvent('onBeforeOpen', (id) => {
                    //     console.log(refactorTree.getItem(id));
                    // });
                    webix.extend(refactorTree, webix.ProgressBar);
                    refactorTree.attachEvent('onDataRequest', (id) => {
                        let refactorNode = refactorTree.getItem(id);
                        refactorTree.showProgress();
                        webix.delay(() => {
                            webix.ajax().get('/integration/network/dataRefactorMethods', {
                                    host: itemData.host,
                                    port: itemData.port,
                                    id: id
                                })
                                .then((d) => {
                                    refactorTree.hideProgress();
                                    let res = d.json();
                                    if (res.error) {
                                        __addNotice(__NoticeType.warning, 'Fetch data refactor methods failed!<br><pre>' + JSON.stringify(res.error, null, 4) + '</pre>');
                                    } else {
                                        if (!_.isArray(res.methods.Method)) {
                                            res.methods.Method = [res.methods.Method];
                                        }
                                        let children = _.map(res.methods.Method, method => {
                                            return {
                                                method: method,
                                                id: method.$.name,
                                                name: method.$.name,
                                                refactorId: id
                                            };
                                        });
                                        refactorTree.parse({
                                            parent: id,
                                            data: children
                                        });
                                    }
                                })
                                .fail((e) => {
                                    refactorTree.hideProgress();
                                    __addNotice(__NoticeType.warning, 'Fetch data refactor methods failed!<br><pre>' + JSON.stringify(e, null, 4) + '</pre>');
                                });
                        })
                    });
                }
                webixBtn.attachEvent('onItemClick', function () {
                    self.__addSelectedClick('data map', mapTree, itemData.host, itemData.port);
                    self.__addSelectedClick('data refactor', refactorTree, itemData.host, itemData.port);
                });
            }

            if (cb) {
                cb();
            }
        },

        __addSelectedClick: function (serviceType, webixTree, host, port) {
            let self = this;
            let selectedWebixList;

            // $('#canvas').unbind();
            getNewItems = () => {
                let serviceList = [];
                let msIDList = webixTree.getChecked();
                for (let i = 0; i < msIDList.length; i++) {
                    let hasInserted = false;
                    let treeItem = webixTree.getItem(msIDList[i]);
                    if(treeItem.$level === 1 && serviceType === 'data refactor') {
                        continue;
                    }
                    let itemID = selectedWebixList.getFirstId();
                    while (itemID) {
                        let item = selectedWebixList.getItem(itemID);
                        if (item._id == treeItem._id) {
                            hasInserted = true;
                            break;
                        }
                        itemID = selectedWebixList.getNextId(itemID);
                    }
                    if (!hasInserted) {
                        treeItem.serviceType = serviceType;
                        treeItem.host = host;
                        treeItem.port = port;
                        var service = _.cloneDeep(treeItem);
                        delete service.$count;
                        delete service.$level;
                        delete service.$parent;
                        delete service.id;
                        serviceList.push(service);
                    }
                }
                if (serviceList.length == 0) {
                    __addNotice(__NoticeType.notice, `No ${serviceType} services selected!`);
                    return [];
                }
                return serviceList;
            }
            if (serviceType == 'model') {
                // __webixSelectedModelList.clearAll();
                selectedWebixList = __webixSelectedModelList;
                var serviceList = getNewItems();
                getServiceListDetail(serviceType, serviceList, (err, serviceListDetail) => {
                    for (let i = 0; i < serviceListDetail.length; i++) {
                        if (serviceListDetail[i].error) {
                            __addNotice(__NoticeType.warning, 'Failed to get service detail!<br><pre>' + JSON.stringify(serviceListDetail[i].error) + '</pre>');
                        } else {
                            serviceListDetail[i].detail.serviceType = serviceType;
                            selectedWebixList.add(serviceListDetail[i].detail);
                        }
                    }
                    selectedWebixList.refresh();
                    $('#webix-AggreMS-list .webix_list_item').attr('draggable', true);
                    let dnd = self.__Dnd();
                    dnd.init();
                    __addNotice(__NoticeType.notice, 'Add model services succeed!');
                });
            } else {
                if (serviceType == 'data map') {
                    selectedWebixList = __webixSelectedDataMapList;
                } 
                else if (serviceType == 'data refactor') {
                    selectedWebixList = __webixSelectedDataRefactorList;
                }
                var serviceList = getNewItems();
                _.map(serviceList, service => {
                    selectedWebixList.add(service);
                });
                selectedWebixList.refresh();
                $('#webix-AggreMS-list .webix_list_item').attr('draggable', true);
                let dnd = self.__Dnd();
                dnd.init();
                __addNotice(__NoticeType.notice, `Add ${serviceType} services succeed!`);
            }
        },

        __Dnd: function () {
            return {
                init: function () {
                    let self = this;
                    // 要不然会重复添加
                    $('#canvas').unbind();
                    self.src = $('.webix_list_item');
                    self.dst = $('#canvas');
                    $(self.src).on('dragstart', self.onDragStart);
                    $(self.dst).on('dragenter', self.onDragEnter);
                    $(self.dst).on('dragover', self.onDragOver);
                    $(self.dst).on('dragleave', self.onDragLeave);
                    $(self.dst).on('drop', self.onDrop);
                },
                onDragStart: function (e) {
                    console.log('in drag start');

                    function isParent(obj, parentObj) {
                        while (obj != undefined && obj != null && obj.tagName.toUpperCase() != 'BODY') {
                            if (obj == parentObj) {
                                return true;
                            }
                            obj = obj.parentNode;
                        }
                        return false;
                    }
                    let modelListView = __webixSelectedModelList.$view;
                    let dataMapListView = __webixSelectedDataMapList.$view;
                    let dataRefactorListView = __webixSelectedDataRefactorList.$view;
                    let type = null;
                    if (isParent(e.target, modelListView)) {
                        type = 'model';
                    } else if (isParent(e.target, dataMapListView)) {
                        type = 'data map';
                    }
                    else if(isParent(e.target, dataRefactorListView)){
                        type = 'data refactor';
                    }
                    let data = $(e.target).index() + '---' + type;
                    e.dataTransfer = e.originalEvent.dataTransfer;
                    e.dataTransfer.setData('text/plain', data);
                    return true;
                },
                onDragEnter: function (e) {
                    return true;
                },
                onDragLeave: function (e) {
                    return true;
                },
                onDragOver: function (e) {
                    return false;
                },
                onDrop: function (e) {
                    console.log('in drag stop');
                    e.dataTransfer = e.originalEvent.dataTransfer;
                    let data = e.dataTransfer.getData('text/plain');
                    data = data.split('---');
                    data[0] = +data[0];
                    let type = data[1];
                    let webixList = null;
                    if (type == 'model') {
                        webixList = __webixSelectedModelList;
                    } else if (type == 'data map') {
                        webixList = __webixSelectedDataMapList;
                    }
                    else if(type == 'data refactor'){
                        webixList = __webixSelectedDataRefactorList;
                    }
                    let SADLService = webixList.getItem(webixList.getIdByIndex(data[0]));
                    CanvasJS.addServiceRole(SADLService);
                }
            };
        },

        init: function () {
            let self = this;
            webix.locale.pager = {
                first: "<<",
                last: ">>",
                next: ">",
                prev: "<"
            };

            __webixModelList = new this.initTab12('div-model-list');
            __webixDataList = new this.initTab12('div-data-list');
            this.initTab3();

            this.requestServiceList('model', function (err, itemData) {
                if (err) {

                } else {
                    self.__buildTab12List('model', itemData);
                }
            });
            this.requestServiceList('data', function (err, itemData) {
                if (err) {

                } else {
                    self.__buildTab12List('data', itemData);
                }
            });

        },

        // create empty view DOM of tab 1 and tab 2
        initTab12: function (containerID) {
            return (function () {
                let width = null;
                let height = null;
                let top = null;

                // if(containerID == 'div-model-list'){
                //     top = __getElementTop($('#div-model-list')[0]);
                width = $('#div-model-Node .sidebar-body').width();
                // top = __getHiddenHeight($('#div-model-Node .sidebar-header'));
                // height = $('#div-model-Node .sidebar-body').height() - $('#div-model-Node .sidebar-header').height() - 10;
                // }
                // else if(containerID == 'div-data-list'){
                //     top = __getElementTop($('#div-data-Node .add-div')[0]) + $('#div-model-Node .add-div').height();
                //     width = $('#div-data-Node').width() -16;
                // }

                height = window.innerHeight - 163;
                webix.ui({
                    container: containerID,
                    view: "scrollview",
                    scroll: false,
                    width: width,
                    height: height,
                    body: {
                        rows: [{
                            id: containerID + '-accordion',
                            view: 'accordion',
                            // width: width,
                            // height: height,
                            multi: true,
                            // width: width - 50,
                            rows: []
                        }]
                    }
                });

                return $$(containerID + '-accordion');
            })();
        },

        // request services list of model/data map/data refactor
        requestServiceList: function (type, cb) {
            let self = this;
            let formSelector = null;
            if (type == 'model') {
                formSelector = '#div-model-Node form';
            } else if (type == 'data') {
                formSelector = '#div-data-Node form';
            }
            $(formSelector).validate({
                onfocusout: function (element) {
                    $(element).valid();
                },
                focusInvalid: true,
                submitHandler: function (form) {
                    let formData = __serialize(form);
                    $('#global-loading-div').show();
                    ajaxGetServices(type, function (err, type, itemData) {
                        if (err) {
                            cb(err);
                        } else {
                            cb(null, itemData);
                        }
                    });
                }
            });
        },

        // create view DOM of tab 3
        initTab3: function () {
            let hHeight = $('#div-model-Node h4').height();
            let paddingTop = $('#div-model-Node h4').css('padding-top');
            paddingTop = +paddingTop.replace('px', '');
            let marginTop = $('#div-model-Node h4').css('margin-top');
            marginTop = +marginTop.replace('px', '');

            let width = $('#div-AggreMS h').width() - 1;
            let height = window.innerHeight - hHeight - paddingTop * 2 - marginTop * 2 - 20;
            webix.ui({
                id: 'tab3',
                type: 'space',
                container: 'webix-AggreMS-list',
                view: 'scrollview',
                scroll: 'xy',
                width: width,
                height: height,
                body: {
                    id: 'services-accordion',
                    view: 'accordion',
                    width: width,
                    multi: true,
                    rows: [{
                            id: 'model-services-accordion-item',
                            view: 'accordionitem',
                            header: 'Selected model services',
                            headerHeight: __HeaderHeight,
                            headerAltHeight: __HeaderHeight,
                            width: width,
                            collapsed: false,
                            body: {
                                id: 'model-services-list',
                                view: 'list',
                                autoheight: true,
                                yCount: 6,
                                select: false,
                                multiselect: false,
                                scroll: true,
                                editable: false,
                                data: [],
                                template: function (obj) {
                                    return obj.MS.ms_model.m_name;
                                }
                            }
                        },
                        {
                            id: 'data-map-services-accordion-item',
                            view: 'accordionitem',
                            header: 'Selected data map services',
                            headerHeight: __HeaderHeight,
                            headerAltHeight: __HeaderHeight,
                            width: width,
                            collapsed: false,
                            body: {
                                id: 'data-map-services-list',
                                view: 'list',
                                autoheight: true,
                                yCount: 6,
                                select: false,
                                multiselect: false,
                                scroll: 'y',
                                editable: false,
                                data: [],
                                template: function (obj) {
                                    return obj.name;
                                }
                            }
                        },
                        {
                            id: 'data-refactor-services-accordion-item',
                            view: 'accordionitem',
                            header: 'Selected data refactor services',
                            headerHeight: __HeaderHeight,
                            headerAltHeight: __HeaderHeight,
                            width: width,
                            // height: 300,
                            maxHeight: 300,
                            collapsed: false,
                            body: {
                                id: 'data-refactor-services-list',
                                view: 'list',
                                select: true,
                                multiselect: false,
                                scroll: 'y',
                                editable: false,
                                data: [],
                                template: function (obj) {
                                    return obj.name;
                                }
                            }
                        }
                    ]
                }
            });
            __webixSelectedModelList = $$('model-services-list');
            __webixSelectedDataMapList = $$('data-map-services-list');
            __webixSelectedDataRefactorList = $$('data-refactor-services-list');
        },

        importLayoutBySolution: function (solution) {
            let self = this;
            this.init();

            let computerNodeList = [];
            let serviceList = solution.solutionCfg.serviceList;
            for (let i = 0; i < serviceList.length; i++) {
                let hasInserted = false;
                for (let j = 0; j < computerNodeList.length; j++) {
                    if (computerNodeList[j].host == serviceList[i].host && computerNodeList[j].port == serviceList[i].port) {
                        hasInserted = true;
                    }
                }
                if (!hasInserted) {
                    computerNodeList.push({
                        host: serviceList[i].host,
                        port: serviceList[i].port,
                        serviceType: serviceList[i].serviceType
                    });
                }
            }
            window.importNode = {
                count: computerNodeList.length,
                index: 0
            };

            for (let i = 0; i < computerNodeList.length; i++) {
                let serviceType = computerNodeList[i].serviceType;
                if (serviceType == 'model') {
                    $('#model-host').attr('value', computerNodeList[i].host);
                    $('#model-port').attr('value', computerNodeList[i].port);
                    computerNodeList[i].widgetType = '';
                    computerNodeList[i].serviceName = 'MS';
                    computerNodeList[i].submitType = 'model';
                } else {
                    $('#data-host').attr('value', computerNodeList[i].host);
                    $('#data-port').attr('value', computerNodeList[i].port);
                    computerNodeList[i].serviceName = 'DS';
                    computerNodeList[i].submitType = 'data-map';
                    if (serviceType == 'data map') {
                        computerNodeList[i].widgetType = '-data-map';
                    }
                    else if(serviceType == 'data refactor') {
                        computerNodeList[i].widgetType = '-data-refactor';
                    }
                } 

                ajaxGetServices(serviceType, function (err2, type2, itemData2) {
                    if (err2) {
                        console.log(err2);
                    } else {
                        self.__buildTab12List(type2, itemData2, function () {
                            let webixTree = $$(computerNodeList[i].host + '-' + computerNodeList[i].port + computerNodeList[i].widgetType + '-tree');
                            for (let j = 0; j < serviceList.length; j++) {
                                if (serviceList[j].host == computerNodeList[i].host && serviceList[j].port == computerNodeList[i].port) {
                                    let itemID = webixTree.getFirstId();
                                    while (itemID) {
                                        item = webixTree.getItem(itemID);
                                        if (item._id == serviceList[j][computerNodeList[i].serviceName]._id) {
                                            webixTree.checkItem(itemID);
                                            break;
                                        }
                                        itemID = webixTree.getNextId(itemID);
                                    }
                                }
                            }
                            let webixBtn = $$(computerNodeList[i].host + '-' + computerNodeList[i].port + computerNodeList[i].widgetType + '-btn');
                            // $($(webixBtn.$view).find('button')).click();
                            $(webixBtn.$view).click(function (e) {
                                e.preventDefault();
                                e.stopPropagation();
                                self.__addSelectedClick(computerNodeList[i].serviceType, webixTree, computerNodeList[i].host, computerNodeList[i].port);
                            });
                            $(webixBtn.$view).click();
                        });
                    }
                });
            }
        }
    };
})();