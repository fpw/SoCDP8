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

import InfoIcon from "@mui/icons-material/Info";
import MemoryIcon from "@mui/icons-material/Memory";
import MenuIcon from "@mui/icons-material/Menu";
import TuneIcon from "@mui/icons-material/Tune";
import { AppBar, Box, Container, CssBaseline, Divider, Drawer, IconButton, List, ListItem, ListItemIcon, ListItemText, Toolbar, Typography } from "@mui/material";
import { observer } from "mobx-react-lite";
import React from "react";
import { BrowserRouter as Router, Link as RouterLink, Navigate, Route, Routes, useParams } from "react-router-dom";
import { SoCDP8 } from "../models/SoCDP8";
import { About } from "./About";
import { PeripheralBox } from "./peripherals/PeripheralBox";
import { System } from "./system/System";
import { SystemManager } from "./system/SystemManager";

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
        <Box sx={{display: "flex"}}>
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
                            display: {xs: "block"},
                            "& .MuiDrawer-paper": { boxSizing: "border-box", width: drawerWidth },
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
                        <Routes>
                            <Route path="/" element={<Navigate to="/machines/active" />} />
                            <Route path="/machines/active" element={<System pdp8={props.pdp8} />} />
                            <Route path="/machines" element={<SystemManager pdp8={props.pdp8} />} />
                            <Route path="/peripherals/:id" element={<PeripheralById pdp8={props.pdp8} />} />
                            <Route path="/about" element={<About />} />
                        </Routes>
                    </Container>
                    <Copyright />
                </Box>
            </Router>
        </Box>
    )
});

function PeripheralById(props: {pdp8: SoCDP8}) {
    const idString = useParams<{id: string}>().id!;
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
