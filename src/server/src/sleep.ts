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

import { promisify } from 'util';

export async function sleepMs(ms: number): Promise<void> {
    const sleepFunc = promisify(setTimeout);
    await sleepFunc(ms);
}

// Node has no way to sleep less than a millisecond - however, we sometimes need a way to sleep
// a short duration less than a millisecond. The actual delay is not important, but it has to be
// less than a milli so this is some hackery that achieves this.
export async function sleepUs(us: number): Promise<void> {
    const endAt = process.hrtime.bigint() + BigInt(us) * 1000n;

    // sleep away all milliseconds, if any
    if (us > 1000) {
        await sleepMs(Math.floor(us / 1000));
    }

    const keepWaiting = (resolve: () => void) => {
        setImmediate(() => {
            const now = process.hrtime.bigint();
            if (now >= endAt) {
                resolve();
            } else {
                keepWaiting(resolve);
            }
        });
    };

    return new Promise(resolve => keepWaiting(resolve));
}
