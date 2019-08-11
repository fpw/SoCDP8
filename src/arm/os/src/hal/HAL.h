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
#ifndef SRC_HAL_HAL_H_
#define SRC_HAL_HAL_H_

#include <functional>
#include <memory>
#include <string>
#include <vector>

namespace hal {

struct FileEntry {
    std::string name;
    bool isDirectory;
};

class HAL {
public:
    using InterruptHandler = std::function<void()>;

    virtual void setup() = 0;

    // PDP-8 Memory
    virtual void pokeMem(uint16_t addr, uint16_t value) = 0;
    virtual uint16_t peekMem(uint16_t addr) = 0;

    // SoCDP8 I/O controller
    virtual void setIOInterruptHandler(const InterruptHandler &handler) = 0;
    virtual uint32_t peekIOMem(uint32_t addr) = 0;
    virtual void pokeIOMem(uint32_t addr, uint32_t value) = 0;

    // File access
    virtual std::vector<FileEntry> listFiles() = 0;
    virtual std::vector<uint8_t> readFile(const std::string &path) = 0;
    virtual void saveFile(const std::string &path, const std::vector<uint8_t> &data) = 0;

    virtual ~HAL() = default;
};

std::unique_ptr<HAL> createHAL();

} // namespace hal


#endif /* SRC_HAL_HAL_H_ */
