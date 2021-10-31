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
import { System } from './system/System';
import { SoCDP8 } from '../models/SoCDP8';
import { observer } from 'mobx-react-lite';
import { HashRouter as Router, Route, Link as RouterLink, Switch, Redirect, useParams } from 'react-router-dom';
import { About } from './About';
import { SystemManager } from './system/SystemManager';

import { makeStyles, createStyles } from '@material-ui/core/styles';
import InfoIcon from '@material-ui/icons/Info';
import TuneIcon from '@material-ui/icons/Tune';
import MemoryIcon from '@material-ui/icons/Memory';
import CssBaseline from '@material-ui/core/CssBaseline';
import AppBar from '@material-ui/core/AppBar';
import Toolbar from '@material-ui/core/Toolbar';
import Typography from '@material-ui/core/Typography';
import Container from '@material-ui/core/Container';
import Drawer from '@material-ui/core/Drawer';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemIcon from '@material-ui/core/ListItemIcon';
import ListItemText from '@material-ui/core/ListItemText';
import Box from '@material-ui/core/Box';
import { PeripheralBox } from './peripherals/PeripheralBox';

const drawerWidth = 240;
const useStyles = makeStyles(theme => createStyles({
    root: {
        display: 'flex',
    },
    appBar: {
        zIndex: theme.zIndex.drawer + 1,
    },
    drawer: {
        width: drawerWidth,
        flexShrink: 0,
    },
    drawerPaper: {
        width: drawerWidth,
    },
    drawerContainer: {
        overFlow: 'auto',
    },
    content: {
        flexGrow: 1,
        padding: theme.spacing(3),
    },
    container: {
        paddingTop: theme.spacing(4),
        paddingBottom: theme.spacing(4),
    },
}));

export interface AppProps {
    pdp8: SoCDP8;
}

export const App: React.FunctionComponent<AppProps> = observer(props => {
    const classes = useStyles();

    if (!props.pdp8.ready) {
        return <ConnectingInfo />;
    }

    return (
        <div className={classes.root}>
            <CssBaseline />
            <AppBar position='fixed' className={classes.appBar}>
                <Toolbar>
                    <Typography component='h1' variant='h6' color='inherit' noWrap>
                        SoCDP-8
                    </Typography>
                </Toolbar>
            </AppBar>
            <Router>
                <Drawer variant='permanent' className={classes.drawer} classes={{paper: classes.drawerPaper}}>
                    <Toolbar />
                    <div className={classes.drawerContainer}>
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
                    </div>
                </Drawer>
                <main className={classes.content}>
                    <Toolbar />
                    <Container className={classes.container}>
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
                </main>
            </Router>
        </div>
    )
});

function PeripheralById(props: {pdp8: SoCDP8}) {
    const idString = useParams<{id: string}>().id;
    const id = Number.parseInt(idString);

    return <PeripheralBox model={props.pdp8.getPeripheralById(id)} />;
}

function ConnectingInfo() {
    const classes = useStyles();

    return (
        <main className={classes.content}>
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
