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

import { createBrowserRouter, Navigate } from "react-router";
import { getBackend } from "../models/getBackend";
import { AppLayout } from "./layout/AppLayout";
import { AboutPage } from "./pages/AboutPage";
import { PeripheralPage } from "./pages/PeripheralPage";
import { SystemListPage } from "./pages/SystemListPage";
import { SystemPage } from "./pages/SystemPage";
import { CodePage } from "./pages/CodePage";

const pdp8 = getBackend();

export const appRouter = createBrowserRouter([
    {
        path: "/",
        loader: getBackend,
        element: <AppLayout pdp8={pdp8} />,
        children: [
            { path: "", element: <Navigate to="/machines/active" />,  },
            { path: "about", element: <AboutPage />,  },
            { path: "code", element: <CodePage pdp8={pdp8} />,  },
            { path: "machines", children: [
                {
                    path: "", element: <SystemListPage pdp8={pdp8} />,
                },
                {
                    path: "active", element: <SystemPage pdp8={pdp8} />,
                },
            ] },
            { path: "peripherals", children: [
                {
                    path: ":id", element: <PeripheralPage pdp8={pdp8} />,
                },
            ] },
        ],
    },
]);
