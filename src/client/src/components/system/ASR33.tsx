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

export interface ASR33Props {
    punchData: string;
    onReaderKey(chr: ArrayBuffer): void;
    onReaderClear(): void;
    onTapeLoad(tape: File): void;
}

export class ASR33 extends React.PureComponent<ASR33Props> {
    private textRef: React.RefObject<HTMLTextAreaElement>;

    constructor(props: ASR33Props) {
        super(props);
        this.textRef = React.createRef();
    }

    public render(): JSX.Element {
        return (
            <section>
                <div className='control'>
                    <textarea readOnly ref={this.textRef} className='textarea has-fixed-size' rows={8} cols={80} value={this.props.punchData} />
                </div>

                <div className='control'>
                    <input className='input' onKeyPress={this.onKeyPress} onKeyDown={this.onKeyDown} />
                </div>

                <div className='field has-addons'>
                    <div className='control'>
                        <button className='button' onClick={this.onClear}>Clear</button>
                    </div>
                    
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

    public componentDidUpdate(): void {
        const textArea = this.textRef.current;
        if (!textArea) {
            return;
        }

        textArea.scrollTop = textArea.scrollHeight;
    }

    private readonly onKeyPress = (ev: React.KeyboardEvent): void => {
        if (ev.key == 'Enter') {
            (ev.target as HTMLInputElement).value = '';
            this.onPunch('\r');
        } else {
            this.onPunch(ev.key);
        }
    }

    private readonly onKeyDown = (ev: React.KeyboardEvent) => {
        if (ev.key == 'Backspace') {
            this.onPunch('\x7F');
        }
    }

    private readonly onPunch = (key: string) => {
        const buf = new ArrayBuffer(1);
        let view = new Uint8Array(buf);
        view[0] = key.charCodeAt(0) | 0x80;
        this.props.onReaderKey(buf);
    }

    private readonly onClear = (): void => {
        this.props.onReaderClear();
    }

    private readonly onLoadFile = (evt: React.ChangeEvent): void => {
        const target = evt.target as HTMLInputElement;
        if (!target.files || target.files.length < 1) {
            return;
        }
        
        this.props.onTapeLoad(target.files[0]);
    }
}
