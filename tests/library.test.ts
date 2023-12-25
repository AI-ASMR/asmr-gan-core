import { describe, expect, it } from '@jest/globals';

import AiMR_GAN from '@lib/index';
import * as tf from '@tensorflow/tfjs';

/**
 * @jest-environment jsdom
 */

describe('the library', () => {
    it('should load from resource first time', async () => {
        expect(AiMR_GAN.loaded).toBe(false);
        expect(AiMR_GAN.cached).toBe(false);
        await expect(AiMR_GAN.load(tf)).resolves.toBe(undefined);
    }, 10_000);
    it('should load from indexeddb after first time', () => {
        // todo:
    });
    it('loading should throw if not bound', () => {
        // todo:
    });
    it('generating should throw if not bound', () => {
        // todo:
    });
    it('generating should throw if invalid chunk size', () => {
        // todo:
    });
    it('generating should work', () => {
        // todo:
    });
});