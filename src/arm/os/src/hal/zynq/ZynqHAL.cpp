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
#include "ZynqHAL.h"

// Xilinx defines a global macro called str that clashes with sstream::str
#undef str

namespace hal {

void ZynqHAL::setup() {
    // convert Xilinx assertions to exceptions
    Xil_AssertSetCallback([] (const char *file, long line) {
        std::ostringstream stream;
        stream << "XilAssertion failed: " << file << ", line " << line;
        throw std::runtime_error(stream.str().c_str());
    });

    setupInterrupts();

    if (f_mount(&fs, "", 1) != FR_OK) {
        throw std::runtime_error("Couldn't mount file system");
    }
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

uint32_t ZynqHAL::peekIOMem(uint32_t addr) {
    return Xil_In32(XPAR_SOCDP8_IO_CONTROLLER_BASEADDR + addr * sizeof(uint32_t));
}

void ZynqHAL::pokeIOMem(uint32_t addr, uint32_t value) {
    Xil_Out32(XPAR_SOCDP8_IO_CONTROLLER_BASEADDR + addr * sizeof(uint32_t), value);
}

void ZynqHAL::pokeMem(uint16_t addr, uint16_t value) {
    Xil_Out16(XPAR_SOCDP8_AXI_BRAM_BASEADDR + addr * sizeof(uint32_t), value);
}

uint16_t ZynqHAL::peekMem(uint16_t addr) {
    return Xil_In16(XPAR_SOCDP8_AXI_BRAM_BASEADDR + addr * sizeof(uint32_t));
}

std::vector<FileEntry> ZynqHAL::listFiles() {
    DIR dir;
    if (f_opendir(&dir, "/") != FR_OK) {
        throw std::runtime_error("Couldn't open directory");
    }

    std::vector<FileEntry> entries;

    do {
        FILINFO info;
        f_readdir(&dir, &info);

        if (info.fname[0] == '\0') {
            break;
        }

        if (info.fattrib & AM_HID) {
            continue;
        }

        if (strcasecmp(info.fname, "boot.bin") == 0) {
            continue;
        }

        FileEntry entry{};
        entry.name = info.fname;
        entry.isDirectory = (info.fattrib & AM_DIR);
        entries.push_back(entry);
    } while (true);

    f_closedir(&dir);

    return entries;
}

std::vector<uint8_t> ZynqHAL::readFile(const std::string& path) {
    FIL file;
    if (f_open(&file, path.c_str(), FA_READ) != FR_OK) {
        throw std::runtime_error("Couldn't open file");
    }

    UINT size = f_size(&file);
    std::vector<uint8_t> data;
    data.resize(size);
    f_read(&file, data.data(), size, &size);

    f_close(&file);

    return data;
}

void ZynqHAL::saveFile(const std::string& path, const std::vector<uint8_t>& data) {
    FIL file;
    if (f_open(&file, path.c_str(), FA_WRITE | FA_CREATE_ALWAYS) != FR_OK) {
        throw std::runtime_error("Couldn't open file");
    }

    UINT size = data.size();
    f_write(&file, data.data(), size, &size);
    f_close(&file);
}

ZynqHAL::~ZynqHAL() {
    f_unmount("");
}

} // namespace hal
