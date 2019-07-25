-- Part of SoCDP8, Copyright by Folke Will, 2019
-- Licensed under CERN Open Hardware Licence v1.2
-- See HW_LICENSE for details
library IEEE;
use IEEE.STD_LOGIC_1164.ALL;
use IEEE.NUMERIC_STD.ALL;

use work.socdp8_package.all;

-- This entity implements the manual timing generator
--
-- Discussion of relevant drawing D-BS-8I-0-2:
--
-- Regions M117 (A8), M700 (A7), M113.E15 (B7) and M115 (B8) - described on page 4-21:
-- If any of the keys LA, ST, EX, DP or CONT is pressed, signal M117.J2 is generated.
-- This signal indicates that any of the momentary switches is down except for the stop switch.
-- The switch signals are not debounced by the console, so the signal is filtered and fed into
-- a Schmitt trigger. The output of the ST is a debounced signal, however there is a 100 ms delay
-- between the switch change and that signal.  
-- The debounced signal is AND-ed with RUN = 0 so that the momentary switches do not
-- interrupt the running system. The combined signal is called MFTS0: manual function time-state 0.
-- The signal stays high until the debounced switch signal goes back to 0 or the run state is entered.
-- A level change from 0 to 1 on MFTS0 generates the MFTP0 pulse and sets the MFTS1 FF.
-- MFTP0 is delayed by 2 us to generate MFTP1 which sets the MFTS2 FF and clears MFTS1.
-- MFTP1 is also delayed by 2us to generate MFTP2 which clears MFTS2.
-- Since MFTS0 is still active until the key is no longer pressed, MFTS3 is high while MFTS0 is
-- high and neither MFTS1 nor MFTS2 are high.
-- In summary, MFTS0 indicates that a momentary key is pressed while the system is not running. 
-- The press generates a single cycle: MFTS1 - 2 us - MFTS 2 - 2 us - MFTS3. The last state is left
-- as soon as MFTS0 goes back to low.
-- To model this, MFTS1 to MFTS3 can be combined into a state signal since they cannot be active at the
-- same time. The pulse signals are combined into a single pulse output since the state signal indicates
-- which state was activated by the pulse. For example, MFTP2 := mftp high and mfts = MFT2
--
-- Region M113.E11 (B5):
-- This region inverts and comines switch signals to commonly used signals.
-- We combine these signals on the fly and leave the rest to the optimizer.
 
entity manual_timing is
    generic (
        clk_frq: natural;
        -- the debouncer requires 100 ms, see page 4-21
        num_cycles_deb: natural := period_to_cycles(clk_frq, 100.0e-3);
        -- manual timing requires 2 us pulses
        num_cycles_pulse: natural := period_to_cycles(clk_frq, 2.0e-6)
    );
    port (
        clk: in std_logic;
        rst: in std_logic;
        
        -- the manual timing depends on the run state
        run: in std_logic;
        
        -- the manual timing is controlled by these console switches
        key_load: in std_logic;
        key_start: in std_logic;
        key_ex: in std_logic;
        key_dep: in std_logic;
        key_cont: in std_logic;
        
        -- this signal indicates that a key is being held and the system is not running
        mfts0: out std_logic;
        mft: out manual_function_time;
        mftp: out std_logic
    );
end manual_timing;

architecture Behavioral of manual_timing is
    signal state: manual_function_time;
    signal counter_timer: natural range 0 to num_cycles_pulse - 1;
    signal counter_deb: natural range 0 to num_cycles_deb - 1;
    signal mftp0: std_logic;
    signal any_key_cur, any_key_deb, any_key_0ms: std_logic;
    signal counter_deb_en: std_logic;
    signal mfts0_last: std_logic;
begin

any_key_cur <= key_load or key_start or key_ex or key_dep or key_cont;

gen_mfts0: process
begin
    wait until rising_edge(clk);

    -- simulate the Schmitt-Trigger
    if any_key_cur /= any_key_deb and counter_deb_en = '0' then
        -- start delay timer to update the debounced signal 100 ms after the input signal
        counter_deb <= num_cycles_deb - 1;
        counter_deb_en <= '1';
        any_key_0ms <= any_key_cur;
    end if;
    
    if counter_deb_en = '1' then
        if counter_deb > 0 then
            counter_deb <= counter_deb - 1;
        else
            -- 100 ms passed, take the original input as the debounced input
            counter_deb_en <= '0';
            any_key_deb <= any_key_0ms;
        end if;
    end if;

    mfts0_last <= mfts0;

    if rst = '1' then
        counter_deb_en <= '0';
        counter_deb <= 0;
        any_key_deb <= '0';
        mfts0_last <= '0';
    end if;
end process;

mfts0 <= any_key_deb and not run;
mftp0 <= mfts0 and not mfts0_last;

manual_generator: process
begin
    wait until rising_edge(clk);

    -- reset pulse signals
    mftp <= '0';

    case state is
        when MFT_NONE =>
            if mftp0 = '1' then
                -- a key was just activated
                counter_timer <= 0;
                mftp <= '1'; -- MFTP0
                state <= MFT0;
            end if;
        when MFT0 =>
            if counter_timer < num_cycles_pulse - 1 then
                counter_timer <= counter_timer + 1;
            else
                counter_timer <= 0;
                mftp <= '1'; -- MFTP1
                state <= MFT1;
            end if;
        when MFT1 =>
            if counter_timer < num_cycles_pulse - 1 then
                counter_timer <= counter_timer + 1;
            else
                counter_timer <= 0;
                mftp <= '1'; -- MFTP2
                state <= MFT2;
            end if;
        when MFT2 =>
            if mfts0 = '0' then
                state <= MFT_NONE;
            end if;
    end case;

    if rst = '1' then
        counter_timer <= 0;
        state <= MFT_NONE;
    end if;
end process;

mft <= state;

end Behavioral;
