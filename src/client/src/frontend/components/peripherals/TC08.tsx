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

import { TU56 } from "./TU56";
import { DECTape } from "../../../models/DECTape";
import { ButtonGroup, Button } from "@mui/material";
import { Box } from "@mui/system";
import { ChangeEvent } from "react";

export interface TC08Props {
    onTapeLoad(tape: File, unit: number): void;
    tapes: DECTape[];
    numTUs: number;
}

export function TC08(props: TC08Props) {
    const tapes = props.tapes;
    const n = props.numTUs;

    return (
        <Box>
            <ButtonGroup variant="outlined" color="primary">
                {Array.from({length: props.numTUs}).map((_x, i) =>
                    <Button key={i} component="label">
                        Load {i}
                        <input type="file" onChange={evt => onLoadFile(evt, props, i)} hidden />
                    </Button>
                )}
            </ButtonGroup>

            {n > 0 && <TU56 left={tapes[0]} right={tapes[1]} /> }
            {n > 2 && <TU56 left={tapes[2]} right={tapes[3]} /> }
            {n > 4 && <TU56 left={tapes[4]} right={tapes[5]} /> }
            {n > 6 && <TU56 left={tapes[6]} right={tapes[7]} /> }
        </Box>
    );
}

function onLoadFile(evt: ChangeEvent,  props: TC08Props, unit: number): void {
    const target = evt.target as HTMLInputElement;
    if (!target.files || target.files.length < 1) {
        return;
    }
    props.onTapeLoad(target.files[0], unit);
}
