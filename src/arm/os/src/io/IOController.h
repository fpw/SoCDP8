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
#ifndef SRC_IO_IOCONTROLLER_H_
#define SRC_IO_IOCONTROLLER_H_

#include <FreeRTOS.h>
#include <task.h>
#include <functional>
#include <map>
#include "src/hal/HAL.h"

struct IOConfigEntry {
    // The IOP pulses should be 1 for IOP1, 2 for IOP2 and 3 for IOP4

    // Which IOP pulse should generate an interrupt in the IOController
    uint8_t iopForInterrupt = 0;

    // Which IOP pulse should load the device register
    uint8_t iopForRegisterLoad = 0;

    // Which IOP pulse should clear the AC
    uint8_t iopForACClear = 0;

    // Which IOP pulse should load the AC from the register
    uint8_t iopForACLoad = 0;

    // Which IOP pulse should set the device flag
    uint8_t iopForFlagSet = 0;

    // Which IOP pulse should clear the device flag
    uint8_t iopForFlagClear = 0;

    // Which IOP pulse should skip if flag is set
    uint8_t iopForSkipFlag = 0;

    // Whether to set the flag on write access
    bool setFlagOnWrite = false;

    // Call I/O function when flag is set
    std::function<void(void)> onFlagSet;

    // Call I/O function when flag is not set
    std::function<void(void)> onFlagUnset;
};

class IOController final {
public:
    IOController(std::shared_ptr<hal::HAL> hal);
    void taskLoop();

    void registerDevice(uint8_t deviceNum, const IOConfigEntry &entry);
    void writeDeviceRegister(uint8_t deviceNum, uint16_t data);
    uint16_t readDeviceRegister(uint8_t deviceNum, bool &isNewData);
    void clearDeviceFlag(uint8_t deviceNum);

    void checkDevices();

    ~IOController();

private:
    static constexpr uint8_t ADDR_FLAGS = 64;
    static constexpr uint32_t TASK_DELAY_MS = 10;
    TaskHandle_t taskHandle{};
    std::shared_ptr<hal::HAL> hal;
    std::map<uint8_t, IOConfigEntry> configEntries;

    void onIOInterrupt();
};

#endif /* SRC_IO_IOCONTROLLER_H_ */
