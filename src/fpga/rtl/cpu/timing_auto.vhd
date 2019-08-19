-- Part of SoCDP8, Copyright by Folke Will, 2019
-- Licensed under CERN Open Hardware Licence v1.2
-- See HW_LICENSE for details
library IEEE;
use IEEE.STD_LOGIC_1164.ALL;
use IEEE.NUMERIC_STD.ALL;

use work.socdp8_package.all;

-- This entity implements the auto time state generator
--
-- Discussion of relevant drawing D-BS-8I-0-2:
-- 
-- Region M216.E18 (D8), M216.E19 (D7) - described on page 4-24:
-- TS1 is forced high by the MANUAL PRESET signal, this also deactivates TS2 to TS4.
-- There is no automatic transition from TS1 to any other state.
-- TS1 is cleared and TS2 is set by the STROBE signal, i.e. during a memory cycle.
--
-- Region M113.E15 (C6), M310.E17 (C5), M216.E18 (C8):
-- The STROBE signal also generates the TP1 pulse to mark the transition to TS2.
-- TP1 generates TP2 and TP3 through a delay line so that TP2 is 250 ns after TP1
-- and TP3 is 250 ns after TP2.
-- TP4 is generated if CONT is detected by the debouncer or if MEM IDLE is high (which
-- is set through MEM DONE) and RUN is active and PAUSE is not active.
--
-- In summary, the auto time cycle is controlled by the memory timing: Starting in TS1,
-- it transitions to TS2 when the memory is ready for reading (STROBE), goes to TS3 and then
-- TS4 through fixed delays and finally back to TS1 when the memory writing is also
-- finished (MEM DONE) or forced externally (force_tp4 ~ debounced cont key).
--
-- Since only one of the states can be active at a time, this can modeled using a state signal
-- and a single pulse when transitions occur.

entity timing_auto is
    generic (
        clk_frq: natural;
        auto_cycle_time: real;
        eae_cycle_time: real
    );
    port (
        clk: in std_logic;
        rstn: in std_logic;
        
        -- the auto time states depend on the memory signals
        strobe: in std_logic;
        mem_done: in std_logic;
        
        -- and on some other states
        manual_preset: in std_logic;
        run: in std_logic;
        pause: in std_logic;
        force_tp4: in std_logic;

        ts: out time_state_auto;
        mem_idle_o: out std_logic;
        tp: out std_logic;
        int_strobe: out std_logic;
        
        io_start: in std_logic;
        io_state_o: out io_state;
        io_end: out std_logic;
        io_strobe: out std_logic;
        
        eae_start: in std_logic;
        eae_on: out std_logic;
        eae_tg: out std_logic;
        eae_end: in std_logic
    );
    -- pulse delay for automatic state transitions
    constant num_cycles_pulse: natural := period_to_cycles(clk_frq, auto_cycle_time);
    constant num_cycles_io_pre: natural := period_to_cycles(clk_frq, 200.0e-9);
    constant num_cycles_io_strobe: natural := period_to_cycles(clk_frq, 400.0e-9);
    constant num_cycles_io_hold: natural := period_to_cycles(clk_frq, 300.0e-9);
    constant num_cycles_eae: natural := period_to_cycles(clk_frq, eae_cycle_time);
end timing_auto;

architecture Behavioral of timing_auto is
    -- The original idea in the PDP/8-I is that the gates become stable inside ths TS phase and then a short
    -- TP pulse activates the registers to perform the transaction as calculated by the gates
    -- during the TS phase.
    -- However, the pulse also immediately changes the TS to the next phase. This wasn't a problem
    -- in the original design due to signal propagation delays, but it would be a problem in a
    -- synchronous design.
    -- For this reason, we delay the state change by one clock cycle so the pulse comes when the
    -- active TS phase is still the one matching the pulse.
    type state_int is (TS1, TS1_WAIT, TS2, TS2_WAIT, TS3, TS3_WAIT, TS3_WAIT_IO, TS4, TS4_WAIT);
    signal state: state_int;
    signal pulse: std_logic; 
    
    signal eae_on_int: std_logic;
    
    type iostate_int is (IO_IDLE, IO1_PRE, IO1_STROBE, IO1_HOLD, IO2_PRE, IO2_STROBE, IO2_HOLD, IO4_PRE, IO4_STROBE, IO4_HOLD);
    signal io_state: iostate_int;
    
    signal time_counter: natural range 0 to num_cycles_pulse - 1;
    signal io_counter: natural range 0 to num_cycles_io_pre + num_cycles_io_strobe - 1;
    signal mem_idle: std_logic;

    signal eae_counter: natural range 0 to num_cycles_eae - 1;
begin

