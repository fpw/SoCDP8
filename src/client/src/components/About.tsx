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

import { Typography } from "@mui/material";

export function About() {
  return (
    <>
        <Typography component='h1' variant='h4'>About SoCDP-8</Typography>
          <Typography component='h2' variant='h6'>Thanks to</Typography>
          <ul>
            <li>
              Oscar Vermeulen for the <a href='https://obsolescence.wixsite.com/obsolescence/pidp-8'>PiDP-8</a> and letting me use the panel artwork
            </li>
            <li>
              Vince Slyngstad for his <a href='http://so-much-stuff.com/pdp8/index.php'>PDP-8 software library</a> and letting me use it for this project
            </li>
            <li>
              Willem van der Mark for his <a href='http://www.vandermark.ch/pdp8/index.php?n=Emulator.TD8E'>TD8E emulator</a>, the visualization was ported to this project
            </li>
            <li>
              <a href='http://www.bitsavers.org/'>BitSavers</a> for their preservation of documentation
            </li>
          </ul>
    </>
  );
}
