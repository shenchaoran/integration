/**
 * Created by SCR on 2017/8/1.
 */
/*jshint esversion: 6 */

module.exports = (function() {
    var __modelListWebix = null;
    var __dataListWebix = null;

    return {
        init: function() {
            // this.validateForm();

            new this.networkList('model-networkList');
            new this.networkList('data-networkList');
            __modelListWebix = $$('mylist-model-networkList');
            __dataListWebix = $$('mylist-data-networkList');

            // this.adjustStyle();
            this.bindSubmit();
        },

        networkList: function(containerID) {

            var add_row = function() {
                $$("mylist-" + containerID).add({
                    host: $$("myform-" + containerID).getValues().host,
                    port: $$("myform-" + containerID).getValues().port
                });
            };

            var delete_row = function() {
                var id = $$("mylist-" + containerID).getSelectedId();
                webix.confirm({
                    title: "Delete", // the text of the box header
                    text: "Are you sure you want to delete the selected item?", // the text of the body
                    callback: function(result) { //callback function that will be called on the button click. The result is true or false subject to the clicked button.
                        if (result) {
                            $$("mylist-" + containerID).remove(id);
                        }
                    }
                });
            };

            return (function() {
                var width = $('.networkList').width();
                var list = webix.ui({
                    container: containerID,
                    width: width,
                    rows: [{
                            view: "toolbar",
                            id: "mybar-" + containerID,
                            elements: [
                                { view: "button", value: "Add", width: 70, click: add_row },
                                { view: "button", value: "Delete", width: 70, click: delete_row }
                            ]
                        },
                        {
                            cols: [{
                                    view: "form",
                                    id: "myform-" + containerID,
                                    width: 200,
                                    elements: [
                                        { view: "text", name: "host", placeholder: "Host" }, //1st column
                                        { view: "text", name: "port", placeholder: "Port" }
                                    ]
                                },
                                {
                                    view: "list",
                                    id: "mylist-" + containerID,
                                    template: "#host# : #port#", //2nd column
                                    select: true, //enable selection of list items
                                    height: 400,
                                    data: []
                                }
                            ]
                        }
                    ]
                });

                $$("mylist-" + containerID).attachEvent("onAfterSelect", function(id) {
                    $$("myform-" + containerID).setValues({
                        title: $$("mylist-" + containerID).getItem(id).host,
                        year: $$("mylist-" + containerID).getItem(id).port
                    });
                });
                return list;
            })();
        },

        adjustStyle: function() {
            // $('.webix_view .webix_toolbar .webix_layout_toolbar').css('background','#FFFFFF');
        },

        __exportData: function() {
            var modelServiceList = [];
            var dataServiceList = [];
            var networkInfo = {};
            var formData = $('#networkInfo-form').serializeArray();
            for (let i = 0; i < formData.length; i++) {
                networkInfo[formData[i].name] = formData[i].value;
            }

            var modelItemID = __modelListWebix.getFirstId();
            while (modelItemID) {
                var modelItem = __modelListWebix.getItem(modelItemID);
                modelServiceList.push({
                    host: modelItem.host,
                    port: modelItem.port
                });
                modelItemID = __modelListWebix.getNextId(modelItemID);
            }
            var dataItemID = __dataListWebix.getFirstId();
            while (dataItemID) {
                var dataItem = __dataListWebix.getItem(dataItemID);
                dataServiceList.push({
                    host: dataItem.host,
                    port: dataItem.port
                });
                dataItemID = __dataListWebix.getNextId(dataItemID);
            }

            return {
                networkInfo: networkInfo,
                modelServices: modelServiceList,
                dataServices: dataServiceList
            };
        },

        bindSubmit: function() {
            var self = this;
            $('#networkInfo-form').validate({
                onfocusout: function(element) {
                    $(element).valid();
                },
                focusInvalid: true,
                submitHandler: function(form) {
                    var formData = self.__exportData();
                    $.ajax({
                            url: '/integration/network',
                            type: 'POST',
                            data: JSON.stringify(formData),
                            contentType: "application/json;charset=utf-8",
                            dataType: 'json'
                        })
                        .done(function(res) {
                            if (res.error) {
                                __addNotice(__NoticeType.warning, 'Fail to create a new integrate network!<br><pre>' + JSON.stringify(res.error, null, 4) + '</pre>');
                            } else {
                                __addNotice(__NoticeType.notice, 'Create integrate network success!');
                            }
                        })
                        .fail(function(error) {
                            __addNotice(__NoticeType.warning, 'Fail to create a new integrate network!<br><pre>' + JSON.stringify(error, null, 4) + '</pre>');
                        });
                }
            });

            // $('#submit-form-btn').click(function () {
            //
            // });
        }
    };
})();