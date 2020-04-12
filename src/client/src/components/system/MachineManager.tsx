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

import * as React from "react";
import { PDP8Model } from '../../models/PDP8Model';
import { useEffect, useState } from "react";
import { MachineState } from '../../models/MachineState';
import { Typography } from "@material-ui/core";

export interface MachineManagerProps {
    pdp8: PDP8Model
}

export const MachineManager: React.FunctionComponent<MachineManagerProps> = (props) => {
    const [states, setStates] = useState<MachineState[]>([]);

    useEffect(() => {
        async function fetchList() {
            const list = await props.pdp8.fetchStateList();
            setStates(list);
        }
        fetchList();
    }, []);

    return (
        <section>
            <Typography component='h1' variant='h4'>Manage Machines</Typography>
            <Typography variant='body1'>
                <ul>
                    { states.map(s => <MachineEntry state={s} />)}
                </ul>
            </Typography>
        </section>
  );
};

const MachineEntry: React.FunctionComponent<{state: MachineState}> = (props) =>
    <li>
        {props.state.name}
    </li>
