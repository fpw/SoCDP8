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

import { PeripheralModel } from './PeripheralModel';
import { observable, action, computed } from 'mobx';
import { PC04Configuration } from '../../types/PeripheralTypes';

export class PC04Model extends PeripheralModel {
    @observable
    private punchData: number[] = [];

    constructor(socket: SocketIOClient.Socket, private conf: PC04Configuration) {
        super(socket);
    }

    public get connections(): number[] {
        return [0o01, 0o02];
    }

    @action
    public onPeripheralAction(action: string, data: any): void {
        switch (action) {
            case 'punch':
                this.punchData.push(data.data);
                break;
        }
    }

    @action
    private setPunchData(data: number[]) {
        this.punchData = data;
    }

    public readonly clearPunch = async (): Promise<void> => {
        this.setPunchData([]);
    }

    @computed
    public get punchOutput(): Uint8Array {
        return Uint8Array.from(this.punchData);
    }

    public readonly loadTape = async (tape: File): Promise<void> => {
        let data = await this.loadFile(tape);
        this.socket.emit('peripheral-action', {
            id: this.conf.id,
            action: 'set-data',
            data: data
        });
    }
}
