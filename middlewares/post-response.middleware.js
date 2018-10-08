module.exports = app => {
    // unify response
    // app.use((req, res, next) => {
    //     // console.log(res.locals);
    //     if (res.locals.succeed === true) {
    //         return res.json(res.locals.resData);
    //     } else {
    //         return next();
    //     }
    // });

    app.use((req, res, next) => {
        let err = new Error('Not Found');
        err.status = 404;
        next(err);
    });

    
    app.use((err, req, res, next) => {
        console.log(err);
        let error = {
            code: err.status || 500,
            desc: err.message,
            stack: req.app.get('env') === 'development' ? err.stack : {}
        };
        return res.json(error);
    });
};