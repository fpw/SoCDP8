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
                    -- fetch.TS1 happens in multiplexer
                    null;
                when TS2 =>
                    -- fetch.TS2 happens in multiplexer
                    null;
                when TS3 =>
                    if input.mb(8) = '0' then
                        -- Group 1

                        if input.mb(7) = '0' and input.mb(5) = '0' then
                            -- no CLA and no CMA
                            transfers.ac_enable <= '1';
                        elsif input.mb(7) = '0' and input.mb(5) = '1' then
                            -- no CLA but CMA
                            transfers.ac_comp_enable <= '1';
                        elsif input.mb(7) = '1' and input.mb(5) = '0' then
                            -- CLA but no CMA
                            -- 0 -> AC
                        elsif input.mb(7) = '1' and input.mb(5) = '1' then
                            -- CLA and CMA
                            transfers.ac_enable <= '1';
                            transfers.ac_comp_enable <= '1';
                            transfers.ac_load <= '1';
                        end if;
                        
                        if input.mb(6) = '0' and input.mb(4) = '0' then
                            -- no CLL and no CML
                            transfers.l_enable <= '1';
                        elsif input.mb(6) = '0' and input.mb(4) = '1' then
                            -- no CLL but CML
                            transfers.l_comp_enable <= '1';
                        elsif input.mb(6) = '1' and input.mb(4) = '0' then
                            -- CLL but no CML
                            -- 0 -> L
                        elsif input.mb(6) = '1' and input.mb(4) = '1' then
                            -- CLL and CML
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

                        transfers.ac_load <= '1';
                        transfers.l_load <= '1';
                    else
                        -- Group 2
                        transfers.skip_if_neg <= input.mb(6); -- SMA / SPA
                        transfers.skip_if_zero <= input.mb(5); -- SZA / SNA
                        transfers.skip_if_link <= input.mb(4); -- SNL / SZL
                        transfers.reverse_skip <= input.mb(3);

                        -- HLT
                        if input.mb(1) = '1' then
                            transfers.clear_run <= '1';
                        end if;
                        
                        if input.mb(7) = '0' and input.mb(2) = '0' then
                            -- no CLA and no OSR
                            transfers.ac_enable <= '1';
                        elsif input.mb(7) = '0' and input.mb(2) = '1' then
                            -- no CLA but OSR
                            transfers.ac_enable <= '1';
                            transfers.sr_enable <= '1';
                        elsif input.mb(7) = '1' and input.mb(2) = '0' then
                            -- CLA but no OSR
                            -- 0 -> AC
                        elsif input.mb(7) = '1' and input.mb(2) = '1' then
                            -- CLA and OSR
                            transfers.sr_enable <= '1';
                        end if;

                        transfers.ac_load <= '1';
                    end if;
                when TS4 =>
                    ts4_back_to_fetch(input, transfers, state_next);
            end case;
        when others =>
            null;
    end case;        
end process;

end Behavioral;
