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

import { useCallback, useEffect, useState } from "react";
import { SoCDP8 } from "../../../models/SoCDP8";
import { LampBrightness, SwitchState } from "../../../types/ConsoleTypes";

type OnSwitch = (sw: string, state: boolean) => void;

export interface FrontPanelProps {
    pdp8: SoCDP8,
}

export function FrontPanel(props: FrontPanelProps) {
    const [svgRoot, setSVGRoot] = useState<SVGSVGElement>();
    const [lamps, setLamps] = useState<Record<string, SVGSVGElement>>({});
    const [switches, setSwitches] = useState<Record<string, SVGSVGElement>>({});

    const svgRef = useCallback((elem: HTMLObjectElement) => {
        if (!elem) {
            return;
        }

        const objElem = elem;
        elem.addEventListener("load", () => {
            const doc = objElem.contentDocument;
            if (!doc) {
                return null;
            }

            const elem = (doc.documentElement as unknown) as SVGSVGElement;
            setSVGRoot(elem);

            const [foundLamps, foundSwitches] = findElements(elem);
            setLamps(foundLamps);
            setSwitches(foundSwitches);

            connectSwitches(foundSwitches, (sw, state) => void props.pdp8.setPanelSwitch(sw, state));
        });
    }, [props.pdp8]);

    useEffect(() => props.pdp8.useStore.subscribe(state => {
        if (!state.frontPanel || !svgRoot) {
            return;
        }
        updateLamps(state.frontPanel.lamps, lamps);
        updateSwitches(state.frontPanel.switches, switches, svgRoot);
    }), [lamps, switches, svgRoot, props.pdp8]);

    return <object ref={svgRef} type="image/svg+xml" data="/img/front_panel.svg">PDP-8/I Panel</object>;
};

function findElements(svg: SVGSVGElement): [Record<string, SVGSVGElement>, Record<string, SVGSVGElement>] {
    const lamps: Record<string, SVGSVGElement> = {};
    const switches: Record<string, SVGSVGElement> = {};

    const elems = svg.querySelectorAll("[id");
    elems.forEach(elem => {
        if (elem.id.startsWith("pdp8_lamp_")) {
            lamps[elem.id] = elem as SVGSVGElement;
        } else if (elem.id.startsWith("pdp8_sw_")) {
            switches[elem.id] = elem as SVGSVGElement;
        }
    });

    return [lamps, switches];
}

function connectSwitches(switches: Record<string, SVGSVGElement>, onSwitch: OnSwitch): void {
    connectSwitch("pdp8_sw_df0", switches, onSwitch);
    connectSwitch("pdp8_sw_df1", switches, onSwitch);
    connectSwitch("pdp8_sw_df2", switches, onSwitch);

    connectSwitch("pdp8_sw_if0", switches, onSwitch);
    connectSwitch("pdp8_sw_if1", switches, onSwitch);
    connectSwitch("pdp8_sw_if2", switches, onSwitch);

    for (let i = 0; i < 12; i++) {
        connectSwitch(`pdp8_sw_swr${i}`, switches, onSwitch);
    }

    connectMomentarySwitch("pdp8_sw_start", switches, onSwitch);
    connectMomentarySwitch("pdp8_sw_load", switches, onSwitch);
    connectMomentarySwitch("pdp8_sw_dep", switches, onSwitch);
    connectMomentarySwitch("pdp8_sw_exam", switches, onSwitch);
    connectMomentarySwitch("pdp8_sw_cont", switches, onSwitch);
    connectMomentarySwitch("pdp8_sw_stop", switches, onSwitch);
    connectSwitch("pdp8_sw_sing_step", switches, onSwitch);
    connectSwitch("pdp8_sw_sing_inst", switches, onSwitch);
}

function connectSwitch(id: string, switches: Record<string, SVGSVGElement>, onSwitch: OnSwitch): void {
    const elem = switches[id];
    if (elem) {
        elem.onclick = () => {
            const curState = isSwitchSet(elem);
            onSwitch(id.replace("pdp8_sw_", ""), !curState);
        }
    }
}

function connectMomentarySwitch(id: string, switches: Record<string, SVGSVGElement>, onSwitch: OnSwitch): void {
    const elem = switches[id];
    if (elem) {
        elem.onmousedown = () => {
            onSwitch(id.replace("pdp8_sw_", ""), true);
        }
    }
}

