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
import { RF08Configuration } from '../../types/PeripheralTypes';

export class RF08Model extends PeripheralModel {
    constructor(socket: SocketIOClient.Socket, private conf: RF08Configuration) {
        super(socket);
    }

    public get connections(): number[] {
        return [0o60, 0o61, 0o62, 0o64];
    }

    public get config(): RF08Configuration {
        return this.conf;
    }

    public onPeripheralAction(action: string, data: any): void {
    }

    public async readBlock(block: number): Promise<Uint16Array> {
        return new Promise<Uint16Array>(accept => {
            this.socket.emit('read-disk-block', this.conf.id, block, (res: Uint16Array) => {
                accept(res);
            });
        });
    }
}
