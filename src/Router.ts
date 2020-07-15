type RouteNode<T> = {
    path: string;
    stack: (RouteNode<T> | T)[];
}

const keepNonEmpty = x => x;

export class Router<T> {
    private _routeStack: RouteNode<T> = this._createRouteNode();

    public register(path: string, value: T) {
        const segments = this._pathToSegments(path);

        let node = this._routeStack;

        for (const segment of segments) {
            const foundNode = node.stack.find(item => this._isRouteNode(item) && item.path === segment) as RouteNode<T>;

            if (foundNode) {
                node = foundNode;
                continue;
            }

            const newNode = this._createRouteNode(segment);
            node.stack.push(newNode);
            node = newNode;
        }

        node.stack.push(value);
    }

    public resolve(path: string): T[] {
        return this._resolve(
            this._pathToSegments(path)
        );
    }

    private _resolve(segments: string[], node: RouteNode<T> = this._routeStack, result: T[] = []): T[] {
        for (const stackItem of node.stack) {
            if(!this._isRouteNode(stackItem)) {
                result.push(stackItem);
            } else if(stackItem.path === segments[0]) {
                 this._resolve(segments.slice(1), stackItem, result)
            }
        }

        return result;
    }

    private _pathToSegments(path: string): string[] {
        if (path[0] !== '/') {
            path = '/' + path;
        }

        return path.split('/').filter(keepNonEmpty);
    }

    private _isRouteNode(value: unknown): value is RouteNode<T> {
        return typeof value === 'object' && 'stack' in (value as object);
    }

    private _createRouteNode(path = '/'): RouteNode<T> {
        return {
            path,
            stack: []
        }
    }
}
