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

import { MachineState } from "./MachineState";
import { mkdirSync, readdirSync } from 'fs';
import { DeviceID } from '../drivers/IO/Peripheral';

export class MachineStateList {
    private readonly machineDir: string;
    private stateMap: Map<string, MachineState> = new Map();

    constructor(private readonly baseDir: string) {
        this.machineDir = this.baseDir + '/machines/';
        mkdirSync(this.machineDir, {recursive: true});

        this.loadStates();

        if (!this.stateMap.has('default')) {
            const defaultState = this.createDefaultState();
            this.stateMap.set('default', defaultState);
        }
    }

    private createDefaultState(): MachineState {
        const defaultState = new MachineState();

        defaultState.name = 'default';
        defaultState.directory = this.machineDir + '/default/';

        defaultState.eaePresent = true;
        defaultState.kt8iPresent = false;
        defaultState.maxMemField = 7;

        defaultState.peripherals = [
            DeviceID.DEV_ID_ASR33,
            DeviceID.DEV_ID_PC04
        ];

        return defaultState;
    }

    private loadStates() {
        for(const stateDir of readdirSync(this.machineDir)) {
            try {
                const state = MachineState.load(this.machineDir + '/' + stateDir);
                this.stateMap.set(state.name, state);
            } catch (e) {
                console.log('Skipping machine ' + stateDir + ': ' + e);
            }
        }
    }

    public getStates(): Iterable<MachineState> {
        return this.stateMap.values();
    }

    public getStateByName(name: string): MachineState {
        const config = this.stateMap.get(name);
        if (!config) {
            throw new Error('Unknown state');
        }

        return config;
    }

}
