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

import { Box, FormControl, FormControlLabel, FormGroup, FormLabel, MenuItem, Select, Switch } from "@mui/material";
import "react-simple-keyboard/build/css/index.css";
import "xterm/css/xterm.css";
import { PT08Model } from "../../../models/peripherals/PT08Model";
import { BaudRate, BAUD_RATES } from "../../../types/PeripheralTypes";
import { ASR33 } from "./accessoires/ASR33";

export function PT08(props: {model: PT08Model}) {
    return (
        <section>
            <ConfigBox {...props} />
            <ASR33 model={props.model} />
        </section>
    );
}

function ConfigBox(props: {model: PT08Model}) {
    const { model } = props;
    const conf = model.useState(state => state.conf!);

    return (<Box>
        <FormGroup row>
            <FormControl>
                <FormLabel component="legend">Baud Rate</FormLabel>
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
            </FormControl>

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
                labelPlacement="start"
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
                labelPlacement="start"
                label="Auto Caps"
            />
        </FormGroup>
    </Box>);
}
