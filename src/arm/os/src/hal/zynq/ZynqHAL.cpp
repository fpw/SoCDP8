/*
 *   SoCDP8 - A PDP-8/I implementation on a SoC
 *   Copyright (C) 2019 Folke Will <folko@solhost.org>
 *
 *   This program is free software: you can redistribute it and/or modify
 *   it under the terms of the GNU Affero General Public License as published by
 *   the Free Software Foundation, either version 3 of the License, or
 *   (at your option) any later version.
 *
 *   This program is distributed in the hope that it will be useful,
 *   but WITHOUT ANY WARRANTY; without even the implied warranty of
 *   MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *   GNU Affero General Public License for more details.
 *
 *   You should have received a copy of the GNU Affero General Public License
 *   along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */
#include <stdexcept>
#include <string>
#include <sstream>
#include <xil_assert.h>
#include <xil_io.h>
#include <FreeRTOS.h>
#undef str
#include "ZynqHAL.h"

namespace hal {

void ZynqHAL::setup() {
    // convert Xilinx assertions to exceptions
    Xil_AssertSetCallback([] (const char *file, long line) {
        std::ostringstream stream;
        stream << "XilAssertion failed: " << file << ", line " << line;
        throw std::runtime_error(stream.str().c_str());
    });

    setupInterrupts();
}

void ZynqHAL::setupInterrupts() {
    uint8_t ioIrq = XPAR_FABRIC_SOCDP8_IO_CONTROLLER_SOC_IRQ_INTR;
    if (xPortInstallInterruptHandler(ioIrq, ioInterruptHandler, this) != pdPASS) {
        throw std::runtime_error("Couldn't install IRQ handler");
    }
    vPortEnableInterrupt(ioIrq);
}

void ZynqHAL::setIOInterruptHandler(const InterruptHandler &handler) {
    ioIRQFunc = handler;
}

void ZynqHAL::ioInterruptHandler(void *ptr) {
    ZynqHAL *us = reinterpret_cast<ZynqHAL *>(ptr);
    if (us->ioIRQFunc) {
        us->ioIRQFunc();
    }
}

void ZynqHAL::pokeMem(uint16_t addr, uint16_t value) {
    Xil_Out16(XPAR_SOCDP8_AXI_BRAM_BASEADDR + addr * sizeof(uint32_t), value);
}

uint16_t ZynqHAL::peekMem(uint16_t addr) {
    return Xil_In16(XPAR_SOCDP8_AXI_BRAM_BASEADDR + addr * sizeof(uint32_t));
}

} // namespace hal
