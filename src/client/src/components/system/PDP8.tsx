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
import { PR8Model } from '../../models/peripherals/PR8Model';
import { PR8 } from "../peripherals/PR8";
import { TC08Model } from '../../models/peripherals/TC08Model';
import { TC08 } from '../peripherals/TC08';
import { PDP8Model } from '../../models/PDP8Model';
import { PeripheralModel } from '../../models/peripherals/PeripheralModel';

export interface PDP8Props {
    pdp8: PDP8Model;
}

export const PDP8: React.FunctionComponent<PDP8Props> = observer((props) =>
    <section className='section'>
        <div className='container'>
            <div className='box'>
                <h1 className='title'>PDP-8/I</h1>
                <FrontPanel lamps={props.pdp8.panel.lamps}
                            switches={props.pdp8.panel.switches}
                            onSwitch={props.pdp8.setPanelSwitch.bind(props.pdp8)}
                />
            </div>
            <PeripheralList list={props.pdp8.peripherals} />
        </div>
    </section>);

const PeripheralList: React.FunctionComponent<{list: PeripheralModel[]}> = ({list}) => {
    const components = list.map(dev => {
        if (dev instanceof ASR33Model) {
            return <ASR33Box model={dev} />
        } else if (dev instanceof PR8Model) {
            return <PR8Box model={dev} />
        } else if (dev instanceof TC08Model) {
            return <TC08Box model={dev} />
        } else {
            return <div />;
        }
    });
    return <React.Fragment>{components}</React.Fragment>
}

const PeripheralBox: React.FunctionComponent<{name: string, children: React.ReactNode}> = ({name, children}) =>
    <div className='box'>
        <h1 className='title'>{name}</h1>
        { children }
    </div>

const ASR33Box: React.FunctionComponent<{model: ASR33Model}> = observer(({model}) =>
    <PeripheralBox name='ASR-33'>
        <ASR33
            onReaderKey={model.appendReaderKey}
            onReaderClear={model.clearPunch}
            onTapeLoad={model.loadTape}
            punchData={model.punchOutput} />
    </PeripheralBox>);

const PR8Box: React.FunctionComponent<{model: PR8Model}> = observer(({model}) =>
    <PeripheralBox name='PR-8/I'>
        <PR8 onTapeLoad={model.loadTape} />
    </PeripheralBox>);

const TC08Box: React.FunctionComponent<{model: TC08Model}> = observer(({model}) =>
    <PeripheralBox name='TC08'>
        <TC08 />
    </PeripheralBox>);
