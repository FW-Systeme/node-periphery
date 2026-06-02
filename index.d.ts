export type GpioDirection = 'in' | 'out' | 'high' | 'low';
export type GpioEdge = 'none' | 'rising' | 'falling' | 'both';

export interface GpioOptions {
    /** Which /dev/gpiochipN to use. Default: 0 */
    chip?: number;
    /** Invert read/write values. Default: false */
    activeLow?: boolean;
    /** Kernel-native debounce in milliseconds. Default: 0 (disabled) */
    debounceTimeout?: number;
    /** Consumer label shown in gpioinfo. Default: 'node-periphery' */
    consumer?: string;
}

export declare class Gpio {
    constructor(offset: number, direction: GpioDirection, options?: GpioOptions);
    constructor(offset: number, direction: GpioDirection, edge: GpioEdge, options?: GpioOptions);

    /** Read GPIO value synchronously. Returns 0 or 1. */
    readSync(): 0 | 1;

    /** Write GPIO value synchronously. */
    writeSync(value: 0 | 1): void;

    /** Read GPIO value asynchronously. Resolves with 0 or 1. */
    read(): Promise<0 | 1>;

    /** Write GPIO value asynchronously. */
    write(value: 0 | 1): Promise<void>;

    /** Register a callback for hardware interrupt events. Returns this for chaining. */
    watch(callback: (err: Error | null, value: 0 | 1) => void): this;

    /** Remove a specific interrupt callback (or all if omitted). Returns this. */
    unwatch(callback?: (err: Error | null, value: 0 | 1) => void): this;

    /** Remove all interrupt callbacks. */
    unwatchAll(): void;

    /** Get current direction. */
    direction(): GpioDirection;

    /** Reconfigure direction without reopening the line fd. */
    setDirection(direction: GpioDirection): void;

    /** Get current interrupt edge setting. */
    edge(): GpioEdge;

    /** Reconfigure interrupt edge without reopening the line fd. */
    setEdge(edge: GpioEdge): void;

    /** Get activeLow setting. */
    activeLow(): boolean;

    /** Set activeLow — inverts all read/write values. */
    setActiveLow(invert: boolean): void;

    /** Release the GPIO line and close file descriptors. */
    unexport(): void;

    /** Async resource disposal — enables `await using gpio = new Gpio(...)` syntax. */
    [Symbol.asyncDispose](): Promise<void>;

    /** true if /dev/gpiochip0 is accessible by the current process. */
    static readonly accessible: boolean;

    static readonly HIGH: 1;
    static readonly LOW: 0;
}

// ── SPI types ────────────────────────────────────────────────────────────────

/** Options read back from or written to a SPI device. */
export interface SpiDeviceOptions {
    /** SPI mode (use spi.MODE0 – spi.MODE3). */
    mode?: number;
    /** Bits per word. Typically 8. */
    bitsPerWord?: number;
    /** Maximum transfer speed in Hz. */
    maxSpeedHz?: number;
    chipSelectHigh?: boolean;
    lsbFirst?: boolean;
    threeWire?: boolean;
    loopback?: boolean;
    noChipSelect?: boolean;
    ready?: boolean;
}

/** One segment of a SPI transfer message. */
export interface SpiMessage {
    /** Data to send. Required unless receiveBuffer is set. */
    sendBuffer?: Buffer;
    /** Buffer to fill with received data. Required unless sendBuffer is set. */
    receiveBuffer?: Buffer;
    /** Number of bytes to transfer. */
    byteLength: number;
    /** Per-segment speed override in Hz. */
    speedHz?: number;
    /** Delay in microseconds after this segment. */
    microSecondDelay?: number;
}

/** A handle to an open SPI device, returned by spi.open / spi.openSync. */
export interface SpiDevice {
    /** Close the device asynchronously. */
    close(callback: (err: Error | null) => void): void;
    /** Close the device synchronously. */
    closeSync(): void;

    /** Perform a SPI transfer asynchronously. */
    transfer(message: SpiMessage[], callback: (err: Error | null) => void): void;
    /** Perform a SPI transfer synchronously. */
    transferSync(message: SpiMessage[]): void;

    /** Read device options asynchronously. */
    getOptions(callback: (err: Error | null, options: SpiDeviceOptions) => void): void;
    /** Read device options synchronously. */
    getOptionsSync(): SpiDeviceOptions;

    /** Write device options asynchronously. */
    setOptions(options: SpiDeviceOptions, callback: (err: Error | null) => void): void;
    /** Write device options synchronously. */
    setOptionsSync(options: SpiDeviceOptions): void;
}

export declare const spi: {
    /** Open a SPI device asynchronously. */
    open(bus: number, device: number, callback: (err: Error | null, dev: SpiDevice) => void): void;
    open(bus: number, device: number, options: SpiDeviceOptions, callback: (err: Error | null, dev: SpiDevice) => void): void;

    /** Open a SPI device synchronously. */
    openSync(bus: number, device: number, options?: SpiDeviceOptions): SpiDevice;

    readonly MODE0: 0;
    readonly MODE1: 1;
    readonly MODE2: 2;
    readonly MODE3: 3;
};
