import * as http from 'http';
import {once} from 'events';
import {AddressInfo} from "net";
import {Router} from "./Router";
import {createHttpMethodGuardMiddleware} from "./middleware/httpMethodGuardMiddleware";

export type RequestContext = {
    readonly body: Buffer;
    readonly method: string;
    res?: string | Buffer;
    status?: number;
};

export type BoundMiddlewareCallback = () => Promise<unknown>;

export type MiddlewareCallback = (ctx: RequestContext, next: BoundMiddlewareCallback) => Promise<unknown> | unknown;

const noopMiddleware: BoundMiddlewareCallback = () => Promise.resolve();

class Server {
    private _router = new Router<MiddlewareCallback>();
    private _httpServer: http.Server | undefined;

    public use(path: string, fn: MiddlewareCallback): void {
        this._router.register(path, fn);
    }

    public get(path: string, fn: MiddlewareCallback): void {
        this._router.register(path, createHttpMethodGuardMiddleware('GET', fn));
    }

    public post(path: string, fn: MiddlewareCallback): void {
        this._router.register(path, createHttpMethodGuardMiddleware('POST', fn));
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

    private async _handleRequest(req: http.IncomingMessage, res: http.ServerResponse): Promise<void> {
        const middlewareStack = this._router.resolve(req.url!);

        if (middlewareStack.length === 0) {
            res.writeHead(404);
            res.end();

            return;
        }

        const requestContext = {
            body: await this._readRequestBody(req),
            method: req.method,
            res: '',
            status: 405
        };

        let nextMiddleware: BoundMiddlewareCallback = noopMiddleware;

        for (let i = middlewareStack.length - 1; i >= 0; i--) {
            nextMiddleware = middlewareStack[i].bind(null, requestContext, nextMiddleware);
        }

        await nextMiddleware();

        res.writeHead(requestContext.status);
        res.write(requestContext.res);
        res.end();
    }

    private async _readRequestBody(req: http.IncomingMessage): Promise<Buffer> {
        const chunks: Buffer[] = [];

        for await (const chunk of req) {
            chunks.push(chunk);
        }

        return Buffer.concat(chunks);
    }
}

export default Server;
