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

import { PeripheralInAction } from "../../types/PeripheralAction";
import { DeviceID } from "../../types/PeripheralTypes";
import { Backend } from "../backends/Backend";

export class DumpMixin {
    private dumpAcceptor?: (dump: Uint8Array) => void;

    public constructor(private backend: Backend, private devId: DeviceID) {
    }

    public onPeripheralAction(id: DeviceID, action: PeripheralInAction) {
        if (action.type == "dump-data") {
            if (this.dumpAcceptor) {
                this.dumpAcceptor(action.dump);
                this.dumpAcceptor = undefined;
            }
        }
    }

    public async downloadDump(unit: number): Promise<Uint8Array> {
        return new Promise<Uint8Array>(accept => {
            this.dumpAcceptor = accept;
            void this.backend.sendPeripheralAction(this.devId, {type: "download-disk", unit});
        });
    }

    public async uploadDump(unit: number, data: Uint8Array) {
        await this.backend.sendPeripheralAction(this.devId, {
            type: "upload-disk",
            data,
            unit,
        });
    }
}
