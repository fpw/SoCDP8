-- Part of SoCDP8, Copyright by Folke Will, 2019
-- Licensed under CERN Open Hardware Licence v1.2
-- See HW_LICENSE for details
library IEEE;
use IEEE.STD_LOGIC_1164.ALL;
use IEEE.NUMERIC_STD.ALL;

use work.socdp8_package.all;

entity registers_tb is
end registers_tb;

architecture Behavioral of registers_tb is
    signal clk: std_logic := '0';
    signal rstn: std_logic;
    
    -- inputs
    signal transfers: register_transfers;
    signal sr: std_logic_vector(11 downto 0);
    signal sense: std_logic_vector(11 downto 0);
    signal io_bus: std_logic_vector(11 downto 0);
    
    -- outputs
    signal pc: std_logic_vector(11 downto 0);
    signal ma: std_logic_vector(11 downto 0);
    signal mb: std_logic_vector(11 downto 0);
    signal ac: std_logic_vector(11 downto 0);
    signal link: std_logic;
    signal inst: pdp8_instruction;
    signal skip: std_logic;
    
    constant clk_period: time := 20 ns;
begin

dut: entity work.registers
generic map (
    enable_ext_mc8i => true
)
port map (
    clk => clk,
    rstn => rstn,

    transfers => transfers,
    sr => sr,
    sw_df => "000",
    sw_if => "000",
    sense => sense,
    io_bus => io_bus,
    
    pc_o => pc,
    ma_o => ma,
    mb_o => mb,
    ac_o => ac,
    link_o => link,
    inst_o => inst,
    skip_o => skip
);

rstn <= '0', '1' after 20ns;
clk <= not clk after clk_period / 2;

