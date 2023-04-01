// tests go here; this will not be compiled when this package is used as an extension.


Trill.init(
    TrillDevice.TRILL_BAR,
    TrillSpeed.TRILL_SPEED_ULTRA_FAST,
    TrillMode.AUTO,
    12,
    1,
    10
) 

basic.forever(function () {
    Trill.read();

    let touch = Trill.numTouchRead();
    for (let j = 0; j <= touch; j++) {
        let loc = Trill.touchRead(j);
        let size = Trill.touchRead(j);

        serial.writeString("touch")
        serial.writeNumber(j)
        serial.writeValue(": location ", loc)

        serial.writeString("size")
        serial.writeNumber(j)
        serial.writeValue("", size)
    }
    basic.pause(1);
})
