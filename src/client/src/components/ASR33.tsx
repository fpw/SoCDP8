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
    onTapeLoad(data: ArrayBuffer): void;
    onPunch(chr: string): void;
    onClear(): void;
    punchData: string;
}

export class ASR33 extends React.Component<ASR33Props, {}> {
    constructor(props: ASR33Props) {
        super(props);
    }

    public render(): JSX.Element {
        return (
            <div>
                <Puncher punchData={this.props.punchData} onPunch={this.props.onPunch} onClear={this.props.onClear} />
                <Reader onTapeLoad={this.props.onTapeLoad} />
            </div>
        );
    }
}

interface PuncherProps {
    punchData: string;
    onPunch(chr: string): void;
    onClear(): void;
}

class Puncher extends React.Component<PuncherProps, {}> {
    public render(): JSX.Element {
        return (
            <div>
                <textarea readOnly rows={25} cols={80} value={this.props.punchData} onKeyPress={(ev: React.KeyboardEvent) => this.onKeyPress(ev)} />
                <button type='button' onClick={() => {this.onClear()}}>Clear</button>
            </div>
        );;
    }

    private onKeyPress(ev: React.KeyboardEvent): void {
        if (ev.key == 'Enter') {
            this.props.onPunch('\r');
        } else {
            this.props.onPunch(ev.key);
        }
    }

    private onClear(): void {
        this.props.onClear();
    }
}

interface ReaderProps {
    onTapeLoad(data: ArrayBuffer): void;
}

class Reader extends React.Component<ReaderProps, {}> {
    public render(): JSX.Element {
        return (
            <div>
                <label>
                    Load Tape
                    <input type='file' onChange={(ev: React.ChangeEvent) => this.onLoadFile(ev)} />
                </label>
            </div>
        );
    }

    private onLoadFile(evt: React.ChangeEvent): void {
        const target = evt.target as HTMLInputElement;
        if (!target.files || target.files.length < 1) {
            return;
        }

        const reader = new FileReader();
        reader.onload = () => {
            let data = reader.result as ArrayBuffer;
            this.props.onTapeLoad(data);
        };
        reader.readAsArrayBuffer(target.files[0]);
    }
}
