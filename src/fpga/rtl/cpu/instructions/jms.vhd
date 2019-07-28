-- Part of SoCDP8, Copyright by Folke Will, 2019
-- Licensed under CERN Open Hardware Licence v1.2
-- See HW_LICENSE for details
library IEEE;
use IEEE.STD_LOGIC_1164.ALL;
use IEEE.NUMERIC_STD.ALL;

use work.socdp8_package.all;
use work.inst_common.all;

-- This entity implements the mechanization chart for the JMS instruction.
entity inst_jms is
    port (
        input: in inst_input;
        transfers: out register_transfers;
        state_next: out major_state
    );
end inst_jms;

architecture Behavioral of inst_jms is
begin

-- combinatorial process
jms_inst: process(all)
begin
    -- default output
    transfers <= nop_transfer;
    state_next <= STATE_NONE;
    
    case input.state is
        when STATE_FETCH =>
            fetch_cycle_mri(input, transfers, state_next);
        when STATE_DEFER =>
            defer_cycle_not_jmp(input, transfers, state_next);
        when STATE_EXEC =>
            state_next <= STATE_FETCH;
            case input.time_div is
                when TS1 =>
                    null;
                when TS2 =>
                    -- PC (+ 1) -> MB
                    transfers.pc_enable <= '1';
                    transfers.carry_insert <= input.skip;
                    transfers.mb_load <= '1';
                when TS3 =>
                    -- MA + 1 -> PC
                    transfers.ma_enable <= '1';
                    transfers.carry_insert <= '1';
                    transfers.pc_load <= '1';
                when TS4 =>
                    ts4_back_to_fetch(input, transfers, state_next);
            end case;
        when others =>
            null;
    end case;        
end process;

end Behavioral;
