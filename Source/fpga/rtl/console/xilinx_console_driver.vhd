-- Part of SoCDP8, Copyright by Folke Will, 2019
-- Licensed under CERN Open Hardware Licence v1.2
-- See HW_LICENSE for details
library IEEE;
use IEEE.STD_LOGIC_1164.ALL;
use IEEE.NUMERIC_STD.ALL;

library unisim;
use unisim.vcomponents.all;

use work.socdp8_package.all;

entity xilinx_console_driver is
    port (
        clk: in std_logic;
    
        led_row_in: in std_logic_vector(7 downto 0);
        column_in: in std_logic_vector(11 downto 0);
        column_out: out std_logic_vector(11 downto 0);
        column_t: in std_logic;
        switch_row_in: in std_logic_vector(2 downto 0);
    
        -- PiDP-8 front panel connections
        column_io: inout std_logic_vector(11 downto 0);
        switch_row_out: out std_logic_vector(2 downto 0);
        led_row_out: out std_logic_vector(7 downto 0)
    );
end xilinx_console_driver;

architecture Behavioral of xilinx_console_driver is
    signal led_row_in_reg: std_logic_vector(7 downto 0);
    signal column_in_reg: std_logic_vector(11 downto 0);
    signal column_out_reg: std_logic_vector(11 downto 0);
    signal column_t_reg: std_logic;
    signal switch_row_in_reg: std_logic_vector(2 downto 0);
begin

regs: process
begin
    wait until rising_edge(clk);
    
    led_row_in_reg <= led_row_in;
    column_in_reg <= column_in;
    column_t_reg <= column_t;
    switch_row_in_reg <= switch_row_in;
    column_out <= column_out_reg;
end process;

-- Using IOBUFs to activate and deactive pullups at runtime
--- Xilinx IOBUFs behave like this:
---- IO <= I when T = '0' else 'Z';
---- O <= IO;
col_bufs: for i in 0 to 11 generate begin
    col_iobuf: IOBUF
    port map (
        O => column_out_reg(i),
        IO => column_io(i),
        I => column_in_reg(i),
        T => column_t_reg
    );
end generate;

led_row_bufs: for i in 0 to 7 generate begin
    led_row_obuf: OBUFT
    port map (
        O => led_row_out(i),
        I => led_row_in_reg(i),
        T => column_t_reg
    );
end generate;

sw_row_bufs: for i in 0 to 2 generate begin
    sw_row_obuf: OBUFT
    port map (
        O => switch_row_out(i),
        I => switch_row_in_reg(i),
        T => switch_row_in_reg(i)
    );
end generate;

end Behavioral;
