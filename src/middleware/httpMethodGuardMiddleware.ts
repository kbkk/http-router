import {MiddlewareCallback} from "../Server";

export function createHttpMethodGuardMiddleware(method: 'GET' | 'POST', fn: MiddlewareCallback): MiddlewareCallback {
    // return a named function for easier stack trace reading
    return function httpMethodGuardMiddleware(ctx, next) {
        if (ctx.method === method) {
            ctx.status = 200;
            return fn(ctx, next);
        } else {
            return next();
        }
    };
}
