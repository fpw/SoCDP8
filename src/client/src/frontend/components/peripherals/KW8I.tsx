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

import { FormControlLabel, FormGroup, InputLabel, MenuItem, Select, Switch } from "@mui/material";
import { KW8IModel } from "../../../models/peripherals/KW8IModel";

export function KW8I(props: {model: KW8IModel}) {
    const is50 = props.model.useState(state => state.conf.use50Hz);
    const set50 = props.model.useState(state => state.set50Hz);
    const isSync = props.model.useState(state => state.conf.useExternalClock);
    const setSync = props.model.useState(state => state.setSync);

    return (<>
        <InputLabel id="hz">Frequency</InputLabel>
        <Select size="small" labelId="hz" value={is50 ? 1 : 0} onChange={ev => ev.target.value == 1 ? set50(true) : set50(false)}>
            <MenuItem value={0}>60 Hz</MenuItem>
            <MenuItem value={1}>50 Hz</MenuItem>
        </Select>
        <FormGroup>
            <FormControlLabel control={<Switch checked={isSync} onChange={(_, c) => setSync(c)} />} label="Sync to real clock" />
        </FormGroup>
    </>);
}
