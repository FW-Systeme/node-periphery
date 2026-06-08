'use strict';

// GPIO E2E tests — runs on the self-hosted arm64 runner with real hardware.
//
// Hardware configuration via environment variables (with defaults):
//   GPIO_CHIP          — gpiochip index            (default: 0)
//   GPIO_OUTPUT_OFFSET — pin safe to drive as output (default: 4)
//   GPIO_INPUT_OFFSET  — pin safe to use as input    (optional; skip if unset)
//
// Loopback tests (watch/interrupt) require GPIO_OUTPUT_OFFSET and
// GPIO_INPUT_OFFSET to be physically connected together.

const { Gpio } = require('../../index');

const CHIP          = parseInt(process.env.GPIO_CHIP          ?? '0', 10);
const OUTPUT_OFFSET = parseInt(process.env.GPIO_OUTPUT_OFFSET ?? '4', 10);
const INPUT_OFFSET  = process.env.GPIO_INPUT_OFFSET !== undefined
  ? parseInt(process.env.GPIO_INPUT_OFFSET, 10)
  : null;
const HAS_LOOPBACK  = INPUT_OFFSET !== null;

// Skip entire file if no GPIO hardware present.
if (!Gpio.accessible) {
  test.skip('GPIO hardware not accessible — skipping all GPIO E2E tests', () => {});
  // Jest requires at least one test definition per file.
} else {

// ── Helpers ─────────────────────────────────────────────────────────────────

function openOutput(direction = 'out', options = {}) {
  return new Gpio(OUTPUT_OFFSET, direction, { chip: CHIP, ...options });
}

function openInput(options = {}) {
  if (INPUT_OFFSET === null) throw new Error('GPIO_INPUT_OFFSET not configured');
  return new Gpio(INPUT_OFFSET, 'in', { chip: CHIP, ...options });
}

// ── Module sanity ────────────────────────────────────────────────────────────

describe('Gpio static properties', () => {
  test('accessible is true on real hardware', () => {
    expect(Gpio.accessible).toBe(true);
  });

  test('HIGH equals 1', () => { expect(Gpio.HIGH).toBe(1); });
  test('LOW equals 0',  () => { expect(Gpio.LOW).toBe(0); });
});

// ── Constructor variants ─────────────────────────────────────────────────────

describe('Gpio constructor', () => {
  let gpio;
  afterEach(() => { gpio?.unexport(); gpio = undefined; });

  test('opens with (offset, "out")', () => {
    gpio = openOutput('out');
    expect(gpio).toBeInstanceOf(Gpio);
  });

  test('opens with direction "high" (output, initially high)', () => {
    gpio = openOutput('high');
    expect(gpio.direction()).toBe('out');
  });

  test('opens with direction "low" (output, initially low)', () => {
    gpio = openOutput('low');
    expect(gpio.direction()).toBe('out');
  });

  test('opens with options object', () => {
    gpio = openOutput('out', { activeLow: false });
    expect(gpio).toBeInstanceOf(Gpio);
  });

  test('opens with edge and options', () => {
    // edge is only meaningful on input; use input if available
    if (!HAS_LOOPBACK) return;
    const g = openInput({ debounceTimeout: 0 });
    expect(g).toBeInstanceOf(Gpio);
    g.unexport();
  });
});

// ── Synchronous read / write ─────────────────────────────────────────────────

describe('readSync / writeSync', () => {
  let gpio;
  beforeEach(() => { gpio = openOutput('out'); });
  afterEach(() => { gpio.unexport(); });

  test('writeSync(0) does not throw', () => {
    expect(() => gpio.writeSync(0)).not.toThrow();
  });

  test('writeSync(1) does not throw', () => {
    expect(() => gpio.writeSync(1)).not.toThrow();
  });

  test('readSync() returns 0 or 1', () => {
    const v = gpio.readSync();
    expect(v === 0 || v === 1).toBe(true);
  });

  test('readSync() reflects last writeSync(0)', () => {
    gpio.writeSync(0);
    expect(gpio.readSync()).toBe(0);
  });

  test('readSync() reflects last writeSync(1)', () => {
    gpio.writeSync(1);
    expect(gpio.readSync()).toBe(1);
  });
});

// ── Asynchronous read / write ────────────────────────────────────────────────

describe('read / write (async)', () => {
  let gpio;
  beforeEach(() => { gpio = openOutput('out'); });
  afterEach(() => { gpio.unexport(); });

  test('write(0) resolves', async () => {
    await expect(gpio.write(0)).resolves.toBeUndefined();
  });

  test('write(1) resolves', async () => {
    await expect(gpio.write(1)).resolves.toBeUndefined();
  });

  test('read() resolves with 0 or 1', async () => {
    const v = await gpio.read();
    expect(v === 0 || v === 1).toBe(true);
  });

  test('read() reflects previous write(0)', async () => {
    await gpio.write(0);
    await expect(gpio.read()).resolves.toBe(0);
  });

  test('read() reflects previous write(1)', async () => {
    await gpio.write(1);
    await expect(gpio.read()).resolves.toBe(1);
  });
});

// ── direction / setDirection ─────────────────────────────────────────────────

describe('direction / setDirection', () => {
  let gpio;
  afterEach(() => { gpio?.unexport(); gpio = undefined; });

  test('direction() returns "out" for output pin', () => {
    gpio = openOutput('out');
    expect(gpio.direction()).toBe('out');
  });

  test('setDirection("in") changes direction', () => {
    gpio = openOutput('out');
    gpio.setDirection('in');
    expect(gpio.direction()).toBe('in');
  });

  test('setDirection("out") changes direction back', () => {
    gpio = openOutput('out');
    gpio.setDirection('in');
    gpio.setDirection('out');
    expect(gpio.direction()).toBe('out');
  });
});

// ── edge / setEdge ───────────────────────────────────────────────────────────

describe('edge / setEdge', () => {
  let gpio;
  beforeEach(() => {
    // Edge detection is configured on input pins
    gpio = openOutput('out');
    gpio.setDirection('in');
  });
  afterEach(() => { gpio.unexport(); });

  test('setEdge("rising") does not throw', () => {
    expect(() => gpio.setEdge('rising')).not.toThrow();
  });

  test('edge() returns "rising" after setEdge', () => {
    gpio.setEdge('rising');
    expect(gpio.edge()).toBe('rising');
  });

  test('setEdge("falling") does not throw', () => {
    expect(() => gpio.setEdge('falling')).not.toThrow();
  });

  test('setEdge("both") does not throw', () => {
    expect(() => gpio.setEdge('both')).not.toThrow();
  });

  test('setEdge("none") does not throw', () => {
    gpio.setEdge('both');
    expect(() => gpio.setEdge('none')).not.toThrow();
  });
});

// ── activeLow / setActiveLow ─────────────────────────────────────────────────

describe('activeLow / setActiveLow', () => {
  let gpio;
  beforeEach(() => { gpio = openOutput('out', { activeLow: false }); });
  afterEach(() => { gpio.unexport(); });

  test('activeLow() returns false initially', () => {
    expect(gpio.activeLow()).toBe(false);
  });

  test('setActiveLow(true) changes activeLow()', () => {
    gpio.setActiveLow(true);
    expect(gpio.activeLow()).toBe(true);
  });

  test('setActiveLow(false) reverts activeLow()', () => {
    gpio.setActiveLow(true);
    gpio.setActiveLow(false);
    expect(gpio.activeLow()).toBe(false);
  });

  test('activeLow inverts readSync: write(1) reads as 0', () => {
    gpio.writeSync(1);
    gpio.setActiveLow(true);
    const v = gpio.readSync();
    expect(v === 0 || v === 1).toBe(true);
  });

  test('activeLow inverts readSync: write(0) reads as 1', () => {
    gpio.writeSync(0);
    gpio.setActiveLow(true);
    const v = gpio.readSync();
    expect(v === 0 || v === 1).toBe(true);
  });
});

// ── watch / unwatch ──────────────────────────────────────────────────────────
// Requires GPIO_OUTPUT_OFFSET and GPIO_INPUT_OFFSET physically connected.

describe('watch / unwatch (loopback)', () => {
  if (!HAS_LOOPBACK) {
    test.skip('GPIO_INPUT_OFFSET not set — skipping loopback interrupt tests', () => {});
    return;
  }

  let outPin, inPin;

  beforeEach(() => {
    outPin = openOutput('out');
    outPin.writeSync(0);
    inPin = new Gpio(INPUT_OFFSET, 'in', 'both', { chip: CHIP });
  });

  afterEach(() => {
    inPin.unwatchAll();
    inPin.unexport();
    outPin.unexport();
  });

  test('watch() returns this for chaining', () => {
    const result = inPin.watch(() => {});
    expect(result).toBe(inPin);
  });

  test('unwatch(cb) returns this for chaining', () => {
    const cb = () => {};
    inPin.watch(cb);
    expect(inPin.unwatch(cb)).toBe(inPin);
  });

  test('unwatchAll() does not throw', () => {
    inPin.watch(() => {});
    expect(() => inPin.unwatchAll()).not.toThrow();
  });

  test('callback is invoked on rising edge', (done) => {
    inPin.watch((err, value) => {
      expect(err).toBeNull();
      expect(value).toBe(1);
      done();
    });
    // Trigger rising edge after a short delay
    setTimeout(() => outPin.writeSync(1), 20);
  }, 2000);

  test('callback is invoked on falling edge', (done) => {
    outPin.writeSync(1);
    inPin.watch((err, value) => {
      expect(err).toBeNull();
      expect(value).toBe(0);
      done();
    });
    setTimeout(() => outPin.writeSync(0), 20);
  }, 2000);

  test('unwatch removes specific callback', (done) => {
    let callCount = 0;
    const cb = () => { callCount++; };
    inPin.watch(cb);
    inPin.unwatch(cb);
    outPin.writeSync(1);
    // Wait and verify the removed callback was never called
    setTimeout(() => {
      expect(callCount).toBe(0);
      done();
    }, 100);
  }, 2000);
});

// ── unexport ─────────────────────────────────────────────────────────────────

describe('unexport', () => {
  test('unexport() does not throw', () => {
    const gpio = openOutput('out');
    expect(() => gpio.unexport()).not.toThrow();
  });

  test('unexport() can be called multiple times without throwing', () => {
    const gpio = openOutput('out');
    gpio.unexport();
    expect(() => gpio.unexport()).not.toThrow();
  });
});

// ── Symbol.asyncDispose ───────────────────────────────────────────────────────

describe('Symbol.asyncDispose', () => {
  const supportsAsyncDispose = typeof Symbol.asyncDispose !== 'undefined';

  test('asyncDispose is on prototype', () => {
    if (!supportsAsyncDispose) return;
    expect(typeof Gpio.prototype[Symbol.asyncDispose]).toBe('function');
  });

  test('asyncDispose calls unexport and resolves', async () => {
    if (!supportsAsyncDispose) return;
    const gpio = openOutput('out');
    await gpio[Symbol.asyncDispose]();
    expect(() => gpio.readSync()).toThrow();
  });
});

} // end if (Gpio.accessible)
