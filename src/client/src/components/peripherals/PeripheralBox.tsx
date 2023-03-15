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

import { Box, Card, CardContent, CardHeader } from "@mui/material";
import { ReactNode } from "react";
import { Link as RouterLink } from "react-router-dom";
import { DF32Model } from "../../models/peripherals/DF32Model";
import { KW8IModel } from "../../models/peripherals/KW8IModel";
import { PC04Model } from "../../models/peripherals/PC04Model";
import { PeripheralModel } from "../../models/peripherals/PeripheralModel";
import { PT08Model } from "../../models/peripherals/PT08Model";
import { RF08Model } from "../../models/peripherals/RF08Model";
import { RK8Model } from "../../models/peripherals/RK8Model";
import { TC08Model } from "../../models/peripherals/TC08Model";
import { DF32 } from "../peripherals/DF32";
import { KW8I } from "../peripherals/KW8I";
import { PC04 } from "../peripherals/PC04";
import { PT08 } from "../peripherals/PT08";
import { RF08 } from "../peripherals/RF08";
import { RK8 } from "../peripherals/RK8";
import { TC08 } from "../peripherals/TC08";

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
        return <></>;
    }
}

function PT08Box(props: {model: PT08Model}) {
    const {model} = props;
    const readerActive = model.useState(state => state.readerActive);
    const punchActive = model.useState(state => state.punchActive);

    return (
        <CaptionBox name='Serial Line' model={model}>
            <PT08
                conf={model.config}
                onConfigChange={conf => void model.updateConfig(conf)}

                readerActive={readerActive}
                readerTape={model.readerTape}
                onReaderTapeLoad={tape => void model.loadTape(tape)}
                onReaderActivationChange={active => void model.setReaderActive(active)}

                punchActive={punchActive}
                punchTape={model.punchTape}
                onPunchActivationChange={active => void model.setPunchActive(active)}
                onPunchClear={() => model.clearPunch()}
                onPunchLeader={() => model.addPunchLeader()}
                onKeyboard={key => void model.onRawKey(key)}

                terminal={model.terminal}
            />
        </CaptionBox>
    );
}

function PC04Box(props: {model: PC04Model}) {
    const {model} = props;
    const readerActive = model.useState(state => state.readerActive);
    const punchActive = model.useState(state => state.punchActive);

    return (
        <CaptionBox name='PC04 High-Speed Paper-Tape Reader and Punch' model={model}>
            <PC04
                conf={model.config}
                onConfigChange={(conf) => void model.updateConfig(conf)}

                readerActive={readerActive}
                readerTape={model.readerTape}
                onReaderTapeLoad={tape => void model.loadTape(tape)}
                onReaderActivationChange={active => void model.setReaderActive(active)}

                punchActive={punchActive}
                punchTape={model.punchTape}
                onPunchActivationChange={active => void model.setPunchActive(active)}
                onPunchClear={() => model.clearPunch()}
                onPunchLeader={() => model.addPunchLeader()}
            />
        </CaptionBox>
    );
}

function TC08Box(props: {model: TC08Model}) {
    const tapes = props.model.useState(state => state.tapes);

    return (
        <CaptionBox name='TC08 DECtape Control' model={props.model}>
            <TC08
                tapes={tapes}
                onTapeLoad={(tape, unit) => void props.model.loadTape(tape, unit)}
            />
        </CaptionBox>
    );
}

function RF08Box(props: {model: RF08Model}) {
    return (
        <CaptionBox name='RF08 Disk Control' model={props.model}>
            <RF08 />
        </CaptionBox>
    );
}

function DF32Box(props: {model: DF32Model}) {
    return (
        <CaptionBox name='DF32 Disk Control' model={props.model}>
            <DF32 />
        </CaptionBox>
    );
}

function RK8Box(props: {model: RK8Model}) {
    return (
        <CaptionBox name='RK8 Disk Control' model={props.model}>
            <RK8 />
        </CaptionBox>
    );
}

function KW8IBox(props: {model: KW8IModel}) {
    return (
        <CaptionBox name='KW8I Real Time Clock' model={props.model}>
            <KW8I />
        </CaptionBox>
    );
}

function CaptionBox(props: {model: PeripheralModel, name: string, children: ReactNode}) {
    const {model, name, children} = props;
    const titleStr = `${name} @ Bus ${model.connections.map(x => x.toString(8)).join(", ")}`;
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
