-- Part of SoCDP8, Copyright by Folke Will, 2019
-- Licensed under CERN Open Hardware Licence v1.2
-- See HW_LICENSE for details
library IEEE;
use IEEE.STD_LOGIC_1164.ALL;
use IEEE.NUMERIC_STD.ALL;

library unisim;
use unisim.vcomponents.all;

use work.socdp8_package.all;
use work.pidp8_console_package.all;

entity pynq_z2_top is
    port(
        clk_50: in std_logic;
        rst_n: in std_logic;

        -- PiDP-8 front panel connections
        column: inout std_logic_vector(11 downto 0);
        switch_row: out std_logic_vector(2 downto 0);
        led_row: out std_logic_vector(7 downto 0);

        -- Board features
        board_led: out std_logic_vector(3 downto 0);
        board_switch: in std_logic_vector(1 downto 0);
        board_led4_r: out std_logic;
        board_led4_g: out std_logic;
        board_led4_b: out std_logic;
        board_led5_r: out std_logic;
        board_led5_g: out std_logic;
        board_led5_b: out std_logic;
        board_btn: in std_logic_vector(3 downto 0);
        board_pmodb: out std_logic_vector(7 downto 0)
    );

    constant clk_frq: natural := 50_000_000;
end pynq_z2_top;

architecture Behavioral of pynq_z2_top is
    -- IO buffer control
    signal switch_row_t: std_logic_vector(2 downto 0);
    signal led_row_buf: std_logic_vector(7 downto 0);
    signal col_out_buf: std_logic_vector(11 downto 0);
    signal col_in_buf: std_logic_vector(11 downto 0);
    signal col_t: std_logic;

    -- interconnection
    signal rst: std_logic;
    signal leds: pdp8i_leds;
    signal switches: pdp8i_switches;
begin

-- Alias signals because Xilinx doesn't allow top entities to be VHDL-2008...
rst <= not rst_n;

console_inst: entity work.pidp8_console
generic map (
    clk_frq => clk_frq
)
port map (
    clk => clk_50,
    rst => rst,
    column_in => col_in_buf,
    column_out => col_out_buf,
    column_t => col_t,
    switch_row => switch_row_t,
    led_row => led_row_buf,

    leds => leds,
    switches => switches
);

-- Test
leds.ion <= '1';
leds.pc <= switches.swr;
leds.data_field <= switches.data_field;
leds.inst_field <= switches.inst_field;
leds.cycle <= CYCLE_DEFER;
leds.instruction <= INST_DCA;
leds.pause <= switches.stop;
leds.run <= switches.sing_inst;

-- Using IOBUFs to activate and deactive pullups at runtime
-- Xilinx IOBUFs behave like this:
-- IO <= I when T = '0' else 'Z';
-- O <= IO;
col_bufs: for i in 0 to 11 generate begin
    col_iobuf: IOBUF
    port map (
        O => col_in_buf(i),
        IO => column(i),
        I => col_out_buf(i),
        T => col_t
    );
end generate;

led_row_bufs: for i in 0 to 7 generate begin
    led_row_obuf: OBUFT
    port map (
        O => led_row(i),
        I => led_row_buf(i),
        T => col_t
    );
end generate;

sw_row_bufs: for i in 0 to 2 generate begin
    sw_row_obuf: OBUFT
    port map (
        O => switch_row(i),
        I => switch_row_t(i),
        T => switch_row_t(i)
    );
end generate;

-- Currently unused peripherals
board_led <= "0000";
board_led4_r <= '0';
board_led4_g <= '0';
board_led4_b <= '0';
board_led5_r <= '0';
board_led5_g <= '0';
board_led5_b <= '0';
board_pmodb <= (others => '0');

end Behavioral;