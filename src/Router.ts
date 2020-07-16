class RouteNode<T> {
    private readonly _stack: (RouteNode<T> | T)[] = [];

    public constructor(
        public readonly path: string
    ) {

    }

    public add(value: RouteNode<T> | T): void {
        this._stack.push(value);
    }

    public next(path: string): RouteNode<T> | undefined {
        return this._stack.find(item => item instanceof RouteNode && item.path === path) as RouteNode<T>;
    }

    public findAll(segments: string[]): T[] {
        const result: T[] = [];

        for (const item of this._stack) {
            if (!(item instanceof RouteNode)) {
                result.push(item);
            } else if (item.path === segments[0]) {
                result.push(...item.findAll(segments.slice(1)));
            }
        }

        return result;
    }
}

const keepNonEmpty = (x: unknown): boolean => !!x;

export class Router<T> {
    private _routeStack: RouteNode<T> = new RouteNode('/');

    public register(path: string, value: T): void {
        const segments = this._pathToSegments(path);

        let node = this._routeStack;

        for (const segment of segments) {
            const foundNode = node.next(segment);

            if (foundNode) {
                node = foundNode;
                continue;
            }

            const newNode = new RouteNode<T>(segment);
            node.add(newNode);
            node = newNode;
        }

        node.add(value);
    }

    public resolve(path: string): T[] {
        return this._resolve(
            this._pathToSegments(path)
        );
    }

    private _resolve(segments: string[]): T[] {
        return this._routeStack.findAll(segments);
    }

    private _pathToSegments(path: string): string[] {
        if (path[0] !== '/') {
            path = '/' + path;
        }

        return path.split('/').filter(keepNonEmpty);
    }
}
