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
require('public/index.html')
require('public/css/style.css')

interface AppProps {
}

interface AppState {
    lamps: LampState;
    switches: SwitchState;
}

export class App extends React.Component<AppProps, AppState> {
    private socket: SocketIOClient.Socket;

    constructor(props: AppProps) {
        super(props);
        this.socket = io.connect();
    }

    public async componentDidMount(): Promise<void> {
        this.socket.on('console-state', (state: any) => {
            let lamps: LampState = state.lamps;
            let switches: SwitchState = state.switches;
            this.setState({
                lamps: lamps,
                switches: switches
            });
        });
    }

    public render(): JSX.Element {
        if (!this.state) {
            return <div>Loading...</div>;
        }

        return <FrontPanel lamps={this.state.lamps} switches={this.state.switches} onSwitch={(s) => this.onConsoleSwitch(s)} />;
    }

    public onConsoleSwitch(sw: string): void {
        this.socket.emit('console-switch', {'switch': sw});
    }
}
