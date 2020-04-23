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
import { PaperTape } from '../../models/PaperTape';
import { Terminal } from 'xterm';
import { PaperTapeBox } from './PaperTapeBox';
import { downloadData } from '../../util';

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
import ExpansionPanel from '@material-ui/core/ExpansionPanel';
import ExpansionPanelSummary from '@material-ui/core/ExpansionPanelSummary';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import ExpansionPanelDetails from '@material-ui/core/ExpansionPanelDetails';
import Container from '@material-ui/core/Container';

import '../../../node_modules/xterm/css/xterm.css';

export interface PT08Props {
    conf: PT08Configuration;
    terminal: Terminal;

    readerTape?: PaperTape;
    readerActive: boolean;
    onReaderActivationChange(state: boolean): void;
    onReaderTapeLoad(tape: File): void;

    punchTape: PaperTape;
    punchActive: boolean;
    onPunchActivationChange(state: boolean): void;
    onPunchClear(): void;
    onPunchLeader(): void;

    onConfigChange(conf: PT08Configuration): void;

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

            <ExpansionPanel>
                <ExpansionPanelSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography variant='body1'>Reader &amp; Punch</Typography>
                </ExpansionPanelSummary>
                <ExpansionPanelDetails>
                    <Container>
                        <ReaderBox {...props} />
                        <Divider />
                        <PunchBox {...props} />
                    </Container>
                </ExpansionPanelDetails>
            </ExpansionPanel>
        </section>
    );
};

const ConfigBox: React.FunctionComponent<PT08Props> = observer(props =>
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

const ReaderBox: React.FunctionComponent<PT08Props> = observer(props => {
    const classes = useStyles();
    const tapeInput = React.useRef<HTMLInputElement>(null);

    return (
        <Box mt={2}>
            <Typography component='h6' variant='h6'>Reader</Typography>

            <PaperTapeBox tape={props.readerTape} reverse={false} />

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

    props.onReaderTapeLoad(target.files[0]);
}

const PunchBox: React.FunctionComponent<PT08Props> = observer(props =>
    <Box mt={2}>
        <Typography component='h6' variant='h6'>Punch</Typography>

        <PaperTapeBox tape={props.punchTape} reverse={true} />

        <FormGroup row>
            <FormControl>
                <Button variant='outlined' color='primary' onClick={() => props.onPunchClear()}>New Tape</Button>
            </FormControl>
            <FormControl>
                <Button variant='outlined' color='primary' onClick={() => downloadData(Uint8Array.from(props.punchTape.buffer), 'punch.bin')}>Download Tape</Button>
            </FormControl>
            <FormControl>
                <Button variant='outlined' color='primary' onClick={() => props.onPunchLeader()}>Leader</Button>
            </FormControl>
            <FormControlLabel
                control={<Switch onChange={evt => props.onPunchActivationChange(evt.target.checked)} defaultChecked={props.punchActive} />}
                labelPlacement='start'
                label='Punch On'
            />
        </FormGroup>
    </Box>
);
