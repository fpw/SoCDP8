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
#include "src/hal/HAL.h"

class IOController final {
public:
    IOController(std::shared_ptr<hal::HAL> hal);
    void taskLoop();
    void onIOInterrupt();
private:
    static constexpr uint32_t TASK_DELAY_MS = 5000;
    TaskHandle_t taskHandle{};
    std::shared_ptr<hal::HAL> hal;
};

#endif /* SRC_IO_IOCONTROLLER_H_ */
