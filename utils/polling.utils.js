module.exports = {
    polling: (func, end, interval) => {
        let recur = () => {
            func()
                .then(rst => {
                    if(end(rst)) {
                        
                    }
                })
                .catch(e => {
                    console.log(e);
                });
        };
    }
}