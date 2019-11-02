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
import { FrontPanel } from "./FrontPanel";
import { ASR33 } from "../peripherals/ASR33";
import { PR8 } from "../peripherals/PR8";
import { PDP8Model } from '../../models/PDP8Model';
import { inject, observer } from "mobx-react";
import { ASR33Model } from '../../models/peripherals/ASR33Model';
import { PR8Model } from '../../models/peripherals/PR8Model';
import { TC08Model } from '../../models/peripherals/TC08Model';
import { TC08 } from '../peripherals/TC08';

export interface PDP8Props {
    pdp8?: PDP8Model;
}

@inject('pdp8')
@observer
export class PDP8 extends React.PureComponent<PDP8Props> {
    constructor(props: PDP8Props) {
        super(props);
    }

    public render(): JSX.Element {
        const pdp8 = this.props.pdp8!;

        if (!pdp8.ready) {
            return <section>Loading...</section>;
        }

        const peripherals = pdp8.peripheralModels;
        const components = peripherals.map(dev => {
            if (dev instanceof ASR33Model) {
                return (
                    <div className='box'>
                        <h1 className='title'>ASR-33</h1>
                        <ASR33
                            onReaderKey={dev.appendReaderKey.bind(dev)}
                            onReaderClear={dev.clearPunch.bind(dev)}
                            onTapeLoad={dev.loadTape.bind(dev)}
                            punchData={dev.punchOutput} />
                    </div>
                );
            } else if (dev instanceof PR8Model) {
                return (
                    <div className='box'>
                        <h1 className='title'>PR-8/I</h1>
                        <PR8 onTapeLoad={dev.loadTape.bind(dev)} />
                    </div>
                );
            } else if (dev instanceof TC08Model) {
                return (
                    <div className='box'>
                        <h1 className='title'>TC08</h1>
                        <TC08 />
                    </div>
                );
            }
        });

        return (
            <section className='section'>
                <div className='container'>
                    <div className='box'>
                        <h1 className='title'>PDP-8/I</h1>
                        <FrontPanel lamps={pdp8.panel.lamps}
                                    switches={pdp8.panel.switches}
                                    onSwitch={pdp8.setPanelSwitch.bind(pdp8)}
                        />
                    </div>
                    { components }
                </div>
            </section>
        );
    }
}
