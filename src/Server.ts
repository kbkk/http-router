import * as http from 'http';
import {once} from 'events';
import {AddressInfo} from "net";
import {Router} from "./Router";

export type RequestContext = {
    readonly body: Buffer;
    readonly method: string;
    res?: string | Buffer;
    status?: number;
};

export type BoundMiddlewareCallback = () => Promise<unknown>;

export type MiddlewareCallback = (ctx: RequestContext, next: BoundMiddlewareCallback) => Promise<unknown> | unknown;

const noop: BoundMiddlewareCallback = () => Promise.resolve();

class Server {
    private _router = new Router<MiddlewareCallback>();
    private _httpServer: http.Server | undefined;

    public use(path: string, fn: MiddlewareCallback) {
        this._router.register(path, fn);
    }

    public get(path: string, fn: MiddlewareCallback) {
        this._router.register(path, function getMiddleware(ctx, next) {
            if (ctx.method === 'GET') {
                ctx.status = 200;
                return fn(ctx, next);
            } else {
                return next();
            }
        });
    }

    public post(path: string, fn: MiddlewareCallback) {
        this._router.register(path, function postMiddleware(ctx, next) {
            if (ctx.method === 'POST') {
                ctx.status = 200;
                return fn(ctx, next);
            } else {
                return next();
            }
        });
    }

    public async start(port: number, hostname?: string): Promise<string> {
        if (this._httpServer) {
            throw new Error('The server has already been started!');
        }

        this._httpServer = http.createServer(this._handleRequest.bind(this));

        await once(
            this._httpServer.listen(port, hostname),
            'listening'
        );

        const address = this._httpServer.address() as AddressInfo;

        return `http://${address.address}:${address.port}/`;
    }

    public async stop(): Promise<void> {
        if (!this._httpServer) {
            throw new Error('The server is not running!');
        }

        await once(
            this._httpServer?.close() as http.Server,
            'close'
        );

        this._httpServer = undefined;
    }

    private async _handleRequest(req: http.IncomingMessage, res: http.ServerResponse) {
        const middlewareStack = this._router.resolve(req.url!);

        if (middlewareStack.length === 0) {
            res.writeHead(404);
            res.end();

            return;
        }

        const chunks: Buffer[] = [];

        for await (const chunk of req) {
            chunks.push(chunk);
        }

        const requestContext = {
            body: Buffer.concat(chunks),
            method: req.method,
            res: '',
            status: 405
        };

        let nextMiddleware: BoundMiddlewareCallback = noop;

        for (let i = middlewareStack.length - 1; i >= 0; i--) {
            nextMiddleware = middlewareStack[i].bind(null, requestContext, nextMiddleware);
        }

        await nextMiddleware();

        res.writeHead(requestContext.status);
        res.write(requestContext.res);
        res.end();
    }
}

export default Server;
