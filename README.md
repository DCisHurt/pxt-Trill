# Trill

A driver for trill family of capacitive sensors in MakeCode.

## Use as Extension

This repository can be added as an **extension** in MakeCode.

* open [MakeCode micro:bit](https://makecode.microbit.org/)
* click on **New Project**
* click on **Extensions** under the gearwheel menu
* search for **<https://github.com/DCisHurt/pxt-Trill>** and import

## Blocks preview

This image shows the blocks code from the last commit in master.
This image may take a few minutes to refresh.

### Basic Usage

* initialize

```blocks
Trill.init(
    TrillDevice.TRILL_BAR,
    TrillSpeed.ULTRA_FAST,
    TrillMode.AUTO,
    12,
    1,
    10
)
```

* read data

```blocks
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
```

<script src="https://makecode.com/gh-pages-embed.js"\></script\><script\>makeCodeRender("{{ site.makecode.home_url }}", "{{ site.github.owner_name }}/{{ site.github.repository_name }}");</script\>
