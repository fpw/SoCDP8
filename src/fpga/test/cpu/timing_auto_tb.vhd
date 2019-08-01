-- Part of SoCDP8, Copyright by Folke Will, 2019
-- Licensed under CERN Open Hardware Licence v1.2
-- See HW_LICENSE for details
library IEEE;
use IEEE.STD_LOGIC_1164.ALL;
use IEEE.NUMERIC_STD.ALL;

use work.socdp8_package.all;

entity auto_timing_tb is
end auto_timing_tb;

architecture Behavioral of auto_timing_tb is
    signal clk: std_logic := '0';
    signal rst: std_logic;
    
    -- inputs
    signal run: std_logic := '1';
    signal pause: std_logic := '0';
    signal strobe: std_logic := '0';
    signal mem_done: std_logic := '0';
    signal force_tp4: std_logic := '0';
    signal manual_preset: std_logic := '0';
    signal io_start: std_logic := '0';
    
    -- outputs
    signal ts: time_state_auto;
    signal tp: std_logic;
    signal mem_idle: std_logic;
    signal io_state: io_state;
    signal io_end: std_logic;
    signal io_strobe: std_logic;
begin

dut: entity work.timing_auto
generic map (
    clk_frq => 50_000_000
)
port map (
    clk => clk,
    rst => rst,
  
    strobe => strobe,
    mem_done => mem_done,
    manual_preset => manual_preset,
    run => run,
    pause => pause,
    force_tp4 => force_tp4,
    
    ts => ts,
    tp => tp,
    mem_idle_o => mem_idle,
    
    io_start => io_start,
    io_state_o => io_state,
    io_end => io_end,
    io_strobe => io_strobe
);

sim_ext: process
begin
    wait until rising_edge(clk);
    io_start <= '0';

    if ts = TS4 then
        mem_done <= '1';
    else
        mem_done <= '0';
    end if;
    
    if ts = TS1 then
        strobe <= '1';
    else
        strobe <= '0';
    end if;
    
    if ts = TS3 then
        if tp = '1' then
            io_start <= '1';
            pause <= '1';
        end if;
    end if;
    
    if io_end = '1' then
        pause <= '0';
    end if;
    
end process;

rst <= '1', '0' after 20ns;
clk <= not clk after 10 ns;

end Behavioral;
