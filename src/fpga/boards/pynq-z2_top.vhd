-- Part of SoCDP8, Copyright by Folke Will, 2019
-- Licensed under CERN Open Hardware Licence v1.2
-- See HW_LICENSE for details
library IEEE;
use IEEE.STD_LOGIC_1164.ALL;
use IEEE.NUMERIC_STD.ALL;

library unisim;
use unisim.vcomponents.all;

use work.socdp8_package.all;

entity pynq_z2_top is
    port (
        clk: in std_logic;
        rst: in std_logic;

        -- I/O connections, documentation in package
        iop: out std_logic_vector(2 downto 0);
        io_ac: out std_logic_vector(11 downto 0);
        io_mb: out std_logic_vector(11 downto 0);
        io_bus_in: in std_logic_vector(11 downto 0);
        io_ac_clear: in std_logic;
        io_skip: in std_logic;
        
        -- Request an interrupt. Level sensitive.
        int_rqst: in std_logic;
        
        -- PiDP-8 front panel connections
        column: inout std_logic_vector(11 downto 0);
        switch_row: out std_logic_vector(2 downto 0);
        led_row: out std_logic_vector(7 downto 0);
        
        -- external memory connections
        mem_addr: out std_logic_vector(14 downto 0);
        mem_din: out std_logic_vector(11 downto 0);
        mem_dout: in std_logic_vector(11 downto 0);
        mem_write: out std_logic;

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

    constant config: pdp8_config := (
        clk_frq => 50_000_000,
        enable_ext_eae => '1',
        simulate_lamps => '0',
        debounce_time => 100.0e-3,
        manual_cycle_time => 2.0e-6,
        memory_cycle_time => 500.0e-9,
        auto_cycle_time => 250.0e-9,
        eae_cycle_time => 350.0e-9
    );
end pynq_z2_top;

architecture Behavioral of pynq_z2_top is

    -- IO buffer control
    signal switch_row_t: std_logic_vector(2 downto 0);
    signal led_row_buf: std_logic_vector(7 downto 0);
    signal col_out_buf: std_logic_vector(11 downto 0);
    signal col_in_buf: std_logic_vector(11 downto 0);
    signal col_t: std_logic;
    
    -- interconnection
    --- console
    signal leds: pdp8i_leds;
    signal switches: pdp8i_switches;
begin

console_inst: entity work.pidp8_console
generic map (
    config => config
)
port map (
    clk => clk,
    rst => rst,
    column_in => col_in_buf,
    column_out => col_out_buf,
    column_t => col_t,
    switch_row => switch_row_t,
    led_row => led_row_buf,

    leds => leds,
    switches => switches
);

pdp8_inst: entity work.pdp8
generic map (
    config => config
)
port map (
    clk => clk,
    rst => rst,
    io_in.bus_in => io_bus_in,
    io_in.ac_clear => io_ac_clear,
    io_in.io_skip => io_skip,
    io_out.iop => iop,
    io_out.ac => io_ac,
    io_out.mb => io_mb,
    int_rqst => int_rqst,
    ext_mem_out.data => mem_din,
    ext_mem_out.write => mem_write,
    ext_mem_out.addr => mem_addr,
    ext_mem_in.data => mem_dout,
    leds => leds,
    switches => switches
);

-- Using IOBUFs to activate and deactive pullups at runtime
--- Xilinx IOBUFs behave like this:
---- IO <= I when T = '0' else 'Z';
---- O <= IO;
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