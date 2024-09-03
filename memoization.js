import cache from './cache.js';

const myCache = cache('./memoize.json');

const memoization = (fn = null) => {
    if (fn === null) return;

    return async function (...args) {
        const key = JSON.stringify(args);

        if (myCache.get(key)) {
            return myCache.get(key);
        }

        const result = await fn(...args);
        myCache.set(key, result, 3600); //expires in 1 hour this memoized code 
        return result;
    }
    
}

export default memoization;