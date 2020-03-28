-- Part of SoCDP8, Copyright by Folke Will, 2019
-- Licensed under CERN Open Hardware Licence v1.2
-- See HW_LICENSE for details
library IEEE;
use IEEE.STD_LOGIC_1164.ALL;
use IEEE.NUMERIC_STD.ALL;

use work.socdp8_package.all;

entity uart_tb is
end uart_tb;

architecture Behavioral of uart_tb is
    signal clk: std_logic := '0';
    
    -- inputs
    signal rx: std_logic;
    signal rts: std_logic;
    signal tx_data: std_logic_vector(7 downto 0);
    signal tx_send: std_logic;
    
    -- outputs
    signal tx: std_logic;
    signal cts: std_logic;
    signal tx_ready: std_logic;
    signal rx_data: std_logic_vector(7 downto 0);
    signal rx_recv: std_logic;
begin

dut: entity work.uart
generic map (
    baud_rate => 300,
    data_bits => 8,
    stop_bits => 2
)
port map (
    clk => clk,
    
    rx => rx,
    tx => tx,
    rts => rts,
    cts => cts,
    
    tx_ready => tx_ready,
    tx_data => tx_data,
    tx_send => tx_send,
    rx_data => rx_data,
    rx_recv => rx_recv
);

sim_ext: process
begin
    wait until rising_edge(clk);
    
    rx <= '1';
    
    tx_data <= "10101010";
    tx_send <= '1';

    wait until rising_edge(clk);
    wait until rising_edge(clk);
    tx_send <= '0';
    
    wait for 40 ms;
    
    rx <= '0';
    wait for 3.33 ms;

    rx <= '1';
    wait for 3.33 ms;
    rx <= '1';
    wait for 3.33 ms;
    rx <= '1';
    wait for 3.33 ms;
    rx <= '0';
    wait for 3.33 ms;
    rx <= '0';
    wait for 3.33 ms;
    rx <= '0';
    wait for 3.33 ms;
    rx <= '1';
    wait for 3.33 ms;
    rx <= '0';
    wait for 3.33 ms;

    rx <= '1';
    wait for 3.33 ms;
    rx <= '1';
    wait for 3.33 ms;

    wait;    
end process;

clk <= not clk after 10 ns;

end Behavioral;
