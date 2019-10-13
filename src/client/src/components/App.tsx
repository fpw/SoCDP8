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

import * as React from 'react';
import * as io from 'socket.io-client'
import { FrontPanel } from './FrontPanel';
import { LampState, SwitchState } from '../models/FrontPanelState';
import { ASR33 } from './ASR33';
import { PR8 } from './PR8';
require('public/index.html')
require('public/css/style.css')

interface AppProps {
}

interface AppState {
    loaded: boolean;
    lamps: LampState;
    switches: SwitchState;
    punchInput: string;
}

export class App extends React.Component<AppProps, AppState> {
    private socket: SocketIOClient.Socket;

    constructor(props: AppProps) {
        super(props);
        this.socket = io.connect();
        this.setState({loaded: false});
    }

    public async componentDidMount(): Promise<void> {
        this.socket.on('console-state', (state: any) => {
            let lamps: LampState = state.lamps;
            let switches: SwitchState = state.switches;
            this.setState({
                loaded: true,
                lamps: lamps,
                switches: switches
            });
        });

        this.socket.on('punch', (data: number) => {
            const chr = String.fromCharCode(data & 0x7F);
            let old = this.state.punchInput;
            if (!old) {
                old = '';
            }
            this.setState({punchInput: old + chr});
        });
    }

    public render(): JSX.Element {
        if (!this.state || !this.state.loaded) {
            return <div>Loading...</div>;
        }

        return (
            <div>
                <FrontPanel lamps={this.state.lamps} switches={this.state.switches} onSwitch={(sw, st) => this.onConsoleSwitch(sw, st)} />
                <ASR33 onTapeLoad={(data: ArrayBuffer) => this.loadTape(data)} punchData={this.state.punchInput} onPunch={(chr) => this.onPunch(chr)} onClear={() => this.onClear()} />
                <PR8 onTapeLoad={(data: ArrayBuffer) => this.loadHighTape(data)}/>
            </div>
        );
    }

    private onConsoleSwitch(sw: string, state: boolean): void {
        this.socket.emit('console-switch', {'switch': sw, 'state': state});
    }

    private loadTape(data: ArrayBuffer) {
        this.socket.emit('load-asr33-tape', data);
    }

    private loadHighTape(data: ArrayBuffer) {
        this.socket.emit('load-pr8-tape', data);
    }

    private onPunch(key: string) {
        const buf = new ArrayBuffer(1);
        let view = new Uint8Array(buf);
        view[0] = key.charCodeAt(0) | 0x80;
        this.socket.emit('load-asr33-tape', buf);
    }

    private onClear(): void {
        this.setState({punchInput: ''});
    }
}
