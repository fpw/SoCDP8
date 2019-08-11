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
#include <FreeRTOS.h>
#include <task.h>
#include <iostream>
#include <stdio.h>
#include "IOController.h"

IOController::IOController(std::shared_ptr<hal::HAL> hal):
    hal(hal)
{
    auto ok = xTaskCreate(
            [] (void *io) { ((IOController *) io)->taskLoop(); },
            "IOTask",
            configMINIMAL_STACK_SIZE,
            this,
            10,
            &taskHandle
        );

    if (ok != pdPASS) {
        throw std::runtime_error("Couldn't create I/O task");
    }

    hal->setIOInterruptHandler([this] {
       onIOInterrupt();
    });
}

void IOController::taskLoop() {
    while (true) {
        ulTaskNotifyTake(pdFALSE, pdMS_TO_TICKS(TASK_DELAY_MS));
        checkDevices();
    }
}

void IOController::registerDevice(uint8_t deviceNum, const IOConfigEntry& entry) {
    configEntries[deviceNum] = entry;

    // the offsets are defined in io_controller.vhd
    uint32_t config = 0;
    config |= entry.iopForInterrupt << 25;
    config |= entry.iopForRegisterLoad << 23;
    config |= entry.iopForACClear << 21;
    config |= entry.iopForACLoad << 19;
    config |= entry.iopForFlagSet << 17;
    config |= entry.iopForFlagClear << 15;
    config |= entry.iopForSkipFlag << 13;
    config |= entry.setFlagOnWrite << 12;
    hal->pokeIOMem(deviceNum, config);
}

void IOController::writeDeviceRegister(uint8_t deviceNum, uint16_t data) {
    uint32_t reg = hal->peekIOMem(deviceNum);
    reg &= ~07777; // clear current data
    reg &= ~(1 << 27); // clear new data flag
    reg |= data & 07777; // set new data
    hal->pokeIOMem(deviceNum, reg);
}

uint16_t IOController::readDeviceRegister(uint8_t deviceNum, bool &isNewData) {
    uint32_t reg = hal->peekIOMem(deviceNum);
    isNewData = (reg & (1 << 27)) != 0;
    return reg & 07777;
}

void IOController::checkDevices() {
    uint64_t flagsH = hal->peekIOMem(ADDR_FLAGS + 1);
    uint64_t flagsL = hal->peekIOMem(ADDR_FLAGS);
    uint64_t flags = (flagsH << 32) | flagsL;
    for (auto it: configEntries) {
        uint8_t deviceNum = it.first;
        const IOConfigEntry &entry = it.second;

        if ((flags & (1ul << deviceNum)) != 0) {
            // Flag is set
            if (entry.onFlagSet) {
                entry.onFlagSet();
            }
        } else {
            // Flag is not set
            if (entry.onFlagUnset) {
                entry.onFlagUnset();
            }
        }
    }
}

void IOController::clearDeviceFlag(uint8_t deviceNum) {
    hal->pokeIOMem(0, deviceNum);
}

void IOController::onIOInterrupt() {
    BaseType_t higherWoken = pdFALSE;
    vTaskNotifyGiveFromISR(taskHandle, &higherWoken);
    portYIELD_FROM_ISR(higherWoken);
}

IOController::~IOController() {
    vTaskDelete(taskHandle);
}
