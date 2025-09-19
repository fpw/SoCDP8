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

import { Anchor, Title } from "@mantine/core";

export function AboutPage() {
    return (<>
        <Title order={4}>About SoCDP-8</Title>
        <Title order={6}>Thanks to</Title>
        <ul>
            <li>
                Oscar Vermeulen for the <Anchor href="https://obsolescence.wixsite.com/obsolescence/pidp-8">
                    PiDP-8
                </Anchor> and letting me use the panel artwork
            </li>
            <li>
                Vince Slyngstad for his <Anchor href="http://so-much-stuff.com/pdp8/index.php">
                    PDP-8 software library
                </Anchor> and letting me use it for this project
            </li>
            <li>
                Willem van der Mark for his <Anchor href="http://www.vandermark.ch/pdp8/index.php?n=Emulator.TD8E">
                    TD8E emulator
                </Anchor>, the visualization was ported to this project
            </li>
            <li>
                <Anchor href="http://www.bitsavers.org/">
                    BitSavers
                </Anchor> for their preservation of documentation
            </li>
        </ul>
    </>);
}
