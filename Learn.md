## 启动访问地址
http://localhost:6868/index

## 协同需要使用到的文件
CanvasJS.js ------ 前端
web-socket.controller.js ------ websocket
solution/task 相关的 

## 相关事件
CanvasJS.js 中相关监听事件

## 可能会用到的方法
### 布局
__getRoleByID
__myLayout
__getLayoutCfg
### 事件
__bindToolbarEvent
__bindStageEvent
__bindSceneEvent
__bindNodeEvent
__bindSaveSolutionEvent
### 用户
__setUser
__setAuthor

## 相关概念
schema?
Role?
SADLService?
relation 模型之间的关系

## 结构
controllers负责后台


## 属于JTOPO里的对象
Stage
Scene
Node
Container(container里可以放node，也可以和node相连)
Link

## 步骤
1. 理清用户关系，共享界面
2. 尝试协同
    1. 实时同步画面

## 用户存储
localStorage.setItem('user', JSON.stringify(res.user));
localStorage.setItem('jwt', JSON.stringify(res.jwt));  //JSON WEB TOKEN:用来在身份提供者和服务提供者间传递被认证的用户身份信息

## 要点
1. 多用户协同，用户角色分配，谁先操作通过websocket群发消息，禁用其他人
2. 保存solution需要localstorage.user和localstorage.jwt

## 后台，在controller里面

## 协同实现
1. 信息同步：   _id, layoutCfg, solutionCfg, solutionInfo。协同的话，可能只需要layoutCfg, solutionCfg。为了提高效率，可能只需要两者之一。
    绘制：      importSolution里的paint
2. 事件监听：   __bindSceneEvent, __bindStageEvent,等。主要是addEventListener函数\
3. 通信：       websocket,应该分三种：1.new solution；2.edit solution;3.run task.

## websocket协议： 
1. 现有使用到socket.io的地方：registerSocket，用于task操作，数据传输

## socket.io 说明
1. socket.on： 对收到的信息进行响应
2. socket.emit： 发送消息
3. socket.send： socket.send(data, callback)相当于 socket.emit('message', JSON.stringify(data), callback)
4. socket.join/soclet.leave: 

