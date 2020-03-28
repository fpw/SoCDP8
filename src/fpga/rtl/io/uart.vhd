-- Part of SoCDP8, Copyright by Folke Will, 2019
-- Licensed under CERN Open Hardware Licence v1.2
-- See HW_LICENSE for details
library IEEE;
use IEEE.STD_LOGIC_1164.ALL;
use IEEE.NUMERIC_STD.ALL;

use work.socdp8_package.all;

entity uart is
    generic (
        baud_rate: positive := 300;
        data_bits: positive := 8;
        stop_bits: positive := 2
    );

    port (
        clk: in std_logic;
        
        rx: in std_logic;
        tx: out std_logic;
        rts: in std_logic; -- other side ready to receive
        cts: out std_logic; -- ready to receive

        tx_ready: out std_logic;
        tx_data: in std_logic_vector(data_bits - 1 downto 0);
        tx_send: in std_logic;

        rx_data: out std_logic_vector(data_bits - 1 downto 0);
        rx_recv: out std_logic
    );
    
    constant num_cycles: natural := period_to_cycles(clk_frq, 1.0 / real(baud_rate));
end uart;

architecture Behavioral of uart is
    type uart_state is (IDLE, START, BITS, STOP);
    
    signal tx_state: uart_state := IDLE;
    signal tx_buf: std_logic_vector(data_bits - 1 downto 0) := (others => '0');
    signal tx_idx: integer range 0 to data_bits - 1 := 0;
    signal tx_counter: integer range 0 to num_cycles - 1 := 0;
    
    signal rx_state: uart_state := IDLE;
    signal rx_buf: std_logic_vector(data_bits - 1 downto 0) := (others => '0');
    signal rx_idx: integer range 0 to data_bits - 1 := 0;
    signal rx_counter: integer range 0 to num_cycles - 1 := 0;
begin

send: process
begin
    wait until rising_edge(clk);
    
    if tx_counter < num_cycles - 1 then
        tx_counter <= tx_counter + 1;
    else
        tx_counter <= 0;
    end if;

    -- defaults
    tx_ready <= '0';
    
    case tx_state is
        when IDLE =>
            tx <= '1';
            tx_ready <= '1';
            tx_buf <= tx_data;
            if tx_send = '1' then
                tx_counter <= 1;
                tx_state <= START;
            end if;
        when START =>
            tx <= '0';
            if tx_counter = 0 then
                tx_idx <= 0;
                tx_state <= BITS;
            end if;
        when BITS =>
            tx <= tx_buf(0);
            if tx_counter = 0 then
                if tx_idx < data_bits - 1 then
                    tx_buf <= '0' & tx_buf(data_bits - 1 downto 1);
                    tx_idx <= tx_idx + 1;
                else
                    tx_state <= STOP;
                    tx_idx <= 0;
                end if;
            end if;
        when STOP =>
            tx <= '1';
            if tx_counter = 0 then
                if tx_idx < stop_bits - 1 then
                    tx_idx <= tx_idx + 1;
                else
                    tx_state <= IDLE;
                    tx_idx <= 0;
                end if;
            end if;
    end case;
end process;

recv: process
begin
    wait until rising_edge(clk);
    
    -- defaults
    rx_recv <= '0';
    
    if rx_counter < num_cycles - 1 then
        rx_counter <= rx_counter + 1;
    else
        rx_counter <= 0;
    end if;
    
    case rx_state is
        when IDLE =>
            if rx = '0' then
                rx_counter <= (num_cycles - 1) / 2;
                rx_state <= START;
            end if;
        when START =>
            if rx_counter = 0 then
                if rx = '0' then
                    rx_idx <= 0;
                    rx_state <= BITS;
                else
                    rx_state <= IDLE;
                end if;
            end if;
        when BITS =>
            if rx_counter = 0 then
                rx_buf <= rx & rx_buf(data_bits - 1 downto 1);
                if rx_idx < data_bits - 1 then
                    rx_idx <= rx_idx + 1;
                else
                    rx_state <= STOP;
                    rx_idx <= 0;
                end if;
            end if;
        when STOP =>
            if rx_counter = 0 then
                if rx = '1' then
                    rx_state <= IDLE;
                    rx_recv <= '1';
                end if;
                rx_state <= IDLE;
            end if;
    end case;
end process;

rx_data <= rx_buf;

end Behavioral;
