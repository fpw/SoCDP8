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
import { PDP8 } from './system/PDP8';
import { PDP8Model } from '../models/PDP8Model';
import { observer } from 'mobx-react-lite';
require('bulma/css/bulma.css')

export interface AppProps {
    pdp8: PDP8Model;
}

export const App: React.FunctionComponent<AppProps> = observer((props) => {
    if (!props.pdp8.ready) {
        return <ConnectingInfo />
    }

    return (
        <React.Fragment>
            <Header />
            <main>
                <PDP8 pdp8={props.pdp8} />
            </main>
            <Footer />
        </React.Fragment>
    );
});

const ConnectingInfo: React.FunctionComponent = () =>
    <section className='section'>
        <div className='container'>
            <div className='box'>
                <h1 className='title'>Connecting...</h1>
                <p>
                    Please wait.
                </p>
            </div>
        </div>
    </section>

const Header: React.FunctionComponent = () =>
    <header>
        <div className='hero is-primary is-small'>
            <div className='hero-body'>
                <h1 className='title'>SoCDP-8</h1>
                <h2 className='subtitle'>Your PDP-8/I on a chip.</h2>
            </div>
        </div>
        <nav className='navbar is-dark' role='navigation'>
            <div className='navbar-menu'>
                <div className='navbar-start'>
                    <a className='navbar-item'>
                        System
                    </a>
                </div>
            </div>
        </nav>
    </header>

const Footer: React.FunctionComponent = () =>
    <footer className='footer'>
        <div className='content has-text-centered'>
            <p>
                Copyright 2019 by Folke Will
            </p>
        </div>
    </footer>
