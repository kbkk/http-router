import {expect} from "chai";
import {Router} from "../Router";

describe('Router', () => {
    let router: Router<string>;

    beforeEach(() => {
        router = new Router<string>();
    });

    it('should return an empty array when an unknown path is requested', function () {
        const result = router.resolve('/');

        expect(result).to.eql([]);
    });

    it('should resolve / (root)', () => {
        router.register('/', 'test');

        const result = router.resolve('/');

        expect(result).to.eql(['test']);
    });

    it('should resolve /d/e/e/p/1 (nested path)', () => {
        router.register('/d/e/e/p/1', 'test');

        const result = router.resolve('/d/e/e/p/1');

        expect(result).to.eql(['test']);
    });

    it('should return result in insertion order', function () {
        router.register('/nested', '1');
        router.register('/nested/path', '2');
        router.register('/nested', '3');

        const result = router.resolve('/nested/path');

        expect(result).to.eql(['1', '2', '3']);
    });
});

