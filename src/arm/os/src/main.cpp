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
#include <stdio.h>
#include <stdexcept>
#include <sstream>
#include <iostream>

#include "src/hal/HAL.h"
#include "src/io/IOController.h"
#include "src/io/devices/ASR33.h"
#include "src/io/devices/PR8.h"
#include "src/shell/Shell.h"

void storeRIMLoader(std::shared_ptr<hal::HAL> hal) {
    hal->pokeMem(07756, 06032); // KCC         / clear keyboard flag and ac
    hal->pokeMem(07757, 06031); // KSF         / skip if keyboard flag
    hal->pokeMem(07760, 05357); // JMP 7757    / jmp -1
    hal->pokeMem(07761, 06036); // KRB         / clear ac, or AC with data (8 bit), clear flag
    hal->pokeMem(07762, 07106); // CLL RTL     / clear link, rotate left 2
    hal->pokeMem(07763, 07006); // RTL         / rotate left 2
    hal->pokeMem(07764, 07510); // SPA         / skip if ac > 0
    hal->pokeMem(07765, 05357); // JMP 7757    / jmp back
    hal->pokeMem(07766, 07006); // RTL         / rotate left 2
    hal->pokeMem(07767, 06031); // KSF         / skip if keyboard flag
    hal->pokeMem(07770, 05367); // JMP 7767    / jmp -1
    hal->pokeMem(07771, 06034); // KRS         / or AC with keyboard (8 bit)
    hal->pokeMem(07772, 07420); // SNL         / skip if link
    hal->pokeMem(07773, 03776); // DCA I 7776  / store ac in [7776], clear ac
    hal->pokeMem(07774, 03376); // DCA 7776    / store ac in 7776, clear ac
    hal->pokeMem(07775, 05356); // JMP 7756
    hal->pokeMem(07776, 00000); // address
}

void run() {
    std::shared_ptr<hal::HAL> hal(hal::createHAL());

    std::cout << "SoCDP8 starting..." << std::endl;
    hal->setup();

    auto ioController = std::make_shared<IOController>(hal);
    ASR33 asr33(ioController);
    PR8 pr8(ioController);
    Shell shell;

    shell.registerCommand("rimloader", [hal] (const std::vector<std::string> &params) {
       storeRIMLoader(hal);
    });

    shell.registerCommand("ls", [hal] (const std::vector<std::string> &params) {
       auto files = hal->listFiles();
       for (auto &file: files) {
           std::cout << file.name << std::endl;
       }
    });

    shell.registerCommand("load", [hal, &asr33, &pr8] (const std::vector<std::string> &params) {
        if (params.size() != 2) {
            std::cout << "Usage: load <low | high> <path>" << std::endl;
            return;
        }

        try {
            auto content = hal->readFile(params[1]);
            if (params[0] == "high") {
                pr8.setReaderInput(content);
                std::cout << "Attached to PR8" << std::endl;
            } else {
                asr33.setReaderInput(content);
                std::cout << "Attached to ASR33" << std::endl;
            }
        } catch (const std::exception &e) {
            std::cout << "Couldn't load file" << std::endl;
        }
    });

    shell.registerCommand("input", [&asr33] (const std::vector<std::string> &params) {
        std::ostringstream str;
        for (size_t i = 0; i < params.size(); i++) {
            if (i != 0) {
                str << ' ';
            }
            str << params[i];
        }
        str << "\r\n";
        asr33.setStringInput(str.str());
    });

    shell.registerCommand("clear", [&asr33, &pr8] (const std::vector<std::string> &params) {
        if (params.size() != 1) {
            std::cout << "Usage: clear <low | high>" << std::endl;
            return;
        }

        if (params[0] == "high") {
            pr8.clear();
        } else {
            asr33.clear();
        }
    });

    shell.registerCommand("dump", [&hal] (const std::vector<std::string> &params) {
        if (params.size() != 2) {
            std::cout << "Usage: dump <start> <end>" << std::endl;
            return;
        }
        uint16_t start = std::stoi(params[0], 0, 8);
        uint16_t end = std::stoi(params[1], 0, 8);
        for (uint16_t i = start; i <= end; i++) {
            if (i % 8 == 0) {
                printf("\n%05o: ", i);
            }
            printf("%04o ", hal->peekMem(i));
        }
        printf("\n");
    });

    shell.registerCommand("state", [&hal] (const std::vector<std::string> &params) {
        if (params.size() != 2) {
            std::cout << "Usage: state <load | save> <file>" << std::endl;
            return;
        }
        try {
            if (params[0] == "save") {
                std::vector<uint8_t> data;
                for (uint16_t i = 0; i <= 077777; i++) {
                    uint16_t word = hal->peekMem(i);
                    data.push_back(word & 0xFF);
                    data.push_back((word >> 8) & 0xFF);
                }
                hal->saveFile(params[1], data);
            } else if (params[0] == "load") {
                auto data = hal->readFile(params[1]);
                for (size_t i = 0; i + 1 < data.size(); i += 2) {
                    uint16_t word = data[i] | (data[i + 1] << 8);
                    hal->pokeMem(i / 2, word);
                }
            }
        } catch (const std::exception &e) {
            std::cout << "Error: " << e.what() << std::endl;
        }
    });

    std::cout << "Ready!" << std::endl;

    vTaskStartScheduler();
}

int main() {
    try {
        run();
    } catch (const std::exception &e) {
        std::cout << "Uncaught exception: " << e.what() << std::endl;
    }
    std::cout << "End" << std::endl;
}
