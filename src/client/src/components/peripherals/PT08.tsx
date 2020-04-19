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

import { PT08Configuration, BaudRate, BAUD_RATES } from '../../types/PeripheralTypes';
import { PaperTape } from './PaperTape';
import { PaperTapePainter } from './PaperTapePainter';
import { Terminal } from 'xterm';

import '../../../node_modules/xterm/css/xterm.css';

import React from 'react';
import { observer } from 'mobx-react-lite';
import { createStyles, makeStyles } from "@material-ui/core/styles";
import Box from "@material-ui/core/Box";
import Button from "@material-ui/core/Button";
import FormGroup from "@material-ui/core/FormGroup";
import FormControl from "@material-ui/core/FormControl";
import FormControlLabel from "@material-ui/core/FormControlLabel";
import Switch from "@material-ui/core/Switch";
import Divider from '@material-ui/core/Divider';
import Select from '@material-ui/core/Select';
import MenuItem from '@material-ui/core/MenuItem';
import FormLabel from '@material-ui/core/FormLabel';
import Typography from '@material-ui/core/Typography';
import LinearProgress from '@material-ui/core/LinearProgress';

export interface PT08Props {
    conf: PT08Configuration;
    terminal: Terminal;

    readerTape?: PaperTape;
    readerActive: boolean;

    onConfigChange(conf: PT08Configuration): void;

    onTapeLoad(tape: File): void;
    onReaderActivationChange(state: boolean): void;
}

const useStyles = makeStyles(theme => createStyles({
    fileInput: {
        display: 'none',
    }
}));

export const PT08: React.FunctionComponent<PT08Props> = (props) => {
    return (
        <section>
            <ConfigBox {...props} />

            <TerminalBox {...props} />

            <Divider />

            <TapeBox {...props} />
        </section>
    );
};

const ConfigBox: React.FunctionComponent<PT08Props> = observer(props => {
    return (
        <Box>
            <FormGroup row>
                <FormControl>
                    <FormLabel component="legend">Baud Rate</FormLabel>
                    <Select
                        value={props.conf.baudRate}
                        onChange={(evt) => {
                            props.conf.baudRate = Number.parseInt(evt.target.value as string) as BaudRate;
                            props.onConfigChange(props.conf);
                        }}
                    >
                        {BAUD_RATES.map((b) => (
                            <MenuItem value={b}>{b}</MenuItem>
                        ))}
                    </Select>
                </FormControl>

                <FormControlLabel
                    control={
                        <Switch
                            defaultChecked={props.conf.eightBit}
                            onChange={(evt) => {
                                props.conf.eightBit = evt.target.checked;
                                props.onConfigChange(props.conf);
                            }}
                        />
                    }
                    labelPlacement="start"
                    label="Set 8th bit"
                />
            </FormGroup>
        </Box>
    );
});

const TerminalBox: React.FunctionComponent<PT08Props> = (props) => {
    const termRef = React.useRef<HTMLDivElement>(null);

    React.useEffect(() => {
        if (!termRef.current) {
            return;
        }
        const term = props.terminal;
        term.setOption('bellStyle', 'both');
        term.resize(80, 25);
        term.open(termRef.current);
    }, []);

    return (
        <React.Fragment>
            <Box mt={1}>
                <div ref={termRef}></div>
            </Box>

            <Box mt={1} mb={3}>
                <Button variant="contained" onClick={() => props.terminal.reset()}>
                    Clear Output
                </Button>
            </Box>
        </React.Fragment>
    );
};

const TapeBox: React.FunctionComponent<PT08Props> = observer(props => {
    const classes = useStyles();
    const tapeInput = React.useRef<HTMLInputElement>(null);
    const canvasRef = React.useRef<HTMLCanvasElement>(null);
    const [drawer] = React.useState<PaperTapePainter>(new PaperTapePainter());

    let tapeInfo: JSX.Element;
    if (!props.readerTape) {
        tapeInfo = <p>No tape loaded</p>;
    } else {
        const tape: PaperTape = props.readerTape;
        let progress = 100;
        if (tape.buffer.byteLength > 0) {
            progress = Math.round(tape.pos / tape.buffer.byteLength * 100);
        }
        tapeInfo =
            <Box mb={1}>
                Tape { tape.name }
                <LinearProgress variant='determinate' value={progress} />
                <canvas ref={canvasRef} />
            </Box>;
    }

    React.useEffect(() => {
        if (canvasRef.current && props.readerTape) {
            const canvas = canvasRef.current;
            if (!canvas) {
                return;
            }

            if (canvas.parentElement) {
                canvas.width = canvas.parentElement.scrollWidth;
                canvas.height = 100;
            }

            const tape = props.readerTape;
            drawer.setState(canvas, tape);
        }
    });

    return (
        <Box mt={2}>
            <Typography component='h6' variant='h6'>Reader</Typography>

            { tapeInfo }

            <FormGroup row>
                <FormControl>
                    <input ref={tapeInput} className={classes.fileInput} type='file' onChange={evt => onLoadFile(evt, props)} />
                    <Button variant='outlined' color='primary' onClick={() => tapeInput?.current?.click()}>Load Tape</Button>
                </FormControl>
                <FormControlLabel
                    control={<Switch onChange={evt => props.onReaderActivationChange(evt.target.checked)} defaultChecked={props.readerActive} />}
                    labelPlacement='start'
                    label='Reader On'
                />
            </FormGroup>
        </Box>
    );
});


function onLoadFile(evt: React.ChangeEvent, props: PT08Props): void {
    const target = evt.target as HTMLInputElement;
    if (!target.files || target.files.length < 1) {
        return;
    }

    props.onTapeLoad(target.files[0]);
}
