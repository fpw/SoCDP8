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

import { Box } from "@mui/material";
import { useState } from "react";
import Keyboard, { KeyboardReactInterface } from "react-simple-keyboard";
import "react-simple-keyboard/build/css/index.css";
import "./ASR33.css";

const keyboardOptions: KeyboardReactInterface["options"] = {
    mergeDisplay: true,
    layout: {
        default: [
            "1 2 3 4 5 6 7 8 9 0 : -",
            "{altmode} Q W E R T Y U I O P {lf} {return}",
            "{ctrl} A S D F G H J K L ; {rubout}",
            "{shift} Z X C V B N M , . / {shift}",
            "{space}"
        ],
        shift: [
            '! " # $ % & / ( ) 0 * =',
            "{altmode} Q W E R T Y U I O @ {lf} {return}",
            "{ctrl} A S D F G H J [ \\ + {rubout}",
            "{deshift} Z X C V B ^ ] < > ? {deshift}",
            "{space}"
        ],
        ctrl: [
            "1 2 3 4 5 6 7 8 9 0 : -",
            "{altmode} Q W E R T Y U I O P {lf} {return}",
            "{dectrl} A S D F G H J K L ; {rubout}",
            "{shift} Z X C V B N M , . / {shift}",
            "{space}"
        ],
        ctrlShift: [
            "1 2 3 4 5 6 7 8 9 0 : -",
            "{altmode} Q W E R T Y U I O P {lf} {return}",
            "{dectrl} A S D F G H J K L ; {rubout}",
            "{deshift} Z X C V B N M , . / {deshift}",
            "{space}"
        ],
    },
    display: {
        "{shift}": "SHIFT",
        "{deshift}": "SHIFT",
        "{ctrl}": "CTRL",
        "{dectrl}": "CTRL",

        "{altmode}": "ALT<br/>MODE",
        "{return}": "RE-<br/>TURN",
        "{lf}": "LINE<br/>FEED",
        "{rubout}": "RUB<br/>OUT",
    },
    buttonTheme: [
        { class: "activeKey", buttons: "{deshift} {dectrl}" },
        { class: "space", buttons: "{space}" }
    ],
};

export function ASR33Keyboard(props: {onKey: (chr: number) => void}) {
    const [shift, setShift] = useState(false);
    const [ctrl, setCtrl] = useState(false);
    const onRawKey = props.onKey;

    const onKey = (key: string) => {
        let chr: number | undefined;
        switch (key) {
            case "{shift}":
            case "{deshift}":
                if (shift && ctrl) {
                    setCtrl(false);
                }
                setShift(!shift);
                break;
            case "{ctrl}":
            case "{dectrl}":
                if (shift && ctrl) {
                    setShift(false);
                }
                setCtrl(!ctrl);
                break;
            case "{altmode}":
                chr = 0x7D;
                break;
            case "{return}":
                chr = 0x0D;
                break;
            case "{lf}":
                chr = 0x0A;
                break;
            case "{rubout}":
                chr = 0x7F;
                break;
            case "{space}":
                chr = 0x20;
                break;
            default:
                chr = key.charCodeAt(0);
                if (ctrl) {
                    if (shift) {
                        switch (key) {
                            case "K": chr = 0x1B; break;
                            case "L": chr = 0x1C; break;
                            case "M": chr = 0x1D; break;
                            case "N": chr = 0x1E; break;
                            case "O": chr = 0x1F; break;
                            case "P": chr = 0x00; break;
                        }
                    } else {
                        chr &= ~0x40;
                    }
                }
                setShift(false);
                setCtrl(false);
        }
        if (chr) {
            onRawKey(chr);
        }
    };

    let layout = "default";
    if (shift) {
        if (ctrl) {
            layout = "ctrlShift";
        } else {
            layout = "shift";
        }
    } else if (ctrl) {
        layout = "ctrl";
    }

    return (
        <Box mt={1} sx={{activeButton: {backgroundColor: "yellow"}}}>
            <Keyboard
                layoutName={layout}
                onKeyPress={(button: string) => onKey(button)}
                { ...keyboardOptions }
            />
        </Box>
    );
}
