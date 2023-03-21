import { Box, ButtonGroup, Button } from "@mui/material";
import React from "react";
import { DiskModel } from "../../../models/peripherals/DiskModel";
import { downloadData, loadFile } from "../../../util";

export function DumpButtons(props: {model: DiskModel}) {
    async function upload(disk: number, target: HTMLInputElement) {
        if (!target.files || target.files.length < 1) {
            return;
        }
        if (target.files[0].size > props.model.getDiskSize()) {
            alert(`File too big, max allowed size is ${props.model.getDiskSize()} bytes.`);
            return;
        }
        const data = await loadFile(target.files[0]);
        await props.model.uploadDump(disk, data);
    }

    async function download(disk: number) {
        const ext = props.model.getDumpExtension();
        const dump = await props.model.downloadDump(disk);
        await downloadData(dump, `dump${disk}.${ext}`);
    }

    return (
        <Box>
            <ButtonGroup variant="outlined" color="primary">
                { Array.from({length: props.model.getDiskCount()}).map((_, i) => <React.Fragment key={i}>
                    <Button onClick={() => void download(i)}>
                        Download {i}
                    </Button>
                    <Button component="label">
                        Upload {i}
                        <input type="file" onChange={evt => void upload(i, evt.target)} hidden />
                    </Button>
                </React.Fragment>)}
            </ButtonGroup>
        </Box>
    );
}
