import styled from "@emotion/styled";
import { LinearProgress, LinearProgressProps } from "@mui/material";

export const ProgressBar = styled(LinearProgress)<LinearProgressProps>(({ theme }) => ({
    ".MuiLinearProgress-bar": {
        transition: "none",
    }
}));
