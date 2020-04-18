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
import { observer } from 'mobx-react-lite';

import { createStyles, makeStyles } from "@material-ui/core/styles";
import TextField from "@material-ui/core/TextField";
import Box from "@material-ui/core/Box";
import Button from "@material-ui/core/Button";
import FormGroup from "@material-ui/core/FormGroup";
import FormControl from "@material-ui/core/FormControl";
import FormControlLabel from "@material-ui/core/FormControlLabel";
import Switch from "@material-ui/core/Switch";

export interface PT08Props {
    punchData: string;
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

export const PT08: React.FunctionComponent<PT08Props> = observer((props) => {
    const classes = useStyles();
    const textRef = React.useRef<HTMLInputElement>(null);
    const tapeInput = React.useRef<HTMLInputElement>(null);

    scrollToBottomOnChange(textRef);

    return (
        <section>
            <Box mb={4}>
                <TextField label='Output' variant='outlined'
                    InputProps={{
                        className: classes.output,
                        spellCheck: false,
                    }}
                    inputRef={textRef}
                    multiline
                    rows={8} fullWidth
                    value={props.punchData}
                />
                <Button variant='contained' onClick={() => props.onReaderClear()}>Clear Output</Button>
            </Box>

            <Box>
                <TextField label='Input' variant='outlined'
                    fullWidth
                    onKeyUp={evt => onKeyUp(evt, props)} onKeyPress={evt => onKeyPress(evt, props)}
                />
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

function scrollToBottomOnChange(textRef: React.RefObject<HTMLInputElement>) {
    React.useEffect(() => {
        const textElem = textRef.current;
        if (!textElem) {
            return;
        }

        textElem.scrollTop = textElem.scrollHeight - textElem.clientHeight;
    });
}

function onKeyUp(ev: React.KeyboardEvent, props: PT08Props): boolean {
    if (ev.key == 'Enter') {
        (ev.target as HTMLInputElement).value = '';
        sendPunch(0x0D, props);
    } else if (ev.key == 'Backspace') {
        sendPunch(0x7F, props);
    } else if (ev.key == 'Escape') {
        sendPunch(0x1B, props);
    }

    return false;
}

function onKeyPress(ev: React.KeyboardEvent, props: PT08Props): boolean {
    if (ev.key.length == 1) {
        const ascii = ev.key.charCodeAt(0);
        if ((ascii & 0x60) == 0x60) {
            // lowercase -> convert to uppercase
            sendPunch(ascii & (~0x20), props);
        } else {
            // uppercase -> convert to ctrl
            sendPunch(ascii & (~0x40), props);
        }
    }

    return false;
}

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
