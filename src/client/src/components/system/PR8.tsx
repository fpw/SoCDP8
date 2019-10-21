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

export interface PR8Props {
    onTapeLoad(tape: File): void;
}

export class PR8 extends React.PureComponent<PR8Props> {
    public render(): JSX.Element {
        return (
            <section>
                <div className='field has-addons'>
                    <div className='file'>
                        <label className='file-label'>
                            <input className='file-input' type='file' onChange={this.onLoadFile} />
                            <span className='file-cta'>
                                <span className='file-label'>
                                    Attach Tape
                                </span>
                            </span>
                        </label>
                    </div>
                </div>
            </section>
        );
    }

    private readonly onLoadFile = (evt: React.ChangeEvent): void => {
        const target = evt.target as HTMLInputElement;
        if (!target.files || target.files.length < 1) {
            return;
        }
        
        this.props.onTapeLoad(target.files[0]);
    }
}
