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

 export async function downloadData(data: Uint8Array, name: string): Promise<void> {
    const convert = () => new Promise<string>((resolve, reject) => {
        const blob = new Blob([Uint8Array.from(data)], {type: 'application/octet-stream'});
        const reader = new FileReader();
        reader.onload = (evt) => {
            if (evt.target && evt.target.result) {
                resolve(evt.target.result as string);
            } else {
                reject('Invalid data');
            }
        };
        reader.readAsDataURL(blob);
    });

    try {
        const dataURI = await convert();
        const link = document.createElement('a');
        link.setAttribute('href', dataURI);
        link.setAttribute('download', name);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    } catch (e) {
        alert(e);
    }
}
