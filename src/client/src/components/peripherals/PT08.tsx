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

import { createStyles, makeStyles, StylesProvider } from "@material-ui/core/styles";
import Box from "@material-ui/core/Box";
import Button from "@material-ui/core/Button";
import FormGroup from "@material-ui/core/FormGroup";
import FormControl from "@material-ui/core/FormControl";
import FormControlLabel from "@material-ui/core/FormControlLabel";
import Switch from "@material-ui/core/Switch";
import { Terminal } from 'xterm';

import '../../../node_modules/xterm/css/xterm.css';

export interface PT08Props {
    terminal: Terminal;
    onReaderKey(chr: number): void;
    onReaderClear(): void;
    onTapeLoad(tape: File): void;
    onReaderActivationChange(state: boolean): void;
}

const useStyles = makeStyles(theme => createStyles({
    output: {
        fontFamily: 'monospace',
    },
    fileInput: {
        display: 'none',
    }
}));

export const PT08: React.FunctionComponent<PT08Props> = (props => {
    const classes = useStyles();
    const tapeInput = React.useRef<HTMLInputElement>(null);
    const termRef = React.useRef<HTMLDivElement>(null);

    React.useEffect(() => {
        if (!termRef.current) {
            return;
        }
        const term = props.terminal;
        term.resize(80, 25);
        term.open(termRef.current);
        term.onData(data => {
            for (let i = 0; i < data.length; i++) {
                sendPunch(data.charCodeAt(i), props);
            }
        });
    }, []);

    return (
        <section>
            <Box mb={4}>
                <div ref={termRef}></div>
                <Button variant='contained' onClick={() => props.onReaderClear()}>Clear Output</Button>
            </Box>

            <Box>
                <FormGroup row>
                    <FormControl>
                        <input ref={tapeInput} className={classes.fileInput} type='file' onChange={evt => onLoadFile(evt, props)}/>
                        <Button variant='outlined' color='primary' onClick={() => tapeInput?.current?.click()}>Load Tape</Button>
                    </FormControl>
                    <FormControlLabel
                        control={<Switch onChange={evt => props.onReaderActivationChange(evt.target.checked)} />}
                        labelPlacement='start'
                        label='Reader On'
                    />
                </FormGroup>
            </Box>
        </section>
    );
});

function onLoadFile(evt: React.ChangeEvent, props: PT08Props): void {
    const target = evt.target as HTMLInputElement;
    if (!target.files || target.files.length < 1) {
        return;
    }

    props.onTapeLoad(target.files[0]);
}

function sendPunch(code: number, props: PT08Props) {
    props.onReaderKey(code | 0x80);
}
