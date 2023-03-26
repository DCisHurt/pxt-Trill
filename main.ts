
serial.redirect(SerialPin.P0, SerialPin.P1, BaudRate.BaudRate31250)
pins.digitalWritePin(DigitalPin.P8, 1)

let lastA = false
let lastB = false

let noteA = 35
let noteB = 39
let velocity = 127

let lastAng = 0
let lastAng2 = 0
let channel_1 = 1
let channel_2 = 2

basic.forever(function () {
    let A = input.buttonIsPressed(Button.A)
    let B = input.buttonIsPressed(Button.B)

    let ang = pins.analogReadPin(AnalogPin.P1)
    let ang2 = pins.analogReadPin(AnalogPin.P2)

    if (A && !lastA) {
        noteOnOff(true, channel_1, noteA, velocity)
        pins.digitalWritePin(DigitalPin.P8, 0)
    }
    else if (!A && lastA) {
        noteOnOff(false, channel_1, noteA, velocity)
        pins.digitalWritePin(DigitalPin.P8, 1)
    }
        
    if (B && !lastB) {
        noteOnOff(true, channel_2, noteB, velocity)
        // basic.showIcon(IconNames.Heart)
    }
    else if (!B && lastB) {
        noteOnOff(false, channel_2, noteB, velocity)
    }
    if (Math.abs(lastAng - ang) >= 2) {
        let pitch = (ang - 511) * 16
        midiPitch(channel_1, pitch)
    }
    if (Math.abs(lastAng2 - ang2) >= 2) {
        let pitch2 = (ang - 511) * 16
        midiPitch(channel_2, pitch2)
    }

    lastAng = ang
    lastAng2 = ang2
    lastA = A
    lastB = B
    basic.pause(10)
})

function midiCC(ch: number, num: number, value: number): void{
    let cc = 0xB0

    let msgC = Buffer.create(3)
    msgC[0] = cc | ch
    msgC[1] = num
    msgC[2] = value
  
    serial.writeBuffer(msgC)
}

function noteOnOff(state: boolean, ch: number, note: number, vol: number): void{
    let noteOn = 0x90
    let noteOff = 0x80

    let msgN = Buffer.create(3)
    msgN[0] = (state? noteOn: noteOff) | ch
    msgN[1] = note
    msgN[2] = vol
  
    serial.writeBuffer(msgN)
}


function midiPitch(ch: number, shift: number): void{
    let cc = 0xE0
    let msgP = Buffer.create(3)
    
    shift = shift + 8192

    msgP[0] = cc | ch
    msgP[1] = shift & 0x003F
    msgP[2] = (shift - msgP[1]) >> 7
  
    serial.writeBuffer(msgP)
}        


// namespace ADS1015{

//     const ADS1015_ADDRESS = 0x48

//     const ADS1015_AIN0 = 0x40
//     const ADS1015_AIN1 = 0x50
//     const ADS1015_AIN2 = 0x60
//     const ADS1015_AIN3 = 0x70

//     const ADS1015_GAIN_05 = 0x06
//     const ADS1015_GAIN_1 = 0x04
//     const ADS1015_GAIN_2 = 0x02
//     const ADS1015_GAIN_3 = 0x00

//     function i2cwrite(addr: number, reg: number): void {
//         let buf = pins.createBuffer(1);
//         buf[0] = reg;
//         pins.i2cWriteBuffer(addr, buf);
//     }

//     function i2cwrite2(addr: number, reg: number, value1: number, value2: number): void {
//         let buf = pins.createBuffer(3);
//         buf[0] = reg;
//         buf[1] = value1;
//         buf[2] = value2;
//         pins.i2cWriteBuffer(addr, buf);
//     }


// 	/**
//      *ReadData From ADS1015
//      *Data Format = 3mV/FS
// 	 * @param channel [0-3] choose ADC channel; eg: 0, 1
// 	*/
//     export function readPin(channel: number): number {

//         let val = 0x00;

//         switch (channel) {
//             case 0:
//                 val += ADS1015_AIN0;
//                 break;
//             case 1:
//                 val += ADS1015_AIN1;
//                 break;
//             case 2:
//                 val += ADS1015_AIN2;
//                 break;
//             case 3:
//                 val += ADS1015_AIN3;
//                 break;
//         }
//         //set gain in 3mV/FS
//         val += ADS1015_GAIN_3;

//         i2cwrite2(ADS1015_ADDRESS, 0x01, val, 0x83);

//         control.waitMicros(5000);

//         pins.i2cWriteNumber(ADS1015_ADDRESS, 0x00, NumberFormat.UInt8LE)

//         control.waitMicros(500);

//         let adc = pins.i2cReadBuffer(ADS1015_ADDRESS, 2);
//         let data = ((parseInt("0x" + adc.toHex())) / 16)

//         if (data > 2048) {
//             return (data-4096)
//         }
//         else {
//             return data
//         }
        
//     }   
// }