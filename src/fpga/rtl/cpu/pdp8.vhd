-- Part of SoCDP8, Copyright by Folke Will, 2019
-- Licensed under CERN Open Hardware Licence v1.2
-- See HW_LICENSE for details
library IEEE;
use IEEE.STD_LOGIC_1164.ALL;
use IEEE.NUMERIC_STD.ALL;

use work.socdp8_package.all;
use work.pidp8_console_package.all;

entity pdp8 is
    generic (
        clk_frq: natural
    );
    port (
        clk: in std_logic;
        rst: in std_logic;
        
        -- Console connection
        leds: out pdp8i_leds;
        switches: in pdp8i_switches;

        -- to be connected to the external memory
        ext_mem_in: in ext_mem_in;
        ext_mem_out: out ext_mem_out
    );
end pdp8;

architecture Behavioral of pdp8 is
    -- current major state
    signal state: pdp8_state;
    -- auto mode
    signal run: std_logic;
    -- interrupt on FF
    signal ion: std_logic;
    
    -- the manual preset signal clears the major state
    signal manual_preset: std_logic;
    -- the initialize signal clears several circuits
    signal initialize: std_logic;

    -- interconnect wires
    --- from timing generator
    signal time_state: timing_state;
    signal time_pulse: std_logic;
    --- from memory
    signal strobe: std_logic;
    signal sense: std_logic_vector(11 downto 0);
    signal mem_start: std_logic;
    signal mem_done: std_logic;
    --- from register network
    signal carry_insert, no_shift, link: std_logic;
    signal pc, ma, mb, ac, mem: std_logic_vector(11 downto 0);
    signal inst: pdp8_instruction;
    signal ac_enable, pc_enable, ma_enable, mem_enable, sr_enable: std_logic;
    signal ac_load, pc_load, ma_load, mb_load: std_logic;
begin

timing: entity work.timing_generator
generic map (
    clk_frq => clk_frq
)
port map (
    clk => clk,
    rst => rst,
    time_state_o => time_state,
    time_pulse_o => time_pulse,
    run => run,
    strobe => strobe,
    mem_done => mem_done,
    key_la => switches.load,
    key_st => switches.start,
    key_ex => switches.exam,
    key_dep => switches.dep,
    key_cont => switches.cont
);

regs: entity work.registers
port map (
    clk => clk,
    rst => rst,
    
    sr => switches.swr,
    sense => sense,
    
    initialize => initialize,
    carry_insert => carry_insert,
    no_shift => no_shift,
    
    pc_o => pc,
    ma_o => ma,
    mb_o => mb,
    ac_o => ac,
    link_o => link,
    inst_o => inst,
    
    ac_enable => ac_enable,
    pc_enable => pc_enable,
    ma_enable => ma_enable,
    mem_enable => mem_enable,
    sr_enable => sr_enable,
    
    ac_load => ac_load,
    pc_load => pc_load,
    ma_load => ma_load,
    mb_load => mb_load
);

mem_control: entity work.memory_control
generic map (
    clk_frq => clk_frq
)
port map (
    clk => clk,
    rst => rst,
    mem_addr => ma,
    field => "000",
    mem_start => mem_start,
    mem_done => mem_done,
    strobe => strobe,
    sense => sense,
    mem_buf => mb,
    ext_mem_in => ext_mem_in,
    ext_mem_out => ext_mem_out
);

time_states: process
begin
    wait until rising_edge(clk);
    
    -- reset pulse signals
    --- internal
    manual_preset <= '0';
    initialize <= '0';

    --- memory
    mem_start <= '0';

    --- registers    
    no_shift <= '1';
    carry_insert <= '0';
    ac_enable <= '0';
    pc_enable <= '0';
    ma_enable <= '0';
    mem_enable <= '0';
    sr_enable <= '0';
    ac_load <= '0';
    pc_load <= '0';
    ma_load <= '0';
    mb_load <= '0';
    
    if time_pulse = '1' then
        case time_state is
            -- MFT signals: see drawing D-FD-8I-0-1.
            -- Remember that setting mem_start will result in strobe which will move to TS2
            when MFT0 =>
                if switches.load = '1' or switches.dep = '1' or switches.exam = '1' or switches.start = '1' then
                    manual_preset <= '1';
                end if;
                if switches.start = '1' then
                    initialize <= '1';
                end if;
            when MFT1 =>
                if switches.dep = '1' or switches.exam = '1' or switches.start = '1' then
                    -- PC -> MA
                    pc_enable <= '1';
                    ma_load <= '1';
                end if;
            when MFT2 =>
                if switches.load = '1' then
                    -- SR -> PC
                    sr_enable <= '1';
                    pc_load <= '1';
                end if;
                if switches.dep = '1' or switches.exam = '1' then
                    -- MA + 1 -> PC
                    ma_enable <= '1';
                    carry_insert <= '1';
                    pc_load <= '1';
                end if;
                if switches.start = '1' or switches.dep = '1' or switches.exam = '1' or switches.cont = '1' then
                    -- mem_start will bring us to TS2
                    mem_start <= '1';
                end if;
            -- TS signals: see drawing D-FD-8I-0-1. 
            when TS1 =>
                case state is
                    when STATE_FETCH =>
                        -- MA + 1 -> PC
                        ma_enable <= '1';
                        carry_insert <= '1';
                        pc_load <= '1';
                    when others =>
                end case;
                -- mem start to that we will reach TS2 through the strobe signal and read memory
                mem_start <= '1';
            when TS2 =>
                case state is
                    when STATE_FETCH =>
                        -- MEM -> MB
                        mem_enable <= '1';
                        mb_load <= '1';
                    when STATE_MANUAL =>
                        if switches.dep = '1' then
                            -- SR -> MB
                            sr_enable <= '1';
                            mb_load <= '1';
                        else
                            -- default transfer is MEM -> MB to write back
                            mem_enable <= '1';
                            mb_load <= '1';
                        end if;
                    when others =>
                end case;
            when TS3 =>
                if switches.start or switches.cont then
                    run <= '1';
                end if;
                if switches.stop = '1' or switches.sing_step = '1' or switches.exam = '1' or switches.dep = '1' then
                    run <= '0';
                end if;
            when TS4 =>
                case state is
                    when STATE_FETCH =>
                        pc_enable <= '1';
                        ma_load <= '1';
                        if switches.sing_inst = '1' then
                            state <= STATE_MANUAL;
                        end if;
                    when others =>
                end case;
        end case;
    end if;
    
    if rst = '1' or manual_preset = '1' then
        state <= STATE_MANUAL;
        ion <= '0';
        run <= '0';
    end if;

    if initialize = '1' then
        state <= STATE_FETCH;
        ion <= '0';
    end if;
end process;

leds.pc <= pc;
leds.mem_addr <= ma;
leds.mem_buf <= mb;
leds.accu <= ac;
leds.link <= link;

leds.state <= state;
leds.instruction <= inst;
leds.ion <= ion;
leds.run <= run;

end Behavioral;
