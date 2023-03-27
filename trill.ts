

enum TrillSpeed {
    TRILL_SPEED_ULTRA_FAST = 0,
    TRILL_SPEED_FAST = 1,
    TRILL_SPEED_NORMAL = 2,
    TRILL_SPEED_SLOW =3
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
    
    enum NumChannel{
        kBar = 26,
        kRing = 30,
        kMax = 30
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

    const commandDelay = 25;

    export class TouchDevice{
        device: TrillDevice;
        address: number;
        mode: number;
        state: Offset;
        maxTouch: number;
        numTouch: number;
        rawData: Buffer;
        touchData: number[];

        private i2cWriteCommand(register: number): void {
            let buf = pins.createBuffer(3);
            buf[0] = Offset.kCommand;
            buf[1] = register;
            pins.i2cWriteBuffer(this.address, buf);
            this.state = Offset.kCommand;
        }

        private i2cWriteCommand1(register: number, value: number): void {
            let buf = pins.createBuffer(3);
            buf[0] = Offset.kCommand;
            buf[1] = register;
            buf[2] = value;
            pins.i2cWriteBuffer(this.address, buf);
            this.state = Offset.kCommand;
        }

        private i2cWriteCommand2(register: number, value1: number, value2: number): void {
            let buf = pins.createBuffer(4);
            buf[0] = Offset.kCommand;
            buf[1] = register;
            buf[2] = value1;
            buf[3] = value2;
            pins.i2cWriteBuffer(this.address, buf);
            this.state = Offset.kCommand;
        } 

        private defaultSet(): void {
            switch (this.device) {
                case TrillDevice.TRILL_BAR:
                    this.address = 0x20;
                    this.mode = TrillMode.CENTROID;
                    this.maxTouch = MaxTouchNum.k1D;
                    break;
                case TrillDevice.TRILL_SQUARE:
                    this.address = 0x28;
                    this.mode = TrillMode.CENTROID;
                    this.maxTouch = MaxTouchNum.k2D;
                    break;
                case TrillDevice.TRILL_CRAFT:
                    this.address = 0x30;
                    this.mode = TrillMode.DIFF;
                    this.maxTouch = MaxTouchNum.k1D;
                    break;
                case TrillDevice.TRILL_RING:
                    this.address = 0x38;
                    this.mode = TrillMode.CENTROID;
                    this.maxTouch = MaxTouchNum.k1D;
                    break;
                case TrillDevice.TRILL_HEX:
                    this.address = 0x40;
                    this.mode = TrillMode.CENTROID;
                    this.maxTouch = MaxTouchNum.k2D;
                    break;
                case TrillDevice.TRILL_FLEX:
                    this.address = 0x48;
                    this.mode = TrillMode.DIFF;
                    this.maxTouch = MaxTouchNum.k1D;
                    break;
                default:
                    this.address = 0xFF;
                    this.mode = TrillMode.AUTO;
                    this.maxTouch = MaxTouchNum.k1D;
                    break;
            }
        }

        setScanSettings(speed: TrillSpeed, num_bits: number): void {
            if (speed > 3) { speed = 3; }
            if (num_bits < 9) { num_bits = 9; }
            if (num_bits > 16) { num_bits = 16; }

            this.i2cWriteCommand2(Command.kScanSettings, speed, num_bits)
        }

        setPrescaler(prescaler: number) {
            this.i2cWriteCommand1(Command.kPrescaler, prescaler)
        }
        
        setNoiseThreshold(threshold: number) {
            if(threshold > 255)
                threshold = 255;
            if(threshold < 0)
                threshold = 0;
            this.i2cWriteCommand1(Command.kNoiseThreshold, threshold)
        }
        
        setIDACValue(value: number) {
            this.i2cWriteCommand1(Command.kIdac, value)
        }
        
        setMinimumTouchSize(size: number) {      
            this.i2cWriteCommand2(Command.kMinimumSize, (size >> 8), (size & 0xFF))
        }
        
        setAutoScanInterval(interval: number) {      
            this.i2cWriteCommand2(Command.kAutoScanInterval, (interval >> 8), (interval & 0xFF))
        }
    
        updateBaseline() {
            this.i2cWriteCommand(Command.kBaselineUpdate)
        }

        setMode(mode: TrillMode): void {
            this.mode = mode;
            this.i2cWriteCommand1(Command.kMode, this.mode)
            this.numTouch = 0;
        }

        init(device: TrillDevice): void {
            this.device = device;
            this.defaultSet();

            this.setMode(this.mode);

            basic.pause(commandDelay);

            this.rawData = pins.createBuffer(Length.kRaw);

            // TODO: set 2D device
            // if(this.is2D()) {
            //     horizontal.centroids = buffer_ + 2 * MAX_TOUCH_1D_OR_2D;
            //     horizontal.sizes = buffer_ + 3 * MAX_TOUCH_1D_OR_2D;
            // } else
            //     horizontal.num_touches = 0;

            /* Set default scan settings */

            this.setScanSettings(TrillSpeed.TRILL_SPEED_ULTRA_FAST, 12);

            basic.pause(commandDelay)

            this.updateBaseline();

            basic.pause(commandDelay)

        }

        read(): void {
            if (this.mode == TrillMode.CENTROID) {
            
                let loc = 0;
                let length = Length.kCentroidDefault;
            
                if (this.state == Offset.kCommand) {
                    this.i2cWriteCommand(Offset.kData);
                    this.state = Offset.kData;
                }
            
                if (this.device == TrillDevice.TRILL_SQUARE || this.device == TrillDevice.TRILL_HEX) { length = Length.kCentroid2D; }
            
                if (this.device == TrillDevice.TRILL_RING) { length = Length.kCentroidRing; }
                
                this.rawData = pins.i2cReadBuffer(this.address, length, false);

                // while(Wire.available() >= 2) {
                //     msb = Wire.read();
                //     lsb = Wire.read();
                //     buffer_[loc] = lsb + (msb << 8);
                //     ++loc;
                // }
                
                
                // TODO: update num_touches
                // // Look for 1st instance of 0xFFFF (no touch) in the buffer
                // for(this.numTouch = 0; this.numTouch < this.maxTouch; ++this.numTouch)
                // {
                //     if(0xffff == centroids[this.numTouch])
                //         break;// at the first non-touch, break
                // }

                // TODO: fix 2D device
                // if(this.is2D())
                //     horizontal.processCentroids(this.maxTouch);
            }
        }




        // getButtonValue(): number {
        //     if((this.mode != TrillMode.CENTROID) || (this.device != TrillDevice.TRILL_RING))
        //     { return -1 }
        //     else
        //     { return 0 }
        //     // { return buffer_[2 * this.maxTouch]; }
        // }
        
        // getNumChannels(): number {
        //     switch(this.device) {
        //         case TrillDevice.TRILL_BAR: return NumChannel.kBar;
        //         case TrillDevice.TRILL_RING: return NumChannel.kRing;
        //         default: return NumChannel.kMax;
        //     }
        // }
        
        private is1D(): boolean {
            if(this.mode != TrillMode.CENTROID)
                return false;
            switch(this.device) {
                case TrillDevice.TRILL_BAR:
                case TrillDevice.TRILL_RING:
                case TrillDevice.TRILL_CRAFT:
                case TrillDevice.TRILL_FLEX:
                    return true;
                default:
                    return false;
            }
        }

        private is2D(): boolean {
            switch(this.device) {
                case TrillDevice.TRILL_SQUARE:
                case TrillDevice.TRILL_HEX:
                    return true;
                default:
                    return false;
            }
        }
    }
}
