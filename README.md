# Introduction

This is a driver for MakeCode for the Trill capacitive sensor series.

## Use as Extension

This repository can be added as an **extension** in MakeCode.

* open [MakeCode micro:bit](https://makecode.microbit.org/)
* click on **New Project**
* click on **Extensions** under the gearwheel menu
* search for **<https://github.com/DCisHurt/pxt-Trill>** and import

## Basic Usage

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
        let loc = Trill.touchCoordinate(j);
        let size = Trill.touchSize(j);

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

## License

MIT

## Reference

* [`Trill`](https://github.com/BelaPlatform/Trill)
* [`Trill-Arduino`](https://github.com/BelaPlatform/Trill-Arduino)

### Metadata (used for search, rendering)

<script src="https://makecode.com/gh-pages-embed.js"></script><script>makeCodeRender("{{ site.makecode.home_url }}", "{{ site.github.owner_name }}/{{ site.github.repository_name }}");</script>
