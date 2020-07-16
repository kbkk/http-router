import * as sinon from "sinon";
import {createHttpMethodGuardMiddleware} from "../../middleware/httpMethodGuardMiddleware";
import {RequestContext} from "../../Server";

const noopMiddlewareSpy = sinon.spy(() => Promise.resolve());

describe('httpMethodGuardMiddleware', () => {
    it('should call the guarded middleware if called with correct HTTP method', async () => {
        const guardedMiddleware = sinon.stub();
        const middleware = createHttpMethodGuardMiddleware('POST', guardedMiddleware);
        const ctx = createRequestContext('POST');

        await middleware(ctx, noopMiddlewareSpy);

        sinon.assert.notCalled(noopMiddlewareSpy);
        sinon.assert.calledOnceWithExactly(guardedMiddleware, ctx, noopMiddlewareSpy);
    });

    it('should not call the guarded middleware and call next middleware if called with incorrect HTTP method', async () => {
        const guardedMiddleware = sinon.stub();
        const middleware = createHttpMethodGuardMiddleware('POST', guardedMiddleware);
        const ctx = createRequestContext('GET');

        await middleware(ctx, noopMiddlewareSpy);

        sinon.assert.notCalled(guardedMiddleware);
        sinon.assert.calledOnceWithExactly(noopMiddlewareSpy);
    });
});

function createRequestContext(method: 'GET' | 'POST'): RequestContext {
    return {
        method
    } as RequestContext;
}
