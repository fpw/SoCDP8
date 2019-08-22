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
    signal rstn: std_logic;

    -- Bus
    signal int_rqst: std_logic := '0';
    signal io_bus_in: std_logic_vector(11 downto 0);
    signal io_ac_clear: std_logic;
    signal io_skip: std_logic;
    signal io_iop: std_logic_vector(2 downto 0);
    signal io_ac: std_logic_vector(11 downto 0);
    signal io_mb: std_logic_vector(11 downto 0);

    -- Memory
    signal mem_out_addr: std_logic_vector(14 downto 0);
    signal mem_out_data: std_logic_vector(11 downto 0);
    signal mem_out_write: std_logic;
    signal mem_in_data: std_logic_vector(11 downto 0);

    -- Console
    signal led_data_field: std_logic_vector(2 downto 0);
    signal led_inst_field: std_logic_vector(2 downto 0);
    signal led_pc: std_logic_vector(11 downto 0);
    signal led_mem_addr: std_logic_vector(11 downto 0);
    signal led_mem_buf: std_logic_vector(11 downto 0);
    signal led_link: std_logic;
    signal led_accu: std_logic_vector(11 downto 0);
    signal led_step_counter: std_logic_vector(4 downto 0);
    signal led_mqr: std_logic_vector(11 downto 0);
    signal led_instruction: std_logic_vector(7 downto 0);
    signal led_state: std_logic_vector(5 downto 0);
    signal led_ion: std_logic;
    signal led_pause: std_logic;
    signal led_run: std_logic;

    signal switch_data_field: std_logic_vector(2 downto 0);
    signal switch_inst_field: std_logic_vector(2 downto 0);
    signal switch_swr: std_logic_vector(11 downto 0);
    signal switch_start: std_logic;
    signal switch_load: std_logic;
    signal switch_dep: std_logic;
    signal switch_exam: std_logic;
    signal switch_cont: std_logic;
    signal switch_stop: std_logic;
    signal switch_sing_step: std_logic;
    signal switch_sing_inst: std_logic;
        
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
begin

dut: entity work.pdp8
generic map (
    clk_frq => 50_000_000,
    enable_ext_eae => true,
    debounce_time_ms => 1,
    manual_cycle_time_us => 1,
    memory_cycle_time_ns => 100,
    auto_cycle_time_ns => 40,
    eae_cycle_time_ns => 80
)
port map (
    clk => clk,
    rstn => rstn,
    
    io_bus_in => io_bus_in,
    io_ac_clear => io_ac_clear,
    io_skip => io_skip,
    io_iop => io_iop,
    io_ac => io_ac,
    io_mb => io_mb,
    
    mem_out_addr => mem_out_addr,
    mem_out_data => mem_out_data,
    mem_out_write => mem_out_write,
    mem_in_data => mem_in_data,
    
    led_data_field => led_data_field,
    led_inst_field => led_inst_field,
    led_pc => led_pc,
    led_mem_addr => led_mem_addr,
    led_mem_buf => led_mem_buf,
    led_link => led_link,
    led_accu => led_accu,
    led_step_counter => led_step_counter,
    led_mqr => led_mqr,
    led_instruction => led_instruction,
    led_state => led_state,
    led_ion => led_ion,
    led_pause => led_pause,
    led_run => led_run,

    switch_data_field => switch_data_field,
    switch_inst_field => switch_inst_field,
    switch_swr => switch_swr,
    switch_start => switch_start,
    switch_load => switch_load,
    switch_dep => switch_dep,
    switch_exam => switch_exam,
    switch_cont => switch_cont,
    switch_stop => switch_stop,
    switch_sing_step => switch_sing_step,
    switch_sing_inst => switch_sing_inst,

    int_rqst => int_rqst
);

ram_sim: process
begin
    wait until rising_edge(clk);
    
    if mem_out_write = '1' then
        ram(to_integer(unsigned(mem_out_addr))) <= mem_out_data;
    end if;

    mem_in_data <= ram(to_integer(unsigned(mem_out_addr)));
end process;

rstn <= '0', '1' after 20 ns;
clk <= not clk after 10 ns;

tests: process
begin
    io_bus_in <= (others => '0');
    io_skip <= '0';
    io_ac_clear <= '0';
    switch_data_field <= (others => '0');
    switch_inst_field <= (others => '0');
    switch_swr <= (others => '0');
    switch_start <= '0';
    switch_load <= '0';
    switch_exam <= '0';
    switch_dep <= '0';
    switch_cont <= '0';
    switch_stop <= '0';
    switch_sing_step <= '0';
    switch_sing_inst <= '0';

    wait until rstn = '1';
    
    wait until rising_edge(clk);

    switch_start <= '1';
    
    wait;
end process;


end Behavioral;
