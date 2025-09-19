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
import { PT08Model } from "../../../models/peripherals/PT08Model";
import { BAUD_RATES, BaudRate, PT08Style } from "../../../types/PeripheralTypes";
import { ASR33 } from "./accessoires/ASR33";
import { VT100 } from "./accessoires/VT100";

export function PT08(props: { model: PT08Model }) {
    const style = props.model.useState(state => state.conf!.style);

    return (
        <>
            <ConfigBox model={props.model} />
            { style == PT08Style.ASR33 && <ASR33 model={props.model} /> }
            { style == PT08Style.VT100 && <VT100 model={props.model} /> }
        </>
    );
}

function ConfigBox(props: { model: PT08Model }) {
    const { model } = props;
    const conf = model.useState(state => state.conf!);

    return (
        <Group mb="xs">
            <Select
                label="Style"
                value={conf.style}
                onChange={s => {
                    if (s !== null) {
                        const style = s as PT08Style;
                        void model.updateConfig({ ...conf, style });
                    }
                }}
                data={Object.entries(PT08Style).map(([key, val]) => ({ value: val, label: key }))}
            />

            <Select
                label="Baud Rate"
                value={conf.baudRate.toString()}
                onChange={val => {
                    if (val !== null) {
                        const rate = Number.parseInt(val) as BaudRate;
                        void model.updateConfig({ ...conf, baudRate: rate });
                    }
                }}
                data={BAUD_RATES.map(x => ({ value: x.toString(), label: x.toString() }))}
            />

            <Switch
                label="Set 8th bit"
                checked={conf.eightBit}
                onChange={(evt) => {
                    const bit8 = evt.target.checked;
                    void model.updateConfig({ ...conf, eightBit: bit8 });
                }}
            />
            <Switch
                label="Auto Caps"
                checked={conf.autoCaps}
                onChange={(evt) => {
                    const caps = evt.target.checked;
                    void model.updateConfig({ ...conf, autoCaps: caps });
                }}
            />
        </Group>
    );
}
