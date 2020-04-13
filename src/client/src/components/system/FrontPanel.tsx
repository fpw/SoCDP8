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

import React from 'react';
import { LampBrightness, SwitchState } from '../../models/FrontPanelState';

export interface FrontPanelProps {
    lamps: LampBrightness;
    switches: SwitchState;
    onSwitch(sw: string, state: boolean): void;
}

export const FrontPanel: React.FunctionComponent<FrontPanelProps> = (props) => {
    const [svgRoot, setSVGRoot] = React.useState<SVGSVGElement|null>(null);
    const [lamps, setLamps] = React.useState<Record<string, SVGSVGElement>>({});
    const [switches, setSwitches] = React.useState<Record<string, SVGSVGElement>>({});
    const [isLoading, setIsLoading] = React.useState<boolean>(false);
    const ref = React.useRef<HTMLObjectElement>(null);

    function loadSVG(): void {
        const cons = ref.current;
        if (!cons) {
            return;
        }

        const objElem = cons;
        cons.addEventListener("load", () => {
            const doc = objElem.contentDocument;
            if (!doc) {
                return null;
            }

            const elem = (doc.documentElement as unknown) as SVGSVGElement;
            setSVGRoot(elem);

            const [foundLamps, foundSwitches] = findElements(elem);
            setLamps(foundLamps);
            setSwitches(foundSwitches);

            connectSwitches(foundSwitches, props);
        });

        setIsLoading(true);
    }

    React.useEffect(() => {
        if (!svgRoot) {
            if (!isLoading) {
                loadSVG();
            }
            return;
        }

        updateLamps(props.lamps, lamps);
        updateSwitches(props.switches, switches, svgRoot);
    });

    return <object ref={ref} type="image/svg+xml" data={require('public/img/front_panel.svg')}></object>;
};

function findElements(svg: SVGSVGElement): [Record<string, SVGSVGElement>, Record<string, SVGSVGElement>] {
    const lamps: Record<string, SVGSVGElement> = {};
    const switches: Record<string, SVGSVGElement> = {};

    const elems = svg.querySelectorAll('[id');
    elems.forEach(elem => {
        if (elem.id.startsWith('pdp8_lamp_')) {
            lamps[elem.id] = elem as SVGSVGElement;
        } else if (elem.id.startsWith('pdp8_sw_')) {
            switches[elem.id] = elem as SVGSVGElement;
        }
    });

    return [lamps, switches];
}

function connectSwitches(switches: Record<string, SVGSVGElement>, props: FrontPanelProps): void {
    connectSwitch('pdp8_sw_df0', switches, props);
    connectSwitch('pdp8_sw_df1', switches, props);
    connectSwitch('pdp8_sw_df2', switches, props);

    connectSwitch('pdp8_sw_if0', switches, props);
    connectSwitch('pdp8_sw_if1', switches, props);
    connectSwitch('pdp8_sw_if2', switches, props);

    for (let i = 0; i < 12; i++) {
        connectSwitch('pdp8_sw_swr' + i, switches, props);
    }

    connectMomentarySwitch('pdp8_sw_start', switches, props);
    connectMomentarySwitch('pdp8_sw_load', switches, props);
    connectMomentarySwitch('pdp8_sw_dep', switches, props);
    connectMomentarySwitch('pdp8_sw_exam', switches, props);
    connectMomentarySwitch('pdp8_sw_cont', switches, props);
    connectMomentarySwitch('pdp8_sw_stop', switches, props);
    connectSwitch('pdp8_sw_sing_step', switches, props);
    connectSwitch('pdp8_sw_sing_inst', switches, props);
}

function connectSwitch(id: string, switches: Record<string, SVGSVGElement>, props: FrontPanelProps): void {
    const elem = switches[id];
    if (elem) {
        elem.onclick = () => {
            const curState = isSwitchSet(elem);
            props.onSwitch(id.replace('pdp8_sw_', ''), !curState);
        }
    }
}

function connectMomentarySwitch(id: string, switches: Record<string, SVGSVGElement>, props: FrontPanelProps): void {
    const elem = switches[id];
    if (elem) {
        elem.onmousedown = () => {
            props.onSwitch(id.replace('pdp8_sw_', ''), true);
        }
    }
}

