import { describe, expect, it } from '@jest/globals';

import Model from '@common/model';

describe('generator model', () => {
    it('should be trainable', () => {
        // todo:
    });
    it('should expect noisy latent space', () => {
        // todo:
    });
    it('should support (grayscale) output shape', () => {
        // todo:
    });
    it('should support (rgb) output shape', () => {
        // todo:
    });
    it('should have output in range -1 to 1', () => {
        // todo:
    });
    it('should be deterministic if seeded', () => {
        // todo:
    });
});

describe('discriminator model', () => {
    it('should be trainable', () => {
        // todo:
    });
    it('should support (grayscale) image as input', () => {
        // todo:
    });
    it('should support (rgb) image as input', () => {
        // todo:
    });
    it('should have scalar-like output in range 0 to 1', () => {
        // todo:
    });
    it('should be deterministic if seeded', () => {
        // todo:
    });
});

describe('combined model', () => {
    it('should be trainable', () => {
        // todo:
    });
    it('should expect noisy latent space', () => {
        // todo:
    });
    it('should have (discriminator) non-trainable weights', () => {
        // todo:
    });
    it('should have scalar-like output in range 0 to 1', () => {
        // todo:
    });
    it('should be deterministic if seeded', () => {
        // todo:
    });
});