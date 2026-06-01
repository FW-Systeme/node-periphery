'use strict';

// Smoke test: verifies the compiled native binary loads correctly and exports
// the expected public API surface. No hardware access.

const addon = require('../../index');
const { Gpio, spi } = addon;

describe('native addon loading', () => {
  test('module loads without throwing', () => {
    expect(addon).toBeDefined();
  });

  test('Gpio class is exported', () => {
    expect(typeof Gpio).toBe('function');
  });

  test('spi object is exported', () => {
    expect(spi).toBeDefined();
    expect(typeof spi).toBe('object');
  });
});

describe('Gpio static constants', () => {
  test('HIGH equals 1', () => { expect(Gpio.HIGH).toBe(1); });
  test('LOW equals 0',  () => { expect(Gpio.LOW).toBe(0); });
  test('accessible is a boolean', () => { expect(typeof Gpio.accessible).toBe('boolean'); });
});

describe('spi static constants', () => {
  test('MODE0 equals 0', () => { expect(spi.MODE0).toBe(0); });
  test('MODE1 equals 1', () => { expect(spi.MODE1).toBe(1); });
  test('MODE2 equals 2', () => { expect(spi.MODE2).toBe(2); });
  test('MODE3 equals 3', () => { expect(spi.MODE3).toBe(3); });
  test('open is a function',     () => { expect(typeof spi.open).toBe('function'); });
  test('openSync is a function', () => { expect(typeof spi.openSync).toBe('function'); });
});

