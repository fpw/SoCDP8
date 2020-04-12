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

import * as React from 'react';
import { Machine } from './system/Machine';
import { PDP8Model } from '../models/PDP8Model';
import { observer } from 'mobx-react-lite';
import { HashRouter as Router, Route, Link as RouterLink, Switch, Redirect } from 'react-router-dom';
import { About } from './system/About';
import { MachineManager } from './system/MachineManager';
import { CssBaseline, AppBar, Toolbar, Typography, Drawer, ListItem, ListItemText, List, Divider, Container, Grid, Link, Box } from '@material-ui/core'
import { makeStyles, createStyles } from '@material-ui/core/styles';

const drawerWidth = 240;
const useStyles = makeStyles(theme => createStyles({
    root: {
        display: 'flex',
    },
    appBar: {
        width: `calc(100% - ${drawerWidth}px)`,
        marginLeft: drawerWidth,
    },
    drawer: {
        width: drawerWidth,
        flexShrink: 0,
    },
    drawerPaper: {
        width: drawerWidth,
    },
    content: {
        flexGrow: 1
    },
    container: {
        paddingTop: theme.spacing(4),
        paddingBottom: theme.spacing(4),
    },
    toolbar: theme.mixins.toolbar,
}));

export interface AppProps {
    pdp8: PDP8Model;
}

export const App: React.FunctionComponent<AppProps> = props => {
    const classes = useStyles();

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
            <ConnectedMachine pdp8={props.pdp8} />
        </div>
    )
};

const ConnectedMachine: React.FunctionComponent<AppProps> = observer(props => {
    if (!props.pdp8.ready) {
        return <ConnectingInfo />;
    } else {
        return <MainApp pdp8={props.pdp8} />
    }
});

const ConnectingInfo: React.FunctionComponent = () => {
    const classes = useStyles();
    return (
        <main className={classes.content}>
            <div className={classes.toolbar} />
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

const MainApp: React.FunctionComponent<AppProps> = observer(props => {
    const classes = useStyles();

    return (
        <Router>
            <Drawer variant='permanent' anchor='left' className={classes.drawer} classes={{paper: classes.drawerPaper}}>
                <div className={classes.toolbar} />
                <Divider />
                <List>
                    <ListItem>
                        <ListItemText>
                            <Link component={RouterLink} to='/machine'>Show Active Machine</Link>
                        </ListItemText>
                    </ListItem>
                    <ListItem>
                        <ListItemText>
                            <Link component={RouterLink} to='/machines'>Manage Machines</Link>
                        </ListItemText>
                    </ListItem>
                    <ListItem>
                        <ListItemText>
                            <Link component={RouterLink} to='/about'>About</Link>
                        </ListItemText>
                    </ListItem>
                </List>
            </Drawer>
            <main className={classes.content}>
                <div className={classes.toolbar} />
                <Container maxWidth='lg' className={classes.container}>
                    <Switch>
                        <Route exact path="/">
                        <Redirect to="/machine" />
                        </Route>
                        <Route path="/machine">
                        <Machine pdp8={props.pdp8} />
                        </Route>
                        <Route path="/machines">
                        <MachineManager pdp8={props.pdp8}/>
                        </Route>
                        <Route path="/about">
                        <About />
                        </Route>
                    </Switch>
                </Container>
                <Copyright />
            </main>
        </Router>
    );
});

const Copyright: React.FunctionComponent = () =>
    <Box pt={4}>
        <Typography variant='body2' color='textSecondary' align='center'>
            Copyright © Folke Will, 2020
        </Typography>
    </Box>
