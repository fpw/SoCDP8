import * as React from "react";
import * as ReactDOM from "react-dom";
import { PDP8Console, LEDState, SwitchState } from './components/PDP8Console/PDP8Console';

let leds: LEDState = {
    dataField: 1,
    instField: 3,
    pc: 0o1234,
    memAddr: 0o456,
    memBuf: 0o776,
    link: 1,
    ac: 0o7461,
    stepCounter: 0o21,
    mqr: 0o1321,
    instruction: 1,
    state: 4,
    ion: 0,
    pause: 0,
    run: 1,
}

let switches: SwitchState = {
    dataField: 0,
    instField: 0,
    swr: 0,
    start: 0,
    load: 0,
    dep: 0,
    exam: 0,
    cont: 0,
    stop: 0,
    singStep: 0,
    singInst: 0,
}

document.body.onload = function() {
    let cons = <PDP8Console leds={leds} switches={switches} />;
    ReactDOM.render(cons, document.getElementById("main"));
}
