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
import { number } from "prop-types";

export interface LampState {
    dataField: number;
    instField: number;
    pc: number;
    memAddr: number;
    memBuf: number;
    link: number;
    ac: number;
    stepCounter: number;
    mqr: number;
    instruction: number;
    state: number;
    ion: number;
    pause: number;
    run: number;
}

export interface SwitchState {
    dataField: number;
    instField: number;
    swr: number;
    start: number;
    load: number;
    dep: number;
    exam: number;
    cont: number;
    stop: number;
    singStep: number;
    singInst: number;
}

export interface PDP8ConsoleProps {
    lamps: LampState;
    switches: SwitchState;
}

export class PDP8Console extends React.Component<PDP8ConsoleProps, {}> {
    private ref: React.RefObject<HTMLObjectElement>;

    constructor(props: PDP8ConsoleProps) {
        super(props);
        this.ref = React.createRef<HTMLObjectElement>();
    }

    public render(): JSX.Element {
        return <object ref={this.ref} type="image/svg+xml" data="/img/console.svg"></object>;
    }

    public componentDidMount() {
        let cons = this.ref.current;
        if (!cons) {
            return;
        }

        cons.addEventListener("load", () => {
            this.forceUpdate();
        });
    }

    public componentDidUpdate(prevProps: Readonly<PDP8ConsoleProps>): void {
        let cons = this.ref.current;
        if (!cons) {
            return;
        }

        let svg = cons.contentDocument;
        if (!svg) {
            return;
        }

        this.setLampRow(svg, 'led_df', 3, this.props.lamps.dataField);
        this.setLampRow(svg, 'led_if', 3, this.props.lamps.instField);
        this.setLampRow(svg, 'led_pc', 12, this.props.lamps.pc);
        this.setLampRow(svg, 'led_ma', 12, this.props.lamps.memAddr);
        this.setLampRow(svg, 'led_mb', 12, this.props.lamps.memBuf);
        this.setLamp(svg, 'led_link', this.props.lamps.link != 0);
        this.setLampRow(svg, 'led_ac', 12, this.props.lamps.ac);
        this.setLampRow(svg, 'led_mq', 12, this.props.lamps.mqr);
        this.setLampRow(svg, 'led_sc', 5, this.props.lamps.stepCounter);

        this.setLamp(svg, 'led_and', (this.props.lamps.instruction & (1 << 0)) != 0);
        this.setLamp(svg, 'led_tad', (this.props.lamps.instruction & (1 << 1)) != 0);
        this.setLamp(svg, 'led_isz', (this.props.lamps.instruction & (1 << 2)) != 0);
        this.setLamp(svg, 'led_dca', (this.props.lamps.instruction & (1 << 3)) != 0);
        this.setLamp(svg, 'led_jms', (this.props.lamps.instruction & (1 << 4)) != 0);
        this.setLamp(svg, 'led_jmp', (this.props.lamps.instruction & (1 << 5)) != 0);
        this.setLamp(svg, 'led_iot', (this.props.lamps.instruction & (1 << 6)) != 0);
        this.setLamp(svg, 'led_opr', (this.props.lamps.instruction & (1 << 7)) != 0);

        this.setLamp(svg, 'led_fetch', (this.props.lamps.state & (1 << 0)) != 0);
        this.setLamp(svg, 'led_execute', (this.props.lamps.state & (1 << 1)) != 0);
        this.setLamp(svg, 'led_defer', (this.props.lamps.state & (1 << 2)) != 0);
        this.setLamp(svg, 'led_word_count', (this.props.lamps.state & (1 << 3)) != 0);
        this.setLamp(svg, 'led_current_addr', (this.props.lamps.state & (1 << 4)) != 0);
        this.setLamp(svg, 'led_break', (this.props.lamps.state & (1 << 5)) != 0);

        this.setLamp(svg, 'led_ion', this.props.lamps.ion != 0);
        this.setLamp(svg, 'led_pause', this.props.lamps.pause != 0);
        this.setLamp(svg, 'led_run', this.props.lamps.run != 0);
    }

    private setLampRow(svg: Document, id: string, width: number, value: number): void {
        for (let i = 0; i < width; i++) {
            this.setLamp(svg, id + i, (value & (1 << (width - i - 1))) != 0);
        }
    }

    private setLamp(svg: Document, id: string, lit: boolean): void {
        let elem = svg.getElementById(id);
        if (elem) {
            elem.style.fill = (lit ? '#dad103ff' : '#222222');
        }
    }
}
