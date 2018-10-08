
$(document).ready(function() {
    $('#dynamic-table').dataTable(
        {
            //数据URL
            "data": "",
            //载入数据的时候是否显示“正在加载中...”
            "processing": true,
            //是否显示分页
            "bPaginate": true,
            //每页显示条目数
            "bLengthChange": true,
            //排序
            "bSort": true,
            //初始化显示条目数
            "iDisplayLength" : 10,
            //排序配置
            "aaSorting": [[3, "desc"]],
            //自适应宽度
            "bAutoWidth": true,
            //多语言配置
            "oLanguage": {
                "sLengthMenu": "每页显示 _MENU_ 条记录",
                "sZeroRecords": "对不起，查询不到任何相关数据",
                "sInfo": "当前显示 _START_ 到 _END_ 条，共 _TOTAL_ 条记录",
                "sInfoEmtpy": "找不到相关数据",
                "sInfoFiltered": "数据表中共为 _MAX_ 条记录)",
                "sProcessing": "正在加载中...",
                "sSearch": "搜索",
                //多语言配置文件，可将oLanguage的设置放在一个txt文件中，例：Javascript/datatable/dtCH.txt
                "sUrl": "",
                "oPaginate": {
                    "sFirst":    "第一页",
                    "sPrevious": " 上一页 ",
                    "sNext":     " 下一页 ",
                    "sLast":     " 最后一页 "
                }
            }
        }
    );
} );