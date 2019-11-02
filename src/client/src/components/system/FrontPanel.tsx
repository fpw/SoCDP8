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
import { LampBrightness, SwitchState } from '../../models/FrontPanelState';

export interface FrontPanelProps {
    lamps: LampBrightness;
    switches: SwitchState;
    onSwitch(sw: string, state: boolean): void;
}

export class FrontPanel extends React.PureComponent<FrontPanelProps, {}> {
    private ref: React.RefObject<HTMLObjectElement>;
    private svgRoot: SVGSVGElement | null = null;
    private lamps: Record<string, SVGSVGElement> = {};
    private switches: Record<string, SVGSVGElement> = {};

    constructor(props: FrontPanelProps) {
        super(props);
        this.ref = React.createRef<HTMLObjectElement>();
    }

    public render(): JSX.Element {
        return <object ref={this.ref} type="image/svg+xml" data={require('public/img/front_panel.svg')}></object>;
    }

    public componentDidMount(): void {
        let cons = this.ref.current;
        if (!cons) {
            return;
        }

        let objElem = cons;
        cons.addEventListener("load", () => {
            let doc = objElem.contentDocument;
            if (!doc) {
                return null;
            }

            this.svgRoot = (doc.documentElement as unknown) as SVGSVGElement;
            this.findElements(this.svgRoot);
            this.connectSwitches();
            this.forceUpdate();
        });
    }

    public componentDidUpdate(prevProps: Readonly<FrontPanelProps>): void {
        this.updateLamps(this.props.lamps);
        this.updateSwitches(this.props.switches);
    }

    private findElements(svg: SVGSVGElement) {
        let elems = svg.querySelectorAll('[id');
        elems.forEach(elem => {
            if (elem.id.startsWith('pdp8_lamp_')) {
                this.lamps[elem.id] = elem as SVGSVGElement;
            } else if (elem.id.startsWith('pdp8_sw_')) {
                this.switches[elem.id] = elem as SVGSVGElement;
            }
        });
    }

    private connectSwitches(): void {
        this.connectSwitch('pdp8_sw_df0');
        this.connectSwitch('pdp8_sw_df1');
        this.connectSwitch('pdp8_sw_df2');

        this.connectSwitch('pdp8_sw_if0');
        this.connectSwitch('pdp8_sw_if1');
        this.connectSwitch('pdp8_sw_if2');

        for (let i = 0; i < 12; i++) {
            this.connectSwitch('pdp8_sw_swr' + i);
        }

        this.connectMomentarySwitch('pdp8_sw_start');
        this.connectMomentarySwitch('pdp8_sw_load');
        this.connectMomentarySwitch('pdp8_sw_dep');
        this.connectMomentarySwitch('pdp8_sw_exam');
        this.connectMomentarySwitch('pdp8_sw_cont');
        this.connectMomentarySwitch('pdp8_sw_stop');
        this.connectSwitch('pdp8_sw_sing_step');
        this.connectSwitch('pdp8_sw_sing_inst');
    }

    private connectSwitch(id: string): void {
        let elem = this.switches[id];
        if (elem) {
            elem.onclick = () => {
                let curState = this.isSwitchSet(elem);
                this.props.onSwitch(id.replace('pdp8_sw_', ''), !curState);
            }
        }
    }

    private connectMomentarySwitch(id: string): void {
        let elem = this.switches[id];
        if (elem) {
            elem.onmousedown = () => {
                this.props.onSwitch(id.replace('pdp8_sw_', ''), true);
            }
        }
    }

    private updateLamps(lamps: LampBrightness) {
        this.setLampRow('pdp8_lamp_df', lamps.dataField);
        this.setLampRow('pdp8_lamp_if', lamps.instField);
        this.setLampRow('pdp8_lamp_pc', lamps.pc);
        this.setLampRow('pdp8_lamp_ma', lamps.memAddr);
        this.setLampRow('pdp8_lamp_mb', lamps.memBuf);
        this.setLamp('pdp8_lamp_link', lamps.link);
        this.setLampRow('pdp8_lamp_ac', lamps.ac);
        this.setLampRow('pdp8_lamp_mq', lamps.mqr);
        this.setLampRow('pdp8_lamp_sc', lamps.stepCounter);

        this.setLamp('pdp8_lamp_and', lamps.instruction[7]);
        this.setLamp('pdp8_lamp_tad', lamps.instruction[6]);
        this.setLamp('pdp8_lamp_isz', lamps.instruction[5]);
        this.setLamp('pdp8_lamp_dca', lamps.instruction[4]);
        this.setLamp('pdp8_lamp_jms', lamps.instruction[3]);
        this.setLamp('pdp8_lamp_jmp', lamps.instruction[2]);
        this.setLamp('pdp8_lamp_iot', lamps.instruction[1]);
        this.setLamp('pdp8_lamp_opr', lamps.instruction[0]);

        this.setLamp('pdp8_lamp_fetch', lamps.state[5]);
        this.setLamp('pdp8_lamp_execute', lamps.state[4]);
        this.setLamp('pdp8_lamp_defer', lamps.state[3]);
        this.setLamp('pdp8_lamp_word_count', lamps.state[2]);
        this.setLamp('pdp8_lamp_current_addr', lamps.state[1]);
        this.setLamp('pdp8_lamp_break', lamps.state[0]);

        this.setLamp('pdp8_lamp_ion', lamps.ion);
        this.setLamp('pdp8_lamp_pause', lamps.pause);
        this.setLamp('pdp8_lamp_run', lamps.run);
    }

