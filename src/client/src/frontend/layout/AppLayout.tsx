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

import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import MenuIcon from "@mui/icons-material/Menu";
import { Box, Container, CssBaseline, Divider, IconButton, Link, Toolbar, Typography } from "@mui/material";
import { useState } from "react";
import { Link as RouterLink, Outlet } from "react-router-dom";
import { SoCDP8 } from "../../models/SoCDP8";
import { AppBar } from "./AppBar";
import { Drawer } from "./Drawer";
import { NavMenu } from "./NavMenu";

export function AppLayout(props: { pdp8: SoCDP8 }) {
    const [drawerOpen, setDrawerOpen] = useState(false);
    const sys = props.pdp8.useStore(state => state.activeSystem);

    const toggleDrawerOpen = () => {
        setDrawerOpen(!drawerOpen);
    };

    if (!sys) {
        return <ConnectingInfo />;
    }

    return (<>
        <CssBaseline />
        <Box sx={{ display: "flex" }}>
            <AppBar position="absolute" open={drawerOpen}>
                <Toolbar sx={{ pr: "24px" }}>
                    <IconButton
                        sx={{ marginRight: "36px", ...(drawerOpen && { display: "none" }) }}
                        edge="start"
                        color="inherit"
                        onClick={toggleDrawerOpen}
                        size="large"
                    >
                        <MenuIcon />
                    </IconButton>
                    <Typography component="h1" variant="h6" color="inherit" noWrap sx={{ flexGrow: 1 }}>
                        <Link color="inherit" underline="none" component={RouterLink} to="/">
                            SoCDP-8
                        </Link>
                    </Typography>
                </Toolbar>
            </AppBar>
            <Drawer variant="permanent" open={drawerOpen}>
                <Toolbar
                    sx={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "flex-end",
                        px: [1],
                    }}
                >
                    <IconButton onClick={toggleDrawerOpen}>
                        <ChevronLeftIcon />
                    </IconButton>
                </Toolbar>
                <Divider />
                <NavMenu />
            </Drawer>
            <Box
                component="main"
                sx={{
                    backgroundColor: (theme) =>
                        theme.palette.mode == "light" ?
                            theme.palette.grey[100] :
                            theme.palette.grey[900],
                    flexGrow: 1,
                    height: "100vh",
                    overflow: "auto"
                }}
            >
                <Toolbar />
                <Container maxWidth="lg" sx={{ mt: 4 }}>
                    <Outlet />
                </Container>
                <Copyright />
            </Box>
        </Box>
    </>);
}

function ConnectingInfo() {
    return (
        <>
            <Container maxWidth="lg">
                <Typography component="h1" variant="h2">
                    Connecting...
                </Typography>
                <Typography>
                    Please wait
                </Typography>
            </Container>
            <Copyright />
        </>
    );
};

function Copyright() {
    return (
        <Typography variant="body2" color="textSecondary" align="center">
            ©&nbsp;
            <Link component={RouterLink} to="https://github.com/fpw/socdp8" target="_blank">
                Folke Will
            </Link>, 2023
        </Typography>
    );
}
