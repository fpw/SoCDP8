import * as React from "react";
import { number } from "prop-types";

export interface LEDState {
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
    leds: LEDState;
    switches: SwitchState;
}

export class PDP8Console extends React.Component<PDP8ConsoleProps> {
    public render() {
        let cons = document.getElementById('console') as HTMLEmbedElement;
        let svg = cons.getSVGDocument();
        if (!svg) {
            return [];
        }
        this.setLEDRow(svg, 'led_df', 3, this.props.leds.dataField);
        this.setLEDRow(svg, 'led_if', 3, this.props.leds.instField);
        this.setLEDRow(svg, 'led_pc', 12, this.props.leds.pc);
        this.setLEDRow(svg, 'led_ma', 12, this.props.leds.memAddr);
        this.setLEDRow(svg, 'led_mb', 12, this.props.leds.memBuf);
        this.setLED(svg, 'led_link', this.props.leds.link != 0);
        this.setLEDRow(svg, 'led_ac', 12, this.props.leds.ac);
        this.setLEDRow(svg, 'led_mq', 12, this.props.leds.mqr);
        this.setLEDRow(svg, 'led_sc', 5, this.props.leds.stepCounter);

        this.setLED(svg, 'led_and', (this.props.leds.instruction & (1 << 0)) != 0);
        this.setLED(svg, 'led_tad', (this.props.leds.instruction & (1 << 1)) != 0);
        this.setLED(svg, 'led_isz', (this.props.leds.instruction & (1 << 2)) != 0);
        this.setLED(svg, 'led_dca', (this.props.leds.instruction & (1 << 3)) != 0);
        this.setLED(svg, 'led_jms', (this.props.leds.instruction & (1 << 4)) != 0);
        this.setLED(svg, 'led_jmp', (this.props.leds.instruction & (1 << 5)) != 0);
        this.setLED(svg, 'led_iot', (this.props.leds.instruction & (1 << 6)) != 0);
        this.setLED(svg, 'led_opr', (this.props.leds.instruction & (1 << 7)) != 0);

        this.setLED(svg, 'led_fetch', (this.props.leds.state & (1 << 0)) != 0);
        this.setLED(svg, 'led_execute', (this.props.leds.state & (1 << 1)) != 0);
        this.setLED(svg, 'led_defer', (this.props.leds.state & (1 << 2)) != 0);
        this.setLED(svg, 'led_word_count', (this.props.leds.state & (1 << 3)) != 0);
        this.setLED(svg, 'led_current_addr', (this.props.leds.state & (1 << 4)) != 0);
        this.setLED(svg, 'led_break', (this.props.leds.state & (1 << 5)) != 0);

        this.setLED(svg, 'led_ion', this.props.leds.ion != 0);
        this.setLED(svg, 'led_pause', this.props.leds.pause != 0);
        this.setLED(svg, 'led_run', this.props.leds.run != 0);
        return [];
    }

    private setLEDRow(svg: Document, id: string, width: number, value: number) {
        for (let i = 0; i < width; i++) {
            this.setLED(svg, id + i, (value & (1 << (width - i - 1))) != 0);
        }
    }

    private setLED(svg: Document, id: string, value: boolean) {
        let elem = svg.getElementById(id);
        if (elem) {
            elem.style.fill = (value ? 'yellow' : 'black');
        }
    }
}
