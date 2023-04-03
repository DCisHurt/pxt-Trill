enum TrillSpeed {
    ULTRA_FAST = 0,
    FAST = 1,
    NORMAL = 2,
    SLOW = 3
}

enum TrillMode {
    AUTO = -1,
    CENTROID = 0,
    RAW = 1,
    BASELINE = 2,
    DIFF = 3
};

enum TrillDevice {
    TRILL_BAR = 1,
    TRILL_SQUARE = 2,
    TRILL_CRAFT = 3,
    TRILL_RING = 4,
    TRILL_HEX = 5,
    TRILL_FLEX = 6
};

namespace Trill {

    enum MaxTouchNum {
        k1D = 5,
        k2D = 4
    };

    enum Length {
        kCentroidDefault = 20,
        kCentroidRing = 24,
        kCentroid2D = 32,
        kRaw = 60
    };

    enum Command {
        kNone = 0,
        kMode = 1,
        kScanSettings = 2,
        kPrescaler = 3,
        kNoiseThreshold = 4,
        kIdac = 5,
        kBaselineUpdate = 6,
        kMinimumSize = 7,
        kAutoScanInterval = 16,
        kIdentify = 255
    };

    enum Offset {
        kCommand = 0,
        kData = 4
    };

    const commandDelay = 15;

    let device: TrillDevice;
    let address: number;
    let mode: number;
    let state: Offset;
    let maxTouch: number;
    let numTouch: number;
    let rawData: Buffer;
    let touchData: number[];

    export function init(
        touchDevice: TrillDevice,
        touchMode: TrillMode,
        speed: TrillSpeed,
        numBits: number,
        prescaler: number,
        threshold: number
    ): void {

        device = touchDevice;

        defaultSet();

        if (touchMode == TrillMode.AUTO) {
            setMode(mode);
        }
        else {
            setMode(touchMode);
        }
        i2cWriteCommand(Command.kMode, mode);
        
        rawData = pins.createBuffer(Length.kRaw);
        touchData = [0x0001];

        setScanSettings(speed, numBits);

        // setPrescaler(prescaler);

        setNoiseThreshold(threshold);

        updateBaseline();

        numTouch = 0;
    }


    export function read(): void {
        if (mode == TrillMode.CENTROID) {

            if (state == Offset.kCommand) {
                i2cWriteCommand(Offset.kData);
                state = Offset.kData;
            }

            let length = Length.kCentroidDefault;

            if (device == TrillDevice.TRILL_SQUARE || device == TrillDevice.TRILL_HEX) { length = Length.kCentroid2D; }
            if (device == TrillDevice.TRILL_RING) { length = Length.kCentroidRing; }

            rawData = pins.i2cReadBuffer(address, length + 4, false);

            let loc = 0;

            // Convert raw data to 16-bit values
            while (loc <= length) {
                touchData[loc] = (rawData[2*loc + 4] << 8) + rawData[2*loc + 5];
                loc++;
            }

            // Look for 1st instance of 0xFFFF (no touch) in the buffer
            for (numTouch = 0; numTouch < maxTouch; ++numTouch) {
                if (touchData[numTouch + maxTouch] < 2000)
                    break;// at the first non-touch, break
                if (touchData[numTouch] > 65500)
                    break;// at the first non-touch, break
            }

        }
    }

    export function touchCoordinate(index: number): number {
        if (index < numTouch) { return touchData[index]; }
        else { return 65535; }
        
    }

    export function touchSize(index: number): number {
        if (index < numTouch) { return touchData[index + maxTouch]; }
        else { return 0; }
    }

    export function updateBaseline(): void {
        i2cWriteCommand(Command.kBaselineUpdate);
    }

    export function numTouchRead(): number {
        return numTouch;
    }

