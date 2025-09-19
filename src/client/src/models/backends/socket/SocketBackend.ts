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

import { io, Socket } from "socket.io-client";
import { ConsoleState } from "../../../types/ConsoleTypes";
import { DeviceID, PeripheralConfiguration } from "../../../types/PeripheralTypes";
import { SystemConfiguration } from "../../../types/SystemConfiguration";
import { Backend } from "../Backend";
import { BackendListener } from "../BackendListener";
import { PeripheralInAction, PeripheralOutAction } from "../../../types/PeripheralAction";

export class SocketBackend implements Backend {
    private socket: Socket;

    public constructor(url: string) {
        if (url.length > 0) {
            this.socket = io(url, { autoConnect: false });
        } else {
            this.socket = io({ autoConnect: false });
        }
    }

    public async connect(listener: BackendListener) {
        this.socket.on("disconnect", () => {
            listener.onDisconnect();
        });

        this.socket.on("console-state", (state: ConsoleState) => {
            listener.onConsoleState(state);
        });

        this.socket.on("peripheral-event", (data: { id: number, action: PeripheralInAction }) => {
            const id = data.id;
            const action = data.action;
            listener.onPeripheralEvent(id, action);
        });

        this.socket.on("state", (action: PeripheralInAction) => {
            listener.onStateChange(action);
        });

        return new Promise<void>(resolve => {
            this.socket.on("connect", () => {
                listener.onConnect().then(() => resolve()).catch((e: unknown) => console.error(e));
            });
            this.socket.connect();
        });
    }

    public async readActiveSystem(): Promise<SystemConfiguration> {
        return new Promise<SystemConfiguration>((accept, reject) => {
            this.socket.emit("active-system", (sys: SystemConfiguration) => {
                accept(sys);
            });
        });
    }

    public async saveActiveSystem(): Promise<boolean> {
        return new Promise<boolean>((accept, reject) => {
            this.socket.emit("save-active-system", (res: boolean) => {
                accept(res);
            });
        });
    }

    public async readSystems(): Promise<SystemConfiguration[]> {
        return new Promise<SystemConfiguration[]>((accept, reject) => {
            this.socket.emit("system-list", (list: SystemConfiguration[]) => {
                accept(list);
            });
        });
    }

    public async createSystem(system: SystemConfiguration) {
        return new Promise<void>((accept, reject) => {
            this.socket.emit("create-system", system, (res: boolean) => {
                if (res) {
                    accept();
                } else {
                    reject(Error("Couldn't create system"));
                }
            });
        });
    }

    public async setActiveSystem(id: string) {
        return new Promise<void>((accept, reject) => {
            this.socket.emit("set-active-system", id, (res: boolean) => {
                if (res) {
                    accept();
                } else {
                    reject(Error("Couldn't activate system"));
                }
            });
        });
    }

    public async deleteSystem(id: string) {
        return new Promise<void>((accept, reject) => {
            this.socket.emit("delete-system", id, (res: boolean) => {
                if (res) {
                    accept();
                } else {
                    reject(Error("Couldn't delete system"));
                }
            });
        });
    }

    public async setThrottleControl(control: boolean): Promise<void> {
        // no effect
    }

    public async setPanelSwitch(sw: string, state: boolean): Promise<void> {
        this.socket.emit("console-switch", { "switch": sw, "state": state });
    }

    public async clearCore() {
        this.socket.emit("core", { action: "clear" });
    }

    public async writeCore(addr: number, fragment: number[]) {
        this.socket.emit("core", {
            action: "write",
            addr: addr,
            fragment: fragment
        });
    }

    public async sendPeripheralAction(id: DeviceID, action: PeripheralOutAction): Promise<void> {
        this.socket.emit("peripheral-action", {
            id: id,
            action: action,
        });
    }

    public async changePeripheralConfig(id: DeviceID, config: PeripheralConfiguration): Promise<void> {
        this.socket.emit("peripheral-change-conf", {
            id: id,
            config: config,
        });
    }
}
