-- Part of SoCDP8, Copyright by Folke Will, 2019
-- Licensed under CERN Open Hardware Licence v1.2
-- See HW_LICENSE for details
library IEEE;
use IEEE.STD_LOGIC_1164.ALL;
use IEEE.NUMERIC_STD.ALL;

use work.socdp8_package.all;
use work.inst_common.all;

-- This entity implements the mechanization chart for the SHL instruction.
entity inst_shl is
    port (
        input: in inst_input;
        transfers: out register_transfers
    );
end inst_shl;

architecture Behavioral of inst_shl is
begin

-- combinatorial process
shl_inst: process(input)
begin
    -- default output
    transfers <= nop_transfer;

    if input.sc /= "00000" then
        transfers.eae_shift <= EAE_L_AC_MQ_LEFT;
        transfers.ac_enable <= '1';
        transfers.ac_load <= '1';
        transfers.inc_sc <= '1';
    end if;

end process;

end Behavioral;
