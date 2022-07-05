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
import { observer } from "mobx-react-lite";
import { PT08Model } from '../../models/peripherals/PT08Model';
import { PT08 } from "../peripherals/PT08";
import { PC04Model } from '../../models/peripherals/PC04Model';
import { PC04 } from "../peripherals/PC04";
import { TC08Model } from '../../models/peripherals/TC08Model';
import { TC08 } from '../peripherals/TC08';
import { PeripheralModel } from '../../models/peripherals/PeripheralModel';
import { RF08 } from '../peripherals/RF08';
import { RF08Model } from '../../models/peripherals/RF08Model';
import { DF32Model } from '../../models/peripherals/DF32Model';
import { DF32 } from '../peripherals/DF32';
import { RK8Model } from '../../models/peripherals/RK8Model';
import { RK8 } from '../peripherals/RK8';
import { KW8IModel } from '../../models/peripherals/KW8IModel';
import { KW8I } from '../peripherals/KW8I';

import { Link as RouterLink } from 'react-router-dom';
import { Box, Card, CardHeader, CardContent } from '@mui/material';

export function PeripheralBox(props: {model: PeripheralModel}) {
    const model = props.model;

    if (model instanceof PT08Model) {
        return <PT08Box model={model} />
    } else if (model instanceof PC04Model) {
        return <PC04Box model={model} />
    } else if (model instanceof TC08Model) {
        return <TC08Box model={model} />
    } else if (model instanceof RF08Model) {
        return <RF08Box model={model} />
    } else if (model instanceof DF32Model) {
        return <DF32Box model={model} />
    } else if (model instanceof RK8Model) {
        return <RK8Box model={model} />
    } else if (model instanceof KW8IModel) {
        return <KW8IBox model={model} />
    } else {
        return <div />;
    }
}

 const PT08Box: React.FunctionComponent<{model: PT08Model}> = observer(({model}) =>
    <CaptionBox name='Serial Line' model={model}>
        <PT08
            conf={model.config}
            onConfigChange={conf => model.updateConfig(conf)}

            readerActive={model.readerActive}
            readerTape={model.readerTape}
            onReaderTapeLoad={tape => model.loadTape(tape)}
            onReaderActivationChange={active => model.setReaderActive(active)}

            punchActive={model.punchActive}
            punchTape={model.punchTape}
            onPunchActivationChange={active => model.setPunchActive(active)}
            onPunchClear={() => model.clearPunch()}
            onPunchLeader={() => model.addPunchLeader()}
            onKeyboard={key => model.onRawKey(key)}

            terminal={model.terminal}
        />
    </CaptionBox>);

const PC04Box: React.FunctionComponent<{model: PC04Model}> = observer(({model}) =>
    <CaptionBox name='PC04 High-Speed Paper-Tape Reader and Punch' model={model}>
        <PC04
            conf={model.config}
            onConfigChange={(conf) => model.updateConfig(conf)}

            readerActive={model.readerActive}
            readerTape={model.readerTape}
            onReaderTapeLoad={tape => model.loadTape(tape)}
            onReaderActivationChange={active => model.setReaderActive(active)}

            punchActive={model.punchActive}
            punchTape={model.punchTape}
            onPunchActivationChange={active => model.setPunchActive(active)}
            onPunchClear={() => model.clearPunch()}
            onPunchLeader={() => model.addPunchLeader()}
        />
    </CaptionBox>);

const TC08Box: React.FunctionComponent<{model: TC08Model}> = observer(({model}) =>
    <CaptionBox name='TC08 DECtape Control' model={model}>
        <TC08
            leftTape={model.getTape(0)}
            rightTape={model.getTape(1)}
            onTapeLoad={model.loadTape}
        />
    </CaptionBox>);

const RF08Box: React.FunctionComponent<{model: RF08Model}> = observer(({model}) =>
    <CaptionBox name='RF08 Disk Control' model={model}>
        <RF08 />
    </CaptionBox>);

const DF32Box: React.FunctionComponent<{model: DF32Model}> = observer(({model}) =>
    <CaptionBox name='DF32 Disk Control' model={model}>
        <DF32 />
    </CaptionBox>);

const RK8Box: React.FunctionComponent<{model: RK8Model}> = observer(({model}) =>
    <CaptionBox name='RK8 Disk Control' model={model}>
        <RK8 />
    </CaptionBox>);

const KW8IBox: React.FunctionComponent<{model: KW8IModel}> = observer(({model}) =>
    <CaptionBox name='KW8I Real Time Clock' model={model}>
        <KW8I />
    </CaptionBox>);

function CaptionBox(props: {model: PeripheralModel, name: string, children: React.ReactNode}) {
    const {model, name, children} = props;
    const titleStr = `${name} @ Bus ${model.connections.map(x => x.toString(8)).join(', ')}`;
    return (
        <Box mb={4}>
            <Card variant='outlined'>
                <CardHeader component={RouterLink} to={`/peripherals/${model.config.id}`} title={titleStr} />
                <CardContent>
                    { children }
                </CardContent>
            </Card>
        </Box>
    );
}
