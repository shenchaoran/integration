/**
 * Created by SCR on 2017/8/9.
 */
/*jshint esversion: 6 */
let qs = require('qs');

module.exports = (function() {
    var __webixTable = null;
    var __DS = null;

    return {
        init: function() {
            this.buildTable();

            var querystring = window.location.search;
            let query = qs.parse(querystring, {
                ignoreQueryPrefix: true
            });
            __DS = query['data-service'];
            if (__DS) {
                __addNotice(__NoticeType.notice, 'Please select the relative visualization tool!');
            }
        },

        buildTable: function() {
            var error = $('#error').html();
            if (error != '') {
                error = JSON.parse(error);
                __addNotice(__NoticeType.warning, 'Fetch visualization library failed<br><pre>' + JSON.stringify(error, null, 4) + '</pre>');
                return;
            }
            var visualList = $('#visualList');
            visualList = JSON.parse($(visualList).html());
            if (visualList.length == 0) {
                __addNotice(__NoticeType.notice, 'There is no visualization tools available!');
                return;
            }

            var width = $('#visual-table').width();
            var height = 600;
            var columns = [{
                id: 'wkname',
                header: [
                    'Name',
                    {
                        content: 'textFilter',
                        placeholder: 'Filter'
                    }
                ],
                adjust: true
            }, {
                id: 'version',
                header: [
                    'Version',
                    {
                        content: 'textFilter',
                        placeholder: 'Filter'
                    }
                ],
                adjust: true
            }, {
                id: 'enAbstract',
                header: [
                    'Abstract',
                    {
                        content: 'textFilter',
                        placeholder: 'Filter'
                    }
                ],
                minWidth: 150,
                fillspace: true
            }, {
                id: 'time',
                header: [
                    'Deploy Time',
                    {
                        content: 'textFilter',
                        placeholder: 'Filter'
                    }
                ],
                adjust: true
            }];
            columns.push({
                id: 'operate',
                header: 'Operate',
                template: function(obj) {
                    return "<div>" +
                        "<button class='btn btn-default btn-xs invoke-visualization-btn table-operate' title='invoke visualization'><i class='fa fa-cogs'></i></button>" +
                        "</div>";
                        // "<button class='btn btn-default btn-xs delete-visualization-btn table-operate' title='delete visualization'><i class='fa fa-trash'></i></button>" +
                },
                adjust: true
            });
            webix.locale.pager = {
                first: "<<",
                last: ">>",
                next: ">",
                prev: "<"
            };
            __webixTable = webix.ui({
                view: 'datatable',
                container: 'visual-table',
                pager: {
                    template: "{common.first()} {common.prev()} {common.pages()} {common.next()} {common.last()}",
                    container: 'visual-pager',
                    size: 12,
                    group: 5,
                    width: width
                },
                columns: columns,
                data: visualList,
                width: width,
                height: height,
                minheight: 600,
                autoheight: true,
                resizeColumn: true,
                select: false,
                editable: false
            });
            this.__bindInvokeEvent();
            this.__bindResizeEvent();
            this.__bindDeleteEvent();
        },

        __bindResizeEvent: function() {
            var resizeTable = function() {
                __webixTable.define('width', $('#visual-table').width());
                __webixTable.resize();
            };

            $('.header-section .toggle-btn').on('click', function() {
                resizeTable();
            });

            window.onresize = function() {
                resizeTable();
            };
        },

        __bindInvokeEvent: function() {
            __webixTable.on_click['invoke-visualization-btn'] = function(e, obj, trg) {
                var item = this.getItem(obj.row);
                var newUrl = '/visualizations/' + item._id;
                if (__DS !== -1) {
                    newUrl += '?data-service=' + __DS;
                }
                window.open(newUrl);
                // window.location.href = newUrl;
            };
        },

        __bindDeleteEvent: function() {
            var self = this;
            __webixTable.on_click['delete-visualization-btn'] = function(e, obj, trg) {
                if (!confirm('Are you sure to delete this visualization tool?')) {
                    return;
                }
                var visualPackage = this.getItem(obj.row);
                var rowID = obj.row;
                $.ajax({
                        url: '/visualizations',
                        data: {
                            _id: visualPackage._id
                        },
                        type: 'DELETE',
                        dataType: 'json'
                    })
                    .done(function(res) {
                        if (res.error) {
                            __addNotice(__NoticeType.warning, 'Delete visualization tool failed!<br><pre>' + JSON.stringify(res.error, null, 4) + '</pre>');
                        } else {
                            __webixTable.remove(rowID);
                            __addNotice(__NoticeType.notice, 'Delete visualization tool success!');
                        }
                    })
                    .fail(function(error) {
                        __addNotice(__NoticeType.warning, 'Delete visualization tool failed!<br><pre>' + JSON.stringify(error, null, 4) + '</pre>');
                    });
            };
        }

    };
})();