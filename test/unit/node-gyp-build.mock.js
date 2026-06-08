'use strict';

class MockGpio {
  constructor(offset, direction, ...args) {
    this._offset = offset;
    this._direction = direction;
    this._edge = 'none';
    this._activeLow = false;

    if (args.length > 0) {
      if (typeof args[0] === 'string') {
        this._edge = args[0];
        if (args[1] && typeof args[1] === 'object') {
          this._activeLow = args[1].activeLow || false;
        }
      } else if (args[0] && typeof args[0] === 'object') {
        this._activeLow = args[0].activeLow || false;
      }
    }
  }

  readSync() { return 0; }
  writeSync(_value) {}
  read() { return Promise.resolve(0); }
  write(_value) { return Promise.resolve(); }
  watch(_callback) { return this; }
  unwatch(_callback) { return this; }
  unwatchAll() {}
  direction() { return this._direction; }
  setDirection(direction) { this._direction = direction; }
  edge() { return this._edge; }
  setEdge(edge) { this._edge = edge; }
  activeLow() { return this._activeLow; }
  setActiveLow(invert) { this._activeLow = invert; }
  unexport() {}
}

MockGpio.accessible = false;
MockGpio.HIGH = 1;
MockGpio.LOW = 0;

const mockSpiDevice = {
  close:          jest.fn((cb) => cb(null)),
  closeSync:      jest.fn(),
  transfer:       jest.fn((msg, cb) => cb(null)),
  transferSync:   jest.fn(),
  getOptions:     jest.fn((cb) => cb(null, { mode: 0, bitsPerWord: 8, maxSpeedHz: 500000, chipSelectHigh: false, lsbFirst: false, threeWire: false, loopback: false, noChipSelect: false, ready: false })),
  getOptionsSync: jest.fn(() => ({ mode: 0, bitsPerWord: 8, maxSpeedHz: 500000, chipSelectHigh: false, lsbFirst: false, threeWire: false, loopback: false, noChipSelect: false, ready: false })),
  setOptions:     jest.fn((opts, cb) => cb(null)),
  setOptionsSync: jest.fn(),
};

const mockSpi = {
  open: jest.fn((_bus, _device, ...args) => {
    const cb = args[args.length - 1];
    if (typeof cb === 'function') cb(null, mockSpiDevice);
  }),
  openSync: jest.fn(() => mockSpiDevice),
  MODE0: 0,
  MODE1: 1,
  MODE2: 2,
  MODE3: 3,
};

module.exports = () => ({ Gpio: MockGpio, spi: mockSpi });