import { useEffect, useRef, useState } from "react";
import { Terminal } from "xterm";
import { PT08Model } from "../../../../models/peripherals/PT08Model";
import { PT08Style } from "../../../../types/PeripheralTypes";
import { Box, Button, Group } from "@mantine/core";
import "xterm/css/xterm.css";

export function VT100(props: { model: PT08Model }) {
    const { model } = props;
    const style = model.useState(state => state.conf!.style);
    const termRef = useRef(null);
    const [term, setTerm] = useState<Terminal>();
    const clearOutput = model.useState(state => state.clearOutput);

    useEffect(() => {
        if (!termRef.current) {
            return;
        }

        let xTerm: Terminal;
        if (style == PT08Style.ASR33) {
            xTerm = new Terminal({
                theme: {
                    background: "#f8f8f8",
                    foreground: "black",
                    cursor: "black",
                    selectionBackground: "grey",
                },
                altClickMovesCursor: false,
                rows: 25,
                cols: 74,

            });
        } else {
            xTerm = new Terminal({
                rows: 25,
                cols: 80,
                altClickMovesCursor: false,
            });
        }
        xTerm.open(termRef.current);
        xTerm.onData(data => {
            for (const c of data) {
                void props.model.onRawKey(c);
            }
        });
        setTerm(xTerm);

        return () => {
            xTerm.dispose();
            setTerm(undefined);
        };
    }, [termRef, style, props.model]);

    useEffect(() => model.useState.subscribe((state, prevState) => {
        if (term && state.outBuf.length != prevState.outBuf.length) {
            term.write(String.fromCharCode(state.outBuf[state.outBuf.length - 1] & 0x7F));
        }
    }), [model, term]);

    function reset() {
        if (term) {
            term.reset();
        }
        clearOutput();
    }

    return (
        <>
            <Group justify="flex-end">
                <Button size="compact-md" onClick={() => reset()}>
                    Clear Output
                </Button>
            </Group>
            <Box ref={termRef} mt="xs" mb="xs" />
        </>
    );
};
