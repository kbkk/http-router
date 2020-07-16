import * as chai from "chai";
import * as chaiAsPromised from "chai-as-promised";
import fetch from "node-fetch";
import Server from "../Server";

chai.use(chaiAsPromised);
const {expect} = chai;

describe('Server', () => {
    let server: Server;
    let serverUrl: string;

    beforeEach(async () => {
        server = new Server();

        serverUrl = await server.start(0, '127.0.0.1');
    });

    afterEach(async () => {
        await server.stop();
    });

    it('should throw if start() is called after the server has already been started', async () => {
        await expect(server.start(0)).to.eventually.be.rejectedWith('The server has already been started!');
    });

    it('should respond with 404 when no route is found', async () => {
        const result = await fetch(`${serverUrl}test`);

        expect(result.status).to.eql(404);
    });

    it('should respond with 405 when a route is invoked with invalid HTTP method', async () => {
        server.post('/test', async ctx => {
            ctx.res = 'POST /test response';
        });

        const result = await fetch(`${serverUrl}test`);

        expect(result.status).to.eql(405);
    });

    it('should handle GET requests', async () => {
        server.get('/test', async ctx => {
            ctx.res = 'GET /test response';
        });

        const result = await fetch(`${serverUrl}test`);

        expect(result.status).to.eql(200);
        expect(await result.text()).to.eql('GET /test response');
    });

    it('should handle POST requests', async () => {
        server.post('/test', async ctx => {
            ctx.res = ctx.body;
        });

        const result = await fetch(`${serverUrl}test`, {method: 'POST', body: 'test-body'});

        expect(result.status).to.eql(200);
        expect(await result.text()).to.eql('test-body');
    });

    it('should handle different GET/POST callbacks on same path', async () => {
        server.use('/same-path-test', async (ctx, next) => {
            ctx.res = 'middleware ';

            await next();
        });

        server.get('/same-path-test', async ctx => {
            ctx.res += 'GET /same-path-test response';
        });

        server.post('/same-path-test', async ctx => {
            ctx.res += 'POST /same-path-test response';
        });

        const getResult = await fetch(`${serverUrl}same-path-test`);
        const postResult = await fetch(`${serverUrl}same-path-test`, {method: 'POST'});

        expect(await getResult.text()).to.eql('middleware GET /same-path-test response');
        expect(await postResult.text()).to.eql('middleware POST /same-path-test response');
    });
});
