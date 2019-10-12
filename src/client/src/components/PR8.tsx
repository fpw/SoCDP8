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
    onTapeLoad(data: ArrayBuffer): void;
}

export class PR8 extends React.Component<PR8Props, {}> {
    constructor(props: PR8Props) {
        super(props);
    }

    public render(): JSX.Element {
        return (
            <div>
                <Puncher />
                <Reader onTapeLoad={this.props.onTapeLoad} />
            </div>
        );
    }

    public componentDidUpdate(prevProps: Readonly<PR8Props>): void {
    }
}

class Puncher extends React.Component<{}, {}> {
    public render(): JSX.Element {
        return <div>Puncher</div>;
    }
}

interface ReaderProps {
    onTapeLoad(data: ArrayBuffer): void;
}

class Reader extends React.Component<PR8Props, {}> {
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
