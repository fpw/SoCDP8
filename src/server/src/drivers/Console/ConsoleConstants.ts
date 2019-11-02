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

/**
 * @note These constants must match console_mux.vhd
 */

export enum LampGroupIndex {
    DATA_FIELD =    1,
    INST_FIELD =    2,
    PC =            3,
    MEM_ADDR =      4,
    MEM_BUF =       5,
    LINK =          6,
    AC =            7,
    STEP_COUNTER =  8,
    MQR =           9,
    INSTRUCTION =   10,
    STATE =         11,
    ION =           12,
    PAUSE =         13,
    RUN =           14,
}

export enum SwitchIndex {
    DATA_FIELD =    15,
    INST_FIELD =    16,
    SWR =           17,
    START =         18,
    LOAD =          19,
    DEP =           20,
    EXAM =          21,
    CONT =          22,
    STOP =          23,
    SING_STEP =     24,
    SING_INST =     25,
}

export enum LampBrightnessIndex {
    LAMP_DF    =  0,
    LAMP_IF    =  3,
    LAMP_PC    =  6,
    LAMP_MA    = 18,
    LAMP_MB    = 30,
    LAMP_L     = 42,
    LAMP_AC    = 43,
    LAMP_SC    = 55,
    LAMP_MQR   = 60,
    LAMP_IR    = 72,
    LAMP_STATE = 80,
    LAMP_ION   = 86,
    LAMP_PAUSE = 87,
    LAMP_RUN   = 88,
}

export const LAMP_OVERRIDE_MASK = 2;
export const SW_OVERRIDE_MASK = 1;
