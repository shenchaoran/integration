/**
 * Created by SCR on 2017/7/17.
 */
/*jshint esversion: 6 */

var TaskList = (function() {
    var __url = '/integration/task/all';
    var __webixTaskTable = null;
    var __tasksSegment = null;

    return {
        init: function() {
            var self = this;
            $.ajax({
                    url: __url,
                    data: {
                        isComplete: false
                    },
                    type: 'GET',
                    dataType: 'json'
                })
                .done(function(res) {
                    if (res.error) {
                        $.gritter.add({
                            title: 'Warning:',
                            text: 'Get task list failed!<br><pre>' + JSON.stringify(res.error, null, 4) + '</pre>',
                            sticky: false,
                            time: 2000
                        });
                    } else {
                        __tasksSegment = res.tasksSegment;

                        _.map(__tasksSegment, task => {
                            task.authorName = _.reduce(task.author, (rst, v, k) => {
                                rst += v.username? v.username + ', ' : '';
                                return rst;
                            }, '');
                            task.authorName = task.authorName.substr(0, task.authorName.length-2);
                        });

                        self.__buildTasksList();
                    }
                })
                .fail(function(error) {
                    $.gritter.add({
                        title: 'Warning:',
                        text: 'Get task list failed!<br><pre>' + JSON.stringify(error, null, 4) + '</pre>',
                        sticky: false,
                        time: 2000
                    });
                });
        },

        __buildTasksList: function() {
            // for (let i = 0; i < __tasksSegment.length; i++) {
            //     __tasksSegment[i].name = __tasksSegment[i].taskInfo.name;
            //     __tasksSegment[i].author = __tasksSegment[i].taskInfo.author;
            //     __tasksSegment[i].desc = __tasksSegment[i].taskInfo.desc;
            //     __tasksSegment[i].time = __tasksSegment[i].taskInfo.time;
            // }

            var width = $('#task-list').width();
            var height = 600;
            var columns = [{
                    id: 'name',
                    header: [
                        'Name',
                        {
                            content: 'textFilter',
                            placeholder: 'Filter'
                        }
                    ],
                    adjust: true
                }, {
                    id: 'authorName',
                    header: [
                        'Author',
                        {
                            content: 'textFilter',
                            placeholder: 'Filter'
                        }
                    ],
                    adjust: true
                }, {
                    id: 'desc',
                    header: 'Description',
                    minWidth: 150,
                    fillspace: true
                },
                // , {
                //     id: 'taskState',
                //     header: [
                //         'State',
                //         {
                //             content: 'selectFilter',
                //             placeholder: 'Filter'
                //         }
                //     ],
                //     adjust: true
                // }
                {
                    id: 'time',
                    header: 'Create Time',
                    adjust: true
                }
            ];
            columns.push({
                id: 'operate',
                header: 'Operate',
                template: function(obj) {
                    return "<div>" +
                        "<button class='btn btn-default btn-xs task-operation-btn task-detail-btn' title='task detail'><i class='fa fa-info'></i></button>" +
                        "<button class='btn btn-default btn-xs task-operation-btn task-edit-btn' title='edit task'><i class='fa fa-pencil-square'></i></button>" +
                        "<button class='btn btn-default btn-xs task-operation-btn task-delete-btn' title='delete task'><i class='fa fa-trash'></i></button>" +
                        "</div>";
                },
                adjust: true
            });

            webix.locale.pager = {
                first: "<<",
                last: ">>",
                next: ">",
                prev: "<"
            };
            __webixTaskTable = webix.ui({
                container: 'task-list',
                view: 'datatable',
                pager: {
                    template: "{common.first()} {common.prev()} {common.pages()} {common.next()} {common.last()}",
                    container: 'task-list-pager',
                    size: 12,
                    group: 5,
                    width: width
                },
                width: width,
                height: height,
                minheight: 600,
                autoheight: true,
                resizeColumn: true,
                select: false,
                editable: false,
                columns: columns,
                data: __tasksSegment
            });
            this.__bindInvokeEvent();
            this.__bindEditBtnEvent();
            this.__bindDeleteBtnEvent();
            this.__bindResizeEvent();
        },

        __bindResizeEvent: function() {
            var resizeTable = function() {
                __webixTaskTable.define('width', $('#task-list').width());
                __webixTaskTable.resize();
            };

            $('.header-section .toggle-btn').on('click', function() {
                resizeTable();
            });

            window.onresize = function() {
                resizeTable();
            };
        },

        __bindInvokeEvent: function() {
            __webixTaskTable.on_click['task-detail-btn'] = function(e, obj, trg) {
                var taskSegment = this.getItem(obj.row);
                window.open('/integration/task/detail?_id=' + taskSegment._id);
            };
        },

        __bindEditBtnEvent: function() {
            __webixTaskTable.on_click['task-edit-btn'] = function(e, obj, trg) {
                var taskSegment = this.getItem(obj.row);
                window.open('/integration/task/edit?_id=' + taskSegment._id);
            };
        },

        __bindDeleteBtnEvent: function() {
            var self = this;
            __webixTaskTable.on_click['task-delete-btn'] = function(e, obj, trg) {
                if (!confirm('Are you sure to delete this task?')) {
                    return;
                }
                var taskSegment = this.getItem(obj.row);
                var rowID = obj.row;
                $.ajax({
                        url: '/integration/task',
                        data: {
                            _id: taskSegment._id
                        },
                        type: 'DELETE',
                        dataType: 'json'
                    })
                    .done(function(res) {
                        if (res.error) {
                            $.gritter.add({
                                title: 'Warning:',
                                text: 'Delete task failed!<br><pre>' + JSON.stringify(res.error, null, 4) + '</pre>',
                                sticky: false,
                                time: 2000
                            });
                        } else {
                            self.__deleteTaskTableByID(rowID);
                            $.gritter.add({
                                title: 'Notice:',
                                text: 'Delete task success!',
                                sticky: false,
                                time: 2000
                            });
                        }

                    })
                    .fail(function(error) {
                        $.gritter.add({
                            title: 'Warning:',
                            text: 'Delete task failed!<br><pre>' + JSON.stringify(error, null, 4) + '</pre>',
                            sticky: false,
                            time: 2000
                        });
                    });
            };
        },

        __deleteTaskTableByID: function(rowID) {
            __webixTaskTable.remove(rowID);
        }
    };
})();

module.exports = TaskList;