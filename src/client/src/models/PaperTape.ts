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
import { create } from "zustand";
import { immer } from "zustand/middleware/immer";

export interface PaperState {
    name: string;
    buffer: number[];
    pos: number;
}

interface PaperStore {
    tapeState: PaperState;
    setPaperState: (newState: PaperState) => void;
    setPos: (newPos: number) => void;
    pushChar: (c: number) => void;
    clear: () => void;
}

export class PaperTape {
    private store = create<PaperStore>()(immer(set => ({
        tapeState: {
            name: "",
            buffer: [],
            pos: 0,
        },
        setPaperState: (newState: PaperState) => set(draft => {
            draft.tapeState = newState;
        }),
        setPos: (newPos: number) => set(draft => {
            draft.tapeState.pos = newPos;
        }),
        pushChar: (c: number) => set(draft => {
            draft.tapeState.buffer.push(c);
        }),
        clear: () => set(draft => {
            draft.tapeState.buffer = [];
            draft.tapeState.pos = 0;
            draft.tapeState.name = "";
        }),
    })));

    public get useTape() {
        return this.store;
    }

    static async fromFile(file: File): Promise<PaperTape> {
        return new Promise<PaperTape>((resolve, reject) => {
            const tape = new PaperTape();

            const reader = new FileReader();
            reader.onload = () => {
                const buffer = Array.from(new Uint8Array(reader.result as ArrayBuffer));
                tape.useTape.getState().setPaperState({buffer, name: file.name, pos: 0});
                resolve(tape);
            };
            reader.onerror = () => {
                reject();
            }

            reader.readAsArrayBuffer(file);
        });
    }
}
