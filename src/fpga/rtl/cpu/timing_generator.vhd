-- Part of SoCDP8, Copyright by Folke Will, 2019
-- Licensed under CERN Open Hardware Licence v1.2
-- See HW_LICENSE for details
library IEEE;
use IEEE.STD_LOGIC_1164.ALL;
use IEEE.NUMERIC_STD.ALL;

use work.socdp8_package.all;

-- This entity implements the manual and automatic timing generator as described in
-- section 4.14.
entity timing_generator is
    generic (
        clk_frq: in natural;
        -- manual timing requires 2 us pulses
        num_cycles_2us: natural := period_to_cycles(clk_frq, 2.0e-6);
        -- auto timing requires 250ns pulses
        num_cycles_250ns: natural := period_to_cycles(clk_frq, 250.0e-9);
        -- the debouncer requires 100 ms, see page 4-21
        num_cycles_100ms: natural := period_to_cycles(clk_frq, 100.0e-3)
    );
    port (
        clk: in std_logic;
        rst: in std_logic;
        
        -- output the current timing state, pulse on change
        time_state_o: out timing_state;
        time_pulse_o: out std_logic;
        
        -- the timing depends on the memory strobe as described on page 4-24
        run: in std_logic;
        strobe: in std_logic;
        mem_done: in std_logic;
        
        -- the manual timing depends on some console switches as described on page 4-21
        key_la: in std_logic;
        key_st: in std_logic;
        key_ex: in std_logic;
        key_dep: in std_logic;
        key_cont: in std_logic
    );
end timing_generator;

architecture Behavioral of timing_generator is
    -- state register
    signal time_state: timing_state;
    signal time_pulse: std_logic;
    
    -- time pulses
    signal mftp0: std_logic;
    
    -- whether the debouncing delay is active
    signal deb_active: std_logic;
    signal deb_wait_low: std_logic;
    
    -- counters for pulses
    signal counter_timer: natural range 0 to num_cycles_2us - 1;
    signal counter_deb: natural range 0 to num_cycles_100ms - 1;
begin

-- there is only one debouncer in the whole system, it debounces the output
-- of an OR gate that connects all momentary switches except for the stop key
-- and also makes sure that run is not active.
-- Other parts of the system will deactive run with the undebounced switches
-- so the condition will eventually be satisfied.
-- Drawing D-BS-8I-0-2
debounce: process
begin
    wait until rising_edge(clk);

    -- the time pulse that indicates that a manual cycle is to be started
    mftp0 <= '0';

    -- the debouncer condition 
    if key_la or key_st or key_ex or key_dep or key_cont then
        if run = '0' and deb_active = '0' and deb_wait_low = '0' then
            -- start debounce delay
            counter_deb <= num_cycles_100ms - 1;
            deb_active <= '1';
        end if;
    else
        -- using this signal for edge detection
        deb_wait_low <= '0';
    end if;
    
    if deb_active = '1' then
        if counter_deb > 0 then
            counter_deb <= counter_deb - 1;
        else
            -- the debouncer condition was active 100 ms ago, generate pulse now
            mftp0 <= '1';
            deb_active <= '0';
            deb_wait_low <= '1';
        end if;
    end if;

    if rst = '1' then
        mftp0 <= '0';
        deb_active <= '0';
        counter_deb <= 0;
        deb_wait_low <= '0';
    end if;
end process;

timing: process
begin
    wait until rising_edge(clk);

    -- reset pulses
    time_pulse <= '0';
    
    -- Initially, the system starts in manual timing mode as described on page 4-21.
    -- Note that the initial state is MFT2 as seen on drawing D-BS-8I-0-2, grid B8
    case time_state is
        when MFT2 =>
            -- If the debounced key input condition is true, generate a manual timing cycle
            if mftp0 = '1' then
                -- set the wait time for the MFT0 state, see page 4-21
                counter_timer <= num_cycles_2us - 1;
                time_pulse <= '1'; -- MFTP0
                time_state <= MFT0;
            end if;
            if strobe = '1' then
                -- time to TS3 is always 250 ns, see page 4-25
                counter_timer <= num_cycles_250ns - 1;
                time_pulse <= '1'; -- TP1
                time_state <= TS2;
            end if;
        when MFT0 =>
            if counter_timer > 0 then
                counter_timer <= counter_timer - 1;
            else
                -- set the delay for the MFT1 state
                counter_timer <= num_cycles_2us - 1;
                time_pulse <= '1'; -- MFTP1
                time_state <= MFT1;
            end if;
        when MFT1 =>
            if counter_timer > 0 then
                counter_timer <= counter_timer - 1;
            else
                time_pulse <= '1'; -- MFTP2
                time_state <= MFT2;
            end if;
        when TS1 =>
            if strobe = '1' then
                counter_timer <= num_cycles_250ns - 1;
                time_pulse <= '1'; -- TP1
                time_state <= TS2;
            end if;
        when TS2 =>
            if counter_timer > 0 then
                counter_timer <= counter_timer - 1;
            else
                -- time to TS4 is always 250 ns, see page 4-25
                counter_timer <= num_cycles_250ns - 1;
                time_pulse <= '1'; -- TP2
                time_state <= TS3;
            end if;
        when TS3 =>
            if counter_timer > 0 then
                counter_timer <= counter_timer - 1;
            else
                time_pulse <= '1'; -- TP3
                time_state <= TS4;
            end if;
        when TS4 =>
            if mem_done = '1' then
                if run = '1' then
                    time_pulse <= '1';
                    time_state <= TS1;
                else
                    time_pulse <= '1';
                    time_state <= MFT2;
                end if;
            end if;
    end case;
    
    if rst = '1' then
        time_state <= MFT2;
    end if;
end process;

time_state_o <= time_state;
time_pulse_o <= time_pulse;

end Behavioral;
