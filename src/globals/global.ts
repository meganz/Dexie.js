declare var global;
export const _global: any =
    typeof self !== 'undefined' ? self :
    typeof window !== 'undefined' ? window :
    global;
