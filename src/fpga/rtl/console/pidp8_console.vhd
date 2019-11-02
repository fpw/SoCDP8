-- Part of SoCDP8, Copyright by Folke Will, 2019
-- Licensed under CERN Open Hardware Licence v1.2
-- See HW_LICENSE for details
library IEEE;
use IEEE.STD_LOGIC_1164.ALL;
use IEEE.NUMERIC_STD.ALL;

use work.socdp8_package.all;

entity pidp8_console is
    port (
        clk: in std_logic;
        rstn: in std_logic;
    
        -- GPIO connections
        led_row: out std_logic_vector(7 downto 0);
        column_in: in std_logic_vector(11 downto 0);
        column_out: out std_logic_vector(11 downto 0);
        column_t: out std_logic;
        switch_row: out std_logic_vector(2 downto 0);
    
        -- Actual console data
        -- Console connection
        lamp_brightness: in std_logic_vector(89 * 4 - 1 downto 0);

        switch_data_field: out std_logic_vector(2 downto 0);
        switch_inst_field: out std_logic_vector(2 downto 0);
        switch_swr: out std_logic_vector(11 downto 0);
        switch_start: out std_logic;
        switch_load: out std_logic;
        switch_dep: out std_logic;
        switch_exam: out std_logic;
        switch_cont: out std_logic;
        switch_stop: out std_logic;
        switch_sing_step: out std_logic;
        switch_sing_inst: out std_logic
    );

    -- we want 50 us steps for the multiplexing, how far do we have to count?
    constant cycles_max: natural := period_to_cycles(clk_frq, 50.0e-6);
    -- and a PWM delay of 1 us
    constant pwm_cycles_max: natural := period_to_cycles(clk_frq, 1.0e-6);
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
    signal duty_counter: natural range 0 to 15;
    signal step_50us: std_logic;
    signal cur_row: natural range 0 to 7;

    type state_t is (RESET, LED_OUT, LED_WAIT, COL_IN, COL_PAUSE);
    signal state: state_t := RESET;

    signal switch_row1: std_logic_vector(11 downto 0);
    signal switch_row2: std_logic_vector(5 downto 0);
    signal switch_row3: std_logic_vector(7 downto 0);

    -- combinatorial
    type led_brightness_row is array(0 to 7) of lamp_brightness_array(0 to 11);
    signal led_brightness: led_brightness_row;
begin

-- Connect LED input to LED rows.
-- Note that that the PDP-8 counts bits starting from 0 := MSB,
-- so vectors need to be reversed.
lpc: for i in 0 to 11 generate
    led_brightness(0)(11 - i) <= unsigned(lamp_brightness((LAMP_PC + i + 1) * 4 - 1 downto (LAMP_PC + i) * 4));
end generate;

lma: for i in 0 to 11 generate
    led_brightness(1)(11 - i) <= unsigned(lamp_brightness((LAMP_MA + i + 1) * 4 - 1 downto (LAMP_MA + i) * 4));
end generate;

lmb: for i in 0 to 11 generate
    led_brightness(2)(11 - i) <= unsigned(lamp_brightness((LAMP_MB + i + 1) * 4 - 1 downto (LAMP_MB + i) * 4));
end generate;

lac: for i in 0 to 11 generate
    led_brightness(3)(11 - i) <= unsigned(lamp_brightness((LAMP_AC + i + 1) * 4 - 1 downto (LAMP_AC + i) * 4));
end generate;

lmqr: for i in 0 to 11 generate
    led_brightness(4)(11 - i) <= unsigned(lamp_brightness((LAMP_MQR + i + 1) * 4 - 1 downto (LAMP_MQR + i) * 4));
end generate;

lstate: for i in 0 to 3 generate
    led_brightness(5)(8 + i) <= unsigned(lamp_brightness((LAMP_STATE + i + 1) * 4 - 1 downto (LAMP_STATE + i) * 4));
end generate;

linst: for i in 0 to 7 generate
    led_brightness(5)(i) <= unsigned(lamp_brightness((LAMP_IR + i + 1) * 4 - 1 downto (LAMP_IR + i) * 4));
end generate;

lsc: for i in 0 to 4 generate
    led_brightness(6)(9 - i) <= unsigned(lamp_brightness((LAMP_SC + i + 1) * 4 - 1 downto (LAMP_SC + i) * 4));
end generate;
led_brightness(6)(4) <= unsigned(lamp_brightness((LAMP_RUN + 0 + 1) * 4 - 1 downto (LAMP_RUN + 0) * 4));
led_brightness(6)(3) <= unsigned(lamp_brightness((LAMP_PAUSE + 0 + 1) * 4 - 1 downto (LAMP_PAUSE + 0) * 4));
led_brightness(6)(2) <= unsigned(lamp_brightness((LAMP_ION + 0 + 1) * 4 - 1 downto (LAMP_ION + 0) * 4));
led_brightness(6)(1) <= unsigned(lamp_brightness((LAMP_STATE + 5 + 1) * 4 - 1 downto (LAMP_STATE + 5) * 4));
led_brightness(6)(0) <= unsigned(lamp_brightness((LAMP_STATE + 4 + 1) * 4 - 1 downto (LAMP_STATE + 4) * 4));

led_brightness(7)(6) <= unsigned(lamp_brightness((LAMP_L + 0 + 1) * 4 - 1 downto (LAMP_L + 0) * 4));

lif: for i in 0 to 2  generate
    led_brightness(7)(5 - i) <= unsigned(lamp_brightness((LAMP_IF + i + 1) * 4 - 1 downto (LAMP_IF + i) * 4));
end generate;

ldf: for i in 0 to 2  generate
    led_brightness(7)(2 - i) <= unsigned(lamp_brightness((LAMP_DF + i + 1) * 4 - 1 downto (LAMP_DF + i) * 4));
end generate;

-- Connect switch register to switch output.
-- Note that switches are from 0 := MSB in vectors.
switch_swr <= reverse(switch_row1);
switch_data_field <= reverse(switch_row2(2 downto 0));
switch_inst_field <= reverse(switch_row2(5 downto 3));
switch_start <= switch_row3(0);
switch_load <= switch_row3(1);
switch_dep <= switch_row3(2);
switch_exam <= switch_row3(3);
switch_cont <= switch_row3(4);
switch_stop <= switch_row3(5);
switch_sing_step <= switch_row3(6);
switch_sing_inst <= switch_row3(7);

-- Note that the entire system only has one central debouncing circuit,
-- so only synchronize the switch column signals here. The debouncer
-- is implemented in the timing generator.
col_in1 <= column_in when rising_edge(clk);
col_in2 <= col_in1 when rising_edge(clk);

pwm: process
begin
    wait until rising_edge(clk);

    if pwm_counter < pwm_cycles_max - 1 then
        pwm_counter <= pwm_counter + 1;
    else
        pwm_counter <= 0;
        
        if duty_counter < 15 then
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

    if rstn = '0' then
        pwm_counter <= 0;
        duty_counter <= 0;
        col_out <= (others => '1');
    end if;
end process;

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

    if rstn = '0' then
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
            if rstn = '1' then
                state <= LED_OUT;
            end if;
        when LED_OUT =>
            col_t_out <= '0';
            if count_50us = 31 then
                count_50us := 0;
                state <= LED_WAIT;
            end if;
        when LED_WAIT =>
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

    if rstn = '0' then
        state <= RESET;
    end if;
end process;

led_row <= led_row_out;
switch_row <= sw_row_out;
column_out <= col_out;
column_t <= col_t_out;

end Behavioral;