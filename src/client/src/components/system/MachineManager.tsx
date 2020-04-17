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
import { PDP8Model } from '../../models/PDP8Model';
import { useEffect, useState } from "react";
import { MachineForm } from './MachineForm';

import Typography from "@material-ui/core/Typography";
import Box from '@material-ui/core/Box';
import { makeStyles, createStyles, withStyles } from '@material-ui/core/styles';
import TableCell from '@material-ui/core/TableCell';
import TableContainer from '@material-ui/core/TableContainer';
import Table from '@material-ui/core/Table';
import TableHead from '@material-ui/core/TableHead';
import TableRow from '@material-ui/core/TableRow';
import TableBody from '@material-ui/core/TableBody';
import Paper from '@material-ui/core/Paper';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import ExpansionPanel from '@material-ui/core/ExpansionPanel';
import ExpansionPanelSummary from '@material-ui/core/ExpansionPanelSummary';
import ExpansionPanelDetails from '@material-ui/core/ExpansionPanelDetails';
import ButtonGroup from '@material-ui/core/ButtonGroup';
import Button from '@material-ui/core/Button';
import { SystemConfiguration, DEFAULT_SYSTEM_CONF } from '../../types/SystemConfiguration';
import { peripheralConfToName } from '../../types/PeripheralTypes';

export interface MachineManagerProps {
    pdp8: PDP8Model
}

const useStyles = makeStyles(theme => createStyles({
    table: {
        width: '100%'
    }
}));

const StyledTableCell = withStyles(theme => ({
    head: {
        backgroundColor: theme.palette.primary.main,
        color: theme.palette.primary.contrastText,
        fontWeight: 'bold',
    },
}))(TableCell);

export const MachineManager: React.FunctionComponent<MachineManagerProps> = (props) => {
    const [states, setStates] = useState<SystemConfiguration[]>([]);
    const [formBusy, setFormBusy] = useState<boolean>(false);
    const classes = useStyles();

    useEffect(() => {
        async function fetchList() {
            const list = await props.pdp8.fetchStateList();
            console.log(list);
            setStates(list);
        }
        fetchList();
    }, []);

    return (
        <section>
            <Typography component='h1' variant='h4' gutterBottom>Manage Machines</Typography>

            <ExpansionPanel>
                <ExpansionPanelSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography variant='body1'>New Machine</Typography>
                </ExpansionPanelSummary>
                <ExpansionPanelDetails>
                    <Box width='75%' pl={4}>
                        <MachineForm
                            initialState={DEFAULT_SYSTEM_CONF}
                            onSubmit={async (s) => {
                                setFormBusy(true);
                                await onNewState(props.pdp8, s);
                                setFormBusy(false);
                            }}
                            buttonEnabled={!formBusy}
                        />
                    </Box>
                </ExpansionPanelDetails>
            </ExpansionPanel>

            <Box mt={2}>
                <TableContainer component={Paper}>
                    <Table className={classes.table}>
                        <TableHead>
                            <TableRow>
                                <StyledTableCell>Name</StyledTableCell>
                                <StyledTableCell>Core</StyledTableCell>
                                <StyledTableCell>Extensions</StyledTableCell>
                                <StyledTableCell>Peripherals</StyledTableCell>
                                <StyledTableCell>Actions</StyledTableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            { states.map(s => <MachineEntry pdp8={props.pdp8} state={s} />)}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Box>
        </section>
    );
};

const MachineEntry: React.FunctionComponent<{pdp8: PDP8Model, state: SystemConfiguration}> = (props) => {
    const [busy, setBusy] = React.useState<boolean>(false);

    return (
        <TableRow>
            <StyledTableCell>{props.state.name}</StyledTableCell>
            <StyledTableCell>
                {(props.state.maxMemField + 1) * 4} kiW
            </StyledTableCell>
            <StyledTableCell>
                <ul>
                    {(() => {
                        if (props.state.maxMemField > 0) {
                            return <li>MC8/I</li>
                        }
                    })()}
                    {(() => {
                        if (props.state.cpuExtensions.eae) {
                            return <li>KE8/I</li>
                        }
                    })()}
                    {(() => {
                        if (props.state.cpuExtensions.kt8i) {
                            return <li>KT8/I</li>
                        }
                    })()}
                </ul>
            </StyledTableCell>
            <StyledTableCell>
                <ul>
                    { props.state.peripherals.map(conf =>
                        <li>{peripheralConfToName(conf)}</li>
                    )}
                </ul>
            </StyledTableCell>
            <StyledTableCell>
                <ButtonGroup variant='outlined' orientation='vertical'>
                    <Button disabled={busy} onClick={async () => {
                        setBusy(true);
                        await activateState(props.pdp8, props.state);
                        setBusy(false);
                    }}>
                        Activate
                    </Button>
                </ButtonGroup>
            </StyledTableCell>
        </TableRow>
    );
};

async function onNewState(pdp8: PDP8Model, state: SystemConfiguration) {
    try {
        await pdp8.createNewState(state);
    } catch (e) {
        if (e instanceof Error) {
            alert(`Creating state failed: ${e.message}`);
        } else {
            alert('Creating state failed');
        }
    }
}

async function activateState(pdp8: PDP8Model, state: SystemConfiguration) {
    try {
        await pdp8.activateState(state.id);
    } catch (e) {
        if (e instanceof Error) {
            alert(`Activating state failed: ${e.message}`);
        } else {
            alert('Activating state failed');
        }
    }
}
