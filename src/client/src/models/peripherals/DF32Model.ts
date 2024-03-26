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
import { DeviceID, DF32Configuration, PeripheralConfiguration } from "../../types/PeripheralTypes";
import { Backend } from "../backends/Backend";
import { DiskModel } from "./DiskModel";
import { DumpMixin } from "./DumpMixin";
import { PeripheralModel } from "./PeripheralModel";

export class DF32Model extends PeripheralModel implements DiskModel {
    private dumpHandler: DumpMixin;

    constructor(backend: Backend, private conf: DF32Configuration) {
        super(backend);
        this.dumpHandler = new DumpMixin(backend, conf.id);
    }

    public get id() {
        return this.conf.id;
    }

    public get connections(): number[] {
        return [0o60, 0o61, 0o62, 0o63];
    }

    public getDumpExtension(): string {
        return "df32";
    }

    public getDiskCount(): number {
        return 4;
    }

    public getDiskSize(): number {
        return 65536;
    }

    public onPeripheralAction(id: DeviceID, action: PeripheralInAction) {
        this.dumpHandler.onPeripheralAction(id, action);
    }

    public async downloadDump(unit: number): Promise<Uint8Array> {
        return await this.dumpHandler.downloadDump(unit);
    }

    public async uploadDump(unit: number, dump: Uint8Array) {
        await this.dumpHandler.uploadDump(unit, dump);
    }

    public async saveState(): Promise<{ config: PeripheralConfiguration, data: Map<string, Uint8Array> }> {
        const dumps = new Map<string, Uint8Array>();
        for (let i = 0; i < this.getDiskSize(); i++) {
            const name = `dump${i + 1}.${this.getDumpExtension()}`;
            const dump = await this.downloadDump(i);
            dumps.set(name, dump);
        }
        return { config: this.conf, data: dumps };
    }
}
