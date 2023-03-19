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

import { Button, ButtonGroup } from "@mui/material";
import { Box } from "@mui/system";
import React from "react";
import { TC08Model } from "../../../models/peripherals/TC08Model";
import { downloadData } from "../../../util";
import { TU56 } from "./TU56";

export interface TC08Props {
    model: TC08Model;
}

export function TC08(props: TC08Props) {
    const tapes = props.model.useState(state => state.tapes);
    const numTUs = props.model.useState(state => state.numTUs);

    async function upload(unit: number, target: HTMLInputElement) {
        if (!target.files || target.files.length < 1) {
            return;
        }
        await props.model.loadTape(target.files[0], unit);
    }

    async function download(unit: number) {
        const dump = await props.model.getDump(unit);
        await downloadData(dump, `tc08-${unit}.tu56`);
    }

    return (
        <Box>
            <ButtonGroup variant="outlined" color="primary">
                { Array.from({length: numTUs}).map((_x, i) => <React.Fragment key={i}>
                    <Button component="label">
                        Upload {i}
                        <input type="file" onChange={evt => void upload(i, evt.target as HTMLInputElement)} hidden />
                    </Button>
                    <Button onClick={() => void download(i)}>
                        Download {i}
                    </Button>
                </React.Fragment>)}
            </ButtonGroup>

            {numTUs > 0 && <TU56 left={tapes[0]} right={tapes[1]} address={0} /> }
            {numTUs > 2 && <TU56 left={tapes[2]} right={tapes[3]} address={2} /> }
            {numTUs > 4 && <TU56 left={tapes[4]} right={tapes[5]} address={4} /> }
            {numTUs > 6 && <TU56 left={tapes[6]} right={tapes[7]} address={6} /> }
        </Box>
    );
}
