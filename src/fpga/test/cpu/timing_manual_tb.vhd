-- Part of SoCDP8, Copyright by Folke Will, 2019
-- Licensed under CERN Open Hardware Licence v1.2
-- See HW_LICENSE for details
library IEEE;
use IEEE.STD_LOGIC_1164.ALL;
use IEEE.NUMERIC_STD.ALL;

use work.socdp8_package.all;

entity manual_timing_tb is
end manual_timing_tb;

architecture Behavioral of manual_timing_tb is
    signal clk: std_logic := '0';
    signal rst: std_logic;
    
    -- inputs
    signal run: std_logic := '0';
    signal key_load: std_logic := '0';
    signal key_start: std_logic := '0';
    signal key_ex: std_logic := '0';
    signal key_dep: std_logic := '0';
    signal key_cont: std_logic := '0';
    
    -- outputs
    signal mfts0: std_logic;
    signal mftp: std_logic;
    signal mft: time_state_manual;
begin

generator: entity work.timing_manual
generic map ( 
    clk_frq => 50_000_000,
    num_cycles_deb => 100,
    num_cycles_pulse => 5
)
port map (
    clk => clk,
    rst => rst,
    run => run,
    
    key_load => key_load,
    key_start => key_start,
    key_ex => key_ex,
    key_dep => key_dep,
    key_cont => key_cont,
    
    mfts0 => mfts0,
    mftp => mftp,
    mft => mft
);

rst <= '1', '0' after 20ns;
clk <= not clk after 10 ns;

key_load <= '0', '1' after 100ns, '0' after 3ms, '1' after 6 ms;


end Behavioral;
