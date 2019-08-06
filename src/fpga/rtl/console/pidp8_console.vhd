-- Part of SoCDP8, Copyright by Folke Will, 2019
-- Licensed under CERN Open Hardware Licence v1.2
-- See HW_LICENSE for details
library IEEE;
use IEEE.STD_LOGIC_1164.ALL;
use IEEE.NUMERIC_STD.ALL;

use work.socdp8_package.all;
use work.pidp8_console_package.all;

entity pidp8_console is
    generic (
        config: pdp8_config;
        -- we want 50 us steps for the multiplexing, how far do we have to count?
        cycles_max: natural := period_to_cycles(config.clk_frq, 50.0e-6);
        -- and a PWM delay of 1 us
        pwm_cycles_max: natural := period_to_cycles(config.clk_frq, 1.0e-6)
    );
    port (
        clk: in std_logic;
        rst: in std_logic;
    
        -- GPIO connections
        led_row: out std_logic_vector(7 downto 0);
        column_in: in std_logic_vector(11 downto 0);
        column_out: out std_logic_vector(11 downto 0);
        column_t: out std_logic;
        switch_row: out std_logic_vector(2 downto 0);
    
        -- Actual console data
        leds: in pdp8i_leds;
        switches: out pdp8i_switches
    );
    constant lamp_count: natural := 8 * 12;
end pidp8_console;

architecture Behavioral of pidp8_console is
    -- output registers
    signal col_t_out: std_logic := '0';
    signal col_out: std_logic_vector(11 downto 0) := (others => '0');
    signal led_row_out: std_logic_vector(7 downto 0) := (others => '0');
    signal sw_row_out: std_logic_vector(2 downto 0) := (others => '0');

    -- internal registers
    -- shift register to sync column input
    signal col_in1: std_logic_vector(11 downto 0) := (others => '0');
    signal col_in2: std_logic_vector(11 downto 0) := (others => '0');
    -- state
    signal cycle_counter: natural range 0 to cycles_max - 1 := 0;
    signal pwm_counter: natural range 0 to pwm_cycles_max - 1;
    signal duty_counter: natural range 0 to 31;
    signal step_50us: std_logic;
    signal cur_row: natural range 0 to 7;

    type state_t is (RESET, LED_OUT, LED_PAUSE, COL_IN, COL_PAUSE);
    signal state: state_t := RESET;

    signal switch_row1: std_logic_vector(11 downto 0);
    signal switch_row2: std_logic_vector(5 downto 0);
    signal switch_row3: std_logic_vector(7 downto 0);

    -- combinatorial
    type led_row_a is array(0 to 7) of std_logic_vector(11 downto 0);
    signal led_row_data: led_row_a;
    
    type led_brightness_row is array(0 to 7) of lamp_brightness_array(0 to 11);
    signal led_brightness: led_brightness_row;
begin

-- Connect LED input to LED rows.
-- Note that that the PDP-8 counts bits starting from 0 := MSB,
-- so vectors need to be reversed.
led_row_data(0) <= reverse(leds.pc);
led_row_data(1) <= reverse(leds.mem_addr);
led_row_data(2) <= reverse(leds.mem_buf);
led_row_data(3) <= reverse(leds.accu);
led_row_data(4) <= reverse(leds.mqr);

with leds.state select led_row_data(5)(11 downto 8) <=
    "0001" when STATE_FETCH,
    "0010" when STATE_EXEC,
    "0100" when STATE_DEFER,
    "1000" when STATE_COUNT,
    "0000" when others;
with leds.instruction select led_row_data(5)(7 downto 0) <=
    "00000001" when INST_AND,
    "00000010" when INST_TAD,
    "00000100" when INST_ISZ,
    "00001000" when INST_DCA,
    "00010000" when INST_JMS,
    "00100000" when INST_JMP,
    "01000000" when INST_IOT,
    "10000000" when INST_OPR,
    "00000000" when others;

led_row_data(6)(11 downto 2) <=
     "00" & reverse(leds.step_counter) &
     leds.run & leds.pause & leds.ion;
with leds.state select led_row_data(6)(1 downto 0) <=
    "01" when STATE_ADDR,
    "10" when STATE_BREAK,
    "00" when others;

led_row_data(7) <= "00000" & leds.link & reverse(leds.inst_field) & reverse(leds.data_field);

-- Connect switch register to switch output.
-- Note that switches are from 0 := MSB in vectors.
switches.swr <= reverse(switch_row1);
switches.data_field <= reverse(switch_row2(2 downto 0));
switches.inst_field <= reverse(switch_row2(5 downto 3));
switches.start <= switch_row3(0);
switches.load <= switch_row3(1);
switches.dep <= switch_row3(2);
switches.exam <= switch_row3(3);
switches.cont <= switch_row3(4);
switches.stop <= switch_row3(5);
switches.sing_step <= switch_row3(6);
switches.sing_inst <= switch_row3(7);

