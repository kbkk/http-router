# HTTP-Router
A simple HTTP router with middleware support 👌

## Concept
Everything within the router is treated as a middleware, the `.get()` and `.post()` methods just wrap the provided function
in another, special middleware that only allows requests of that kind.

The middlewares will run in registration order.

## Usage
```typescript
const port = 1337;
const host = '127.0.0.1';
const server = new Server();

// starting the server will return it's url and port, e.g. http://127.0.0.1:1337/
const serverUrl = await server.start(port, host);

// this middleware will run for each route
server.use('/', async (ctx, next) => {
    if(Math.random() < 0.5) {
        await next();
        // manipulate the response after it's been processed!
        ctx.res += ' And even more of them.'
    } else {
        ctx.status = 401;
        ctx.res = 'You cannot access them kitties, sorry!';
    }
});

server.get('/cats', async ctx => {
    ctx.res = 'Imagine some cute cats here.';
});

// now, GET /cats and if you're not rejected you'll see:
// Imagine some cute cats here. And even more of them.
```
