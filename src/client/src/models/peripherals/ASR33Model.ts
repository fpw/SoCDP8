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

export class ASR33Model extends PeripheralModel {
    @observable
    private punchData: string = '';

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

    public readonly appendReaderKey = async (chr: ArrayBuffer): Promise<void> => {
        this.socket.emit('peripheral-action', {
            devId: this.id,
            action: 'append-data',
            data: chr
        });
    }

    public readonly loadTape = async (tape: File): Promise<void> => {
        let data = await this.loadFile(tape);
        this.socket.emit('peripheral-action', {
            devId: this.id,
            action: 'set-data',
            data: data
        });
    }

    public readonly clearPunch = async (): Promise<void> => {
        this.setPunchData('');
    }
}
