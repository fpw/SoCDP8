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

import FullscreenIcon from "@mui/icons-material/Fullscreen";
import { Box, Card, CardContent, CardHeader, IconButton } from "@mui/material";
import { ReactNode } from "react";
import { Link as RouterLink } from "react-router-dom";
import { DF32Model } from "../../../models/peripherals/DF32Model";
import { KW8IModel } from "../../../models/peripherals/KW8IModel";
import { PC04Model } from "../../../models/peripherals/PC04Model";
import { PeripheralModel } from "../../../models/peripherals/PeripheralModel";
import { PT08Model } from "../../../models/peripherals/PT08Model";
import { RF08Model } from "../../../models/peripherals/RF08Model";
import { RK08Model } from "../../../models/peripherals/RK08Model";
import { RK8EModel } from "../../../models/peripherals/RK8EModel";
import { TC08Model } from "../../../models/peripherals/TC08Model";
import { DF32 } from "./DF32";
import { KW8I } from "./KW8I";
import { PC04 } from "./PC04";
import { PT08 } from "./PT08";
import { RF08 } from "./RF08";
import { RK08 } from "./RK08";
import { RK8E } from "./RK8E";
import { TC08 } from "./TC08";

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
    } else if (model instanceof RK08Model) {
        return <RK08Box model={model} />
    } else if (model instanceof RK8EModel) {
        return <RK8EBox model={model} />
    } else if (model instanceof KW8IModel) {
        return <KW8IBox model={model} />
    } else {
        return <></>;
    }
}

function PT08Box(props: {model: PT08Model}) {
    return (
        <CaptionBox name="Serial Line" model={props.model}>
            <PT08 model={props.model} />
        </CaptionBox>
    );
}

function PC04Box(props: {model: PC04Model}) {
    return (
        <CaptionBox name="PC04 High-Speed Paper-Tape Reader and Punch" model={props.model}>
            <PC04 model={props.model} />
        </CaptionBox>
    );
}

function TC08Box(props: {model: TC08Model}) {
    return (
        <CaptionBox name="TC08 DECtape Control" model={props.model}>
            <TC08
                model={props.model}
            />
        </CaptionBox>
    );
}

function RF08Box(props: {model: RF08Model}) {
    return (
        <CaptionBox name="RF08 Disk Control" model={props.model}>
            <RF08 model={props.model} />
        </CaptionBox>
    );
}

function DF32Box(props: {model: DF32Model}) {
    return (
        <CaptionBox name="DF32 Disk Control" model={props.model}>
            <DF32 model={props.model} />
        </CaptionBox>
    );
}

function RK08Box(props: {model: RK08Model}) {
    return (
        <CaptionBox name="RK08 Disk Control" model={props.model}>
            <RK08 model={props.model} />
        </CaptionBox>
    );
}

function RK8EBox(props: {model: RK8EModel}) {
    return (
        <CaptionBox name="RK8E Disk Control" model={props.model}>
            <RK8E model={props.model} />
        </CaptionBox>
    );
}

function KW8IBox(props: {model: KW8IModel}) {
    return (
        <CaptionBox name="KW8I Real Time Clock" model={props.model}>
            <KW8I model={props.model} />
        </CaptionBox>
    );
}

function CaptionBox(props: {model: PeripheralModel, name: string, children: ReactNode}) {
    const {model, name, children} = props;
    const titleStr = `${name} @ Bus ${model.connections.map(x => x.toString(8)).join(", ")}`;
    return (
        <Box mb={3}>
            <Card variant="outlined">
                <CardHeader
                    title={titleStr}
                    action={
                        <IconButton component={RouterLink} to={`/peripherals/${model.id}`} title="Display only this">
                            <FullscreenIcon />
                        </IconButton>
                    }
                />
                <CardContent>
                    { children }
                </CardContent>
            </Card>
        </Box>
    );
}
