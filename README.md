
# SoCDP8   [![Badge Hardware]][License]   [![Badge Software]][License]

This is an implementation of the 1968 **[DEC PDP-8/I]** on <br>
a **Xilinx Zynq**, a **FPGA** controller with an **ARM CPU**.

Built on the **[PiDP-8/I Console]** by **Oscar Vermeulen**, <br>
it acts as a replacement for the Raspberry Pi approach.

<br>
<br>

<div align = center>

![Preview]

</div>

<br>
<br>

## Why SoC ?

Drawback of the `Raspberry Pi` + `Linux` + `SIMH` approach:

- **Inaccurate Simulation :** Doesn't allow for single stepping
- **Long Boot Times :** `Linux` takes a few seconds to boot / start `SIMH`
- **Meticulous Shutdown :** `Linux` needs a proper shutdown to not corrupt

<br>

The **SoCDP8** implements the `PDP-8/I` in **VHDL**, targeting **FPGAs**.

<br>

#### Design

The system is modeled exactly as described in the <br>
**[Maintenance Manual]**  and **Engineering Drawings**.

*The manual is treated as the project specification, registers* <br>
*and signals are named as described in the book and register* <br>
*transfers are modeled as specified in the drawings.*

<br>

#### Peripherals

Peripherals are implemented on the **ARM CPU** on the **SoC**.

This makes device implementation, like the teletype, fairly easy.

Code for peripherals can access the onboard <br>
**SD Card** to retrieve *tapes*, *disk images*, ..

When connected to the **Ethernet** / **WiFi**, the system, including <br>
it's peripherals, can be controlled with a **Web Browser**.

<br>
<br>

## Project Goals

- Implementing the system as close as possible to the original specifications.

- Providing a *simple replacement* for the **Raspberry Pi**, <br>
ideally the project runs on a **SoC** board that snaps into <br>
the `PiDP-8/I Console` in the same way the **Pi** does.

- Have it be operable through a browser using <br>
a web socket connection between a web server <br>
on the **ARM** and the `PDP-8` on the **FPGA**.

<br>
<br>

## Supported SoCs

The project currently only targets the **Zynq** board <br>
and utilizes the `Pynq-Z2` for development only.

<br>

### Tested Boards

| Board |  |
|:-----:|:-|
| **[ZynqBerry]** | <br> ***Xilinx Zynq 7010*** <br><br> - `130€` \| Good Availability <br><br> - **Raspberry Pi** form factor <br><br> - No free **GPIO** pins <br><br> - Has the *smallest* **Zynq** <br><br> |
| **[Pynq-Z2]** | <br> ***Xilinx Zynq 7020*** <br><br> `132€` \| Good Availability <br><br> - Raspberry Pi Connectors <br><br> - Spare **GPIO** pins, such as a <br><br>  **PMOD** pin, useful for sensors<br> - Switches, buttons, LEDs <br><br> - Requires a ribbon cable to <br>  fit in the `PiDP-8/I` box <br><br> |

<br>

### Other Boards

| Board |  |
|:-----:|:-|
| **[DE0-Nano-SoC]** | <br> ***Altera Cyclone V*** <br><br> - `125€` \| International Shipping <br><br> - **Incompatible** 40 pin connector, <br><br>  requires adapter. <br><br> - Many free **GPIO** pins <br><br> - Switches, buttons, LEDs <br><br> |

<br>
<br>

## Project Status

<br>

### Functional

- **Base System**
- **Timesharing**
- **Data Breaks**
- **Interrupts**
- **EAE**
- **I/O**

*These features pass the `MAINDEC` tests and* <br>
*can be loaded using the `RIM` / `BIN` loaders.*
<br>
<br>

### Runs On

- `Focal69`
- `TSS/8`
- `OS/8`

<br>

### Peripherals

Implemented in software with only basic functionality.

<br>

### Deviations

To have the `PiDP-8/I` work with the **Zynq** boards, <br>
a modification had to unfortunately be made.

The `1KΩ` resistors had to be replaced by `220Ω` ones <br>
to support the `pullup` resistance of the **Zynq** drivers.

Thankfully `220Ω` is compatible with the **Raspberry Pi**.

<br>


<!----------------------------------------------------------------------------->

[PiDP-8/I Console]: https://obsolescence.wixsite.com/obsolescence/pidp-8
[DE0-Nano-SoC]: https://www.terasic.com.tw/cgi-bin/page/archive.pl?Language=English&CategoryNo=163&No=941&PartNo=1
[DEC PDP-8/I]: https://en.wikipedia.org/wiki/PDP-8
[ZynqBerry]: https://shop.trenz-electronic.de/en/TE0726-03M-ZynqBerry-Zynq-7010-in-Raspberry-Pi-form-factor
[Pynq-Z2]: http://www.tul.com.tw/ProductsPYNQ-Z2.html

[Maintenance Manual]: Documentation/PDP8I_maintenance_manual_vol1.pdf
[Preview]: Resources/Preview.png
[License]: LICENSE


<!--------------------------------[ Badges ]----------------------------------->

[Badge Software]: https://img.shields.io/badge/License-AGPL3-015d93.svg?style=for-the-badge&labelColor=blue
[Badge Hardware]: https://img.shields.io/badge/Open_Hardware-1.2-21214e?style=for-the-badge&labelColor=292961

