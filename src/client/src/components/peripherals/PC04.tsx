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

import React from 'react';
import { makeStyles, createStyles } from '@material-ui/core/styles';
import ButtonGroup from "@material-ui/core/ButtonGroup";
import Button from "@material-ui/core/Button";
import { downloadData } from '../../util';

export interface PC04Props {
    punchData: Uint8Array;
    clearPunch(): void;
    onTapeLoad(tape: File): void;
}

const useStyles = makeStyles(theme => createStyles({
    fileInput: {
        display: 'none',
    }
}));

export const PC04: React.FunctionComponent<PC04Props> = props => {
    const classes = useStyles();
    const tapeInput = React.useRef<HTMLInputElement>(null);

    return (
        <section>
            <input ref={tapeInput} className={classes.fileInput} type='file' onChange={evt => onLoadFile(evt, props)}/>

            <ButtonGroup variant='outlined' color='primary'>
                <Button onClick={() => tapeInput?.current?.click()}>Attach Tape</Button>>
                <Button onClick={() => downloadData(props.punchData, 'punch.bin')}>Download Punch</Button>>
                <Button onClick={() => props.clearPunch()}>Clear Punch</Button>>
            </ButtonGroup>
        </section>
    );
}

function onLoadFile(evt: React.ChangeEvent,  props: PC04Props): void {
    const target = evt.target as HTMLInputElement;
    if (!target.files || target.files.length < 1) {
        return;
    }

    props.onTapeLoad(target.files[0]);
}
