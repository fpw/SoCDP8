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
#include <sstream>
#include <iostream>
#include <iterator>
#include "Shell.h"
#include "linenoise.h"

Shell::Shell() {
    auto ok = xTaskCreate(
            [] (void *sh) { ((Shell *) sh)->taskLoop(); },
            "ShellTask",
            configMINIMAL_STACK_SIZE,
            this,
            tskIDLE_PRIORITY + 2,
            &taskHandle
        );
    if (ok != pdPASS) {
        throw std::runtime_error("Couldn't create shell task");
    }
}

void Shell::registerCommand(const std::string& cmd, CommandHandler handler) {
    commands[cmd] = handler;
}

void Shell::taskLoop() {
    char *line;
    while ((line = linenoise("SoCDP8> "))) {
        std::istringstream stream{line};
        free(line);

        std::string cmd;
        stream >> cmd;

        if (cmd.empty()) {
            continue;
        }

        std::vector<std::string> params((std::istream_iterator<std::string>(stream)), std::istream_iterator<std::string>());
        auto it = commands.find(cmd);
        if (it != commands.end()) {
            it->second(params);
        } else {
            std::cout << "Unknown command: " << cmd << std::endl;
        }
    }
}

Shell::~Shell() {
    vTaskDelete(taskHandle);
}
