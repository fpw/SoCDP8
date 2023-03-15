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

import { PeripheralModel } from "./PeripheralModel";
import { DeviceID, RK8Configuration } from "../../types/PeripheralTypes";
import { Backend } from "../backends/Backend";
import { PeripheralInAction } from "../../types/PeripheralAction";

export class RK8Model extends PeripheralModel {
    constructor(backend: Backend, private conf: RK8Configuration) {
        super(backend);
    }

    public get connections(): number[] {
        return [0o73, 0o74, 0o75];
    }

    public get id() {
        return this.conf.id;
    }

    public onPeripheralAction(id: DeviceID, action: PeripheralInAction) {
    }
}
