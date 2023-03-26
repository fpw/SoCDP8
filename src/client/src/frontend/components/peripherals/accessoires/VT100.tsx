import { Box, Button } from "@mui/material";
import { useEffect, useRef, useState } from "react";
import { Terminal } from "xterm";
import "xterm/css/xterm.css";
import { PT08Model } from "../../../../models/peripherals/PT08Model";

export function VT100(props: {model: PT08Model}) {
    const { model } = props;
    const termRef = useRef(null);
    const [term, setTerm] = useState<Terminal>();
    const clearOutput = model.useState(state => state.clearOutput);

    useEffect(() => {
        if (!termRef.current) {
            return;
        }

        const xTerm = new Terminal();
        xTerm.resize(80, 25);
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
    }, [termRef, props.model]);

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
            <Box ref={termRef} mt={1} />
            <Box mt={1} mb={3}>
                <Button variant="contained" onClick={() => reset()}>
                    Clear Output
                </Button>
            </Box>
        </>
    );
};
