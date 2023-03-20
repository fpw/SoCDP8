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

import { Box, ButtonGroup, Button } from "@mui/material";
import { DF32Model } from "../../../models/peripherals/DF32Model";
import { downloadData } from "../../../util";

export function DF32(props: {model: DF32Model}) {
    async function upload(target: HTMLInputElement) {
        if (!target.files || target.files.length < 1) {
            return;
        }
        await props.model.loadDump(target.files[0]);
    }

    async function download() {
        const dump = await props.model.getDump();
        await downloadData(dump, "df32.dat");
    }

    return (
        <Box>
            <ButtonGroup variant="outlined" color="primary">
                <Button onClick={() => void download()}>
                    Download Dump
                </Button>
                <Button component="label">
                    Upload Dump
                    <input type="file" onChange={evt => void upload(evt.target)} hidden />
                </Button>
            </ButtonGroup>
        </Box>
    );
}