    function i2cWriteCommand(register: number, value1?: number, value2?: number): void {
        let buf: Buffer;
        if (typeof value2 !== 'undefined') {
            buf = pins.createBuffer(4);
            buf[0] = Offset.kCommand;
            buf[1] = register;
            buf[2] = value1;
            buf[3] = value2;
        }
        else if (typeof value1 !== 'undefined') {
            buf = pins.createBuffer(3);
            buf[0] = Offset.kCommand;
            buf[1] = register;
            buf[2] = value1;
        }
        else {
            buf = pins.createBuffer(2);
            buf[0] = Offset.kCommand;
            buf[1] = register;
        }

        pins.i2cWriteBuffer(address, buf);
        state = Offset.kCommand;
        basic.pause(commandDelay);
    }

    function defaultSet(): void {
        switch (device) {
            case TrillDevice.TRILL_BAR:
                address = 0x20;
                mode = TrillMode.CENTROID;
                maxTouch = MaxTouchNum.k1D;
                break;
            case TrillDevice.TRILL_SQUARE:
                address = 0x28;
                mode = TrillMode.CENTROID;
                maxTouch = MaxTouchNum.k2D;
                break;
            case TrillDevice.TRILL_CRAFT:
                address = 0x30;
                mode = TrillMode.DIFF;
                maxTouch = MaxTouchNum.k1D;
                break;
            case TrillDevice.TRILL_RING:
                address = 0x38;
                mode = TrillMode.CENTROID;
                maxTouch = MaxTouchNum.k1D;
                break;
            case TrillDevice.TRILL_HEX:
                address = 0x40;
                mode = TrillMode.CENTROID;
                maxTouch = MaxTouchNum.k2D;
                break;
            case TrillDevice.TRILL_FLEX:
                address = 0x48;
                mode = TrillMode.DIFF;
                maxTouch = MaxTouchNum.k1D;
                break;
            default:
                address = 0xFF;
                mode = TrillMode.AUTO;
                maxTouch = MaxTouchNum.k1D;
                break;
        }
    }

    function setMode(touchMode: TrillMode): void {
        mode = touchMode;
        i2cWriteCommand(Command.kMode, mode)
        numTouch = 0;
    }

    function setScanSettings(speed: TrillSpeed, numBits: number): void {
        if (speed > 3) { speed = 3; }
        if (numBits < 9) { numBits = 9; }
        if (numBits > 16) { numBits = 16; }

        i2cWriteCommand(Command.kScanSettings, speed, numBits);
    }

    function setPrescaler(prescaler: number): void {
        i2cWriteCommand(Command.kPrescaler, prescaler);
    }

    function setNoiseThreshold(threshold: number): void {
        if (threshold > 255)
            threshold = 255;
        if (threshold < 0)
            threshold = 0;
        i2cWriteCommand(Command.kNoiseThreshold, threshold);
    }

    function setIDACValue(value: number): void {
        i2cWriteCommand(Command.kIdac, value);
    }

    function setMinimumTouchSize(size: number): void {
        i2cWriteCommand(Command.kMinimumSize, (size >> 8), (size & 0xFF));
    }

    function setAutoScanInterval(interval: number): void {
        i2cWriteCommand(Command.kAutoScanInterval, (interval >> 8), (interval & 0xFF));
    }

    function getButtonValue(): number {
        if ((mode != TrillMode.CENTROID) || (device != TrillDevice.TRILL_RING)) { return -1; }
        else { return 0; }
        // { return buffer_[2 * maxTouch]; }
    }

    function is1D(): boolean {
        if (mode != TrillMode.CENTROID)
            return false;
        switch (device) {
            case TrillDevice.TRILL_BAR:
            case TrillDevice.TRILL_RING:
            case TrillDevice.TRILL_CRAFT:
            case TrillDevice.TRILL_FLEX:
                return true;
            default:
                return false;
        }
    }

    function is2D(): boolean {
        switch (device) {
            case TrillDevice.TRILL_SQUARE:
            case TrillDevice.TRILL_HEX:
                return true;
            default:
                return false;
        }
    }
}