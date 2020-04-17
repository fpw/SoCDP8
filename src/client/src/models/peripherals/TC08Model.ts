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
import { peripheralConfToName, TC08Configuration } from '../../types/PeripheralTypes';

export class TC08Model extends PeripheralModel {
    constructor(socket: SocketIOClient.Socket, private conf: TC08Configuration) {
        super(socket);
    }

    public get connections(): number[] {
        return [0o76, 0o77];
    }

    public onPeripheralAction(action: string, data: any): void {
    }

    public readonly loadTape = async (tape: File, unit: number): Promise<void> => {
        let data = await this.loadFile(tape);
        this.socket.emit('peripheral-action', {
            peripheral: peripheralConfToName(this.conf),
            action: 'load-tape',
            data: {
                unit: unit,
                tapeData: data
            }
        });
    }
}
