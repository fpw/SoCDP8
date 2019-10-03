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
import { LampState, SwitchState } from "../models/FrontPanelState";

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
        return <object ref={this.ref} className="pdp8console" type="image/svg+xml" data="/img/console.svg"></object>;
    }

    public componentDidMount(): void {
        let cons = this.ref.current;
        if (!cons) {
            return;
        }

        cons.addEventListener("load", () => {
            this.connectSwitches();
            this.forceUpdate();
        });
    }

    private connectSwitches(): void {
        let svg = this.getSVG();
        if (!svg) {
            return;
        }

        this.connectSwitch(svg, 'sw_df0', () => this.onSwitch('df0'));
        this.connectSwitch(svg, 'sw_df1', () => this.onSwitch('df1'));
        this.connectSwitch(svg, 'sw_df2', () => this.onSwitch('df2'));

        this.connectSwitch(svg, 'sw_if0', () => this.onSwitch('if0'));
        this.connectSwitch(svg, 'sw_if1', () => this.onSwitch('if1'));
        this.connectSwitch(svg, 'sw_if2', () => this.onSwitch('if2'));

        for (let i = 0; i < 12; i++) {
            this.connectSwitch(svg, 'sw_swr' + i, () => this.onSwitch('swr' + i));
        }

        this.connectSwitch(svg, 'sw_start', () => this.onSwitch('start'));
        this.connectSwitch(svg, 'sw_load', () => this.onSwitch('load'));
        this.connectSwitch(svg, 'sw_dep', () => this.onSwitch('dep'));
        this.connectSwitch(svg, 'sw_exam', () => this.onSwitch('exam'));
        this.connectSwitch(svg, 'sw_cont', () => this.onSwitch('cont'));
        this.connectSwitch(svg, 'sw_stop', () => this.onSwitch('stop'));
        this.connectSwitch(svg, 'sw_sing_step', () => this.onSwitch('sing_step'));
        this.connectSwitch(svg, 'sw_sing_inst', () => this.onSwitch('sing_inst'));
    }

    private connectSwitch(svg: Document, id: string, f: () => void): void {
        let elem = svg.getElementById(id);
        if (elem) {
            elem.onclick = f;
        }
    }

    private onSwitch(sw: string): void  {
    }

    public componentDidUpdate(prevProps: Readonly<PDP8ConsoleProps>): void {
        let svg = this.getSVG();
        if (!svg) {
            return;
        }

        this.setLampRow(svg, 'lamp_df', 3, this.props.lamps.dataField);
        this.setLampRow(svg, 'lamp_if', 3, this.props.lamps.instField);
        this.setLampRow(svg, 'lamp_pc', 12, this.props.lamps.pc);
        this.setLampRow(svg, 'lamp_ma', 12, this.props.lamps.memAddr);
        this.setLampRow(svg, 'lamp_mb', 12, this.props.lamps.memBuf);
        this.setLamp(svg, 'lamp_link', this.props.lamps.link != 0);
        this.setLampRow(svg, 'lamp_ac', 12, this.props.lamps.ac);
        this.setLampRow(svg, 'lamp_mq', 12, this.props.lamps.mqr);
        this.setLampRow(svg, 'lamp_sc', 5, this.props.lamps.stepCounter);

        this.setLamp(svg, 'lamp_and', (this.props.lamps.instruction & (1 << 0)) != 0);
        this.setLamp(svg, 'lamp_tad', (this.props.lamps.instruction & (1 << 1)) != 0);
        this.setLamp(svg, 'lamp_isz', (this.props.lamps.instruction & (1 << 2)) != 0);
        this.setLamp(svg, 'lamp_dca', (this.props.lamps.instruction & (1 << 3)) != 0);
        this.setLamp(svg, 'lamp_jms', (this.props.lamps.instruction & (1 << 4)) != 0);
        this.setLamp(svg, 'lamp_jmp', (this.props.lamps.instruction & (1 << 5)) != 0);
        this.setLamp(svg, 'lamp_iot', (this.props.lamps.instruction & (1 << 6)) != 0);
        this.setLamp(svg, 'lamp_opr', (this.props.lamps.instruction & (1 << 7)) != 0);

        this.setLamp(svg, 'lamp_fetch', (this.props.lamps.state & (1 << 0)) != 0);
        this.setLamp(svg, 'lamp_execute', (this.props.lamps.state & (1 << 1)) != 0);
        this.setLamp(svg, 'lamp_defer', (this.props.lamps.state & (1 << 2)) != 0);
        this.setLamp(svg, 'lamp_word_count', (this.props.lamps.state & (1 << 3)) != 0);
        this.setLamp(svg, 'lamp_current_addr', (this.props.lamps.state & (1 << 4)) != 0);
        this.setLamp(svg, 'lamp_break', (this.props.lamps.state & (1 << 5)) != 0);

        this.setLamp(svg, 'lamp_ion', this.props.lamps.ion != 0);
        this.setLamp(svg, 'lamp_pause', this.props.lamps.pause != 0);
        this.setLamp(svg, 'lamp_run', this.props.lamps.run != 0);
    }

    private getSVG(): Document | null {
        let cons = this.ref.current;
        if (!cons) {
            return null;
        }

        let svg = cons.contentDocument;
        if (!svg) {
            return null;
        }

        return svg;
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
