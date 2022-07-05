-- Part of SoCDP8, Copyright by Folke Will, 2019
-- Licensed under CERN Open Hardware Licence v1.2
-- See HW_LICENSE for details
library IEEE;
use IEEE.STD_LOGIC_1164.ALL;
use IEEE.NUMERIC_STD.ALL;

use work.socdp8_package.all;
use work.inst_common.all;

-- This entity implements the mechanization chart for the JMP instruction.
entity inst_jmp is
    port (
        input: in inst_input;
        transfers: out register_transfers;
        state_next: out major_state
    );
end inst_jmp;

architecture Behavioral of inst_jmp is
begin

-- combinatorial process
jmp_inst: process(input)
begin
    -- default output
    transfers <= nop_transfer;
    state_next <= STATE_NONE;
    

    case input.state is
        when STATE_FETCH =>
            -- indirect bit decides next state
            if input.mb(8) = '1' then
                state_next <= STATE_DEFER;
            else
                state_next <= STATE_FETCH;
            end if;
            
            case input.time_div is
                when TS1 =>
                    -- fetch.TS1 happens in multiplexer
                    null;
                when TS2 =>
                    -- fetch.TS2 happens in multiplexer
                    null;
                when TS3 =>
                    -- check indirect addressing
                    if input.mb(8) = '0' then
                        -- transfer the memory page only if the page bit is set (otherwise zero page)
                        -- this combines MA and MEM into the new PC
                        transfers.ma_enable_page <= input.mb(7);
                        transfers.mem_enable_addr <= '1';
                        transfers.pc_load <= '1';
                    end if;
                when TS4 =>
                    -- check indirect addressing
                    if input.mb(8) = '0' then
                        ts4_back_to_fetch(input, transfers, state_next);
                    else
                        -- transfer the memory page only if the page bit is set (otherwise zero page)
                        -- this combines MA and MEM into the new MA
                        transfers.ma_enable_page <= input.mb(7);
                        transfers.mem_enable_addr <= '1';
                        transfers.ma_load <= '1';
                    end if;
            end case;
        when STATE_DEFER =>
            state_next <= STATE_FETCH;
            case input.time_div is
                when TS1 =>
                    null;
                when TS2 =>
                    -- MEM -> MB (with auto index)
                    transfers.mem_enable <= '1';
                    transfers.carry_insert <= input.auto_index;
                    transfers.mb_load <= '1';
                when TS3 =>
                    -- MEM -> PC (with auto index)
                    transfers.mem_enable <= '1';
                    transfers.carry_insert <= input.auto_index;
                    transfers.pc_load <= '1';
                when TS4 =>
                    ts4_back_to_fetch(input, transfers, state_next);
            end case;
        when others =>
            null;
    end case;        
end process;

end Behavioral;
