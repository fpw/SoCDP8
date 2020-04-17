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

export enum PeripheralType {
    PERPH_PT08,
    PERPH_PC04,

    PERPH_TC08,

    PERPH_DF32,
    PERPH_RF08,
    PERPH_RK8,

    PERPH_KW8I,
}

export type BaudRate = 110 | 150 | 300 | 1200 | 2400 | 4800 | 9600 | 19200;

export enum BaudRateConf {
    BAUD_110        = 0,
    BAUD_150        = 1,
    BAUD_300        = 2,
    BAUD_1200       = 3,
    BAUD_2400       = 4,
    BAUD_4800       = 5,
    BAUD_9600       = 6,
    BAUD_19200      = 7,
}

export interface PT08Configuration {
    kind: PeripheralType.PERPH_PT08,
    bus: 0o03 | 0o40 | 0o42 | 0o44 | 0o46,
    baudRate: BaudRate,
}

export interface PC04Configuration {
    kind: PeripheralType.PERPH_PC04,
    baudRate: BaudRate,
}

export interface TC08Configuration {
    kind: PeripheralType.PERPH_TC08,
    numTapes: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8,
}

export interface DF32Configuration {
    kind: PeripheralType.PERPH_DF32,
}

export interface RF08Configuration {
    kind: PeripheralType.PERPH_RF08,
}

export interface RK8Configuration {
    kind: PeripheralType.PERPH_RK8,
}

export interface KW8IConfiguration {
    kind: PeripheralType.PERPH_KW8I,
}

export type PeripheralConfiguration =
    PT08Configuration | PC04Configuration |
    TC08Configuration |
    DF32Configuration | RF08Configuration | RK8Configuration |
    KW8IConfiguration;

export type PeripheralName = 'SerialLine' | 'PT08.1' | 'PT08.2' | 'PT08.3' | 'PT08.4' | 'PC04' | 'TC08' | 'RF08' | 'DF32' | 'RK8' | 'KW8I';

export function peripheralConfToName(conf: PeripheralConfiguration): PeripheralName {
    switch (conf.kind) {
        case PeripheralType.PERPH_PT08:
            switch (conf.bus) {
                case 0o03:  return 'SerialLine';
                case 0o40:  return 'PT08.1';
                case 0o42:  return 'PT08.2';
                case 0o44:  return 'PT08.3';
                case 0o46:  return 'PT08.4';
            }
            break;
        case PeripheralType.PERPH_PC04:
            return 'PC04';
        case PeripheralType.PERPH_TC08:
            return 'TC08';
        case PeripheralType.PERPH_RF08:
            return 'RF08';
        case PeripheralType.PERPH_DF32:
            return 'DF32';
        case PeripheralType.PERPH_RK8:
            return 'RK8';
        case PeripheralType.PERPH_KW8I:
            return 'KW8I';
    }
}