    private updateSwitches(switches: SwitchState) {
        this.setSwitchRow('pdp8_sw_df', 3, switches.dataField);
        this.setSwitchRow('pdp8_sw_if', 3, switches.instField);
        this.setSwitchRow('pdp8_sw_swr', 12, switches.swr);

        this.setSwitch('pdp8_sw_start', switches.start != 0);
        this.setSwitch('pdp8_sw_load', switches.load != 0);
        this.setSwitch('pdp8_sw_dep', switches.dep != 0);
        this.setSwitch('pdp8_sw_exam', switches.exam != 0);
        this.setSwitch('pdp8_sw_cont', switches.cont != 0);
        this.setSwitch('pdp8_sw_stop', switches.stop != 0);
        this.setSwitch('pdp8_sw_sing_step', switches.singStep != 0);
        this.setSwitch('pdp8_sw_sing_inst', switches.singInst != 0);
    }

    private setLampRow(id: string, values: number[]): void {
        for (let i = 0; i < values.length; i++) {
            this.setLamp(id + i, values[i]);
        }
    }

    private setLamp(id: string, brightness: number): void {
        let elem = this.lamps[id];

        if (elem) {
            let fill: string;
            switch (brightness) {
                case 0:  fill = '#222222'; break;
                case 1:  fill = '#646001'; break;
                case 2:  fill = '#6d6801'; break;
                case 3:  fill = '#757001'; break;
                case 4:  fill = '#7e7901'; break;
                case 5:  fill = '#878101'; break;
                case 6:  fill = '#8f8901'; break;
                case 7:  fill = '#989202'; break;
                case 8:  fill = '#a19a02'; break;
                case 9:  fill = '#aaa302'; break;
                case 10: fill = '#b2ab02'; break;
                case 11: fill = '#bbb302'; break;
                case 12: fill = '#c4bc02'; break;
                case 13: fill = '#ccc402'; break;
                case 14: fill = '#d5cc02'; break;
                case 15: fill = '#dad103'; break;
                default: fill = 'red';
            }
            elem.style.fill = fill;
        }
    }

    private setSwitchRow(id: string, width: number, value: number): void {
        for (let i = 0; i < width; i++) {
            this.setSwitch(id + i, (value & (1 << (width - i - 1))) != 0);
        }
    }

    private getSwitchRotationIndex(sw: SVGSVGElement): number | null {
        let transformations = sw.transform.baseVal;
        for (let i = 0; i < transformations.numberOfItems; i++) {
            if (transformations.getItem(i).type == SVGTransform.SVG_TRANSFORM_ROTATE) {
                return i;
            }
        }
        return null;
    }

    private isSwitchSet(sw: SVGSVGElement): boolean {
        return (this.getSwitchRotationIndex(sw) != null);
    }

    private setSwitch(id: string, on: boolean): void {
        let elem = this.switches[id];
        if (!elem || !this.svgRoot) {
            return;
        }

        // find existing rotation, if any
        let rotationIndex = this.getSwitchRotationIndex(elem);

        if (on) {
            // nothing to do if rotation already present
            if (!rotationIndex) {
                let rect = elem.getBBox();
                let cx = rect.x + rect.width / 2;
                let cy = rect.y + rect.height / 2;

                let rot = this.svgRoot.createSVGTransform();
                rot.setRotate(180, cx, cy);
                elem.transform.baseVal.appendItem(rot);
                }
        } else {
            // nothing to do if no rotation present
            if (rotationIndex) {
                let transformations = elem.transform.baseVal;
                transformations.removeItem(rotationIndex);
            }
        }
    }
}
