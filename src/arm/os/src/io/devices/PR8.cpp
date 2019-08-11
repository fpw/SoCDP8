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
#include "PR8.h"

PR8::PR8(std::shared_ptr<IOController> ctrl):
    ioCtrl(ctrl)
{
    setupReader();
    setupPunch();
}

void PR8::setupReader() {
    IOConfigEntry readerEntry{};

    // IOP1 for reader: Skip if flag is set
    readerEntry.iopForSkipFlag = 1;

    // IOP2 for reader: Read buffer and clear flag
    readerEntry.iopForACLoad = 2;
    readerEntry.iopForFlagClear = 2;
    readerEntry.onFlagUnset = [this] { onReaderFlagReset(); };

    // IOP4 for reader: Clear flag and read next
    readerEntry.iopForInterrupt = 3;

    // Writing data to register should set the flag
    readerEntry.setFlagOnWrite = true;

    ioCtrl->registerDevice(READER_DEVICE_ID, readerEntry);
}

void PR8::setupPunch() {
    IOConfigEntry punchEntry{};

    // IOP1 for punch: Skip if flag is set
    punchEntry.iopForSkipFlag = 1;

    // IOP2 for reader: Clear Flag, generate IRQ so we can retrieve the data
    punchEntry.iopForFlagClear = 2;
    punchEntry.iopForInterrupt = 2;
    punchEntry.onFlagUnset = [this] { onPunchFlagReset(); };

    // IOP4 for reader: Load register with AC
    punchEntry.iopForRegisterLoad = 3;

    // Writing data to register should set the flag
    punchEntry.setFlagOnWrite = true;

    ioCtrl->registerDevice(PUNCH_DEVICE_ID, punchEntry);
}

void PR8::setReaderInput(const std::vector<uint8_t> &data) {
    readerData = data;
    readerPos = 0;
    lastReaderDataAt = xTaskGetTickCount();
}

void PR8::clear() {
    readerData.clear();
    readerPos = 0;
    ioCtrl->clearDeviceFlag(READER_DEVICE_ID);
    ioCtrl->clearDeviceFlag(PUNCH_DEVICE_ID);
}

void PR8::onReaderFlagReset() {
    auto now = xTaskGetTickCount();
    if (now - lastReaderDataAt > pdMS_TO_TICKS(READER_DELAY)) {
        if (readerPos < readerData.size()) {
            ioCtrl->writeDeviceRegister(READER_DEVICE_ID, readerData[readerPos++]);
            lastReaderDataAt = now;
            printf("PR8-Read %d / %d\n", readerPos, readerData.size());
        }
    }
}

void PR8::onPunchFlagReset() {
    auto now = xTaskGetTickCount();
    if (now - lastPunchDataAt > pdMS_TO_TICKS(PUNCH_DELAY)) {
        bool hasNewData = false;
        uint16_t data = ioCtrl->readDeviceRegister(PUNCH_DEVICE_ID, hasNewData);
        if (hasNewData) {
            char c = data & 0x7F;
            ioCtrl->writeDeviceRegister(PUNCH_DEVICE_ID, 0);
            lastPunchDataAt = now;
            printf("PR8-Punch '%c'\n", c);
        }
    }
}
