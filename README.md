# SoCDP8

This project will provide an implementation of a [DEC PDP-8/I](https://en.wikipedia.org/wiki/PDP-8) on an a chip that contains an FPGA and an ARM CPU, for example the Xilinx Zynq.

It will target the [PiDP-8/I console](https://obsolescence.wixsite.com/obsolescence/pidp-8) built by Oscar Vermeulen as a replacement for the Raspberry Pi solution.

![GitHub Logo](/pictures/socdp-8.jpg)

## Why a SoC solution?
The common Raspberry Pi + Linux + SIMH approach has a few drawbacks:
* inaccurate simulation: for example, single stepping doesn't work
* long boot time: Linux takes a few seconds to boot and start SIMH
* careful shutdown required: Turning off the system without a Linux shutdown will corrupt the file system

The SoCDP8 will implement the PDP-8/I system in VHDL, targeting an FPGA. The system will be modeled exactly as described in the original [maintenance manual](/docs/PDP8I_maintenance_manual_vol1.pdf). The manual will be treated as the project's specification: Registers and signals will be named as described in the book, register transfers will be modeled as specified.

Peripherals will be implemented on the ARM CPU of the SoC. This will allow an easy implementation of peripheral devices like the teletype. The peripheral code can access the board's SD card to retrieve tapes, disk images and so on. Instead of using Linux, the peripheral code will be implemented without an operating system or using a real-time operating system like FreeRTOS. This will allow quick boot times and won't require clean shutdowns.

## Project Vision
* Provide a simple replacement for the Raspberry Pi: Ideally, the project runs on a SoC board that snaps into the PiDP-8/I console in the same way as the Raspberry Pi.
* Implement the system as close as possible to the maintenance manual.
* Visualize peripherals using an HDMI touch screen that fits into the same type of box as the PiDP-8/I to build a nice stack.

## Supported SoC Boards
I evaluated a few SoC boards:
* [ZynqBerry (Xilinx Zynq 7010)](https://shop.trenz-electronic.de/en/TE0726-03M-ZynqBerry-Zynq-7010-in-Raspberry-Pi-form-factor)
  * 130€, available at several shops
  * has the same form factor as the Raspberry Pi, including the GPIO connector
  * doesn't have free GPIO pins
  * has the smallest Zynq
* [Pynq-Z2 (Xilinx Zynq 7020)](http://www.tul.com.tw/ProductsPYNQ-Z2.html)
  * 132€, available at several shops
  * has a Raspberry Pi connector
  * has lots of remaining GPIO pins, including one free PMOD for dozens of ready-made sensors
  * has a few switches, buttons and LEDs
  * must be connected using a ribbon cable due to the different form factor, but still fits in the PiDP-8/I box
* [Atlas-SoC (Altera Cyclone V)](https://www.terasic.com.tw/cgi-bin/page/archive.pl?Language=English&CategoryNo=163&No=941&PartNo=1)
  * 125€, had to order internationally
  * the 40 pin connector is not compatible, an adapter board would be required
  * has lots of remaining GPIO pins
  * has a few switches, buttons and LEDs

For now, I am targeting the Zynq and will use the Pynq-Z2 board for development.

## Project Status
I have completed a proof-of-concept phase by implementing a simplified version of the PDP-8/I in VHDL along with a driver for the PiDP-8/I console. The system can run on the FPGA inside the Zynq. It can communicate with the a C++ program running on the ARM CPU through internal GPIOs and shared memory. The startup time is less than a second and does not depend on the complexity of the system. The picture on top shows the PiDP-8/I connected to the Pynq-Z2 board that runs this implementation. Next to it is the ZynqBerry board that can also run it. The C++ program loaded the RIM loader into the memory of the emulated PDP-8/I and the console allows examining and single stepping the program.

Unforunately, I had to make a small modification to the PiDP-8/I hardware to support the Zynq boards: The 1k resistors must be replaced by 220 Ohm resistors to support the different pullup resistance of the Zynq drivers. But at least 220 Ohm also work with the Raspberry Pi, so this modification is compatible.
