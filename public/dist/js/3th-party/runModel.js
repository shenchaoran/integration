/**
 * Created by Administrator on 2016/3/25.
 */
$(document).on('click','#tabServerStatus',function() {

     $.ajax({
         url:'/status',
         success:function(data){
             var jsonObj= eval('('+data+')');
             //alert(jsonObj);
             $('#divServerStatus').html("");
             $('#divServerStatus').append("<table class='table table-bordered'>");
             $.each(jsonObj,function(name,value){
                 $('#inbox').append("<tr><td>"+name+"</td><td>"+value+"</td></tr>")
             });
             $('#divServerStatus').append("</table>");
         }
     });
});
$(document).on('click','#tabServerStatus',function(){

    ListenStatus();
    setInterval(ListenStatus,5000);

});
ListenStatus=function(){
    //alert('1');
    var stringJson='{"hostname":"Franklin-PC","systemtype":"Windows_NT","release":"10.0.10586","uptime":431054.8920569,"loadavg":[0,0,0],"totalmem":8510103552,"freemem":4543623168,"cpus":[{"model":"Intel(R) Core(TM) i7-4790 CPU @ 3.60GHz","speed":3592,"times":{"user":20824406,"nice":0,"sys":10510531,"idle":330765140,"irq":2125593}},{"model":"Intel(R) Core(TM) i7-4790 CPU @ 3.60GHz","speed":3592,"times":{"user":75242453,"nice":0,"sys":2454859,"idle":284402546,"irq":34218}},{"model":"Intel(R) Core(TM) i7-4790 CPU @ 3.60GHz","speed":3592,"times":{"user":31901421,"nice":0,"sys":4637125,"idle":325561296,"irq":49500}},{"model":"Intel(R) Core(TM) i7-4790 CPU @ 3.60GHz","speed":3592,"times":{"user":23710828,"nice":0,"sys":2660984,"idle":335728031,"irq":32328}},{"model":"Intel(R) Core(TM) i7-4790 CPU @ 3.60GHz","speed":3592,"times":{"user":29026640,"nice":0,"sys":4168390,"idle":328904828,"irq":45328}},{"model":"Intel(R) Core(TM) i7-4790 CPU @ 3.60GHz","speed":3592,"times":{"user":24644453,"nice":0,"sys":2454484,"idle":335000906,"irq":33812}},{"model":"Intel(R) Core(TM) i7-4790 CPU @ 3.60GHz","speed":3592,"times":{"user":30571515,"nice":0,"sys":4176265,"idle":327352078,"irq":47703}},{"model":"Intel(R) Core(TM) i7-4790 CPU @ 3.60GHz","speed":3592,"times":{"user":26567734,"nice":0,"sys":3335171,"idle":332196937,"irq":33812}}],"disk":""}';
    var jsonObj=eval('('+stringJson+')');
    $('#divServerStatus').html("");
    $('#divServerStatus').append("<table class='table table-bordered'>");
    $.each(jsonObj,function(name,value){
        $('#divServerStatus').append("<tr><td>"+name+"</td><td>"+value+"</td></tr>")
    });
    $('#divServerStatus').append("</table>");
}

var uploadiObj = null;
$(document).on('click','#btnRunModel',function(){
    $('#upload').modal('toggle');
    //加载模型上传
    uploadiObj = $("#fileuploader").uploadFile({
        url:"/modelser/",
        fileName:"myfile"
    });
});
//上传参数后，确认运行模型
$(document).on('click','#btnRun',function(){
    //TODO:运行模型请求
});
//上传参数时，关闭上传，清除参数
$(document).on('click','#btnClose',function(){
    uploadiObj.reset();
});