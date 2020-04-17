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

import { PeripheralConfiguration, PC04Configuration, PT08Configuration, TC08Configuration, RF08Configuration, DeviceID } from './PeripheralTypes';

export interface SystemConfiguration {
    id: string,
    name: string;
    description: string;

    cpuExtensions: {
        eae: boolean;
        kt8i: boolean;
    }

    maxMemField: number;

    peripherals: PeripheralConfiguration[],
}

export const DEFAULT_SYSTEM_CONF: SystemConfiguration = {
    id: 'default',
    name: 'default',
    description: '',
    maxMemField: 7,
    cpuExtensions: {
        eae: true,
        kt8i: false,
    },
    peripherals: [
        <PT08Configuration>
        {
            id: DeviceID.DEV_ID_PT08,
            baudRate: 110,
        },
        <PC04Configuration> {
            id: DeviceID.DEV_ID_PC04,
            baudRate: 4800,
        },
        <TC08Configuration> {
            id: DeviceID.DEV_ID_TC08,
            numTapes: 2,
        },
        <RF08Configuration> {
            id: DeviceID.DEV_ID_RF08,
        },
    ]
};
