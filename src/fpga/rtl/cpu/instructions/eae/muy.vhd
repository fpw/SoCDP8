-- Part of SoCDP8, Copyright by Folke Will, 2019
-- Licensed under CERN Open Hardware Licence v1.2
-- See HW_LICENSE for details
library IEEE;
use IEEE.STD_LOGIC_1164.ALL;
use IEEE.NUMERIC_STD.ALL;

use work.socdp8_package.all;
use work.inst_common.all;

-- This entity implements the mechanization chart for the MUY instruction.
entity inst_muy is
    port (
        input: in inst_input;
        transfers: out register_transfers
    );
end inst_muy;

architecture Behavioral of inst_muy is
begin

-- combinatorial process
muy_inst: process(all)
begin
    -- default output
    transfers <= nop_transfer;

    if input.mqr(0) = '1' then
        -- AC + MEM -> AC
        transfers.mem_enable <= '1';
    end if;
    
    transfers.eae_shift <= EAE_L_AC_MQ_RIGHT;
    transfers.ac_enable <= '1';
    transfers.ac_load <= '1';
    
    -- done after 12 steps
    if input.sc = "01011" then
        transfers.eae_end <= '1';
    else
        -- SC + 1 -> SC
        transfers.inc_sc <= '1';
    end if;
    
end process;

end Behavioral;
