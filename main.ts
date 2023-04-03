enum TrillSpeed {
    ULTRA_FAST = 0,
    FAST = 1,
    NORMAL = 2,
    SLOW =3
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

//% weight=29 color=#444444 icon="\uf0a6" block="Trill"
namespace Trill{

    enum MaxTouchNum{
        k1D = 5,
        k2D = 4
    };
    
    enum Length{
        kCentroidDefault = 20,
        kCentroidRing = 24,
        kCentroid2D = 32,
        kRaw = 60
    };
    
    enum Command{
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
    
    enum Offset{
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


    /**
     *initialize the Trill device
     *@param touchDevice [1-6] the device type
     *@param speed [0-3] the detect speed of the device
     *@param touchMode [-1-3] the touch mode of the device
     *@param numBits [9-16] the resolution of the device
     *@param prescaler [1-8] the sensitivity of the device
     *@param threshold [0-255] the noise threshold of the device
    */
    //%block="set up %touchDevice in mode %touchMode with speed %speed resolution %numBits prescaler x%prescaler noise threshold %threshold"
    //%weight=31 %blockID="setup Trill"
    //% numBits.min=9 numBits.max=16 numBits.defl=12
    //% prescaler.min=1 prescaler.max=8 prescaler.defl=1
    //% threshold.min=0 threshold.max=255 threshold.defl=16
    export function init(
        touchDevice: TrillDevice,
        speed: TrillSpeed,
        touchMode: TrillMode,
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

        rawData = pins.createBuffer(Length.kRaw);

        // TODO: set 2D device
        // if(is2D()) {
        //     horizontal.centroids = buffer_ + 2 * MAX_TOUCH_1D_OR_2D;
        //     horizontal.sizes = buffer_ + 3 * MAX_TOUCH_1D_OR_2D;
        // } else
        //     horizontal.num_touches = 0;

        // Set default scan settings 
        setScanSettings(speed, numBits);

        setPrescaler(prescaler);

        setNoiseThreshold(threshold);

        updateBaseline();

        numTouch = 0;
    }

    /**
     *read the data from device
    */
    //%block="read data from Trill"
    //%weight=31 %blockID="number of touch points"
    export function read(): void {
        if (mode == TrillMode.CENTROID) {
            
            if (state == Offset.kCommand) {
                i2cWriteCommand(Offset.kData);
                state = Offset.kData;
            }

            let length = Length.kCentroidDefault;

            if (device == TrillDevice.TRILL_SQUARE || device == TrillDevice.TRILL_HEX) { length = Length.kCentroid2D; }
            if (device == TrillDevice.TRILL_RING) { length = Length.kCentroidRing; }
            
            rawData = pins.i2cReadBuffer(address, length, false);

            let loc = 0;

            // Convert raw data to 16-bit values
            while(loc <= length) {
                touchData[loc] = (rawData[loc] << 8) + rawData[loc+1];
                loc+=2;
            }
            
            // Look for 1st instance of 0xFFFF (no touch) in the buffer
            for(numTouch = 0; numTouch < maxTouch; ++numTouch)
            {
                if(0xffff == touchData[numTouch])
                    break;// at the first non-touch, break
            }

            // TODO: fix 2D device
            // if(is2D())
            //     horizontal.processCentroids(maxTouch);
        }
    }

    /**
     *Get the location of the touch points from index 0 to max
     *@param index [0-4] the index of the touch point
    */
    //%block="location of touch point |%index|"
    //%weight=34 %blockID="touch Coordinate"
    //% index.min=0 index.max=4
    export function touchCoordinate(index: number): number {
        if (index <= numTouch) {
            return touchData[index];
        }
        else {
            return -1;
        }
    }

    /**
     *Get the size of the touch points from index 0 to max
     *@param index [0-4] the index of the touch point
    */
    //%block="size of touch point |%index|"
    //%weight=35 %blockID="touch size"
    //% index.min=0 index.max=4
    export function touchSize(index: number): number {
        if (index <= numTouch) {
            return touchData[index];
        }
        else {
            return -1;
        }
    }



    /**
     *update the baseline of device
    */
    //%block="update touch baseline"
    //% weight=32 %blockID="update topuch baseline"
    export function updateBaseline(): void {
        i2cWriteCommand(Command.kBaselineUpdate);
    }

    /**
     *read the number of touch points
    */
    //%block="number of touch points"
    //%weight=33 %blockID="number of touch points"
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
        if(threshold > 255)
            threshold = 255;
        if(threshold < 0)
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
        if ((mode != TrillMode.CENTROID) || (device != TrillDevice.TRILL_RING))
        { return -1; }
        else
        { return 0; }
        // { return buffer_[2 * maxTouch]; }
    }
    
    function is1D(): boolean {
        if(mode != TrillMode.CENTROID)
            return false;
        switch(device) {
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
        switch(device) {
            case TrillDevice.TRILL_SQUARE:
            case TrillDevice.TRILL_HEX:
                return true;
            default:
                return false;
        }
    }
}
