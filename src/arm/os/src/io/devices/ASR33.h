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
#ifndef SRC_IO_DEVICES_ASR33_H_
#define SRC_IO_DEVICES_ASR33_H_

#include <FreeRTOS.h>
#include <timers.h>
#include <cstdint>
#include <vector>
#include "src/io/IOController.h"

class ASR33 {
public:
    ASR33(std::shared_ptr<IOController> ctrl);
    void setReaderInput(const std::vector<uint8_t> &data);
    void setStringInput(const std::string &input);
    void clear();
private:
    static constexpr uint8_t READER_DEVICE_ID = 3;
    static constexpr uint8_t PUNCH_DEVICE_ID = 4;
    static constexpr uint16_t READER_DELAY = 100; // 100 ms = 10 cps
    static constexpr uint16_t PUNCH_DELAY = 100; // 100 ms = 10 cps
    bool doStatusOutput = false;
    std::shared_ptr<IOController> ioCtrl;

    std::vector<uint8_t> readerData;
    size_t readerPos = 0;
    TickType_t lastReaderDataAt = 0;

    TickType_t lastPunchDataAt = 0;

    void setupReader();
    void onReaderFlagReset();

    void setupPunch();
    void onPunchFlagReset();
};

#endif /* SRC_IO_DEVICES_ASR33_H_ */
