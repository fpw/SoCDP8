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

export interface TC08Props {
    onTapeLoad(tape: File, unit: number): void;
}

export const TC08: React.FunctionComponent<TC08Props> = (props) =>
    <section>
        <div className='field has-addons'>
            <div className='file'>
                <label className='file-label'>
                    <input className='file-input' type='file' onChange={evt => onLoadFile(evt, props, 0)} />
                    <span className='file-cta'>
                        <span className='file-label'>
                            Load DECtape 0
                        </span>
                    </span>
                </label>
            </div>
            <div className='file'>
                <label className='file-label'>
                    <input className='file-input' type='file' onChange={evt => onLoadFile(evt, props, 1)} />
                    <span className='file-cta'>
                        <span className='file-label'>
                            Load DECtape 1
                        </span>
                    </span>
                </label>
            </div>
        </div>
    </section>

function onLoadFile(evt: React.ChangeEvent,  props: TC08Props, unit: number): void {
    const target = evt.target as HTMLInputElement;
    if (!target.files || target.files.length < 1) {
        return;
    }
    props.onTapeLoad(target.files[0], unit);
}
