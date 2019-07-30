-- Part of SoCDP8, Copyright by Folke Will, 2019
-- Licensed under CERN Open Hardware Licence v1.2
-- See HW_LICENSE for details
library IEEE;
use IEEE.STD_LOGIC_1164.ALL;
use IEEE.NUMERIC_STD.ALL;

use work.socdp8_package.all;
use work.inst_common.all;

-- This entity implements the mechanization chart for the IOT instruction.
entity inst_iot is
    port (
        input: in inst_input;
        transfers: out register_transfers;
        state_next: out major_state
    );
end inst_iot;

architecture Behavioral of inst_iot is
begin

-- combinatorial process
iot_inst: process(all)
begin
    -- default output
    transfers <= nop_transfer;
    state_next <= STATE_FETCH;
    
    case input.state is
        when STATE_FETCH =>
            case input.time_div is
                when TS1 =>
                    -- fetch.TS1 happens in multiplexer
                    null;
                when TS2 =>
                    -- fetch.TS2 happens in multiplexer
                    null;
                when TS3 =>
                    -- the CPU will do this
                    null;
                when TS4 =>
                    ts4_back_to_fetch(input, transfers, state_next);
            end case;
        when others =>
            null;
    end case;        
end process;

end Behavioral;