function updateLamps(brightness: LampBrightness, lamps: Record<string, SVGSVGElement>) {
    setLampRowBrightnesses('pdp8_lamp_df', brightness.dataField, lamps);
    setLampRowBrightnesses('pdp8_lamp_if', brightness.instField, lamps);
    setLampRowBrightnesses('pdp8_lamp_pc', brightness.pc, lamps);
    setLampRowBrightnesses('pdp8_lamp_ma', brightness.memAddr, lamps);
    setLampRowBrightnesses('pdp8_lamp_mb', brightness.memBuf, lamps);
    setLampBrightness('pdp8_lamp_link', brightness.link, lamps);
    setLampRowBrightnesses('pdp8_lamp_ac', brightness.ac, lamps);
    setLampRowBrightnesses('pdp8_lamp_mq', brightness.mqr, lamps);
    setLampRowBrightnesses('pdp8_lamp_sc', brightness.stepCounter, lamps);

    setLampBrightness('pdp8_lamp_and', brightness.instruction[7], lamps);
    setLampBrightness('pdp8_lamp_tad', brightness.instruction[6], lamps);
    setLampBrightness('pdp8_lamp_isz', brightness.instruction[5], lamps);
    setLampBrightness('pdp8_lamp_dca', brightness.instruction[4], lamps);
    setLampBrightness('pdp8_lamp_jms', brightness.instruction[3], lamps);
    setLampBrightness('pdp8_lamp_jmp', brightness.instruction[2], lamps);
    setLampBrightness('pdp8_lamp_iot', brightness.instruction[1], lamps);
    setLampBrightness('pdp8_lamp_opr', brightness.instruction[0], lamps);

    setLampBrightness('pdp8_lamp_fetch', brightness.state[5], lamps);
    setLampBrightness('pdp8_lamp_execute', brightness.state[4], lamps);
    setLampBrightness('pdp8_lamp_defer', brightness.state[3], lamps);
    setLampBrightness('pdp8_lamp_word_count', brightness.state[2], lamps);
    setLampBrightness('pdp8_lamp_current_addr', brightness.state[1], lamps);
    setLampBrightness('pdp8_lamp_break', brightness.state[0], lamps);

    setLampBrightness('pdp8_lamp_ion', brightness.ion, lamps);
    setLampBrightness('pdp8_lamp_pause', brightness.pause, lamps);
    setLampBrightness('pdp8_lamp_run', brightness.run, lamps);
}

function updateSwitches(states: SwitchState, switches: Record<string, SVGSVGElement>, svg: SVGSVGElement) {
    setSwitchRow('pdp8_sw_df', 3, states.dataField, switches, svg);
    setSwitchRow('pdp8_sw_if', 3, states.instField, switches, svg);
    setSwitchRow('pdp8_sw_swr', 12, states.swr, switches, svg);

    setSwitch('pdp8_sw_start', states.start != 0, switches, svg);
    setSwitch('pdp8_sw_load', states.load != 0, switches, svg);
    setSwitch('pdp8_sw_dep', states.dep != 0, switches, svg);
    setSwitch('pdp8_sw_exam', states.exam != 0, switches, svg);
    setSwitch('pdp8_sw_cont', states.cont != 0, switches, svg);
    setSwitch('pdp8_sw_stop', states.stop != 0, switches, svg);
    setSwitch('pdp8_sw_sing_step', states.singStep != 0, switches, svg);
    setSwitch('pdp8_sw_sing_inst', states.singInst != 0, switches, svg);
}

function setLampRowBrightnesses(id: string, values: number[], lamps: Record<string, SVGSVGElement>): void {
    for (let i = 0; i < values.length; i++) {
        setLampBrightness(id + i, values[i], lamps);
    }
}

function setLampBrightness(id: string, brightness: number, lamps: Record<string, SVGSVGElement>): void {
    const elem = lamps[id];

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

function setSwitchRow(id: string, width: number, value: number, switches: Record<string, SVGSVGElement>, svg: SVGSVGElement): void {
    for (let i = 0; i < width; i++) {
        setSwitch(id + i, (value & (1 << (width - i - 1))) != 0, switches, svg);
    }
}

function getSwitchRotationIndex(sw: SVGSVGElement): number | null {
    const transformations = sw.transform.baseVal;
    for (let i = 0; i < transformations.numberOfItems; i++) {
        if (transformations.getItem(i).type == SVGTransform.SVG_TRANSFORM_ROTATE) {
            return i;
        }
    }
    return null;
}

function isSwitchSet(sw: SVGSVGElement): boolean {
    return (getSwitchRotationIndex(sw) != null);
}

function setSwitch(id: string, on: boolean, switches: Record<string, SVGSVGElement>, svg: SVGSVGElement): void {
    const elem = switches[id];
    if (!elem) {
        return;
    }

    // find existing rotation, if any
    const rotationIndex = getSwitchRotationIndex(elem);

    if (on) {
        // nothing to do if rotation already present
        if (!rotationIndex) {
            const rect = elem.getBBox();
            const cx = rect.x + rect.width / 2;
            const cy = rect.y + rect.height / 2;

            const rot = svg.createSVGTransform();
            rot.setRotate(180, cx, cy);
            elem.transform.baseVal.appendItem(rot);
            }
    } else {
        // nothing to do if no rotation present
        if (rotationIndex) {
            const transformations = elem.transform.baseVal;
            transformations.removeItem(rotationIndex);
        }
    }
}
