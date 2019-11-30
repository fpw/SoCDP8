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
import { observer } from 'mobx-react-lite';

export interface ASR33Props {
    punchData: string;
    onReaderKey(chr: number): void;
    onReaderClear(): void;
    onTapeLoad(tape: File): void;
    onReaderActivationChange(state: boolean): void;
}

export const ASR33: React.FunctionComponent<ASR33Props> = observer((props) => {
    const textRef = React.useRef<HTMLTextAreaElement>(null);

    scrollToBottomOnChange(textRef);

    return (
        <section>
            <div className='box'>
                <h2 className='subtitle is-4'>Output</h2>
                <div className='control'>
                    <textarea ref={textRef}
                        readOnly className='textarea has-fixed-size' rows={8} cols={80} style={{fontFamily: 'monospace'}}
                        value={props.punchData} />
                </div>

                <div className='control'>
                    <button className='button' onClick={props.onReaderClear}>Clear Output</button>
                </div>
            </div>

            <div className='box'>
            <h2 className='subtitle is-4'>Input</h2>
                <div className='field'>
                    <label className='label'>
                        Key Input
                        <div className='control'>
                            <input className='input' onKeyUp={evt => onKeyUp(evt, props)} onKeyPress={evt => onKeyPress(evt, props)} />
                        </div>
                    </label>
                </div>

                <div className='field'>
                    <div className='control'>
                        <label className='checkbox'>
                            <input type='checkbox' onChange={evt => props.onReaderActivationChange(evt.target.checked)} />
                            Reader On
                        </label>
                    </div>
                </div>

                <div className='field'>
                    <div className='control'>
                        <div className='file'>
                            <label className='file-label'>
                                <input className='file-input' type='file' onChange={evt => onLoadFile(evt, props)} />
                                <span className='file-cta'>
                                    <span className='file-label'>
                                        Load Tape
                                    </span>
                                </span>
                            </label>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
});

function scrollToBottomOnChange(textRef: React.RefObject<HTMLTextAreaElement>) {
    React.useEffect(() => {
        const textElem = textRef.current;
        if (!textElem) {
            return;
        }

        textElem.scrollTop = textElem.scrollHeight - textElem.clientHeight;
    });
}

function onKeyUp(ev: React.KeyboardEvent, props: ASR33Props): boolean {
    if (ev.key == 'Enter') {
        (ev.target as HTMLInputElement).value = '';
        sendPunch(0x0D, props);
    } else if (ev.key == 'Backspace') {
        sendPunch(0x7F, props);
    } else if (ev.key == 'Escape') {
        sendPunch(0x1B, props);
    }

    return false;
}

function onKeyPress(ev: React.KeyboardEvent, props: ASR33Props): boolean {
    if (ev.key.length == 1) {
        const ascii = ev.key.charCodeAt(0);
        if ((ascii & 0x60) == 0x60) {
            // lowercase -> convert to uppercase
            sendPunch(ascii & (~0x20), props);
        } else {
            // uppercase -> convert to ctrl
            sendPunch(ascii & (~0x40), props);
        }
    }

    return false;
}

function onLoadFile(evt: React.ChangeEvent, props: ASR33Props): void {
    const target = evt.target as HTMLInputElement;
    if (!target.files || target.files.length < 1) {
        return;
    }

    props.onTapeLoad(target.files[0]);
}

function sendPunch(code: number, props: ASR33Props) {
    props.onReaderKey(code | 0x80);
}
