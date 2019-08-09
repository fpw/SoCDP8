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
#include <iostream>

#include "src/hal/HAL.h"
#include "src/io/IOController.h"

void storeRIMLoader(std::shared_ptr<hal::HAL> hal) {
    hal->pokeMem(07756, 06032); // KCC         / clear keyboard flag and ac
    hal->pokeMem(07757, 06031); // KSF         / skip if keyboard flag
    hal->pokeMem(07760, 05357); // JMP 7757    / jmp -1
    hal->pokeMem(07761, 06036); // KRB         / clear ac, or AC with keyboard (8 bit), clear flag
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
    hal->pokeMem(07774, 03376); // DCA 7776    / store cleared ac in 7776
    hal->pokeMem(07775, 05356); // JMP 7756
    hal->pokeMem(07776, 00000); // address
}

void run() {
    std::shared_ptr<hal::HAL> hal(hal::createHAL());

    std::cout << "SoCDP8 starting..." << std::endl;
    hal->setup();

    std::cout << "Storing RIM loader..." << std::endl;
    storeRIMLoader(hal);

    IOController ioCtrl(hal);

    std::cout << "Ready!" << std::endl;

    vTaskStartScheduler();
}

int main() {
    try {
        run();
    } catch (const std::exception &e) {
        std::cout << "Uncaught exception: " << e.what() << std::endl;
    }
}
