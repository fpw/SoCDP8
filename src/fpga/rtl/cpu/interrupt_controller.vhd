-- Part of SoCDP8, Copyright by Folke Will, 2019
-- Licensed under CERN Open Hardware Licence v1.2
-- See HW_LICENSE for details
library IEEE;
use IEEE.STD_LOGIC_1164.ALL;
use work.socdp8_package.all;

-- This implements the interrupt logic as per drawing D-BS-8I-0-7.
-- int_rqst is the external request, it is synced into int_sync.
-- int_ok is the output signal to activate the interrupt cycle.
entity interrupt_controller is
    port (
        clk: in std_logic;
        rst: in std_logic;

        -- Interrupt control signals
        int_rqst: in std_logic;
        int_strobe: in std_logic;

        -- Internal reset
        manual_preset: in std_logic;
        
        -- State output
        int_enable: out std_logic;
        int_ok: out std_logic;

        -- Various state signals
        ts: in time_state_auto;
        tp: in std_logic;
        run: in std_logic;
        switches: in pdp8i_switches;
        state: in major_state;
        mb: in std_logic_vector(11 downto 0);
        inst: in pdp8_instruction;
        state_next: in major_state
    );
end interrupt_controller;

architecture Behavioral of interrupt_controller is
    -- synchronized interrupt request
    signal int_sync: std_logic;
    
    -- used to enable interrupts one instruction later
    signal int_delay: std_logic;
    
    -- TODO
    signal int_inhibit: std_logic := '0';
begin

interrupts: process
    variable f_set: std_logic;
    variable key_la_ex_dep: std_logic;
    variable key_la_ex_dep_n: std_logic;
begin
    wait until rising_edge(clk);

    f_set := '1' when state_next = STATE_FETCH or state = STATE_NONE else '0';
    key_la_ex_dep := switches.load or switches.exam or switches.dep;
    key_la_ex_dep_n := key_la_ex_dep and not run;  
    
    -- this happens between TP3 and TP4
    if int_strobe = '1' then
        if key_la_ex_dep_n = '0' and f_set = '1' and int_rqst = '1' then
            int_sync <= '1';
        else
            int_sync <= '0';
        end if;
        
        if state = STATE_FETCH then
            int_delay <= int_enable;
            if inst = INST_IOT and mb(8 downto 3) = o"00" then
                if mb(0) = '1' then
                    int_enable <= '1';
                elsif mb(1) = '1' then
                    int_enable <= '0';
                end if;
            end if;
        end if;
    end if;

    -- disable ION in the interrupt's fetch cycle
    if ts = TS1 and tp = '1' then    
        if int_ok = '1' then
            int_enable <= '0';
        end if;
    end if;
   
    if int_enable = '0' then
        int_delay <= '0';
    end if;
    
    if manual_preset = '1' then
        int_sync <= '0';
    end if;
    
    if rst = '1' then
        int_sync <= '0';
        int_delay <= '0';
        int_enable <= '0';
    end if;
end process;

int_ok <= int_sync and int_delay and not int_inhibit; 

end Behavioral;
