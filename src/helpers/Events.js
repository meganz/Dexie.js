import {keys, isArray, asap} from '../functions/utils';
import {nop, mirror, reverseStoppableEventChain} from '../functions/chaining-functions';
import {exceptions} from '../errors';

export default function Events(ctx) {
    var evs = {};
    var rv = function (eventName, ...args) {
        if (args[0]) {
            // Subscribe. If additional arguments than just the subscriber was provided, forward them as well.
            evs[eventName].subscribe.apply(null, args);
            return ctx;
        } else if (typeof (eventName) === 'string') {
            // Return interface allowing to fire or unsubscribe from event
            return evs[eventName];
        }
    };
    rv.addEventType = add;

    for (var i = 1, l = arguments.length; i < l; ++i) {
        add(arguments[i]);
    }

    return rv;

    function add(eventName, chainFunction, defaultFunction) {
        if (typeof eventName === 'object') return addConfiguredEvents(eventName);
        if (!chainFunction) chainFunction = reverseStoppableEventChain;
        if (!defaultFunction) defaultFunction = nop;

        var context = {
            subscribers: [],
            fire: defaultFunction,
            subscribe: function (cb) {
                if (!context.subscribers.includes(cb)) {
                    context.subscribers.push(cb);
                    context.fire = chainFunction(context.fire, cb);
                }
            },
            unsubscribe: function (cb) {
                context.subscribers = context.subscribers.filter(function (fn) { return fn !== cb; });
                context.fire = context.subscribers.reduce(chainFunction, defaultFunction);
            }
        };
        evs[eventName] = rv[eventName] = context;
        return context;
    }

    function addConfiguredEvents(cfg) {
        // events(this, {reading: [functionChain, nop]});
        keys(cfg).forEach(function (eventName) {
            var args = cfg[eventName];
            if (isArray(args)) {
                add(eventName, cfg[eventName][0], cfg[eventName][1]);
            } else if (args === 'asap') {
                // Rather than approaching event subscription using a functional approach, we here do it in a for-loop where subscriber is executed in its own stack
                // enabling that any exception that occur wont disturb the initiator and also not nescessary be catched and forgotten.
                const context = add(eventName, mirror, (...args) => {
                    // All each subscriber:
                    const fire = (fn) => asap(() => fn(...args));
                    for (let i = 0; i < context.subscribers.length; i++) {
                        fire(context.subscribers[i]);
                    }
                });
            } else throw new exceptions.InvalidArgument("Invalid event config");
        });
    }
}
