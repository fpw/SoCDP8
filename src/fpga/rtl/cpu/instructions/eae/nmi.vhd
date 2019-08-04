-- Part of SoCDP8, Copyright by Folke Will, 2019
-- Licensed under CERN Open Hardware Licence v1.2
-- See HW_LICENSE for details
library IEEE;
use IEEE.STD_LOGIC_1164.ALL;
use IEEE.NUMERIC_STD.ALL;

use work.socdp8_package.all;
use work.inst_common.all;

-- This entity implements the mechanization chart for the NMI instruction.
entity inst_nmi is
    port (
        input: in inst_input;
        transfers: out register_transfers
    );
end inst_nmi;

architecture Behavioral of inst_nmi is
begin

-- combinatorial process
nmi_inst: process(all)
begin
    -- default output
    transfers <= nop_transfer;

    if input.norm = '1' then
        transfers.eae_end <= '1';
    else
        transfers.eae_shift <= EAE_L_AC_MQ_LEFT;
        transfers.ac_enable <= '1';
        transfers.ac_load <= '1';
        transfers.inc_sc <= '1';
    end if;
    
end process;

end Behavioral;
