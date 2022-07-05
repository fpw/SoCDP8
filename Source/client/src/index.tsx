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

import ReactDOM from 'react-dom';
import { App } from "./components/App";
import { SocketBackend } from './models/backends/socket/SocketBackend';
import { WasmBackend } from './models/backends/wasm/WasmBackend';
import { SoCDP8 } from './models/SoCDP8';

let url = "";
if (window.location.toString().includes("localhost")) {
    url = "http://192.168.178.68:8000/"
}
// const backend = new SocketBackend(url);
const backend = new WasmBackend();
const pdp8 = new SoCDP8(backend);

ReactDOM.render((
    <App pdp8={pdp8} />
), document.getElementById("app"));
