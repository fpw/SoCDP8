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

import { Box } from "@mui/system";
import { TC08Model } from "../../../models/peripherals/TC08Model";
import { DumpButtons } from "./DumpButtons";
import { TU56 } from "./accessoires/TU56";

export function TC08(props: { model: TC08Model }) {
    const tapes = props.model.useState(state => state.tapes);
    const numTUs = props.model.useState(state => state.numTUs);

    return (
        <Box>
            <DumpButtons model={props.model} />
            {numTUs > 0 && <TU56 left={tapes[0]} right={tapes[1]} address={0} /> }
            {numTUs > 2 && <TU56 left={tapes[2]} right={tapes[3]} address={2} /> }
            {numTUs > 4 && <TU56 left={tapes[4]} right={tapes[5]} address={4} /> }
            {numTUs > 6 && <TU56 left={tapes[6]} right={tapes[7]} address={6} /> }
        </Box>
    );
}
