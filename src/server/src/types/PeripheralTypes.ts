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

export enum DeviceID {
    DEV_ID_CPU      = 0,
    DEV_ID_PT08     = 1,
    DEV_ID_PC04     = 2,
    DEV_ID_TC08     = 3,
    DEV_ID_RF08     = 4,
    DEV_ID_DF32     = 5,
    DEV_ID_TT1      = 6,
    DEV_ID_TT2      = 7,
    DEV_ID_TT3      = 8,
    DEV_ID_TT4      = 9,
    DEV_ID_KW8I     = 10,
    DEV_ID_RK08     = 11,
    DEV_ID_RK8E     = 12,

    _COUNT
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

export const BAUD_RATES: BaudRate[] = [110, 150, 300, 1200, 2400, 4800, 9600, 19200];

export interface PT08Configuration {
    id: DeviceID.DEV_ID_PT08 | DeviceID.DEV_ID_TT1 | DeviceID.DEV_ID_TT2 | DeviceID.DEV_ID_TT3 | DeviceID.DEV_ID_TT4;
    baudRate: BaudRate;
    eightBit: boolean;
    autoCaps: boolean;
}

export interface PC04Configuration {
    id: DeviceID.DEV_ID_PC04;
    baudRate: BaudRate;
}

export interface TC08Configuration {
    id: DeviceID.DEV_ID_TC08;
    numTapes: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;
}

export interface DF32Configuration {
    id: DeviceID.DEV_ID_DF32
}

export interface RF08Configuration {
    id: DeviceID.DEV_ID_RF08;
}

export interface RK08Configuration {
    id: DeviceID.DEV_ID_RK08;
}

export interface RK8EConfiguration {
    id: DeviceID.DEV_ID_RK8E;
}

export interface KW8IConfiguration {
    id: DeviceID.DEV_ID_KW8I;
    useExternalClock: boolean;
    use50Hz: boolean;
}

export type PeripheralConfiguration =
    PT08Configuration | PC04Configuration |
    TC08Configuration |
    DF32Configuration | RF08Configuration | RK08Configuration | RK8EConfiguration |
    KW8IConfiguration;
