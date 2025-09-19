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

import { Group, Select, Switch } from "@mantine/core";
import { KW8IModel } from "../../../models/peripherals/KW8IModel";

export function KW8I(props: { model: KW8IModel }) {
    const is50 = props.model.useState(state => state.conf.use50Hz);
    const set50 = props.model.useState(state => state.set50Hz);
    const isSync = props.model.useState(state => state.conf.useExternalClock);
    const setSync = props.model.useState(state => state.setSync);

    return (
        <Group>
            <Select
                value={is50 ? "1" : "0"}
                data={[{ value: "0", label: "60 Hz" }, { value: "1", label: "50 Hz" }]}
                onChange={x => set50(x === "1" ? true : false)}
            />
            <Switch label="Sync to real clock" checked={isSync} onChange={ev => setSync(ev.currentTarget.checked)} />
        </Group>
    );
}