function updateLamps(brightness: LampBrightness, lamps: Record<string, SVGSVGElement>) {
    setLampRowBrightnesses("pdp8_lamp_df", brightness.dataField, lamps);
    setLampRowBrightnesses("pdp8_lamp_if", brightness.instField, lamps);
    setLampRowBrightnesses("pdp8_lamp_pc", brightness.pc, lamps);
    setLampRowBrightnesses("pdp8_lamp_ma", brightness.memAddr, lamps);
    setLampRowBrightnesses("pdp8_lamp_mb", brightness.memBuf, lamps);
    setLampBrightness("pdp8_lamp_link", brightness.link, lamps);
    setLampRowBrightnesses("pdp8_lamp_ac", brightness.ac, lamps);
    setLampRowBrightnesses("pdp8_lamp_mq", brightness.mqr, lamps);
    setLampRowBrightnesses("pdp8_lamp_sc", brightness.stepCounter, lamps);

    setLampBrightness("pdp8_lamp_and", brightness.instruction[7], lamps);
    setLampBrightness("pdp8_lamp_tad", brightness.instruction[6], lamps);
    setLampBrightness("pdp8_lamp_isz", brightness.instruction[5], lamps);
    setLampBrightness("pdp8_lamp_dca", brightness.instruction[4], lamps);
    setLampBrightness("pdp8_lamp_jms", brightness.instruction[3], lamps);
    setLampBrightness("pdp8_lamp_jmp", brightness.instruction[2], lamps);
    setLampBrightness("pdp8_lamp_iot", brightness.instruction[1], lamps);
    setLampBrightness("pdp8_lamp_opr", brightness.instruction[0], lamps);

    setLampBrightness("pdp8_lamp_fetch", brightness.state[5], lamps);
    setLampBrightness("pdp8_lamp_execute", brightness.state[4], lamps);
    setLampBrightness("pdp8_lamp_defer", brightness.state[3], lamps);
    setLampBrightness("pdp8_lamp_word_count", brightness.state[2], lamps);
    setLampBrightness("pdp8_lamp_current_addr", brightness.state[1], lamps);
    setLampBrightness("pdp8_lamp_break", brightness.state[0], lamps);

    setLampBrightness("pdp8_lamp_ion", brightness.ion, lamps);
    setLampBrightness("pdp8_lamp_pause", brightness.pause, lamps);
    setLampBrightness("pdp8_lamp_run", brightness.run, lamps);
}

function updateSwitches(states: SwitchState, switches: Record<string, SVGSVGElement>, svg: SVGSVGElement) {
    setSwitchRow("pdp8_sw_df", 3, states.dataField, switches, svg);
    setSwitchRow("pdp8_sw_if", 3, states.instField, switches, svg);
    setSwitchRow("pdp8_sw_swr", 12, states.swr, switches, svg);

    setSwitch("pdp8_sw_start", states.start != 0, switches, svg);
    setSwitch("pdp8_sw_load", states.load != 0, switches, svg);
    setSwitch("pdp8_sw_dep", states.dep != 0, switches, svg);
    setSwitch("pdp8_sw_exam", states.exam != 0, switches, svg);
    setSwitch("pdp8_sw_cont", states.cont != 0, switches, svg);
    setSwitch("pdp8_sw_stop", states.stop != 0, switches, svg);
    setSwitch("pdp8_sw_sing_step", states.singStep != 0, switches, svg);
    setSwitch("pdp8_sw_sing_inst", states.singInst != 0, switches, svg);
}

function setLampRowBrightnesses(id: string, values: number[], lamps: Record<string, SVGSVGElement>): void {
    for (let i = 0; i < values.length; i++) {
        setLampBrightness(`${id}${i}`, values[i], lamps);
    }
}

function setLampBrightness(id: string, brightness: number, lamps: Record<string, SVGSVGElement>): void {
    const elem = lamps[id];

    const fromR = 0x22;
    const fromG = 0x22;
    const fromB = 0x22;

    const toR = 0xDA;
    const toG = 0xD1;
    const toB = 0x03;

    const f = brightness / 15;
    const grad = f;

    const r = fromR + grad * (toR - fromR);
    const g = fromG + grad * (toG - fromG);
    const b = fromB + grad * (toB - fromB);

    elem.style.fill = `rgb(${r}, ${g}, ${b})`;
}

function setSwitchRow(id: string, width: number, value: number, switches: Record<string, SVGSVGElement>, svg: SVGSVGElement): void {
    for (let i = 0; i < width; i++) {
        setSwitch(`${id}${i}`, (value & (1 << (width - i - 1))) != 0, switches, svg);
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
