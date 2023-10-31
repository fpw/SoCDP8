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
        const blob = new Blob([Uint8Array.from(data)], {type: "application/octet-stream"});
        const reader = new FileReader();
        reader.onload = (evt) => {
            if (evt.target?.result) {
                resolve(evt.target.result as string);
            } else {
                reject("Invalid data");
            }
        };
        reader.readAsDataURL(blob);
    });

    try {
        const dataURI = await convert();
        const link = document.createElement("a");
        link.setAttribute("href", dataURI);
        link.setAttribute("download", name);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    } catch (e) {
        alert(e);
    }
}

export async function loadFile(file: File): Promise<Uint8Array> {
    return new Promise<Uint8Array>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
            const data = reader.result as ArrayBuffer;
            resolve(new Uint8Array(data));
        };
        reader.onerror = () => {
            reject();
        }
        reader.readAsArrayBuffer(file);
    });
}

// https://stackoverflow.com/questions/105034/how-do-i-create-a-guid-uuid/8809472#8809472
export function generateUUID() {
    // Timestsamp
    let d = new Date().getTime();

    //Time in microseconds since page-load or 0 if unsupported
    let d2 = ((typeof performance !== "undefined") && performance.now && (performance.now() * 1000)) || 0;

    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, c => {
        let r = Math.random() * 16;//random number between 0 and 16
        if (d > 0) { //Use timestamp until depleted
            r = (d + r) % 16 | 0;
            d = Math.floor(d / 16);
        } else { //Use microseconds since page-load if supported
            r = (d2 + r) % 16 | 0;
            d2 = Math.floor(d2 / 16);
        }
        return (c === "x" ? r : ((r & 0x3) | 0x8)).toString(16);
    });
}

export function numToOctal(num: number, width: number): string {
    return num.toString(8).padStart(width, "0");
}
