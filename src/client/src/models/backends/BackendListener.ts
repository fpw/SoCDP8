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

import { ConsoleState } from "../../types/ConsoleTypes";
import { DeviceID } from "../../types/PeripheralTypes";
import { PeripheralInAction } from "../../types/PeripheralAction";

export interface BackendListener {
    onConnect(): Promise<void>;
    onDisconnect(): void;
    onConsoleState(state: ConsoleState): void;
    onPeripheralEvent(id: DeviceID, action: PeripheralInAction): void;
    onPerformanceReport(simSpeed: number): void;
    onStateChange(action: PeripheralInAction): void;
}
