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

import { Box, Progress } from "@mantine/core";
import { useCallback, useEffect, useMemo } from "react";
import { PaperTape } from "../../../models/PaperTape";

interface PaperTapeBoxProps {
    tape: PaperTape;
    reverse: boolean;
}

export function PaperTapeBox(props: { tape: PaperTape, reverse: boolean }) {
    const tapeName = props.tape.useTape(state => state.tapeState.name);

    return (
        <Box mb={1}>
            Tape { tapeName }
            { !props.reverse && <TapeBar tape={props.tape} reverse={props.reverse} /> }
            <Tape tape={props.tape} reverse={props.reverse} />
        </Box>
    );
}

function TapeBar(props: PaperTapeBoxProps) {
    const tapeLen = props.tape.useTape(state => state.tapeState.buffer.length);
    const tapePos = props.tape.useTape(state => state.tapeState.pos);

    let progress = 100;
    if (tapeLen > 0) {
        progress = Math.round(tapePos / tapeLen * 100);
    }

    return <Progress value={progress} />;
}

function Tape(props: PaperTapeBoxProps) {
    const painter = useMemo(() => new PaperTapePainter(), []);

    const canvasRef = useCallback((canvas: HTMLCanvasElement) => {
        if (!canvas) {
            return;
        }

        painter.setCanvas(canvas);
    }, [painter]);

    useEffect(() => {
        const state = props.tape.useTape.getState();
        painter.update(state.tapeState.buffer, state.tapeState.pos);
    }, [painter, props.tape]);

    useEffect(() => props.tape.useTape.subscribe(state => {
        if (!props.reverse) {
            painter.update(state.tapeState.buffer, state.tapeState.pos);
        } else {
            painter.update(state.tapeState.buffer, -1);
        }
    }), [painter, props.reverse, props.tape]);

    return <canvas ref={canvasRef} />;
}

class PaperTapePainter {
    private canvas?: HTMLCanvasElement;

    public setCanvas(canvas: HTMLCanvasElement) {
        this.canvas = canvas;
    }

    public update(buf: number[], pos: number) {
        if (this.canvas?.parentElement) {
            this.canvas.width = this.canvas.parentElement.scrollWidth;
            this.canvas.height = 100;
        }
        requestAnimationFrame(() => this.draw(buf, pos));
    }

    private draw(buf: number[], pos: number) {
        if (!this.canvas) {
            return;
        }

        const ctx = this.canvas.getContext("2d");
        if (!ctx) {
            return;
        }

        const w = ctx.canvas.width;
        const h = ctx.canvas.height;

        ctx.fillStyle = "#cccbc7";
        ctx.fillRect(0, 0, w, h);
        ctx.fillStyle = "#ffffff";

        if (pos >= 0) {
            this.drawForward(ctx, buf, pos);
        } else {
            this.drawBackwards(ctx, buf);
        }
    }

    private drawForward(ctx: CanvasRenderingContext2D, buf: number[], pos: number) {
        const w = ctx.canvas.width;

        for (let i = 0; i < w / 10; i++) {
            const idx = pos + i;
            if (idx < buf.length) {
                const x = 2 + 10 * i;
                const byte = buf[idx];
                this.drawByte(ctx, x, byte);
            }
        }
    }

    private drawBackwards(ctx: CanvasRenderingContext2D, buf: number[]) {
        const w = ctx.canvas.width;

        const cnt = Math.floor(w / 10);
        for (let i = 0; i < cnt; i++) {
            const idx = buf.length - i - 1;
            if (idx >= 0) {
                const x = 2 + 10 * (cnt - i - 1);
                const byte = buf[idx];
                this.drawByte(ctx, x, byte);
            }
        }
    }

    private drawByte(ctx: CanvasRenderingContext2D, x: number, byte: number) {
        for (let i = 0; i < 8; i++) {
            if ((byte & (1 << (7 - i))) != 0) {
                let y = 18 + (7 - i) * 10;
                if (i >= 5) {
                    y -= 5;
                }
                ctx.beginPath();
                ctx.arc(x, y, 4, 0, 2 * Math.PI);
                ctx.fill();
            }
        }
        ctx.beginPath();
        ctx.arc(x, 41, 2, 0, 2 * Math.PI);
        ctx.fill();
    }
}
