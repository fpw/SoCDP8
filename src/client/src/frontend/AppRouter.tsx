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

import { createBrowserRouter, Navigate } from "react-router-dom";
import { SocketBackend } from "../models/backends/socket/SocketBackend";
import { WasmBackend } from "../models/backends/wasm/WasmBackend";
import { SoCDP8 } from "../models/SoCDP8";
import { SystemPage } from "./pages/SystemPage";
import { SystemListPage } from "./pages/SystemListPage";
import { AppLayout } from "./layout/AppLayout";
import { AboutPage } from "./pages/AboutPage";
import { PeripheralPage } from "./pages/PeripheralPage";

let url = "";
if (window.location.toString().includes("localhost")) {
    url = "http://192.168.178.68:8000/"
}

let backend;
if (true) {
    backend = new WasmBackend();
} else {
    backend = new SocketBackend(url);
}
const pdp8 = new SoCDP8(backend);

export const appRouter = createBrowserRouter([
    {
        path: "/",
        element: <AppLayout pdp8={pdp8} />,
        children: [
            { path: "", element: <Navigate to="/machines/active" />,  },
            { path: "about", element: <AboutPage />,  },
            { path: "machines", children: [
                {
                    path: "", element: <SystemListPage pdp8={pdp8} />,
                },
                {
                    path: "active", element: <SystemPage pdp8={pdp8} />,
                },
            ]},
            { path: "peripherals", children: [
                {
                    path: ":id", element: <PeripheralPage pdp8={pdp8} />,
                },
            ]},
        ],
    },
]);
