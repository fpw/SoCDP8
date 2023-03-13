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

import { Box, Button, ButtonGroup, Card, CardActions, CardHeader, CardMedia, Dialog, DialogTitle, List, ListItem, ListItemText } from "@mui/material";
import { observer } from "mobx-react-lite";
import React from "react";
import { ProgramSnippet, ProgramSnippets } from "../../models/ProgramSnippets";
import { SoCDP8 } from "../../models/SoCDP8";
import { FrontPanel } from "./FrontPanel";

export const FrontPanelBox: React.FunctionComponent<{pdp8: SoCDP8}> = observer(props => {
    const [busy, setBusy] = React.useState<boolean>(false);
    const [showSnippets, setShowSnippets] = React.useState<boolean>(false);

    return (
        <Box mb={4}>
            <Card variant='outlined'>
                <CardHeader title='PDP-8/I' />
                <CardMedia>
                    <FrontPanel lamps={props.pdp8.panel.lamps}
                        switches={props.pdp8.panel.switches}
                        onSwitch={props.pdp8.setPanelSwitch.bind(props.pdp8)}
                    />
                </CardMedia>
                <CardActions>
                    <ButtonGroup color='primary' variant='outlined'>
                        <Button
                            onClick={async() => {
                                setBusy(true);
                                await props.pdp8.saveCurrentState();
                                setBusy(false);
                            }}
                            disabled={busy}
                        >
                            Save State
                        </Button>

                        <Button onClick={() => setShowSnippets(true)}>
                            Load Snippet
                        </Button>

                        <Button onClick={() => props.pdp8.clearCore()}>
                            Clear Core
                        </Button>
                    </ButtonGroup>
                    <Box>
                        Performance { props.pdp8.speed }
                    </Box>
                    <SnippetDialog
                        open={showSnippets}
                        onClose={() => setShowSnippets(false)}
                        onSelect={(snippet) => {
                            for (const s of snippet.snippets) {
                                props.pdp8.writeCore(s.start, s.data);
                            }
                            setShowSnippets(false);
                        }}
                    />
                </CardActions>
            </Card>
        </Box>
    );
});

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
                    <ListItem button key={snippet.label} onClick={() => props.onSelect(snippet)}>
                        <ListItemText primary={snippet.label} secondary={snippet.desc} />
                    </ListItem>
                )};
            </List>
        </Dialog>
    );
}
