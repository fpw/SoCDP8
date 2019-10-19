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

import * as React from "react";
import { FrontPanel } from "./FrontPanel";
import { ASR33 } from "./ASR33";
import { PR8 } from "./PR8";

export interface PDP8Props {
    socket: SocketIOClient.Socket;
}

interface PDP8State {
};

export class PDP8 extends React.Component<PDP8Props, PDP8State> {
    private socket: SocketIOClient.Socket;

    constructor(props: PDP8Props) {
        super(props);
        this.socket = props.socket;
    }

    public render(): JSX.Element {
        return (
            <section className='section'>
                <div className='container'>
                    <h1 className='title'>PDP-8/I</h1>
                    <FrontPanel socket={this.socket} />
                </div>

                <div className='container'>
                    <h1 className='title'>ASR-33</h1>
                    <ASR33 socket={this.socket} />
                </div>

                <div className='container'>
                    <h1 className='title'>PR-8/I</h1>
                    <PR8 socket={this.socket} />
                </div>
            </section>
        );
    }
}
