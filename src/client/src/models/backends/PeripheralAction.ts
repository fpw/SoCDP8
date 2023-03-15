import { DeviceID } from "../../types/PeripheralTypes";
import { TapeState } from "../DECTape";

export type PeripheralOutAction =
    KeyPressAction | TapeSetAction | ReaderStateAction |
    LoadTapeAction;

export interface KeyPressAction {
    type: "key-press";
    key: number;
}

export interface TapeSetAction {
    type: "reader-tape-set";
    tapeData: Uint8Array;
}

export interface ReaderStateAction {
    type: "reader-set-active";
    active: boolean;
}

export interface LoadTapeAction {
    type: "load-tape";
    unit: number;
    data: Uint8Array;
}

export type PeripheralInAction =
    ActiveStateChangeAction | StateListChangeAction |
    ReaderPosAction | PunchAction |
    TapeStatusAction;

export interface ReaderPosAction {
    type: "readerPos",
    pos: number;
}

export interface PunchAction {
    type: "punch",
    char: number;
}

export interface TapeStatusAction {
    type: "tapeStates",
    states: TapeState[];
}

export interface ActiveStateChangeAction {
    type: "active-state-changed";
}

export interface StateListChangeAction {
    type: "state-list-changed";
}
