// By default, debug will be true only if platform is a web platform and its page is served from localhost.
// When debug = true, error's stacks will contain asyncronic long stacks.
export var debug = typeof localStorage === 'object' && !!localStorage.dexieDebug;

export function setDebug(value, filter) {
    debug = value;
    libraryFilter = filter;
}

export var libraryFilter = () => true;

export function getErrorWithStack() {
    "use strict";
    return new Error();
}

export function prettyStack(exception, numIgnoredFrames) {
    var stack = exception.stack;
    if (!stack) return "";
    numIgnoredFrames = (numIgnoredFrames || 0);
    if (stack.indexOf(exception.name) === 0)
        numIgnoredFrames += (exception.name + exception.message).split('\n').length;
    return stack.split('\n')
        .slice(numIgnoredFrames)
        .filter(libraryFilter)
        .map(frame => "\n" + frame)
        .join('');
}

// TODO: Replace this in favor of a decorator instead.
export function deprecated<T> (what: string, fn: (...args)=>T) {
    return function () {
        console.warn(`${what} is deprecated. See http://dexie.org/docs/Deprecations. ${prettyStack(getErrorWithStack(), 1)}`);
        return fn.apply(this, arguments);
    } as (...args)=>T
}
