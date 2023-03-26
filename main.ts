
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