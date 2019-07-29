-- Part of SoCDP8, Copyright by Folke Will, 2019
-- Licensed under CERN Open Hardware Licence v1.2
-- See HW_LICENSE for details
library IEEE;
use IEEE.STD_LOGIC_1164.ALL;
use IEEE.NUMERIC_STD.ALL;

use work.socdp8_package.all;
use work.inst_common.all;

-- This entity implements the mechanization chart for the OPR instruction.
entity inst_opr is
    port (
        input: in inst_input;
        transfers: out register_transfers;
        state_next: out major_state
    );
end inst_opr;

architecture Behavioral of inst_opr is
begin

-- combinatorial process
opr_inst: process(all)
begin
    -- default output
    transfers <= nop_transfer;
    state_next <= STATE_NONE;
    
    case input.state is
        when STATE_FETCH =>
            state_next <= STATE_FETCH;
            case input.time_div is
                when TS1 =>
                    -- MA + 1 -> PC
                    transfers.ma_enable <= '1';
                    transfers.carry_insert <= '1';
                    transfers.pc_load <= '1';
                when TS2 =>
                    -- MEM -> MB
                    transfers.mem_enable <= '1';
                    transfers.mb_load <= '1';
                when TS3 =>
                    if input.mb(8) = '0' then
                        -- Group 1

                        -- no CLA and no CMA
                        if input.mb(7) = '0' and input.mb(5) = '0' then
                            transfers.ac_enable <= '1';
                        end if;
                        
                        -- no CLA but CMA
                        if input.mb(7) = '0' and input.mb(5) = '1' then
                            transfers.ac_comp_enable <= '1';
                        end if;
                        
                        -- CLA but no CMA
                        if input.mb(7) = '1' and input.mb(5) = '0' then
                            -- 0 -> AC
                        end if;
                        
                        -- CLA and CMA
                        if input.mb(7) = '1' and input.mb(5) = '1' then
                            transfers.ac_enable <= '1';
                            transfers.ac_comp_enable <= '1';
                            transfers.ac_load <= '1';
                        end if;
                        
                        -- no CLL and no CML
                        if input.mb(6) = '0' and input.mb(4) = '0' then
                            transfers.l_enable <= '1';
                        end if;
                        
                        -- no CLL but CML
                        if input.mb(6) = '0' and input.mb(4) = '1' then
                            transfers.l_comp_enable <= '1';
                        end if;
                        
                        -- CLL but no CML
                        if input.mb(6) = '1' and input.mb(4) = '0' then
                            -- 0 -> L
                        end if;
                        
                        -- CLL and CML
                        if input.mb(6) = '1' and input.mb(4) = '1' then
                            transfers.l_enable <= '1';
                            transfers.l_comp_enable <= '1';
                        end if;
                        
                        -- right shift
                        if input.mb(3) = '1' then
                            if input.mb(1) = '0' then
                                transfers.shift <= RIGHT_SHIFT;
                            else
                                transfers.shift <= DOUBLE_RIGHT_ROTATE;
                            end if;
                        end if;
                        
                        -- left shift
                        if input.mb(2) = '1' then
                            -- left shift
                            if input.mb(1) = '0' then
                                transfers.shift <= LEFT_SHIFT;
                            else
                                transfers.shift <= DOUBLE_LEFT_ROTATE;
                            end if;
                        end if;
                        
                        -- IAC
                        if input.mb(0) = '1' then
                            transfers.carry_insert <= '1';
                        end if;
                        transfers.l_load <= '1';
                    else
                        -- Group 2
                        if input.mb(3) = '0' then
                            -- SMA
                            if input.mb(6) = '1' and input.ac_zero = '1' then
                                transfers.skip_set <= '1';
                            end if;
                        
                            -- SZA
                            if input.mb(5) = '1' and input.ac_zero = '1' then
                                transfers.skip_set <= '1';
                            end if;
    
                            -- SNL
                            if input.mb(4) = '1' and input.link = '1' then
                                transfers.skip_set <= '1';
                            end if;
                        else
                            -- SPA
                            if input.mb(6) = '1' and input.ac_zero = '0' then
                                transfers.skip_set <= '1';
                            end if;
                        
                            -- SNA
                            if input.mb(5) = '1' and input.ac_zero = '0' then
                                transfers.skip_set <= '1';
                            end if;
    
                            -- SZL
                            if input.mb(4) = '1' and input.link = '0' then
                                transfers.skip_set <= '1';
                            end if;

                            -- SKP
                            if input.mb(4) = '0' and input.mb(5) = '0' and input.mb(6) = '0' then
                                transfers.skip_set <= '1';
                            end if;
                        end if;
                        
                        -- HLT
                        if input.mb(1) = '1' then
                            transfers.clear_run <= '1';
                        end if;
                        
                        -- no CLA and no OSR
                        if input.mb(7) = '0' and input.mb(2) = '0' then
                            transfers.ac_enable <= '1';
                        end if;
                        
                        -- no CLA but OSR
                        if input.mb(7) = '0' and input.mb(2) = '1' then
                            transfers.ac_enable <= '1';
                            transfers.sr_enable <= '1';
                        end if;
                        
                        -- CLA but no OSR
                        if input.mb(7) = '1' and input.mb(2) = '0' then
                            -- nothing to do
                        end if;
                        
                        -- CLA and OSR
                        if input.mb(7) = '1' and input.mb(2) = '1' then
                            transfers.sr_enable <= '1';
                        end if;
                    end if;
                    transfers.ac_load <= '1';
                when TS4 =>
                    ts4_back_to_fetch(input, transfers, state_next);
            end case;
        when others =>
            null;
    end case;        
end process;

end Behavioral;
