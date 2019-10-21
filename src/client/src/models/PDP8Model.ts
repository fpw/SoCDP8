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

import * as io from 'socket.io-client'
import { FrontPanelState, FrontPanelDefaultState } from './FrontPanelState';
import { observable, action, computed } from 'mobx'

export class PDP8Model {
    private socket: SocketIOClient.Socket;

    @observable
    private frontPanel: FrontPanelState = FrontPanelDefaultState;

    @observable
    private punchData: string = '';

    constructor() {
        this.socket = io.connect();

        this.socket.on('console-state', (state: FrontPanelState) => {
            this.onFrontPanelChange(state);
        });

        this.socket.on('punch', (data: number) => {
            this.onASR33Punch(data);
        });
    }

    @action
    private onFrontPanelChange(newState: FrontPanelState): void {
        this.frontPanel = newState;
    }
   
    @action
    private onASR33Punch(data: number): void {
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

    private loadFile(file: File): Promise<ArrayBuffer> {
        return new Promise<ArrayBuffer>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
                let data = reader.result as ArrayBuffer;
                resolve(data);
            };
            reader.onerror = () => {
                reject();
            }
            reader.readAsArrayBuffer(file);
        });
    }

    @computed
    public get panel(): FrontPanelState {
        return this.frontPanel;
    }

    @computed
    public get punchOutput() {
        return this.punchData;
    }

    public setPanelSwitch(sw: string, state: boolean): void {
        this.socket.emit('console-switch', {'switch': sw, 'state': state});
    }

    public appendReaderKey(chr: ArrayBuffer) {
        this.socket.emit('append-asr33-tape', chr);
    }

    public async loadASR33Tape(tape: File) {
        let data = await this.loadFile(tape);
        this.socket.emit('clear-asr33-tape', data);
        this.socket.emit('append-asr33-tape', data);
    }

    public async loadPR8Tape(tape: File) {
        let data = await this.loadFile(tape);
        this.socket.emit('load-pr8-tape', data);
    }

    @action
    public clearASR33Punch() {
        this.punchData = '';
    }
}
