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
    onReaderKey(chr: ArrayBuffer): void;
    onReaderClear(): void;
    onTapeLoad(tape: File): void;
}

export const ASR33: React.FunctionComponent<ASR33Props> = observer((props) => {
    const textRef = React.useRef<HTMLTextAreaElement>(null);

    scrollToBottomOnChange(textRef);

    return (
        <section>
            <div className='control'>
                <textarea readOnly ref={textRef} className='textarea has-fixed-size' rows={8} cols={80} value={props.punchData} />
            </div>

            <div className='control'>
                <input className='input' onKeyUp={(evt) => onKey(evt, props)} />
            </div>

            <div className='field has-addons'>
                <div className='control'>
                    <button className='button' onClick={props.onReaderClear}>Clear</button>
                </div>

                <div className='file'>
                    <label className='file-label'>
                        <input className='file-input' type='file' onChange={(evt) => onLoadFile(evt, props)} />
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
});

function scrollToBottomOnChange(textRef: React.RefObject<HTMLTextAreaElement>) {
    React.useEffect(() => {
        const textArea = textRef.current;
        if (!textArea) {
            return;
        }

        textArea.scrollTop = textArea.scrollHeight;
    });
}

function onKey(ev: React.KeyboardEvent, props: ASR33Props): boolean {
    if (ev.key == 'Enter') {
        (ev.target as HTMLInputElement).value = '';
        sendPunch(0x0D, props);
    } else if (ev.key == 'Backspace') {
        sendPunch(0x7F, props);
    } else if (ev.key.length == 1) {
        const ascii = ev.key.charCodeAt(0);
        if ((ascii & 0x60) == 0x60) {
            // lowercase -> convert to uppercase
            sendPunch(ascii & (~0x20), props);
        } else {
            // uppercase -> convert to ctrl
            sendPunch(ascii & (~0x40), props);
        }
    }
    console.log(`${ev.key} ${ev.ctrlKey}`)
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
    const buf = new ArrayBuffer(1);
    let view = new Uint8Array(buf);
    view[0] = code | 0x80;
    props.onReaderKey(buf);
}
