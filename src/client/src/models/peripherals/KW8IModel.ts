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
import { DeviceID, KW8IConfiguration, PeripheralConfiguration } from "../../types/PeripheralTypes";
import { Backend } from "../backends/Backend";
import { PeripheralInAction } from "../../types/PeripheralAction";
import { create } from "zustand";
import { immer } from "zustand/middleware/immer";

interface KW8IStore {
    conf: KW8IConfiguration;

    setConf: (conf: KW8IConfiguration) => void;
    setSync: (sync: boolean) => void;
    set50Hz: (use50: boolean) => void;
}

export class KW8IModel extends PeripheralModel {
    private store = create<KW8IStore>()(immer(set => ({
        conf: { id: DeviceID.DEV_ID_KW8I, use50Hz: false, useExternalClock: true },
        setConf: (conf: KW8IConfiguration) => set(draft => {
            draft.conf = conf;
        }),
        setSync: (sync: boolean) => set(draft => {
            draft.conf.useExternalClock = sync;
        }),
        set50Hz: (use50: boolean) => set(draft => {
            draft.conf.use50Hz = use50;
        }),
    })));

    constructor(backend: Backend, conf: KW8IConfiguration) {
        super(backend);
        this.store.getState().setConf(conf);
        this.store.subscribe(state => {
            void this.backend.changePeripheralConfig(state.conf.id, state.conf);
        });
    }

    public get connections(): number[] {
        return [0o13];
    }

    private get config(): KW8IConfiguration {
        return this.store.getState().conf;
    }

    public get id() {
        return this.config.id;
    }

    public get useState() {
        return this.store;
    }

    public onPeripheralAction(id: DeviceID, action: PeripheralInAction) {
    }

    public async saveState(): Promise<{ config: PeripheralConfiguration, data: Map<string, Uint8Array> }> {
        return { config: this.store.getState().conf, data: new Map() };
    }
}
