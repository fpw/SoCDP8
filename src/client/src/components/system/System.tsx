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
import { FrontPanel } from "./FrontPanel";
import { PT08Model } from '../../models/peripherals/PT08Model';
import { PT08 } from "../peripherals/PT08";
import { PC04Model } from '../../models/peripherals/PC04Model';
import { PC04 } from "../peripherals/PC04";
import { TC08Model } from '../../models/peripherals/TC08Model';
import { TC08 } from '../peripherals/TC08';
import { SoCDP8 } from '../../models/SoCDP8';
import { PeripheralModel } from '../../models/peripherals/PeripheralModel';
import { RF08 } from '../peripherals/RF08';
import { RF08Model } from '../../models/peripherals/RF08Model';
import { DF32Model } from '../../models/peripherals/DF32Model';
import { DF32 } from '../peripherals/DF32';
import { RK8Model } from '../../models/peripherals/RK8Model';
import { RK8 } from '../peripherals/RK8';
import { KW8IModel } from '../../models/peripherals/KW8IModel';
import { KW8I } from '../peripherals/KW8I';
import { ProgramSnippets, ProgramSnippet } from '../../models/ProgramSnippets';

import Typography from '@material-ui/core/Typography';
import Box from '@material-ui/core/Box';
import Card from "@material-ui/core/Card";
import CardHeader from "@material-ui/core/CardHeader";
import CardMedia from "@material-ui/core/CardMedia";
import CardActions from "@material-ui/core/CardActions";
import Button from "@material-ui/core/Button";
import CardContent from "@material-ui/core/CardContent";
import ButtonGroup from '@material-ui/core/ButtonGroup';
import Dialog from '@material-ui/core/Dialog';
import ListItemText from '@material-ui/core/ListItemText';
import DialogTitle from '@material-ui/core/DialogTitle';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';

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

            <PeripheralList list={props.pdp8.peripherals} />
        </React.Fragment>
    );
});

const FrontPanelBox: React.FunctionComponent<SystemProps> = observer(props => {
    const [busy, setBusy] = React.useState<boolean>(false);
    const [showSnippets, setShowSnippets] = React.useState<boolean>(false);

    return (
        <Box mb={4}>
            <Card variant='outlined'>
                <CardHeader title='PDP-8/I' />
                <CardMedia>
                    <FrontPanel lamps={props.pdp8.panel.lamps}
                                switches={props.pdp8.panel.switches}
                                onSwitch={props.pdp8.setPanelSwitch.bind(props.pdp8)}
                    />
                </CardMedia>
                <CardActions>
                    <ButtonGroup color='primary' variant='outlined'>
                        <Button onClick={async () => {
                                    setBusy(true);
                                    await props.pdp8.saveCurrentState();
                                    setBusy(false);
                                }}
                                disabled={busy}
                        >
                            Save State
                        </Button>

                        <Button onClick={() => setShowSnippets(true)}>
                            Load Snippet
                        </Button>

                        <Button onClick={() => props.pdp8.core.clear()}>
                            Clear Core
                        </Button>
                    </ButtonGroup>
                    <SnippetDialog
                            open={showSnippets}
                            onClose={() => setShowSnippets(false)}
                            onSelect={(snippet) => {
                                props.pdp8.core.write(snippet.start, snippet.data);
                                setShowSnippets(false);
                            }}
                    />
                </CardActions>
            </Card>
        </Box>
    );
});

const SnippetDialog: React.FunctionComponent<{onSelect: ((s: ProgramSnippet) => void), open: boolean, onClose: (() => void)}> = (props) => {
    return (
        <Dialog open={props.open} onClose={props.onClose}>
            <DialogTitle>Select Snippet</DialogTitle>
            <List>
                { ProgramSnippets.map(snippet =>
                    <ListItem button onClick={() => props.onSelect(snippet)}>
                        <ListItemText primary={snippet.label} secondary={snippet.desc} />
                    </ListItem>
            )};
            </List>
        </Dialog>
    );
};

const PeripheralList: React.FunctionComponent<{list: PeripheralModel[]}> = ({list}) => {
    const components = list.map(dev => {
        if (dev instanceof PT08Model) {
            return <PT08Box model={dev} />
        } else if (dev instanceof PC04Model) {
            return <PC04Box model={dev} />
        } else if (dev instanceof TC08Model) {
            return <TC08Box model={dev} />
        } else if (dev instanceof RF08Model) {
            return <RF08Box model={dev} />
        } else if (dev instanceof DF32Model) {
            return <DF32Box model={dev} />
        } else if (dev instanceof RK8Model) {
            return <RK8Box model={dev} />
        } else if (dev instanceof KW8IModel) {
            return <KW8IBox model={dev} />
        } else {
            return <div />;
        }
    });
    return <React.Fragment>{components}</React.Fragment>
}

const PT08Box: React.FunctionComponent<{model: PT08Model}> = observer(({model}) =>
    <PeripheralBox name='Serial Line' model={model}>
        <PT08
            conf={model.config}
            onConfigChange={conf => model.updateConfig(conf)}

            readerTape={model.readerTape}

            terminal={model.terminal}

            onTapeLoad={model.loadTape}

            onReaderActivationChange={active => model.setReaderActive(active)}
            readerActive={model.readerActive}
        />
    </PeripheralBox>);

const PC04Box: React.FunctionComponent<{model: PC04Model}> = observer(({model}) =>
    <PeripheralBox name='PC04 High-Speed Paper-Tape Reader and Punch' model={model}>
        <PC04 onTapeLoad={model.loadTape} punchData={model.punchOutput} clearPunch={model.clearPunch} />
    </PeripheralBox>);

const TC08Box: React.FunctionComponent<{model: TC08Model}> = observer(({model}) =>
    <PeripheralBox name='TC08 DECtape Control' model={model}>
        <TC08 onTapeLoad={model.loadTape} />
    </PeripheralBox>);

const RF08Box: React.FunctionComponent<{model: RF08Model}> = observer(({model}) =>
    <PeripheralBox name='RF08 Disk Control' model={model}>
        <RF08 />
    </PeripheralBox>);

const DF32Box: React.FunctionComponent<{model: DF32Model}> = observer(({model}) =>
    <PeripheralBox name='DF32 Disk Control' model={model}>
        <DF32 />
    </PeripheralBox>);

const RK8Box: React.FunctionComponent<{model: RK8Model}> = observer(({model}) =>
    <PeripheralBox name='RK8 Disk Control' model={model}>
        <RK8 />
    </PeripheralBox>);

const KW8IBox: React.FunctionComponent<{model: KW8IModel}> = observer(({model}) =>
    <PeripheralBox name='KW8I Real Time Clock' model={model}>
        <KW8I />
    </PeripheralBox>);

const PeripheralBox: React.FunctionComponent<{model: PeripheralModel, name: string, children: React.ReactNode}> = ({model, name, children}) =>
    <Box mb={4}>
        <Card variant='outlined'>
            <CardHeader title={`${name} @ Bus ${model.connections.map(x => x.toString(8)).join(', ')}`}/>
            <CardContent>
                { children }
            </CardContent>
        </Card>
    </Box>
