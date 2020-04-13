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
import { MachineState, deviceIdToString } from '../../models/MachineState';
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
    const [states, setStates] = useState<MachineState[]>([]);
    const classes = useStyles();

    useEffect(() => {
        async function fetchList() {
            const list = await props.pdp8.fetchStateList();
            setStates(list);
        }
        fetchList();
    }, []);

    return (
        <Box>
            <Typography component='h1' variant='h4' gutterBottom>Manage Machines</Typography>

            <ExpansionPanel>
                <ExpansionPanelSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography variant='body1'>New Machine</Typography>
                </ExpansionPanelSummary>
                <ExpansionPanelDetails>
                    <Box width='75%' pl={4}>
                        <MachineForm
                            initialState={MachineState.defaultNewState}
                            onSubmit={(s) => onNewState(props.pdp8, s)}
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
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            { states.map(s => <MachineEntry state={s} />)}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Box>
        </Box>
    );
};

const MachineEntry: React.FunctionComponent<{state: MachineState}> = (props) =>
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
                    if (props.state.eaePresent) {
                        return <li>KE8/I</li>
                    }
                })()}
                {(() => {
                    if (props.state.kt8iPresent) {
                        return <li>KT8/I</li>
                    }
                })()}
            </ul>
        </StyledTableCell>
        <StyledTableCell>
            <ul>
                { props.state.peripherals.map(id =>
                    <li>{deviceIdToString(id)}</li>
                )}
            </ul>
        </StyledTableCell>
    </TableRow>

async function onNewState(pdp8: PDP8Model, state: MachineState) {
    try {
        await pdp8.createNewState(state);
    } catch (e) {
        if (e instanceof Error) {
            alert(e.message);
        } else {
            alert('State could not be created');
        }
    }
}