computer_time_generator: process
begin
    wait until rising_edge(clk);
    
    -- reset pulse signals
    pulse <= '0';
    int_strobe <= '0';
    
    case state is
        when TS1 =>
            if strobe = '1' then
                time_counter <= 0;
                pulse <= '1'; -- TP1
                state <= TS1_WAIT;
            end if;
        when TS1_WAIT =>
            state <= TS2;
        when TS2 =>
            if time_counter < num_cycles_pulse - 1 then
                time_counter <= time_counter + 1;
            else
                time_counter <= 0;
                pulse <= '1'; -- TP2
                state <= TS2_WAIT;
            end if;
        when TS2_WAIT =>
            state <= TS3;
        when TS3 =>
            if time_counter < num_cycles_pulse - 1 then
                time_counter <= time_counter + 1;
            else
                pulse <= '1'; -- TP3
                state <= TS3_WAIT;
            end if;
        when TS3_WAIT =>
            state <= TS3_WAIT_IO;
        when TS3_WAIT_IO =>
            -- delay TS3 if slow_cycle is active
            if io_state = IO_IDLE and io_start = '0' and eae_start = '0' and eae_on_int = '0' then
                int_strobe <= '1';
                state <= TS4;
            end if;
        when TS4 =>
            if run = '1' and pause = '0' and mem_idle = '1' then
                pulse <= '1'; -- TP4
                state <= TS4_WAIT;
            end if;
        when TS4_WAIT =>
            state <= TS1;
    end case;
    
    if force_tp4 = '1' then
        state <= TS4_WAIT;
        pulse <= '1';
    end if;
    
    if rstn = '0' then
        state <= TS1;
        pulse <= '0';
    end if;
    
    if manual_preset = '1' then
        state <= TS1;
    end if;
end process;

gen_mem_idle: process
begin
    wait until rising_edge(clk);

    if strobe = '1' then
        mem_idle <= '0';
    elsif mem_done = '1' then
        mem_idle <= '1';
    end if;
    
    if rstn = '0' then
        mem_idle <= '1';
    end if;
end process;
mem_idle_o <= mem_idle;

gen_io_state: process
begin
    wait until rising_edge(clk);

    -- reset pulse signals to defaults
    io_strobe <= '0';
    io_end <= '0';

    case io_state is
        when IO_IDLE =>
            if io_start = '1' then
                io_counter <= 0;
                io_state <= IO1_PRE;
            end if;
        when IO1_PRE =>
            if io_counter < num_cycles_io_pre - 1 then
                io_counter <= io_counter + 1;
            else
                io_counter <= 0;
                io_state <= IO1_STROBE;
            end if;
        when IO1_STROBE =>
            if io_counter < num_cycles_io_strobe - 1 then
                io_counter <= io_counter + 1;
            else
                io_strobe <= '1';
                io_counter <= 0;
                io_state <= IO1_HOLD;
            end if;
        when IO1_HOLD =>
            if io_counter < num_cycles_io_hold - 1 then
                io_counter <= io_counter + 1;
            else
                io_counter <= 0;
                io_state <= IO2_PRE;
            end if;
        when IO2_PRE =>
            if io_counter < num_cycles_io_pre - 1 then
                io_counter <= io_counter + 1;
            else
                io_counter <= 0;
                io_state <= IO2_STROBE;
            end if;
        when IO2_STROBE =>
            if io_counter < num_cycles_io_strobe - 1 then
                io_counter <= io_counter + 1;
            else
                io_strobe <= '1';
                io_counter <= 0;
                io_state <= IO2_HOLD;
            end if;
        when IO2_HOLD =>
            if io_counter < num_cycles_io_hold - 1 then
                io_counter <= io_counter + 1;
            else
                io_counter <= 0;
                io_state <= IO4_PRE;
            end if;
        when IO4_PRE =>
            if io_counter < num_cycles_io_pre - 1 then
                io_counter <= io_counter + 1;
            else
                io_counter <= 0;
                io_state <= IO4_STROBE;
            end if;
        when IO4_STROBE =>
            if io_counter < num_cycles_io_strobe - 1 then
                io_counter <= io_counter + 1;
            else
                io_strobe <= '1';
                io_counter <= 0;
                io_state <= IO4_HOLD;
            end if;
        when IO4_HOLD =>
            if io_counter < num_cycles_io_hold - 1 then
                io_counter <= io_counter + 1;
            else
                io_end <= '1';
                io_counter <= 0;
                io_state <= IO_IDLE;
            end if;
    end case;
    
    if rstn = '0' then
        io_state <= IO_IDLE;
        io_counter <= 0;
    end if;
end process;

eae_timing: process
begin
    wait until rising_edge(clk);
    
    eae_tg <= '0';
    
    if eae_on_int = '1' then
        if eae_counter < num_cycles_eae - 1 then
            eae_counter <= eae_counter + 1;
        else
            eae_counter <= 0;
            eae_tg <= '1';
        end if;
        
        if eae_end = '1' then
            eae_on_int <= '0';
        end if;
    else
        if eae_start = '1' then
            eae_counter <= 0;
            eae_on_int <= '1';
        end if;
    end if;
    
    
    if rstn = '0' then
        eae_on_int <= '0';
    end if;
end process;

with io_state select io_state_o <=
    IO1 when IO1_STROBE | IO1_HOLD,
    IO2 when IO2_STROBE | IO2_HOLD,
    IO4 when IO4_STROBE | IO4_HOLD,
    IO_NONE when others;

with state select ts <=
    TS1 when TS1 | TS1_WAIT,
    TS2 when TS2 | TS2_WAIT,
    TS3 when TS3 | TS3_WAIT | TS3_WAIT_IO,
    TS4 when TS4 | TS4_WAIT,
    TS1 when others;

tp <= pulse;
eae_on <= eae_on_int;

end Behavioral;
