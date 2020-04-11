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
    DEV_ID_NULL     = 0,
    DEV_ID_ASR33    = 1,
    DEV_ID_PC04     = 2,
    DEV_ID_TC08     = 3,
    DEV_ID_RF08     = 4,
    DEV_ID_DF32     = 5,
    DEV_ID_TT1      = 6,
    DEV_ID_TT2      = 7,
    DEV_ID_TT3      = 8,
    DEV_ID_TT4      = 9,
    DEV_ID_KW8I     = 10,
    DEV_ID_RK8      = 11,
}

export class MachineState {
    // General
    public name: string = "";

    // CPU extensions
    public eaePresent: boolean = false;
    public kt8iPresent: boolean = false;
    public maxMemField: number = 0;

    // Peripherals
    public peripherals: DeviceID[] = [];

    constructor(private socket: SocketIOClient.Socket) {
    }

    public save() {
        this.socket.emit('state', {action: 'save'});
    }

    public toJSONObject(): Object {
        const obj = {
            name: this.name,
            eae: this.eaePresent,
            kt8i: this.kt8iPresent,
            maxMemField: this.maxMemField,
            peripherals: this.peripherals.map(id => DeviceID[id])
        };

        return obj;
    }

    public static fromJSONObject(socket: SocketIOClient.Socket, configObj: any): MachineState {
        const state = new MachineState(socket);

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
