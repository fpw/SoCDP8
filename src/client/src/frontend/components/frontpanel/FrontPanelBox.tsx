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

import { Box, Button, ButtonGroup, Card, CardActions, CardHeader, CardMedia, Dialog, DialogTitle, List, ListItem, ListItemButton, ListItemText } from "@mui/material";
import { useState } from "react";
import { ProgramSnippet, ProgramSnippets } from "../../../models/ProgramSnippets";
import { SoCDP8 } from "../../../models/SoCDP8";
import { FrontPanel } from "./FrontPanel";

export function FrontPanelBox(props: {pdp8: SoCDP8}) {
    const [busy, setBusy] = useState<boolean>(false);
    const [showSnippets, setShowSnippets] = useState<boolean>(false);
    const simSpeed = props.pdp8.useStore(state => state.simSpeed);

    async function saveState() {
        setBusy(true);
        await props.pdp8.saveCurrentState();
        setBusy(false);
    }

    async function loadSnippet(snippet: ProgramSnippet) {
        for (const s of snippet.snippets) {
            await props.pdp8.writeCore(s.start, s.data);
        }
        setShowSnippets(false);
    }

    return (
        <Box mb={4}>
            <Card variant='outlined'>
                <CardHeader title='PDP-8/I' />
                <CardMedia>
                    <FrontPanel pdp8={props.pdp8} />
                </CardMedia>
                <CardActions>
                    <ButtonGroup color='primary' variant='outlined'>
                        <Button onClick={() => void saveState()} disabled={busy}>
                            Save State
                        </Button>

                        <Button onClick={() => setShowSnippets(true)}>
                            Load Snippet
                        </Button>

                        <Button onClick={() => void props.pdp8.clearCore()}>
                            Clear Core
                        </Button>
                    </ButtonGroup>
                    <Box>
                        Performance { simSpeed.toFixed(1) }
                    </Box>
                    <SnippetDialog
                        open={showSnippets}
                        onClose={() => setShowSnippets(false)}
                        onSelect={(snippet) => void loadSnippet(snippet)}
                    />
                </CardActions>
            </Card>
        </Box>
    );
}

interface SnippetProps {
    onSelect: ((s: ProgramSnippet) => void);
    open: boolean, onClose: (() => void);
}

function SnippetDialog(props: SnippetProps) {
    return (
        <Dialog open={props.open} onClose={props.onClose}>
            <DialogTitle>Select Snippet</DialogTitle>
            <List>
                { ProgramSnippets.map(snippet =>
                    <ListItemButton key={snippet.label} onClick={() => props.onSelect(snippet)}>
                        <ListItemText primary={snippet.label} secondary={snippet.desc} />
                    </ListItemButton>
                )};
            </List>
        </Dialog>
    );
}
