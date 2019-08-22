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
    generic (
        enable_ext_eae: boolean
    );
    port (
        inst: in pdp8_instruction;
        input: in inst_input;
        eae_on: in std_logic;
        eae_inst: in eae_instruction;
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

    signal transfers_iot: register_transfers;
    signal state_next_iot: major_state;

    signal transfers_opr: register_transfers;
    signal state_next_opr: major_state;

    signal transfers_muy: register_transfers;
    signal transfers_dvi: register_transfers;
    signal transfers_nmi: register_transfers;
    signal transfers_shl: register_transfers;
    signal transfers_asr: register_transfers;
    signal transfers_lsr: register_transfers;
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

iot_instance: entity work.inst_iot
port map (
    input => input,
    transfers => transfers_iot,
    state_next => state_next_iot
);

opr_instance: entity work.inst_opr
generic map (
    enable_ext_eae => enable_ext_eae
)
port map (
    input => input,
    transfers => transfers_opr,
    state_next => state_next_opr
);

muy_instance: entity work.inst_muy
port map (
    input => input,
    transfers => transfers_muy
);

dvi_instance: entity work.inst_dvi
port map (
    input => input,
    transfers => transfers_dvi
);

nmi_instance: entity work.inst_nmi
port map (
    input => input,
    transfers => transfers_nmi
);

shl_instance: entity work.inst_shl
port map (
    input => input,
    transfers => transfers_shl
);

asr_instance: entity work.inst_asr
port map (
    input => input,
    transfers => transfers_asr
);

lsr_instance: entity work.inst_lsr
port map (
    input => input,
    transfers => transfers_lsr
);

-- select the output of the currenct instruction
mux_inst: process(input, inst, eae_inst, transfers_muy, transfers_dvi, transfers_nmi, transfers_shl, transfers_asr, transfers_lsr, eae_on,
    state_next_and, state_next_tad, state_next_isz, state_next_dca, state_next_jms, state_next_jmp, state_next_iot, state_next_opr,
    transfers_and, transfers_tad, transfers_isz, transfers_dca, transfers_jms, transfers_jmp, transfers_iot, transfers_opr)
begin
    transfers <= nop_transfer;
    state_next <= STATE_NONE;

    if input.state = STATE_FETCH and input.time_div = TS1 then
        -- we must implement fetch.TS1 here because the instruction is not known yet
        -- MA + 1 -> PC
        transfers.ma_enable <= '1';
        transfers.carry_insert <= '1';
        transfers.pc_load <= '1';
        state_next <= STATE_FETCH;
    elsif input.state = STATE_FETCH and input.time_div = TS2 then
        -- we must implement fetch.TS2 here because the instruction register is not loaded yet
        -- MEM -> MB
        transfers.mem_enable <= '1';
        transfers.mb_load <= '1';
        state_next <= STATE_FETCH;
    elsif eae_on = '1' then
        case eae_inst is
            when EAE_MUY => transfers <= transfers_muy;
            when EAE_DVI => transfers <= transfers_dvi;
            when EAE_NMI => transfers <= transfers_nmi;
            when EAE_SHL => transfers <= transfers_shl;
            when EAE_ASR => transfers <= transfers_asr;
            when EAE_LSR => transfers <= transfers_lsr;
            when others => transfers <= nop_transfer;
        end case;
        state_next <= STATE_FETCH;
    else
        case inst is
            when INST_AND =>
                transfers <= transfers_and;
                state_next <= state_next_and;
            when INST_TAD =>
                transfers <= transfers_tad;
                state_next <= state_next_tad;
            when INST_ISZ =>
                transfers <= transfers_isz;
                state_next <= state_next_isz;
            when INST_DCA =>
                transfers <= transfers_dca;
                state_next <= state_next_dca;
            when INST_JMS =>
                transfers <= transfers_jms;
                state_next <= state_next_jms;
            when INST_JMP =>
                transfers <= transfers_jmp;
                state_next <= state_next_jmp;
            when INST_IOT =>
                transfers <= transfers_iot;
                state_next <= state_next_iot;
            when INST_OPR =>
                transfers <= transfers_opr;
                state_next <= state_next_opr;
            when others =>
                transfers <= nop_transfer;
                state_next <= STATE_FETCH;
        end case;
    end if;
end process;

end Behavioral;
