/**
 * Created by SCR on 2017/8/9.
 */
/*jshint esversion: 6 */

var qs = require('qs');
module.exports = (function() {
    var __error = null;
    var __visualService = null;

    var leftWidget = null;
    var rightWidget = null;
    
    var __DS;

    return {
        init: function() {
            this.initData();
            if (__error != null) {
                return;
            }
            this.buildLeft();
        },

        initData: function() {
            var error = $('#error').html();
            if (error != '') {
                error = JSON.parse(error);
                __addNotice(__NoticeType.warning, 'Fetch visualization service failed!<br><pre>' + JSON.stringify(error, null, 4) + '</pre>');
                return;
            }
            var visualService = $('#visualService').html();
            if (visualService == '') {
                __addNotice(__NoticeType.warning, 'Fetch visualization service failed!');
                return;
            }
            __visualService = JSON.parse(visualService);
        },

        buildLeft: function() {
            var self = this;
            var listData = [];
            var items = __visualService.DVM.Params.Item;
            if (items instanceof Array) {

            } else {
                items = [items];
            }
            for (let i = 0; i < items.length; i++) {
                let itemData = items[i];
                itemData.name = 'default group';
                if (items[i]._$ != null && items[i]._$.name != null) {
                    itemData.name = items[i]._$.name;
                }
                listData.push(itemData);
            }

            var containerID = 'param-list';
            var width = $('#' + containerID).width();

            leftWidget = webix.ui({
                id: 'leftWidget',
                container: containerID,
                scroll: false,
                padding: 20,
                width: width,
                minHeight: 500,
                autoheight: true,
                rows: [{
                        view: 'template',
                        template: 'Supported parameter list',
                        type: 'header'
                    },
                    {
                        id: 'paramList',
                        view: 'list',
                        height: 750,
                        // autoheight: true,
                        // borderless: true,
                        yCount: 12,
                        select: true,
                        multiselect: false,
                        scroll: true,
                        editable: false,
                        data: listData,
                        template: function(obj) {
                            return obj.name;
                        },
                        on: {
                            'onItemClick': function(id, e, node) {
                                self.__buildRight(this.getItem(id));
                            }
                        }
                    }
                ]
            });

            this.__bindOnresize(containerID, leftWidget);
            var firstID = $$('paramList').getFirstId();
            if (firstID != null && firstID != '') {
                $$('paramList').getItemNode($$('paramList').getFirstId()).click();
            }

            var url = window.location.href;
            var index = url.indexOf('gdid=');
            if (index != -1) {
                __addNotice(__NoticeType.notice, 'Please select relative input parameter group by input data schema!');
            }
        },

        __bindOnresize: function(containerID, widget) {
            var resizeFn = function() {
                widget.define('width', $('#' + containerID).width());
                widget.resize();
            };

            // $('.header-section .toggle-btn').on('click',function () {
            //     resizeFn();
            // });

            window.onresize = function() {
                resizeFn();
            };
        },

        __buildRight: function(paramItem) {
            $('#param-detail').children().hide();

            if ($('#' + paramItem.id).length) {
                $('#' + paramItem.id).show();
                return;
            }
            $('#param-detail').append($('<div id="' + paramItem.id + '"></div>'));


            var containerID = paramItem.id;
            if (typeof containerID == 'number') {
                containerID = containerID.toString();
            }
            var width = $('#param-detail').width();

            var headerName = __visualService.DVM._$.wkname;
            var abstract = '';
            var zhAbstract = '';
            var Localizations = __visualService.DVM.Localizations.Localization;
            if (Localizations instanceof Array) {

            } else {
                Localizations = [Localizations];
            }
            for (let i = 0; i < Localizations.length; i++) {
                if (Localizations[i]._$.local == 'EN_US') {
                    abstract = Localizations[i].Abstract;
                    break;
                } else {
                    zhAbstract = Localizations[i].Abstract;
                }
            }
            if (abstract == '') {
                abstract = zhAbstract;
            }

            var params = paramItem.Param;
            if (!(params instanceof Array)) {
                params = [params];
            }

            // TODO 没关联name，在数据库中存时是用xml解析的，应该是按照顺序的，待优化
            window[containerID] = {};
            for (let i = 0; i < params.length; i++) {
                window[containerID][params[i]._$.name] = null;
            }

            rightWidget = webix.ui({
                id: 'rightWidget',
                container: containerID,
                // type: 'clean',
                width: width,
                scroll: false,
                // minHeight: 900,
                autoheight: true,
                padding: 20,
                rows: [{
                        autoheight: true,
                        view: 'template',
                        template: headerName,
                        type: 'header'
                    },
                    {
                        padding: 10,
                        // type: 'clean',
                        rows: [{
                                autoheight: true,
                                borderless: true,
                                template: '<p><b>Method Description:</b> ' + abstract + '</p>' +
                                    '<p><b>Paramter List:</b></p>'
                            },
                            {
                                view: 'tabbar',
                                // type: 'clean',
                                autoheight: true,
                                autowidth: true,
                                // tabMinWidth: 90,
                                // minWidth: 90,
                                css: 'tab-cell',
                                id: 'schema-tabbar',
                                value: params[0]._$.name,
                                // multiview: true,
                                options: (function() {
                                    var options = [];
                                    for (let i = 0; i < params.length; i++) {
                                        options.push({
                                            value: params[i]._$.name,
                                            id: params[i]._$.name
                                        });
                                    }
                                    return options;
                                })()
                            },
                            {
                                autoheight: true,
                                css: 'tab-cell',
                                cells: (function() {
                                    var cells = [];
                                    for (let i = 0; i < params.length; i++) {
                                        var schemas = __visualService.schemas;
                                        var schemaName = params[i]._$.schema;
                                        var schemaStr = '';
                                        for (let j = 0; j < schemas.length; j++) {
                                            if (schemaName == schemas[j].fname) {
                                                schemaStr = schemas[j].value;
                                                schemaStr = schemaStr.replace(/\"/g, '&quot');
                                                schemaStr = schemaStr.replace(/</g, '&lt');
                                                schemaStr = schemaStr.replace(/>/g, '&gt');
                                                schemaStr = '<pre>' + schemaStr + '</pre>';
                                                break;
                                            }
                                        }

                                        cells.push({
                                            css: 'tab-cell',
                                            autoheight: true,
                                            type: 'clean',
                                            id: params[i]._$.name,
                                            rows: [{
                                                    autoheight: true,
                                                    template: '<p><b>Type:</b> ' + params[i]._$.type + '</p>' +
                                                        '<p><b>Description:</b> ' + params[i]._$.description + '</p>' +
                                                        schemaStr
                                                },
                                                {
                                                    // autoheight: true,
                                                    id: containerID + 'upload-data',
                                                    height: 130,
                                                    template: '<div style="margin: 5px auto"><p><b>Upload data:</b></p>' +
                                                        '<input id="' + containerID + '-' + params[i]._$.name + '-upload-data" type="file" name="myfile" class="file upload-file">' +
                                                        '</div>'
                                                },
                                                {
                                                    id: containerID + 'select-data',
                                                    autoheight: true,
                                                    template: '<div style="margin: 5px auto"><p style="margin: 5px auto"><b>Select data:</b></p>' +
                                                        '<button class="btn btn-primary" id="' + containerID + '-' + params[i]._$.name + '-select-data">Select</button>' +
                                                        '</div>'
                                                },
                                            ]
                                        });
                                    }
                                    return cells;
                                })()
                            },
                            {
                                autoheight: true,
                                borderless: true,
                                template: '<div style="text-align: center;margin: 15px auto;">' +
                                    '<button style="margin: auto 20px; min-width: 100px;" class="btn btn-success" disabled id="' + containerID + '-call-btn">Visualization</button>' +
                                    '<button style="margin: auto 20px; min-width: 100px;" class="btn btn-default" id="' + containerID + '-cancel-btn">Cancel</button>' +
                                    '</div>'
                            }
                        ]
                    }
                ]
            });

            $('#' + containerID + ' .fileinput-remove-button').on('click', function(e) {
                $('#' + containerID + '-call-btn').attr('disabled', true);
            });

            $('.upload-file').fileinput({
                    uploadUrl: '/integration/data',
                    // allowedFileExtensions: ['xml','zip','udx'],
                    aploadAsync: true,
                    showPreview: false,
                    showUpload: true,
                    showRemove: true,
                    showClose: true,
                    showUploadedThumbs: false,
                    autoReplace: true,
                    maxFileCount: 1,
                    uploadLabel: '',
                    removeLabel: '',
                    cancelLabel: '',
                    browseLabel: ''
                })
                .on('fileuploaded', function(e, data, previewId, index) {
                    var res = data.response;
                    if (res.res != 'suc') {
                        $.gritter.add({
                            title: 'Warning:',
                            text: 'Upload data failed!',
                            sticky: false,
                            time: 2000
                        });
                        return;
                    }

                    // update glogal params
                    var id = $(this).attr('id');
                    var group = id.match(/(.+)-(.+)-upload-data/);
                    var containerID = group[1];
                    var schemaName = group[2];
                    window[containerID][schemaName] = res.gd_id;

                    // check run preparation state
                    var isReady = true;
                    for (let key in window[containerID]) {
                        if (window[containerID][key] == null) {
                            isReady = false;
                            $('#' + containerID + '-call-btn').attr('disabled', true);
                            break;
                        }
                    }
                    if (isReady) {
                        $('#' + containerID + '-call-btn').attr('disabled', false);
                    }


                    $.gritter.add({
                        title: 'Notice:',
                        text: 'Upload data success!',
                        sticky: false,
                        time: 2000
                    });
                })
                .on('fileerror', function(e, data) {
                    $.gritter.add({
                        title: 'Warning:',
                        text: '<pre>' + JSON.stringify(error, null, 4) + '</pre>',
                        sticky: false,
                        time: 2000
                    });
                });

            // TODO select mode

            // url with gdid
            var querystring = window.location.search;
            let query = qs.parse(querystring, {
                ignoreQueryPrefix: true
            });
            __DS = query['data-service'];
            if (__DS) {
                $$(containerID + 'select-data').hide();
                $$(containerID + 'upload-data').hide();
                if (params.length == 1) {
                    window[containerID][params[0]._$.name] = __DS;
                    $('#' + containerID + '-call-btn').attr('disabled', false);
                }
            }

            // bind call visualization
            this.__bindCall(containerID);

            // bind cancel event
            $('#' + containerID + '-cancel-btn').click(function(e) {
                $('#' + containerID + ' .fileinput-remove-button').click();
                window[containerID] = {};
                $('#' + containerID + '-call-btn').attr('disabled', true);
            });
        },

        __bindCall: function(containerID) {
            var btnID = containerID + '-call-btn';
            $('#' + btnID).click(function(e) {
                var inputs = [];
                var index = $$('paramList').getIndexById($$('paramList').getSelectedId());
                if (index == -1) {
                    return;
                }
                var url = '/visualization/' + __visualService._id + '/index.html?index=' + index;
                var i = 1;
                for (let key in window[containerID]) {
                    if (window[containerID][key] == null) {
                        return;
                    } else {
                        inputs.push({
                            name: key,
                            gdid: window[containerID][key]
                        });
                        url += '&filename' + i + '=' + window[containerID][key];
                        i++;
                    }
                }
                window.location.href = url;
            });
        }
    };
})();