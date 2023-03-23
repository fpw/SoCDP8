import { Button } from "@mui/material";
import { ReactNode, useRef } from "react";

export function UploadButton(props: {onSelect: (list: FileList | null) => void, children: ReactNode}) {
    const uploadRef = useRef<HTMLInputElement>(null);

    return (<>
        <input type="file" ref={uploadRef} onChange={evt => props.onSelect(evt.target.files)} hidden />
        <Button onClick={() => uploadRef.current?.click()}>
            { props.children }
        </Button>
    </>);
}
