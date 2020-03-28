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

import * as React from "react";
import { observer } from "mobx-react-lite";
import { FrontPanel } from "./FrontPanel";
import { ASR33Model } from '../../models/peripherals/ASR33Model';
import { ASR33 } from "../peripherals/ASR33";
import { PC04Model } from '../../models/peripherals/PC04Model';
import { PC04 } from "../peripherals/PC04";
import { TC08Model } from '../../models/peripherals/TC08Model';
import { TC08 } from '../peripherals/TC08';
import { PDP8Model } from '../../models/PDP8Model';
import { PeripheralModel } from '../../models/peripherals/PeripheralModel';
import { RF08 } from '../peripherals/RF08';
import { RF08Model } from '../../models/peripherals/RF08Model';
import { DF32Model } from '../../models/peripherals/DF32Model';
import { DF32 } from '../peripherals/DF32';
import { RK8Model } from '../../models/peripherals/RK8Model';
import { RK8 } from '../peripherals/RK8';
import { KW8IModel } from '../../models/peripherals/KW8IModel';
import { KW8I } from '../peripherals/KW8I';

export interface PDP8Props {
    pdp8: PDP8Model;
}

export const PDP8: React.FunctionComponent<PDP8Props> = observer((props) =>
    <section className='section container'>
        <div className='panel is-primary'>
            <p className='panel-heading'>PDP-8/I</p>
            <FrontPanel lamps={props.pdp8.panel.lamps}
                            switches={props.pdp8.panel.switches}
                            onSwitch={props.pdp8.setPanelSwitch.bind(props.pdp8)}
                />
        </div>
        <PeripheralList list={props.pdp8.peripherals} />
    </section>);

const PeripheralList: React.FunctionComponent<{list: PeripheralModel[]}> = ({list}) => {
    const components = list.map(dev => {
        if (dev instanceof ASR33Model) {
            return <ASR33Box model={dev} />
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

const PeripheralBox: React.FunctionComponent<{model: PeripheralModel, name: string, children: React.ReactNode}> = ({model, name, children}) =>
    <section className='panel is-primary'>
        <p className='panel-heading'>
            {name} @ Bus {model.connections.map(x => x.toString(8)).join(', ')}
        </p>
        <div className='panel-block'>
            <div className='container'>
                { children }
            </div>
        </div>
    </section>

const ASR33Box: React.FunctionComponent<{model: ASR33Model}> = observer(({model}) =>
    <PeripheralBox name='ASR-33 Teletype' model={model}>
        <ASR33
            onReaderKey={model.appendReaderKey}
            onReaderClear={model.clearPunch}
            onTapeLoad={model.loadTape}
            punchData={model.punchOutput}
            onReaderActivationChange={model.setReaderActive}
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
        <RF08 onFlush={model.flushData} />
    </PeripheralBox>);

const DF32Box: React.FunctionComponent<{model: DF32Model}> = observer(({model}) =>
    <PeripheralBox name='DF32 Disk Control' model={model}>
        <DF32 onFlush={model.flushData} />
    </PeripheralBox>);

const RK8Box: React.FunctionComponent<{model: RK8Model}> = observer(({model}) =>
    <PeripheralBox name='RK8 Disk Control' model={model}>
        <RK8 onFlush={model.flushData} />
    </PeripheralBox>);

const KW8IBox: React.FunctionComponent<{model: KW8IModel}> = observer(({model}) =>
    <PeripheralBox name='KW8I Real Time Clock' model={model}>
        <KW8I />
    </PeripheralBox>);
