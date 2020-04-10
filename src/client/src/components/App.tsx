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
import { PDP8, PDP8Props } from './system/PDP8';
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
            <Header pdp8={props.pdp8} />
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

const Header: React.FunctionComponent<PDP8Props> = (props) =>
    <header>
        <div className='hero is-primary is-small'>
            <div className='hero-body'>
                <h1 className='title'>SoCDP-8</h1>
                <h2 className='subtitle'>Your PDP-8/I on a chip.</h2>
            </div>
        </div>
        <MenuContainer>
            <Menu title='Machine'>
                <MenuEntry label='Save State' cb={() => props.pdp8.state.save()} />
            </Menu>

            <Menu title='Core Memory'>
                <MenuEntry label='Clear' cb={() => props.pdp8.core.clear()} />
                <MenuEntry label='Store RIM LS Loader - 7756' cb={() => props.pdp8.core.storeRIMLoader()} />
                <MenuEntry label='Store RIM HS Loader - 7756' cb={() => props.pdp8.core.storeHSRIMLoader()} />
                <MenuEntry label='Store OS/8 TC08 Loader - 7613' cb={() => props.pdp8.core.storeOS8LoaderTC08()} />
                <MenuEntry label='Store OS/8 RF08 Loader - 7750' cb={() => props.pdp8.core.storeOS8LoaderRF08()} />
                <MenuEntry label='Store Disk Monitor Loader - 0200' cb={() => props.pdp8.core.storeMonitorLoader()} />
                <MenuEntry label='Store AC/MQ Blinker - 0000' cb={() => props.pdp8.core.storeBlinker()} />
            </Menu>
        </MenuContainer>
    </header>

const Footer: React.FunctionComponent = () =>
    <footer className='footer'>
        <div className='content has-text-centered'>
            <p>
                Copyright 2020 by Folke Will
            </p>
        </div>
    </footer>

const MenuContainer: React.FunctionComponent = (props) =>
    <nav className='navbar is-dark' role='navigation'>
        <div className='navbar-menu'>
            <div className='navbar-start'>
                { props.children }
            </div>
        </div>
    </nav>

const Menu: React.FunctionComponent<{title: string}> = (props) =>
    <div className='navbar-item has-dropdown is-hoverable'>
        <a className='navbar-link'>
            { props.title }
        </a>
        <div className='navbar-dropdown'>
            { props.children }
        </div>
    </div>

const MenuEntry: React.FunctionComponent<{label: string, cb: (() => void)}> = (props) =>
    <a className='navbar-item' onClick={() => props.cb() }>
        { props.label }
    </a>
