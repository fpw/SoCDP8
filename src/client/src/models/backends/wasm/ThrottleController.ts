/*
 *   SoCDP8 - A PDP-8/I implementation on a SoC
 *   Copyright (C) 2021 Folke Will <folko@solhost.org>
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

const enum State {
    Uncontrolled,
    Measure,
    Control,
};

// TODO: This is a very simple controller, replace with a PID controller or something
export class ThrottleController {
    private control: (throttle: number) => void;
    private velocity = 1;
    private state = State.Uncontrolled;
    private history: number[] = [];

    public constructor(control: (throttle: number) => void) {
        this.control = control;
    }

    public setControl(doControl: boolean) {
        if (doControl) {
            if (this.history.length == 0) {
                this.state = State.Measure;
                this.velocity = 1.0;
                this.control(0);
            } else {
                this.state = State.Control;
                this.control(this.velocity);
            }
        } else {
            this.state = State.Uncontrolled;
            this.control(0);
        }
    }

    private controlVelocity(norm: number) {
        const throt = 100000 * norm;
        this.control(Math.max(1, throt));
    }

    public onPerformanceReport(performance: number) {
        // at current velocity, we're running at the current performance
        // -> to get 1.0 performance, we need velocity / performance
        if (performance == 0 || this.state == State.Uncontrolled) {
            return;
        }
        if (this.history.length == 5) {
            this.history.shift();
        }
        this.history.push(this.velocity / performance);
        const avg = this.history.reduce((a, x) => a + x, 0) / this.history.length;

        switch (this.state) {
            case State.Measure:
                if (this.history.length >= 3) {
                    this.state = State.Control;
                    this.velocity = avg;
                    this.controlVelocity(this.velocity);
                }
                break;
            case State.Control:
                this.velocity = avg;
                this.controlVelocity(this.velocity);
                break;
        }
    }
}
