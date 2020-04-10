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

import { DeviceID } from '../drivers/IO/Peripheral';
import { readFileSync } from 'fs';
import { promises } from 'fs';

export class MachineState {
    // General
    public directory: string = "";
    public name: string = "";

    // CPU extensions
    public eaePresent: boolean = false;
    public kt8iPresent: boolean = false;
    public maxMemField: number = 0;

    // Peripherals
    public peripherals: DeviceID[] = [];

    public async save(dir: string) {
        const obj = {
            name: this.name,
            eae: this.eaePresent,
            kt8i: this.kt8iPresent,
            maxMemField: this.maxMemField,
            peripherals: this.peripherals.map(id => DeviceID[id])
        };

        await promises.writeFile(dir + '/machine.json', JSON.stringify(obj, null, 2));
    }

    public static load(dir: string): MachineState {
        const state = new MachineState();
        const configJson = readFileSync(dir + '/machine.json');
        const configObj = JSON.parse(configJson.toString());

        state.directory = dir;
        state.name = configObj.name;
        state.eaePresent = configObj.eae;
        state.kt8iPresent = configObj.kt8i;
        state.maxMemField = configObj.maxMemField;

        for (const perphIdStr of configObj.peripherals) {
            const id = DeviceID[perphIdStr as keyof typeof DeviceID];
            state.peripherals.push(id);
        }

        return state;
    }
}
