-- Part of SoCDP8, Copyright by Folke Will, 2019
-- Licensed under CERN Open Hardware Licence v1.2
-- See HW_LICENSE for details
library IEEE;
use IEEE.STD_LOGIC_1164.ALL;
use IEEE.NUMERIC_STD.ALL;

use work.socdp8_package.all;
use work.inst_common.all;

-- This entity implements the combinatorial register multiplexer.
-- It selects the signals for the register transfers based on the current
-- instruction, major state and time division.
entity instruction_multiplexer is
    port (
        inst: in pdp8_instruction;
        input: in inst_input;
        transfers: out register_transfers;
        state_next: out major_state
    );
end instruction_multiplexer;

architecture Behavioral of instruction_multiplexer is
    signal transfers_and: register_transfers;
    signal state_next_and: major_state;

    signal transfers_tad: register_transfers;
    signal state_next_tad: major_state;

    signal transfers_isz: register_transfers;
    signal state_next_isz: major_state;

    signal transfers_dca: register_transfers;
    signal state_next_dca: major_state;

    signal transfers_jms: register_transfers;
    signal state_next_jms: major_state;

    signal transfers_jmp: register_transfers;
    signal state_next_jmp: major_state;

    signal transfers_opr: register_transfers;
    signal state_next_opr: major_state;
begin

and_instance: entity work.inst_and
port map (
    input => input,
    transfers => transfers_and,
    state_next => state_next_and
);

tad_instance: entity work.inst_tad
port map (
    input => input,
    transfers => transfers_tad,
    state_next => state_next_tad
);

isz_instance: entity work.inst_isz
port map (
    input => input,
    transfers => transfers_isz,
    state_next => state_next_isz
);

dca_instance: entity work.inst_dca
port map (
    input => input,
    transfers => transfers_dca,
    state_next => state_next_dca
);

jms_instance: entity work.inst_jms
port map (
    input => input,
    transfers => transfers_jms,
    state_next => state_next_jms
);

jmp_instance: entity work.inst_jmp
port map (
    input => input,
    transfers => transfers_jmp,
    state_next => state_next_jmp
);

opr_instance: entity work.inst_opr
port map (
    input => input,
    transfers => transfers_opr,
    state_next => state_next_opr
);

with inst select transfers <=
    transfers_and when INST_AND,
    transfers_tad when INST_TAD,
    transfers_isz when INST_ISZ,
    transfers_dca when INST_DCA,
    transfers_jms when INST_JMS,
    transfers_jmp when INST_JMP,
    transfers_opr when INST_OPR,
    nop_transfer when others;

with inst select state_next <=
    state_next_and when INST_AND,
    state_next_tad when INST_TAD,
    state_next_isz when INST_ISZ,
    state_next_dca when INST_DCA,
    state_next_jms when INST_JMS,
    state_next_jmp when INST_JMP,
    state_next_opr when INST_OPR,
    STATE_NONE when others;

end Behavioral;
