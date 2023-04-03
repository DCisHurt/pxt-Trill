// tests go here; this will not be compiled when this package is used as an extension.


Trill.init(
    TrillDevice.TRILL_BAR,
    TrillMode.AUTO,
    TrillSpeed.ULTRA_FAST,
    12,
    1,
    150
) 

basic.forever(function () {
    Trill.read();
    let num = Trill.numTouchRead()
    for (let j = 0; j <= num; j++) {
        serial.writeNumber(j)
        serial.writeValue("r", Trill.touchCoordinate(j))
        serial.writeNumber(j)
        serial.writeValue("s", Trill.touchSize(j))
    }
    serial.writeValue("num", num)
    basic.pause(3)
})
