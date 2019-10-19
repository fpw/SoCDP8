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
import { PDP8 } from './system/PDP8';
require('public/index.html')
require('bulma/css/bulma.css')

interface AppProps {
}

interface AppState {
}

export class App extends React.Component<AppProps, AppState> {
    private socket: SocketIOClient.Socket;

    constructor(props: AppProps) {
        super(props);
        this.socket = io.connect();
    }

    public render(): JSX.Element {
        return (
            <React.Fragment>
                <header>
                    <div className='hero is-primary'>
                        <div className='hero-body'>
                            <h1 className='title'>SoCDP-8</h1>
                            <h2 className='subtitle'>A PDP-8/I on a chip</h2>
                        </div>
                    </div>
                    <nav className='navbar is-dark' role='navigation'>
                        <div className='navbar-menu'>
                            <div className='navbar-start'>
                                <a className='navbar-item'>
                                    Test
                                </a>
                            </div>
                        </div>
                    </nav>
                </header>

                <main>
                    <PDP8 socket={this.socket} />
                </main>
                
                <footer className='footer'>
                    <div className='content has-text-centered'>
                        <p>
                            Copyright 2019 by Folke Will
                        </p>
                    </div>
                </footer>
            </React.Fragment>
        );
    }

    /*
    <kbd>keyboard stroke</kbd>
    <samp>output</samp>
    <code>code</code>
    <var>variable</var>
    <mark>marked</mark>
    <data value="01234">word</data>
    <dfn>definition</dfn>
    <div>test</div>
    <progress></progress>
    <meter min='0' max='100' value='50'>50%</meter>
    <footer></footer>
    */
}
