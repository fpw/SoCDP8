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
    socket: SocketIOClient.Socket;
}

interface ASR33State {
    punchData: string;
}

export class ASR33 extends React.Component<ASR33Props, ASR33State> {
    private socket: SocketIOClient.Socket;
    private textRef: React.RefObject<HTMLTextAreaElement>;

    constructor(props: ASR33Props) {
        super(props);
        this.socket = props.socket;
        this.textRef = React.createRef();
        this.state = {punchData: ''};

        this.socket.on('punch', (data: number) => {
            const chr = data & 0x7F;
            const old = this.state.punchData;
            if (chr == 0x7F) {
                // Rub-out
                this.setState({punchData: old.slice(0, old.length)});
            } else if (chr == 0x00) {
                // nothing
            } else {
                // punch character
                const str = String.fromCharCode(chr);
                this.setState({punchData: old + str});
            }
        });
    }

    public render(): JSX.Element {
        return (
            <section>
                <div className='control'>
                    <textarea readOnly ref={this.textRef} className='textarea has-fixed-size' rows={8} cols={80} value={this.state.punchData} onKeyPress={(ev: React.KeyboardEvent) => this.onKeyPress(ev)} />
                </div>
                <div className='field has-addons'>
                    <div className='control'>
                        <button className='button' onClick={() => {this.onClear()}}>Clear</button>
                    </div>
                    <div className='file'>
                        <label className='file-label'>
                            <input className='file-input' type='file' onChange={(ev: React.ChangeEvent) => this.onLoadFile(ev)} />
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

    public componentDidMount(): void {
    }

    public componentDidUpdate(): void {
        const textArea = this.textRef.current;
        if (!textArea) {
            return;
        }

        textArea.scrollTop = textArea.scrollHeight;
    }

    private onKeyPress(ev: React.KeyboardEvent): void {
        if (ev.key == 'Enter') {
            this.onPunch('\r');
        } else {
            this.onPunch(ev.key);
        }
    }

    private onPunch(key: string) {
        const buf = new ArrayBuffer(1);
        let view = new Uint8Array(buf);
        view[0] = key.charCodeAt(0) | 0x80;
        this.socket.emit('load-asr33-tape', buf);
    }

    private onClear(): void {
        this.setState({punchData: ''});
    }

    private onLoadFile(evt: React.ChangeEvent): void {
        const target = evt.target as HTMLInputElement;
        if (!target.files || target.files.length < 1) {
            return;
        }

        const reader = new FileReader();
        reader.onload = () => {
            let data = reader.result as ArrayBuffer;
            this.socket.emit('load-asr33-tape', data);
        };
        reader.readAsArrayBuffer(target.files[0]);
    }
}
