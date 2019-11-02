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
require('bulma/css/bulma.css')

export class App extends React.PureComponent {
    public render(): JSX.Element {
        return (
            <React.Fragment>
                <Header />

                <main>
                    <PDP8 />
                </main>

                <Footer />
            </React.Fragment>
        );
    }
}

function Header(): JSX.Element {
    return (
        <header>
            <div className='hero is-primary is-small'>
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
                        <a className='navbar-item'>
                            Test
                        </a>
                    </div>
                </div>
            </nav>
        </header>
    );
}

function Footer(): JSX.Element {
    return (
        <footer className='footer'>
            <div className='content has-text-centered'>
                <p>
                    Copyright 2019 by Folke Will
                </p>
            </div>
        </footer>
    );
}
