import { Button, FileButton, Group } from "@mantine/core";
import { DiskModel } from "../../../models/peripherals/DiskModel";
import { downloadData, loadFile } from "../../../util";

export function DumpButtons(props: { model: DiskModel }) {
    async function upload(disk: number, file: File | null) {
        if (!file) {
            return;
        }
        if (file.size > props.model.getDiskSize()) {
            alert(`File too big, max allowed size is ${props.model.getDiskSize()} bytes.`);
            return;
        }
        const data = await loadFile(file);
        await props.model.uploadDump(disk, data);
    }

    async function download(disk: number) {
        const ext = props.model.getDumpExtension();
        const dump = await props.model.downloadDump(disk);
        await downloadData(dump, `dump${disk}.${ext}`);
    }

    return (
        <Group>
            <Button.Group>
                { Array.from({ length: props.model.getDiskCount() }).map((_, i) =>
                    <Button key={i} onClick={() => void download(i)}>
                        Download Image {i}
                    </Button>
                )}
                { Array.from({ length: props.model.getDiskCount() }).map((_, i) =>
                    <FileButton key={i} onChange={file => void upload(i, file)}>
                        { props => <Button {...props}>Upload Image {i}</Button> }
                    </FileButton>
                )}
            </Button.Group>
        </Group>
    );
}
