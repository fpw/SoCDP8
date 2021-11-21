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

import { PeripheralModel } from './PeripheralModel';
import { TC08Configuration } from '../../types/PeripheralTypes';
import { DECTape } from '../DECTape';
import { action, makeObservable, observable } from 'mobx';
import { Backend } from '../backends/Backend';

export class TC08Model extends PeripheralModel {
    private tapes: DECTape[] = [];

    constructor(backend: Backend, private conf: TC08Configuration) {
        super(backend);
        makeObservable<TC08Model, "tapes">(this, {
            tapes: observable,
            onPeripheralAction: action,
        })
    }

    public get connections(): number[] {
        return [0o76, 0o77];
    }

    public get config(): TC08Configuration {
        return this.conf;
    }

    public onPeripheralAction(action: string, data: any): void {
        if (action != 'status') {
            return;
        }

        this.tapes = [];

        for (const state of (data.data as any[])) {
            const tape: DECTape = {
                name: '',
                address: state.address,
                selected: state.selected,
                moving: state.moving,
                reverse: state.reverse,
                writing: state.writing,
                normalizedPosition: state.normalizedPosition,
            };

            this.tapes[tape.address] = tape;
        }
    }

    public getTape(idx: number): DECTape | undefined {
        if (idx < this.tapes.length) {
            return this.tapes[idx];
        } else {
            return undefined;
        }
    }

    public readonly loadTape = async (tape: File, unit: number): Promise<void> => {
        let data = await this.loadFile(tape);
        this.backend.sendPeripheralAction(this.conf.id, "load-tape", {
            unit: unit,
            tapeData: data
        });
    }
}
