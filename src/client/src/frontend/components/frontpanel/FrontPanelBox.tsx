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

import { Box, Button, ButtonGroup, Card, CardActions, CardHeader, CardMedia, Checkbox, Dialog, DialogTitle, FormControlLabel, List, ListItem, ListItemButton, ListItemText, Typography } from "@mui/material";
import { Stack } from "@mui/system";
import { useState } from "react";
import { ProgramSnippet, ProgramSnippets } from "../../../models/ProgramSnippets";
import { SoCDP8 } from "../../../models/SoCDP8";
import { FrontPanel } from "./FrontPanel";

export function FrontPanelBox(props: {pdp8: SoCDP8}) {
    const [throttle, setThrottle] = useState(true);
    const [busy, setBusy] = useState(false);
    const [showSnippets, setShowSnippets] = useState(false);
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

    async function toggleThrottle() {
        await props.pdp8.setThrottleControl(!throttle);
        setThrottle(!throttle);
    }

    return (
        <Box mb={4}>
            <Card variant="outlined">
                <CardMedia>
                    <FrontPanel pdp8={props.pdp8} />
                </CardMedia>
                <Stack direction="row" justifyContent="space-between" component={CardActions}>
                    <ButtonGroup color="primary" variant="outlined">
                        <Button onClick={() => void saveState()} disabled={busy}>
                            Save State
                        </Button>

                        <Button onClick={() => setShowSnippets(true)}>
                            Load Snippet
                        </Button>

                        <Button onClick={() => void props.pdp8.clearCore()}>
                            Clear Core
                        </Button>
                        <SnippetDialog
                            open={showSnippets}
                            onClose={() => setShowSnippets(false)}
                            onSelect={(snippet) => void loadSnippet(snippet)}
                        />
                    </ButtonGroup>
                    <Box sx={{alignSelf: "right"}}>
                        Emulation Speed: { simSpeed.toFixed(2) }
                        <FormControlLabel control={<Checkbox checked={throttle} onChange={() => void toggleThrottle()} />} label="Control" sx={{ml: 1}}/>
                    </Box>
                </Stack>
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
                )}
            </List>
        </Dialog>
    );
}