-- Note that the entire system only has one central debouncing circuit,
-- so only synchronize the switch column signals here. The debouncer
-- is implemented in the timing generator.
col_in1 <= column_in when rising_edge(clk);
col_in2 <= col_in1 when rising_edge(clk);

gen_lamps: if config.simulate_lamps generate
    -- simulate lamps by observing the state to output it via PWM
    lamps: entity work.lamp
    generic map (
        clk_frq => config.clk_frq,
        lamp_count => lamp_count,
        rise_time_ms => 100
    )
    port map (
        clk => clk,
        rst => rst,
        input(11 downto 0) => led_row_data(0),
        input(23 downto 12) => led_row_data(1),
        input(35 downto 24) => led_row_data(2),
        input(47 downto 36) => led_row_data(3),
        input(59 downto 48) => led_row_data(4),
        input(71 downto 60) => led_row_data(5),
        input(83 downto 72) => led_row_data(6),
        input(95 downto 84) => led_row_data(7),
        brightness(0 to 11) => led_brightness(0),
        brightness(12 to 23) => led_brightness(1),
        brightness(24 to 35) => led_brightness(2),
        brightness(36 to 47) => led_brightness(3),
        brightness(48 to 59) => led_brightness(4),
        brightness(60 to 71) => led_brightness(5),
        brightness(72 to 83) => led_brightness(6),
        brightness(84 to 95) => led_brightness(7)
    );
    
    pwm: process
    begin
        wait until rising_edge(clk);
    
        if pwm_counter < pwm_cycles_max - 1 then
            pwm_counter <= pwm_counter + 1;
        else
            pwm_counter <= 0;
            
            if duty_counter < 31 then
                duty_counter <= duty_counter + 1;
            else
                duty_counter <= 0;
            end if;
        end if;
    
        for col in 0 to 11 loop
            if led_brightness(cur_row)(col) /= 0 and led_brightness(cur_row)(col) >= duty_counter then
                col_out(col) <= '0'; -- low active, this enabled the LED
            else
                col_out(col) <= '1';
            end if;
        end loop;
    
        if rst = '1' then
            pwm_counter <= 0;
            duty_counter <= 0;
            col_out <= (others => '1');
        end if;
    end process;
end generate;

count_cycles: process
begin
    wait until rising_edge(clk);
    
    step_50us <= '0';

    if cycle_counter < cycles_max - 1 then
        cycle_counter <= cycle_counter + 1;
    else
        cycle_counter <= 0;
        step_50us <= '1';
    end if;

    if rst = '1' then
        cycle_counter <= 0;
    end if;
end process;

led_col: process is
    variable count_50us: natural range 0 to 31 := 0;
begin
    wait until rising_edge(clk);

    if step_50us = '1' then
        count_50us := count_50us + 1;
    end if;

    case state is
        when RESET =>
            count_50us := 0;
            cur_row <= 0;
            led_row_out <= "00000001";
            sw_row_out <= "111";
            col_t_out <= '1';
            if rst = '0' then
                state <= LED_OUT;
            end if;
        when LED_OUT =>
            col_t_out <= '0';
            if config.simulate_lamps = '0' then
                col_out <= not led_row_data(cur_row);
            end if;
            if count_50us = 31 then
                count_50us := 0;
                state <= LED_PAUSE;
            end if;
        when LED_PAUSE =>
            col_t_out <= '1';
            if count_50us = 1 then
                count_50us := 0;
                led_row_out <= led_row_out(6 downto 0) & led_row_out(7);
                if cur_row < 7 then
                    cur_row <= cur_row + 1;
                    state <= LED_OUT;
                else
                    cur_row <= 0;
                    state <= COL_IN;
                end if;
            end if;
        when COL_IN =>
            col_t_out <= '1';
            case count_50us is
                when 0 =>
                    sw_row_out <= "110";
                when 1 =>
                    if step_50us = '1' then
                        switch_row1 <= not col_in2;
                    end if;
                    sw_row_out <= "101";
                when 2 =>
                    if step_50us = '1' then
                        switch_row2 <= not col_in2(5 downto 0);
                    end if;
                    sw_row_out <= "011";
                when 3 =>
                    if step_50us = '1' then
                        switch_row3 <= not col_in2(7 downto 0);
                    end if;
                    count_50us := 0;
                    state <= COL_PAUSE;
                when others =>
                    null;
            end case;
        when COL_PAUSE =>
            sw_row_out <= "111";
            col_t_out <= '1';
            if count_50us = 1 then
                count_50us := 0;
                state <= LED_OUT;
            end if;
    end case;

    if rst = '1' then
        state <= RESET;
    end if;
end process;

led_row <= led_row_out;
switch_row <= sw_row_out;
column_out <= col_out;
column_t <= col_t_out;

end Behavioral;