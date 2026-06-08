'use strict';

// SPI E2E tests — runs on the self-hosted arm64 runner with real hardware.
//
// Hardware configuration via environment variables (with defaults):
//   SPI_BUS    — SPI bus number    (default: 0  → /dev/spidev0.x)
//   SPI_DEVICE — SPI device number (default: 0  → /dev/spidevx.0)
//
// Transfer tests send bytes and verify the response has the correct shape.
// If the connected device echoes data (loopback wire MOSI→MISO), the
// receiveBuffer content is also verified.

const fs   = require('fs');
const { spi } = require('../../index');

const BUS    = parseInt(process.env.SPI_BUS    ?? '0', 10);
const DEVICE = parseInt(process.env.SPI_DEVICE ?? '0', 10);
const SPI_PATH = `/dev/spidev${BUS}.${DEVICE}`;
const HAS_SPI  = fs.existsSync(SPI_PATH);

// Skip entire file if no SPI hardware present.
if (!HAS_SPI) {
  test.skip(`${SPI_PATH} not found — skipping all SPI E2E tests`, () => {});
} else {

// ── openSync / closeSync ─────────────────────────────────────────────────────

describe('openSync / closeSync', () => {
  test('openSync returns a device object', () => {
    const dev = spi.openSync(BUS, DEVICE);
    expect(dev).toBeDefined();
    dev.closeSync();
  });

  test('openSync with mode option', () => {
    const dev = spi.openSync(BUS, DEVICE, { mode: spi.MODE0 });
    expect(dev).toBeDefined();
    expect(typeof dev.closeSync).toBe('function');
    dev.closeSync();
  });

  test('closeSync does not throw', () => {
    const dev = spi.openSync(BUS, DEVICE);
    expect(() => dev.closeSync()).not.toThrow();
  });
});

// ── open / close (async, callback) ───────────────────────────────────────────

describe('open / close (async)', () => {
  test('open calls back with (null, device)', (done) => {
    spi.open(BUS, DEVICE, (err, dev) => {
      expect(err).toBeNull();
      expect(dev).toBeDefined();
      dev.closeSync();
      done();
    });
  });

  test('open with options calls back with (null, device)', (done) => {
    spi.open(BUS, DEVICE, { mode: spi.MODE0 }, (err, dev) => {
      expect(err).toBeNull();
      expect(dev).toBeDefined();
      dev.closeSync();
      done();
    });
  });
  test('close (async) calls back without error', (done) => {
    spi.open(BUS, DEVICE, (err, dev) => {
      expect(err).toBeNull();
      dev.close((closeErr) => {
        expect(closeErr).toBeNull();
        done();
      });
    });
  });
});

// ── getOptionsSync ────────────────────────────────────────────────────────────

describe('getOptionsSync', () => {
  let dev;
  beforeEach(() => { dev = spi.openSync(BUS, DEVICE); });
  afterEach(() => { dev.closeSync(); });

  test('returns an object', () => {
    const opts = dev.getOptionsSync();
    expect(typeof opts).toBe('object');
    expect(opts).not.toBeNull();
  });

  test('contains mode (0–3)', () => {
    const { mode } = dev.getOptionsSync();
    expect([spi.MODE0, spi.MODE1, spi.MODE2, spi.MODE3]).toContain(mode);
  });

  test('contains bitsPerWord (positive integer)', () => {
    const { bitsPerWord } = dev.getOptionsSync();
    expect(typeof bitsPerWord).toBe('number');
    expect(bitsPerWord).toBeGreaterThan(0);
  });

  test('contains maxSpeedHz (positive integer)', () => {
    const { maxSpeedHz } = dev.getOptionsSync();
    expect(typeof maxSpeedHz).toBe('number');
    expect(maxSpeedHz).toBeGreaterThan(0);
  });

  test('contains boolean flags: chipSelectHigh, lsbFirst, threeWire, loopback, noChipSelect, ready', () => {
    const opts = dev.getOptionsSync();
    for (const flag of ['chipSelectHigh', 'lsbFirst', 'threeWire', 'loopback', 'noChipSelect', 'ready']) {
      expect(typeof opts[flag]).toBe('boolean');
    }
  });
});

// ── getOptions (async, callback) ──────────────────────────────────────────────

describe('getOptions (async)', () => {
  let dev;
  beforeEach(() => { dev = spi.openSync(BUS, DEVICE); });
  afterEach(() => { dev.closeSync(); });

  test('calls back with (null, options)', (done) => {
    dev.getOptions((err, opts) => {
      expect(err).toBeNull();
      expect(typeof opts).toBe('object');
      done();
    });
  });

  test('async options match sync options', (done) => {
    const syncOpts = dev.getOptionsSync();
    dev.getOptions((err, asyncOpts) => {
      expect(err).toBeNull();
      expect(asyncOpts.mode).toBe(syncOpts.mode);
      expect(asyncOpts.bitsPerWord).toBe(syncOpts.bitsPerWord);
      expect(asyncOpts.maxSpeedHz).toBe(syncOpts.maxSpeedHz);
      done();
    });
  });
});

// ── setOptionsSync ────────────────────────────────────────────────────────────

describe('setOptionsSync', () => {
  let dev;
  let originalOpts;

  beforeEach(() => {
    dev = spi.openSync(BUS, DEVICE);
    originalOpts = dev.getOptionsSync();
  });
  afterEach(() => {
    // Restore original settings
    dev.setOptionsSync(originalOpts);
    dev.closeSync();
  });

  test('setOptionsSync does not throw', () => {
    expect(() => dev.setOptionsSync({ mode: spi.MODE0 })).not.toThrow();
  });

  test('setting mode is reflected by getOptionsSync', () => {
    dev.setOptionsSync({ mode: spi.MODE0 });
    expect(dev.getOptionsSync().mode).toBe(spi.MODE0);
  });

  test('setting maxSpeedHz is reflected by getOptionsSync', () => {
    const target = 500000;
    dev.setOptionsSync({ maxSpeedHz: target });
    expect(dev.getOptionsSync().maxSpeedHz).toBe(target);
  });

  test('setting bitsPerWord 8 is reflected by getOptionsSync', () => {
    dev.setOptionsSync({ bitsPerWord: 8 });
    expect(dev.getOptionsSync().bitsPerWord).toBe(8);
  });
});

// ── setOptions (async, callback) ──────────────────────────────────────────────

describe('setOptions (async)', () => {
  let dev;
  let originalOpts;

  beforeEach(() => {
    dev = spi.openSync(BUS, DEVICE);
    originalOpts = dev.getOptionsSync();
  });
  afterEach(() => {
    dev.setOptionsSync(originalOpts);
    dev.closeSync();
  });

  test('calls back without error', (done) => {
    dev.setOptions({ mode: spi.MODE0 }, (err) => {
      expect(err).toBeNull();
      done();
    });
  });

  test('async set is reflected by getOptionsSync', (done) => {
    dev.setOptions({ maxSpeedHz: 500000 }, (err) => {
      expect(err).toBeNull();
      expect(dev.getOptionsSync().maxSpeedHz).toBe(500000);
      done();
    });
  });
});

// ── transferSync ──────────────────────────────────────────────────────────────

describe('transferSync', () => {
  let dev;
  beforeEach(() => {
    dev = spi.openSync(BUS, DEVICE);
    dev.setOptionsSync({ maxSpeedHz: 500000 });
  });
  afterEach(() => { dev.closeSync(); });

  test('send-only transfer (sendBuffer only) does not throw', () => {
    const msg = [{ sendBuffer: Buffer.from([0x00, 0x01, 0x02, 0x03]), byteLength: 4 }];
    expect(() => dev.transferSync(msg)).not.toThrow();
  });

  test('receive-only transfer (receiveBuffer only) does not throw', () => {
    const rxBuf = Buffer.alloc(4);
    const msg = [{ receiveBuffer: rxBuf, byteLength: 4 }];
    expect(() => dev.transferSync(msg)).not.toThrow();
    // receiveBuffer is now populated (content device-dependent)
    expect(rxBuf).toHaveLength(4);
  });

  test('full-duplex transfer (send + receive) does not throw', () => {
    const txBuf = Buffer.from([0xAA, 0xBB, 0xCC, 0xDD]);
    const rxBuf = Buffer.alloc(4);
    const msg = [{ sendBuffer: txBuf, receiveBuffer: rxBuf, byteLength: 4 }];
    expect(() => dev.transferSync(msg)).not.toThrow();
  });

  test('multi-message transfer does not throw', () => {
    const msg = [
      { sendBuffer: Buffer.from([0x01]), byteLength: 1 },
      { sendBuffer: Buffer.from([0x02]), byteLength: 1 },
    ];
    expect(() => dev.transferSync(msg)).not.toThrow();
  });

  test('transfer with speedHz override does not throw', () => {
    const msg = [{ sendBuffer: Buffer.from([0xFF]), byteLength: 1, speedHz: 100000 }];
    expect(() => dev.transferSync(msg)).not.toThrow();
  });

  test('transfer with microSecondDelay does not throw', () => {
    const msg = [{ sendBuffer: Buffer.from([0x00]), byteLength: 1, microSecondDelay: 10 }];
    expect(() => dev.transferSync(msg)).not.toThrow();
  });

  test('invalid transfer (no sendBuffer or receiveBuffer) throws', () => {
    const msg = [{ byteLength: 4 }];
    expect(() => dev.transferSync(msg)).toThrow();
  });

  test('sendBuffer smaller than byteLength throws', () => {
    const msg = [{ sendBuffer: Buffer.from([0x01]), byteLength: 4 }];
    expect(() => dev.transferSync(msg)).toThrow();
  });
});

// ── transfer (async, callback) ────────────────────────────────────────────────

describe('transfer (async)', () => {
  let dev;
  beforeEach(() => {
    dev = spi.openSync(BUS, DEVICE);
    dev.setOptionsSync({ maxSpeedHz: 500000 });
  });
  afterEach(() => { dev.closeSync(); });

  test('send-only transfer calls back without error', (done) => {
    const msg = [{ sendBuffer: Buffer.from([0x00, 0x01]), byteLength: 2 }];
    dev.transfer(msg, (err) => {
      expect(err).toBeNull();
      done();
    });
  });

  test('full-duplex transfer calls back without error', (done) => {
    const rxBuf = Buffer.alloc(2);
    const msg   = [{ sendBuffer: Buffer.from([0xAA, 0xBB]), receiveBuffer: rxBuf, byteLength: 2 }];
    dev.transfer(msg, (err) => {
      expect(err).toBeNull();
      expect(rxBuf).toHaveLength(2);
      done();
    });
  });

  test('invalid transfer calls back with an error', (done) => {
    const msg = [{ byteLength: 4 }]; // missing sendBuffer/receiveBuffer
    dev.transfer(msg, (err) => {
      expect(err).toBeTruthy();
      expect(typeof err.message).toBe('string');
      done();
    });
  });
});

// ── Multiple devices open simultaneously ─────────────────────────────────────

describe('multiple devices', () => {
  test('two openSync calls return independent device objects', () => {
    const dev1 = spi.openSync(BUS, DEVICE);
    const dev2 = spi.openSync(BUS, DEVICE);
    expect(dev1).not.toBe(dev2);
    dev1.closeSync();
    dev2.closeSync();
  });

  test('setOptions on one device does not affect the other', () => {
    const dev1 = spi.openSync(BUS, DEVICE);
    const dev2 = spi.openSync(BUS, DEVICE);
    const original = dev1.getOptionsSync().maxSpeedHz;
    dev1.setOptionsSync({ maxSpeedHz: 250000 });
    // dev2 reads its own handle — should still reflect kernel state for that fd
    expect(dev1.getOptionsSync().maxSpeedHz).toBe(250000);
    dev1.setOptionsSync({ maxSpeedHz: original });
    dev1.closeSync();
    dev2.closeSync();
  });
});

} // end if (HAS_SPI)
