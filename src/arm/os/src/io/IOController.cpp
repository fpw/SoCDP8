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
#include <timers.h>
#include <stdio.h>
#include "IOController.h"

IOController::IOController(std::shared_ptr<hal::HAL> hal):
    hal(hal)
{
    xTaskCreate(
            [] (void *io) { ((IOController *) io)->taskLoop(); },
            "IOTask",
            configMINIMAL_STACK_SIZE,
            this,
            tskIDLE_PRIORITY + 1,
            &taskHandle
        );

    hal->setIOInterruptHandler([this] {
       onIOInterrupt();
    });
}

void IOController::taskLoop() {
    while (true) {
        auto notify = ulTaskNotifyTake(pdFALSE, pdMS_TO_TICKS(TASK_DELAY_MS));
        if (notify > 0) {
        }
    }
}

void IOController::onIOInterrupt() {
    BaseType_t higherWoken = pdFALSE;
    vTaskNotifyGiveFromISR(taskHandle, &higherWoken);
    portYIELD_FROM_ISR(higherWoken);
}
