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

import { FormControlLabel, FormGroup, MenuItem, Select, Switch } from "@mui/material";
import { PT08Model } from "../../../models/peripherals/PT08Model";
import { BaudRate, BAUD_RATES, PT08Style } from "../../../types/PeripheralTypes";
import { ASR33 } from "./accessoires/ASR33";
import { VT100 } from "./accessoires/VT100";

export function PT08(props: {model: PT08Model}) {
    const style = props.model.useState(state => state.conf!.style);

    return (
        <>
            <ConfigBox model={props.model} />
            { style == PT08Style.ASR33 && <ASR33 model={props.model} /> }
            { style == PT08Style.VT100 && <VT100 model={props.model} /> }
        </>
    );
}

function ConfigBox(props: {model: PT08Model}) {
    const { model } = props;
    const conf = model.useState(state => state.conf!);

    return (
        <FormGroup row>
            <FormControlLabel
                control={
                    <Select
                        size="small"
                        value={conf.baudRate}
                        onChange={(evt) => {
                            const rate = Number.parseInt(evt.target.value as string) as BaudRate;
                            void model.updateConfig({...conf, baudRate: rate});
                        }}
                    >
                        {BAUD_RATES.map((b) => (
                            <MenuItem key={b} value={b}>{b}</MenuItem>
                        ))}
                    </Select>
                }
                label="Baud Rate"
            />

            <FormControlLabel
                control={
                    <Switch
                        checked={conf.eightBit}
                        onChange={(evt) => {
                            const bit8 = evt.target.checked;
                            void model.updateConfig({...conf, eightBit: bit8});
                        }}
                    />
                }
                label="Set 8th bit"
            />
            <FormControlLabel
                control={
                    <Switch
                        checked={conf.autoCaps}
                        onChange={(evt) => {
                            const caps = evt.target.checked;
                            void model.updateConfig({...conf, autoCaps: caps});
                        }}
                    />
                }
                label="Auto Caps"
            />
            <FormControlLabel
                control={
                    <Select size="small" value={conf.style}
                        onChange={ev => {
                            const style = ev.target.value as PT08Style;
                            void model.updateConfig({...conf, style});
                        }}
                    >
                        { Object.entries(PT08Style).map(([key, val]) =>
                            <MenuItem key={key} value={val}>{val}</MenuItem>
                        )}
                    </Select>
                }
                label="Style"
            />
        </FormGroup>
    );
}
