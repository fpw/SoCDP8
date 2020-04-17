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

import { observable, action, computed } from 'mobx';
import { PeripheralModel } from './PeripheralModel';
import { PT08Configuration, DeviceID } from '../../types/PeripheralTypes';

export class ASR33Model extends PeripheralModel {
    @observable
    private punchData: string = '';

    constructor(socket: SocketIOClient.Socket, private conf: PT08Configuration) {
        super(socket);
    }

    public get connections(): number[] {
        switch (this.conf.id) {
            case DeviceID.DEV_ID_PT08: return [0o03, 0o04];
            case DeviceID.DEV_ID_TT1:  return [0o40, 0o41];
            case DeviceID.DEV_ID_TT2:  return [0o42, 0o43];
            case DeviceID.DEV_ID_TT3:  return [0o44, 0o45];
            case DeviceID.DEV_ID_TT4:  return [0o46, 0o47];
        }
    }

    public onPeripheralAction(action: string, data: any) {
        switch (action) {
            case 'punch':
                this.onPunch(data.data);
                break;
        }
    }

    @action
    private onPunch(data: number) {
        const chr = data & 0x7F;
        const old = this.punchData;
        if (chr == 0x7F) {
            // Rub-out
            this.punchData = old.slice(0, old.length);
        } else if (chr == 0x00) {
            // nothing
        } else {
            // punch character
            const str = String.fromCharCode(chr);
            this.punchData = old + str;
        }
    }

    @action
    private setPunchData(data: string) {
        this.punchData = '';
    }

    @computed
    public get punchOutput() {
        return this.punchData;
    }

    public readonly appendReaderKey = async (chr: number): Promise<void> => {
        this.socket.emit('peripheral-action', {
            id: this.conf.id,
            action: 'key-press',
            data: chr
        });
    }

    public readonly loadTape = async (tape: File): Promise<void> => {
        let data = await this.loadFile(tape);
        this.socket.emit('peripheral-action', {
            id: this.conf.id,
            action: 'reader-tape-set',
            data: data
        });
    }

    public readonly setReaderActive = async (active: boolean): Promise<void> => {
        this.socket.emit('peripheral-action', {
            id: this.conf.id,
            action: 'reader-set-active',
            data: active
        });
    };

    public readonly clearPunch = async (): Promise<void> => {
        this.setPunchData('');
    }
}
