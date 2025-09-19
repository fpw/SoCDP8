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

import { NavLink } from "@mantine/core";
import { IconAdjustmentsHorizontal, IconCode, IconCpu, IconInfoCircle } from "@tabler/icons-react";
import { Link } from "react-router";

export function NavMenu(props: { onClick: () => void }) {
    const links: [string, string, React.ReactNode][] = [
        ["Active Machine", "/machines/active", <IconCpu />],
        ["Machiness", "/machines", <IconAdjustmentsHorizontal />],
        ["Code", "/code", <IconCode />],
        ["About", "/about", <IconInfoCircle />],
    ];

    return (<>
        { links.map(l =>
            <NavLink
                key={l[0]}
                component={Link}
                label={l[0]}
                to={l[1]}
                leftSection={l[2]}
                onClick={ev => {
                    props.onClick();
                }}
            />
        )}
    </>);
}
