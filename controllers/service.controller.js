let _ = require('lodash');

module.exports = {
    getEvents: (service, filter) => {
        let rst = [];
        if(service.serviceType === 'model') {
            let states = _.get(service, 'MDL.ModelClass.Behavior.StateGroup.States');
            if(!states instanceof Array) {
                states = [states];
            }
            _.map(states, state => {
                let events = _.get(state, 'Event');
                if(!events instanceof Array) {
                    events = [events];
                }
                _.map(events, event => {
                    event.stateID = state._$.id;
                    event.stateName = state._$.name;
                    event.stateDes = state._$.description;
                    rst.push(event);
                });
            });
        }
        else if(service.serviceType === 'data map' || service.serviceType === 'data refactor') {
            let states = _.get(service, 'CDL.StateGroup.States');
            _.map(states, state => {
                let events = _.get(state, 'Events');
                _.map(events, event => {
                    event.stateID = state.id;
                    event.stateName = state.name;
                    event.stateDes = state.description;
                    rst.push(event);
                });
            });
        }

        if(filter) {
            rst = _.filter(rst, filter);
        }

        return rst;
    },


}