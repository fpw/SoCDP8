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
import { makeStyles, createStyles, Button, ButtonGroup } from '@material-ui/core';

export interface TC08Props {
    onTapeLoad(tape: File, unit: number): void;
}

const useStyles = makeStyles(theme => createStyles({
    fileInput: {
        display: 'none',
    }
}));

export const TC08: React.FunctionComponent<TC08Props> = (props) => {
    const classes = useStyles();
    const b0 = React.useRef<HTMLInputElement>(null);
    const b1 = React.useRef<HTMLInputElement>(null);
    const b2 = React.useRef<HTMLInputElement>(null);
    const b3 = React.useRef<HTMLInputElement>(null);

    return (
        <section>
            <input ref={b0} className={classes.fileInput} type='file' onChange={evt => onLoadFile(evt, props, 0)}/>
            <input ref={b1} className={classes.fileInput} type='file' onChange={evt => onLoadFile(evt, props, 1)}/>
            <input ref={b2} className={classes.fileInput} type='file' onChange={evt => onLoadFile(evt, props, 2)}/>
            <input ref={b3} className={classes.fileInput} type='file' onChange={evt => onLoadFile(evt, props, 3)}/>

            <ButtonGroup variant='outlined' color='primary'>
                <Button onClick={() => b0?.current?.click()}>Load DECtape 0</Button>>
                <Button onClick={() => b1?.current?.click()}>Load DECtape 1</Button>>
                <Button onClick={() => b2?.current?.click()}>Load DECtape 2</Button>>
                <Button onClick={() => b3?.current?.click()}>Load DECtape 3</Button>>
            </ButtonGroup>
        </section>
    );
}


function onLoadFile(evt: React.ChangeEvent,  props: TC08Props, unit: number): void {
    const target = evt.target as HTMLInputElement;
    if (!target.files || target.files.length < 1) {
        return;
    }
    props.onTapeLoad(target.files[0], unit);
}
