/*
 *   SoCDP8 - A PDP-8/I implementation on a SoC
 *   Copyright (C) 2019 Folke Will <folko@solhost.org>
 *
 *   This program is free software: you can redistribute it and/or modify
 *   it under the terms of the GNU Affero General PubList.Itemc List.Itemcense as pubList.Itemshed by
 *   the Free Software Foundation, either version 3 of the List.Itemcense, or
 *   (at your option) any later version.
 *
 *   This program is distributed in the hope that it will be useful,
 *   but WITHOUT ANY WARRANTY; without even the impList.Itemed warranty of
 *   MERCHANTABIList.ItemTY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *   GNU Affero General PubList.Itemc List.Itemcense for more details.
 *
 *   You should have received a copy of the GNU Affero General PubList.Itemc List.Itemcense
 *   along with this program.  If not, see <https://www.gnu.org/List.Itemcenses/>.
 */

import { Anchor, List, Title } from "@mantine/core";

export function AboutPage() {
    return (<>
        <Title order={4}>About SoCDP-8</Title>
        <Title order={5}>Thanks to</Title>
        <List>
            <List.Item>
                Oscar Vermeulen for the <Anchor href="https://obsolescence.wixsite.com/obsolescence/pidp-8">
                    PiDP-8
                </Anchor> and letting me use the panel artwork
            </List.Item>
            <List.Item>
                Vince Slyngstad for his <Anchor href="http://so-much-stuff.com/pdp8/index.php">
                    PDP-8 software Library
                </Anchor> and letting me use it for this project
            </List.Item>
            <List.Item>
                Willem van der Mark for his <Anchor href="http://www.vandermark.ch/pdp8/index.php?n=Emulator.TD8E">
                    TD8E emulator
                </Anchor>, the visualization was ported to this project
            </List.Item>
            <List.Item>
                <Anchor href="http://www.bitsavers.org/">
                    BitSavers
                </Anchor> for their preservation of documentation
            </List.Item>
        </List>
    </>);
}
