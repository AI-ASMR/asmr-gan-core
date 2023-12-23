import {describe, expect, test} from '@jest/globals';

import Model from '@common/model';

describe('some dummy model', () => {
    test('some dummy test', () => {
        expect(Model.ADAM_BETA1).toBe(0.5);
    });
});