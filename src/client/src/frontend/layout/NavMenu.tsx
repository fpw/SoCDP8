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

import { List, ListItemButton, ListItemIcon, ListItemText } from "@mui/material";
import { Link as RouterLink } from "react-router-dom";
import InfoIcon from "@mui/icons-material/Info";
import MemoryIcon from "@mui/icons-material/Memory";
import TuneIcon from "@mui/icons-material/Tune";
import FormatListNumberedIcon from "@mui/icons-material/FormatListNumbered";

export function NavMenu() {
    return (
        <List component="nav">
            <ListItemButton component={RouterLink} to="/machines/active">
                <ListItemIcon title="Active Machine"><MemoryIcon /></ListItemIcon>
                <ListItemText primary="Active Machine" />
            </ListItemButton>
            <ListItemButton component={RouterLink} to="/machines">
                <ListItemIcon title="Manage Machines"><TuneIcon /></ListItemIcon>
                <ListItemText primary="Manage Machines" />
            </ListItemButton>
            <ListItemButton component={RouterLink} to="/code">
                <ListItemIcon title="Code Editor"><FormatListNumberedIcon /></ListItemIcon>
                <ListItemText primary="Code Editor" />
            </ListItemButton>
            <ListItemButton component={RouterLink} to="/about">
                <ListItemIcon title="About"><InfoIcon /></ListItemIcon>
                <ListItemText primary="About" />
            </ListItemButton>
        </List>
    );
}
