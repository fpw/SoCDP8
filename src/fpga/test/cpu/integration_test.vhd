-- Part of SoCDP8, Copyright by Folke Will, 2019
-- Licensed under CERN Open Hardware Licence v1.2
-- See HW_LICENSE for details
library IEEE;
use IEEE.STD_LOGIC_1164.ALL;
use IEEE.NUMERIC_STD.ALL;

use work.socdp8_package.all;

entity integration_tb is
end integration_tb;

architecture Behavioral of integration_tb is
    signal clk: std_logic := '0';
    signal rst: std_logic;

    signal leds: pdp8i_leds;
    signal switches: pdp8i_switches;
    
    signal io_in: pdp8i_io_in;    
    signal io_out: pdp8i_io_out;
    
    signal int_rqst: std_logic := '0';
    signal ext_mem_in: ext_mem_in;
    signal ext_mem_out: ext_mem_out;
    
    type ram_a is array (0 to 32767) of std_logic_vector(11 downto 0);
    signal ram: ram_a := (
        0 => o"1007",       -- TAD 7
        1 => o"7421",       -- MQL
        2 => o"7405",       -- MUY
        3 => o"0005",       -- C5
        4 => o"7407",       -- DVI
        5 => o"0014",       -- C12
        6 => o"7402",       -- HLT
        7 => o"0035",       -- C29
        others => o"0000"
    );
    
    constant config: pdp8_config := (
        clk_frq => 50_000_000,
        enable_ext_eae => '1',
        simulate_lamps => '0',
        debounce_time => 1.0e-6,
        manual_cycle_time => 1.0e-6,
        memory_cycle_time => 1.0e-6,
        auto_cycle_time => 1.0e-6,
        eae_cycle_time => 1.0e-6
    );
begin

dut: entity work.pdp8
generic map (
    config => config
)
port map (
    clk => clk,
    rst => rst,
    
    leds => leds,
    switches => switches,
    
    io_in => io_in,
    io_out => io_out,
    
    int_rqst => int_rqst,
    
    ext_mem_in => ext_mem_in,
    ext_mem_out => ext_mem_out
);

ram_sim: process
begin
    wait until rising_edge(clk);
    
    if ext_mem_out.write = '1' then
        ram(to_integer(unsigned(ext_mem_out.addr))) <= ext_mem_out.data;
    end if;

    ext_mem_in.data <= ram(to_integer(unsigned(ext_mem_out.addr)));
end process;

rst <= '1', '0' after 20 ns;
clk <= not clk after 10 ns;

tests: process
begin
    io_in.bus_in <= (others => '0');
    io_in.io_skip <= '0';
    io_in.ac_clear <= '0';
    switches.data_field <= (others => '0');
    switches.inst_field <= (others => '0');
    switches.swr <= (others => '0');
    switches.start <= '0';
    switches.load <= '0';
    switches.exam <= '0';
    switches.dep <= '0';
    switches.cont <= '0';
    switches.stop <= '0';
    switches.sing_step <= '0';
    switches.sing_inst <= '0';

    wait until rst = '0';
    
    wait until rising_edge(clk);

    switches.start <= '1';
    
    wait;
end process;


end Behavioral;
