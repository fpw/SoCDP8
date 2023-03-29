import { Box, Button, ButtonGroup } from "@mui/material";
import React from "react";
import { DiskModel } from "../../../models/peripherals/DiskModel";
import { downloadData, loadFile } from "../../../util";
import { UploadButton } from "../common/UploadButton";

export function DumpButtons(props: {model: DiskModel}) {
    async function upload(disk: number, files: FileList | null) {
        if (!files || files.length < 1) {
            return;
        }
        if (files[0].size > props.model.getDiskSize()) {
            alert(`File too big, max allowed size is ${props.model.getDiskSize()} bytes.`);
            return;
        }
        const data = await loadFile(files[0]);
        await props.model.uploadDump(disk, data);
    }

    async function download(disk: number) {
        const ext = props.model.getDumpExtension();
        const dump = await props.model.downloadDump(disk);
        await downloadData(dump, `dump${disk}.${ext}`);
    }

    return (
        <Box>
            { Array.from({length: props.model.getDiskCount()}).map((_, i) => <React.Fragment key={i}>
                <ButtonGroup variant="outlined" orientation="vertical">
                    <Button onClick={() => void download(i)}>
                        Download Image {i}
                    </Button>
                    <UploadButton onSelect={files => void upload(i, files)}>
                        Upload Image {i}
                    </UploadButton>
                </ButtonGroup>
            </React.Fragment>)}
        </Box>
    );
}