tests: process
begin
    transfers <= nop_transfer;
    sr <= (others => '0');
    sense <= (others => '0');
    io_bus <= (others => '0');
    
    wait until rstn = '1' and falling_edge(clk);
    transfers <= nop_transfer;
    
    -- Test SR -> AC
    sr <= o"6543";
    transfers <= nop_transfer;
    transfers.sr_enable <= '1';
    transfers.ac_load <= '1';
    wait for clk_period;
    assert ac = o"6543" report "SR -> AC" severity failure;
    
    -- Test AC -> not AC
    transfers <= nop_transfer;
    transfers.ac_comp_enable <= '1';
    transfers.ac_load <= '1';
    wait for clk_period;
    assert ac = o"1234" report "AC -> not AC" severity failure;

    -- Test SENSE -> MB
    transfers <= nop_transfer;
    sense <= o"7256";
    transfers.mem_enable <= '1';
    transfers.mb_load <= '1';
    wait for clk_period;
    assert mb = o"7256" report "SENSE -> MB" severity failure;

    -- Test AC AND MB -> AC
    transfers <= nop_transfer;
    transfers.ac_enable <= '1';
    transfers.and_enable <= '1';
    transfers.ac_load <= '1';
    wait for clk_period;
    assert ac = o"1214" report "AC or (not AC) -> not AC" severity failure;
    
    -- Test AC or (not AC) -> AC
    transfers <= nop_transfer;
    transfers.ac_enable <= '1';
    transfers.ac_comp_enable <= '1';
    transfers.ac_load <= '1';
    wait for clk_period;
    assert ac = o"7777" report "AC or (not AC) -> not AC" severity failure;

    -- Test 0 -> AC
    transfers <= nop_transfer;
    transfers.ac_load <= '1';
    wait for clk_period;
    assert ac = o"0000" report "0 -> AC" severity failure;

    -- Test MEM + 1 -> MB, SKIP on zero
    sense <= o"7777";
    transfers <= nop_transfer;
    transfers.mem_enable <= '1';
    transfers.carry_insert <= '1';
    transfers.skip_if_carry <= '1';
    transfers.skip_load <= '1';
    transfers.mb_load <= '1';
    wait for clk_period;
    assert mb = o"0000" and skip = '1' report "MEM + 1 -> MB, SKIP on zero" severity failure;
    
    -- Test CLA CML IAC RAL
    transfers <= nop_transfer;
    transfers.l_comp_enable <= '1';
    transfers.carry_insert <= '1';
    transfers.shift <= LEFT_SHIFT;
    transfers.ac_load <= '1';
    transfers.l_load <= '1';
    wait for clk_period;
    assert ac = o"0003" and link = '0' report "CLA CML IAC RAL" severity failure;

    -- Test CLA CMA CLL
    transfers <= nop_transfer;
    transfers.ac_comp_enable <= '1';
    transfers.ac_enable <= '1';
    transfers.ac_load <= '1';
    transfers.l_load <= '1';
    wait for clk_period;
    assert ac = o"7777" and link = '0' report "CLA CML CMA" severity failure;
    
    -- Test IAC overflow
    transfers <= nop_transfer;
    transfers.ac_enable <= '1';
    transfers.l_enable <= '1';
    transfers.carry_insert <= '1';
    transfers.ac_load <= '1';
    transfers.l_load <= '1';
    wait for clk_period;
    assert ac = o"0000" and link = '1' report "IAC" severity failure;
    
    -- Test CLA CLL IAC RTL
    transfers <= nop_transfer;
    transfers.carry_insert <= '1';
    transfers.shift <= DOUBLE_LEFT_ROTATE;
    transfers.ac_load <= '1';
    transfers.l_load <= '1';
    wait for clk_period;
    assert ac = o"0004" and link = '0' report "CLA IAC RTL" severity failure;

    -- Set AC = 7777 again
    transfers <= nop_transfer;
    transfers.ac_comp_enable <= '1';
    transfers.ac_enable <= '1';
    transfers.ac_load <= '1';
    transfers.l_load <= '1';
    wait for clk_period;
    assert ac = o"7777" and link = '0' report "CLA CML CMA" severity failure;
    
    -- Test TAD overflow
    sense <= o"7777";
    transfers <= nop_transfer;
    transfers.ac_enable <= '1';
    transfers.mem_enable <= '1';
    transfers.ac_load <= '1';
    wait for clk_period;
    assert ac = o"7776" and link = '1' report "TAD overflow" severity failure;
    
    -- Set AC 7776, L = 0
    sr <= o"7776";
    transfers <= nop_transfer;
    transfers.sr_enable <= '1';
    transfers.ac_load <= '1';
    transfers.l_load <= '1';
    wait for clk_period;
    assert ac = o"7776" and link = '0' report "7776 -> AC" severity failure;
    
    -- Test CML IAC
    transfers <= nop_transfer;
    transfers.l_comp_enable <= '1';
    transfers.ac_enable <= '1';
    transfers.carry_insert <= '1';
    transfers.l_load <= '1';
    transfers.ac_load <= '1';
    wait for clk_period;
    assert ac = o"7777" and link = '1' report "CML IAC" severity failure;

    -- Set AC 7776, L = 1
    sr <= o"7776";
    transfers <= nop_transfer;
    transfers.sr_enable <= '1';
    transfers.ac_load <= '1';
    wait for clk_period;
    assert ac = o"7776" and link = '1' report "7776 -> AC" severity failure;

    -- Test CML IAC
    transfers <= nop_transfer;
    transfers.l_comp_enable <= '1';
    transfers.ac_enable <= '1';
    transfers.carry_insert <= '1';
    transfers.l_load <= '1';
    transfers.ac_load <= '1';
    wait for clk_period;
    assert ac = o"7777" and link = '0' report "CML IAC" severity failure;

    -- Test CLA CMA CML IAC
    transfers <= nop_transfer;
    transfers.ac_comp_enable <= '1';
    transfers.ac_enable <= '1';
    transfers.l_comp_enable <= '1';
    transfers.carry_insert <= '1';
    transfers.ac_load <= '1';
    transfers.l_load <= '1';
    wait for clk_period;
    assert ac = o"0000" and link = '0' report "CLA CMA CML IAC" severity failure;

    -- Test CLA CMA CLL IAC
    transfers <= nop_transfer;
    transfers.ac_comp_enable <= '1';
    transfers.ac_enable <= '1';
    transfers.carry_insert <= '1';
    transfers.ac_load <= '1';
    transfers.l_load <= '1';
    wait for clk_period;
    assert ac = o"0000" and link = '1' report "CLA CMA CLL IAC" severity failure;

    -- Test CLA CMA CLL CML IAC
    transfers <= nop_transfer;
    transfers.ac_comp_enable <= '1';
    transfers.ac_enable <= '1';
    transfers.l_enable <= '1';
    transfers.l_comp_enable <= '1';
    transfers.carry_insert <= '1';
    transfers.ac_load <= '1';
    transfers.l_load <= '1';
    wait for clk_period;
    assert ac = o"0000" and link = '0' report "CLA CMA CLL CML IAC" severity failure;

    report "End of tests";
    transfers <= nop_transfer;
    wait;
    
end process;


end Behavioral;
