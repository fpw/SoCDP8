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

import React, { useState } from 'react';
import { System } from './system/System';
import { SoCDP8 } from '../models/SoCDP8';
import { observer } from 'mobx-react-lite';
import { HashRouter as Router, Route, Link as RouterLink, Switch, Redirect, useParams } from 'react-router-dom';
import { About } from './About';
import { SystemManager } from './system/SystemManager';

import { PeripheralBox } from './peripherals/PeripheralBox';
import { AppBar, Box, Container, CssBaseline, Divider, Drawer, IconButton, List, ListItem, ListItemIcon, ListItemText, Toolbar, Typography } from '@mui/material';
import MemoryIcon from '@mui/icons-material/Memory';
import TuneIcon from '@mui/icons-material/Tune';
import InfoIcon from '@mui/icons-material/Info';
import MenuIcon from '@mui/icons-material/Menu';

export interface AppProps {
    pdp8: SoCDP8;
}

const drawerWidth = 240;

export const App: React.FunctionComponent<AppProps> = observer(props => {
    const [drawerOpen, setDrawerOpen] = React.useState(false);

    const toggleDrawerOpen = () => {
        setDrawerOpen(!drawerOpen);
    };

    if (!props.pdp8.ready) {
        return <ConnectingInfo />;
    }

    const drawer = (
        <Box onClick={toggleDrawerOpen} onKeyDown={toggleDrawerOpen}>
            <Toolbar />
            <Divider />
            <List>
                <ListItem button component={RouterLink} to='/machines/active'>
                    <ListItemIcon><MemoryIcon /></ListItemIcon>
                    <ListItemText primary='Active Machine' />
                </ListItem>
                <ListItem button component={RouterLink} to='/machines'>
                    <ListItemIcon><TuneIcon /></ListItemIcon>
                    <ListItemText primary='Manage Machines' />
                </ListItem>
                <ListItem button component={RouterLink} to='/about'>
                    <ListItemIcon><InfoIcon /></ListItemIcon>
                    <ListItemText primary='About' />
                </ListItem>
            </List>
        </Box>
    );

    return (
        <Box sx={{display: 'flex'}}>
            <CssBaseline />
            <AppBar position='fixed'>
                <Toolbar>
                    <IconButton
                        color="inherit"
                        edge="start"
                        onClick={toggleDrawerOpen}
                        sx={{ mr: 2 }}
                    >
                        <MenuIcon />
                    </IconButton>
                    <Typography component='h1' variant='h6' color='inherit' noWrap>
                        SoCDP-8
                    </Typography>
                </Toolbar>
            </AppBar>
            <Router>
                <Box component="nav">
                    <Drawer
                        variant='temporary'
                        open={drawerOpen}
                        onClose={toggleDrawerOpen}
                        ModalProps={{keepMounted: true}}
                        sx={{
                            display: {xs: 'block'},
                            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
                        }}
                    >
                        {drawer}
                    </Drawer>
                </Box>
                <Box
                    component="main"
                    sx={{ flexGrow: 1, p: 3 }}
                >
                    <Toolbar />
                    <Container>
                        <Switch>
                            <Route exact path="/">
                                <Redirect to="/machines/active" />
                            </Route>

                            <Route path="/machines/active">
                                <System pdp8={props.pdp8} />
                            </Route>

                            <Route path="/machines">
                                <SystemManager pdp8={props.pdp8}/>
                            </Route>

                            <Route path="/peripherals/:id">
                                <PeripheralById pdp8={props.pdp8} />
                            </Route>

                            <Route path="/about">
                                <About />
                            </Route>
                        </Switch>
                    </Container>
                    <Copyright />
                </Box>
            </Router>
        </Box>
    )
});

function PeripheralById(props: {pdp8: SoCDP8}) {
    const idString = useParams<{id: string}>().id;
    const id = Number.parseInt(idString);

    return <PeripheralBox model={props.pdp8.getPeripheralById(id)} />;
}

function ConnectingInfo() {
    return (
        <main>
            <Container maxWidth='lg'>
                <Typography component='h1' variant='h2'>
                    Connecting...
                </Typography>
                <p>
                    Please wait
                </p>
            </Container>
            <Copyright />
        </main>
    );
};

function Copyright() {
    return (
        <Box pt={4}>
            <Typography variant='body2' color='textSecondary' align='center'>
                Copyright © Folke Will, 2021
            </Typography>
        </Box>
    );
}
