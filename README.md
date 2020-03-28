# SoCDP8

This project implements a 1968 [DEC PDP-8/I](https://en.wikipedia.org/wiki/PDP-8) on Xilinx Zynq, a controller that contains an FPGA and an ARM CPU on the same chip.

It targets the [PiDP-8/I console](https://obsolescence.wixsite.com/obsolescence/pidp-8) built by Oscar Vermeulen as a replacement for the Raspberry Pi approach.

![GitHub Logo](/pictures/socdp-8.jpg)

## Why a SoC solution?
The common Raspberry Pi + Linux + SIMH approach has a few drawbacks:
* inaccurate simulation: for example, single stepping doesn't work
* long boot time: Linux takes a few seconds to boot and start SIMH
* careful shutdown required: Turning off the system without a Linux shutdown will corrupt the file system

The SoCDP8 implements the PDP-8/I system in VHDL, targeting an FPGA. The system is modeled exactly as described in the original [maintenance manual](/docs/PDP8I_maintenance_manual_vol1.pdf) and the engineering drawings. The manual is treated as the project's specification: Registers and signals are named as described in the book, register transfers are modeled as specified in the drawings.

Peripherals are implemented on the ARM CPU of the SoC. This allows an easy implementation of peripheral devices like the teletype. The peripheral code can access the board's SD card to retrieve tapes, disk images and so on. When connected to a network (Ethernet or WiFi), the system and its peripherals can be controlled through a web frontend using a browser.

## Project Vision
* Provide a simple replacement for the Raspberry Pi: Ideally, the project runs on a SoC board that snaps into the PiDP-8/I console in the same way as the Raspberry Pi.
* Implement the system as close as possible to the maintenance manual and engineering drawings.
* Operate the system through a browser, i.e. the ARM will run a web server that can communicate with the PDP-8 on the FPGA so that web sockets can be used to control the system through a browser.

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

## Other boards
* [DE0-Nano-SoC (Altera Cyclone V)](https://www.terasic.com.tw/cgi-bin/page/archive.pl?Language=English&CategoryNo=163&No=941&PartNo=1)
  * 125€, had to order internationally
  * the 40 pin connector is not compatible, an adapter board would be required
  * has lots of remaining GPIO pins
  * has a few switches, buttons and LEDs

For now, I am targeting the Zynq and will use the Pynq-Z2 board for development.

## Project Status
The base system including EAE, timesharing, data breaks, I/O and interrupts is functional and passes the MAINDEC tests that can be loaded using the RIM and BIN loaders. It can successfully run Focal69, OS/8 and TSS/8.

External peripherals are mainly implemented in software and only provide a base functionality for now.

Unfortunately, I had to make a small modification to the PiDP-8/I hardware to support the Zynq boards: The 1k resistors must be replaced by 220 Ohm resistors to support the different pullup resistance of the Zynq drivers. But at least 220 Ohm also work with the Raspberry Pi, so this modification is compatible.
