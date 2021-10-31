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
import { SoCDP8 } from '../../models/SoCDP8';
import { useState } from "react";
import { SystemForm } from './SystemForm';
import { SystemConfiguration, getDefaultSysConf } from '../../types/SystemConfiguration';
import { DeviceID } from '../../types/PeripheralTypes';

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
import ButtonGroup from '@material-ui/core/ButtonGroup';
import Button from '@material-ui/core/Button';
import { Accordion, AccordionDetails, AccordionSummary } from '@material-ui/core';

export interface SystemManagerProps {
    pdp8: SoCDP8
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

export const SystemManager: React.FunctionComponent<SystemManagerProps> = observer(props => {
    const [formBusy, setFormBusy] = useState<boolean>(false);
    const [open, setOpen] = useState<boolean>(false);
    const classes = useStyles();
    const activeSys = props.pdp8.activeSystem;

    return (
        <section>
            <Typography component='h1' variant='h4' gutterBottom>Manage Systems</Typography>

            <Accordion expanded={open} onChange={() => setOpen(!open)}>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography variant='body1'>New System</Typography>
                </AccordionSummary>
                <AccordionDetails>
                    <Box width='75%' pl={4}>
                        <SystemForm
                            initialState={getDefaultSysConf()}
                            onSubmit={async (s) => {
                                setFormBusy(true);
                                await onNewSystem(props.pdp8, s);
                                setFormBusy(false);
                                setOpen(false);
                            }}
                            buttonEnabled={!formBusy}
                        />
                    </Box>
                </AccordionDetails>
            </Accordion>

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
                            { props.pdp8.systems.map(s => <SystemEntry key= {s.id} pdp8={props.pdp8} system={s} active={s.id == activeSys.id} />)}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Box>
        </section>
    );
});

function SystemEntry(props: {pdp8: SoCDP8, system: SystemConfiguration, active: boolean}) {
    const [busy, setBusy] = React.useState<boolean>(false);

    return (
        <TableRow>
            <StyledTableCell>
                <Box fontWeight={props.active ? 'bold' : null}>
                    {props.system.name}
                </Box>
            </StyledTableCell>
            <StyledTableCell>
                {(props.system.maxMemField + 1) * 4} kiW
            </StyledTableCell>
            <StyledTableCell>
                <ul>
                    {(() => {
                        if (props.system.maxMemField > 0) {
                            return <li>MC8/I</li>
                        }
                    })()}
                    {(() => {
                        if (props.system.cpuExtensions.eae) {
                            return <li>KE8/I</li>
                        }
                    })()}
                    {(() => {
                        if (props.system.cpuExtensions.kt8i) {
                            return <li>KT8/I</li>
                        }
                    })()}
                </ul>
            </StyledTableCell>
            <StyledTableCell>
                <ul>
                    { props.system.peripherals.map(conf =>
                        <li key={conf.id}>{getPeripheralName(conf.id)}</li>
                    )}
                </ul>
            </StyledTableCell>
            <StyledTableCell>
                <ButtonGroup variant='outlined' orientation='vertical'>
                    <Button disabled={busy} onClick={async () => {
                        setBusy(true);
                        await activateSystem(props.pdp8, props.system);
                        setBusy(false);
                    }}>
                        Activate
                    </Button>
                    <Button disabled={busy} onClick={async () => {
                        setBusy(true);
                        await deleteSystem(props.pdp8, props.system);
                        setBusy(false);
                    }}>
                        Delete
                    </Button>
                </ButtonGroup>
            </StyledTableCell>
        </TableRow>
    );
}

function getPeripheralName(id: DeviceID): string {
    switch (id) {
        case DeviceID.DEV_ID_NULL:  return '';
        case DeviceID.DEV_ID_PT08:  return 'PT08';
        case DeviceID.DEV_ID_PC04:  return 'PC04';
        case DeviceID.DEV_ID_TC08:  return 'TC08';
        case DeviceID.DEV_ID_RF08:  return 'RF08';
        case DeviceID.DEV_ID_DF32:  return 'DF32';
        case DeviceID.DEV_ID_TT1:   return 'TT1';
        case DeviceID.DEV_ID_TT2:   return 'TT2';
        case DeviceID.DEV_ID_TT3:   return 'TT3';
        case DeviceID.DEV_ID_TT4:   return 'TT4';
        case DeviceID.DEV_ID_KW8I:  return 'KW8I';
        case DeviceID.DEV_ID_RK8:   return 'RK8';
    }
}

async function onNewSystem(pdp8: SoCDP8, state: SystemConfiguration) {
    try {
        await pdp8.createNewSystem(state);
    } catch (e) {
        if (e instanceof Error) {
            alert(`Creating state failed: ${e.message}`);
        } else {
            alert('Creating state failed');
        }
    }
}

async function activateSystem(pdp8: SoCDP8, state: SystemConfiguration) {
    try {
        await pdp8.activateSystem(state.id);
    } catch (e) {
        if (e instanceof Error) {
            alert(`Activating state failed: ${e.message}`);
        } else {
            alert('Activating state failed');
        }
    }
}

async function deleteSystem(pdp8: SoCDP8, state: SystemConfiguration) {
    if (!window.confirm(`Delete system '${state.name}'?`)) {
        return;
    }

    try {
        await pdp8.deleteSystem(state.id);
    } catch (e) {
        if (e instanceof Error) {
            alert(`Deleting system failed: ${e.message}`);
        } else {
            alert('Deleting system failed');
        }
    }
}
