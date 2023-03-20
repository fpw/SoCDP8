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

import { DeviceID, PeripheralConfiguration } from "../../types/PeripheralTypes";
import { SystemConfiguration } from "../../types/SystemConfiguration";
import { BackendListener } from "./BackendListener";
import { PeripheralOutAction } from "../../types/PeripheralAction";

export interface Backend {
    connect(listener: BackendListener): Promise<void>;

    readActiveSystem(): Promise<SystemConfiguration>;
    saveActiveSystem(): Promise<boolean>;
    readSystems(): Promise<SystemConfiguration[]>;
    setActiveSystem(id: string): Promise<void>;
    deleteSystem(id: string): Promise<void>;
    createSystem(state: SystemConfiguration): Promise<void>;

    setPanelSwitch(sw: string, state: boolean): Promise<void>;
    setThrottleControl(control: boolean): Promise<void>;

    clearCore(): Promise<void>;
    writeCore(addr: number, fragment: number[]): Promise<void>;

    sendPeripheralAction(id: DeviceID, action: PeripheralOutAction): Promise<void>;
    changePeripheralConfig(id: DeviceID, config: PeripheralConfiguration): Promise<void>;
}
