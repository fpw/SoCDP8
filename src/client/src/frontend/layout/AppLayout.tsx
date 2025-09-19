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

import { ActionIcon, Anchor, AppShell, Box, Burger, Flex, Group, Text, Title, useMantineColorScheme } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { IconMoon, IconSun } from "@tabler/icons-react";
import React from "react";
import { Outlet, Link } from "react-router-dom";
import { SoCDP8 } from "../../models/SoCDP8";
import { NavMenu } from "./NavMenu";

export function AppLayout(props: { pdp8: SoCDP8 }) {
    const [isOpen, { toggle, close }] = useDisclosure();
    const { toggleColorScheme, colorScheme } = useMantineColorScheme();
    const sys = props.pdp8.useStore(state => state.activeSystem);

    if (!sys) {
        return <ConnectingInfo />;
    }

    return (<>
        <AppShell
            header={{ height: 60 }}
            navbar={{
                width: 200,
                breakpoint: "sm",
                collapsed: { mobile: !isOpen }
            }}
            padding="md"
        >
            <AppShell.Header p="xs">
                <Flex justify="space-between">
                    <Burger
                        opened={isOpen}
                        onClick={toggle}
                        hiddenFrom="sm"
                        size="sm"
                    >
                    </Burger>
                    <Title order={2}>
                        <Anchor component={Link} to="/" inherit>SoCDP-8</Anchor>
                    </Title>
                    <ActionIcon variant="transparent" onClick={toggleColorScheme}>{ colorScheme == "dark" ? <IconSun /> : <IconMoon />}</ActionIcon>
                </Flex>
            </AppShell.Header>
            <AppShell.Navbar p="md">
                <NavMenu onClick={() => close()}/>
            </AppShell.Navbar>
            <AppShell.Main>
                <React.Suspense fallback={<>Loading...</>}>
                    <Outlet />
                </React.Suspense>
            </AppShell.Main>
            <AppShell.Footer>
                <Copyright />
            </AppShell.Footer>
        </AppShell>
    </>);
}

function ConnectingInfo() {
    return (
        <>
            <Box>
                <Text component="h1" variant="h2">
                    Connecting...
                </Text>
                <Text>
                    Please wait
                </Text>
            </Box>
            <Copyright />
        </>
    );
};

function Copyright() {
    return (
        <Text>
            ©&nbsp;
            <Link to="https://github.com/fpw/socdp8" target="_blank">
                Folke Will
            </Link>, 2024
        </Text>
    );
}
