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

import { SoCDP8 } from '../../models/SoCDP8';
import { FrontPanelBox } from '../frontpanel/FrontPanelBox';
import { PeripheralBox } from '../peripherals/PeripheralBox';

import React from 'react';
import { observer } from "mobx-react-lite";
import { Typography } from '@mui/material';

export interface SystemProps {
    pdp8: SoCDP8;
}

export const System: React.FunctionComponent<SystemProps> = observer(props => {
    return (
        <React.Fragment>
            <Typography component='h1' variant='h4' gutterBottom>
                System: {props.pdp8.activeSystem.name}
            </Typography>

            <FrontPanelBox pdp8={props.pdp8} />

            { props.pdp8.peripherals.map((dev, i) => <PeripheralBox key={i} model={dev} />) }
        </React.Fragment>
    );
});
