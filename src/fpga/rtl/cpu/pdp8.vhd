-- Part of SoCDP8, Copyright by Folke Will, 2019
-- Licensed under CERN Open Hardware Licence v1.2
-- See HW_LICENSE for details
library IEEE;
use IEEE.STD_LOGIC_1164.ALL;
use IEEE.NUMERIC_STD.ALL;

use work.socdp8_package.all;

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
    -- Drawing D-BS-8I-0-2, region M900.D40 (B1):
    -- The run FF is evaluated at every TP3 pulse, i.e. in TS4.
    -- It is used to decide whether to generate a memory transfer which will
    -- result in continuous computer cycles. Its transitions depend mainly on
    -- external switches and the HLT instruction.
    signal run: std_logic;

    -- Since the manual time pulses and computer time pulses cannot overlap,
    -- the time signals are combined and stored in this state register.
    -- Also, a state is only assumed for one cycle and then goes back to idle
    -- so that we can implement a normal state machine with this state.
    signal time_state_pulse: combined_time_state;

    -- Drawing D-BS-8I-0-2, region M617.F30 (B5):
    -- This region generates the MANUAL PRESET signal which is used to clear some FFs throughout the system,
    -- for example the major state FFs. The signal is generated if the CONT switch is not active (!) at
    -- MFTP0, i.e. it is active if LA, ST, EX or DP are pressed. This matches drawing D-FD-8I-0-1 where this
    -- transfer is called 0 -> MAJOR STATES.
    signal manual_preset: std_logic;

    -- Drawing D-BS-8I-0-2, region M617.C12 (B3):
    -- The INITIALIZE signal is generated if START is pressed at MFTP0. This signal is used to clear IOP FFs.
    signal initialize: std_logic;
    
    -- Drawing D-BS-8I-0-2, region M113.E15 (C8):
    -- This region generates the MEM START signal if the LOAD key is not active (!) at MFTP2, i.e. MEM START
    -- is generated if ST, EX, DP or CONT are pressed. This matches drawing D-FD-8I-0-1.
    -- The signal is also generated if run is high while pause is low and mem idle is high, shown in the same drawing.
    signal mem_start: std_logic;
    
    -- The cont switch forces a manual TP4 pulse to finish the TS4 state in manual mode.
    -- This is shown in drawing D-BS-8I-0-2, region M113.E15 (C7)
    signal force_tp4: std_logic;
    
    -- The following signals are not fully implemented yet:
    --- whether we are paused by peripherals
    signal pause: std_logic;

    --- current major state
    signal state: pdp8_state;

    --- interrupt on FF
    signal ion: std_logic;

    -- interconnect wires
    --- from manual timing generator
    signal mft: manual_function_time;
    signal mftp: std_logic;
    signal mfts0: std_logic;
    --- from automatic timing generator
    signal ts: computer_time_state;
    signal tp: std_logic;
    signal mem_idle: std_logic;
    --- from memory
    signal strobe: std_logic;
    signal sense: std_logic_vector(11 downto 0);
    signal mem_done: std_logic;
    --- from register network
    signal carry_insert, no_shift, link: std_logic;
    signal pc, ma, mb, ac, mem: std_logic_vector(11 downto 0);
    signal inst: pdp8_instruction;
    signal ac_enable, pc_enable, ma_enable, mem_enable, sr_enable: std_logic;
    signal ac_load, pc_load, ma_load, mb_load: std_logic;
begin

manual_timing_inst: entity work.manual_timing
generic map (
    clk_frq => clk_frq
)
port map (
    clk => clk,
    rst => rst,
    run => run,
    
    key_load => switches.load,
    key_start => switches.start,
    key_ex => switches.exam,
    key_dep => switches.dep,
    key_cont => switches.cont,
    
    mfts0 => mfts0,
    mftp => mftp,
    mft => mft
);

computer_timing_inst: entity work.computer_timing
generic map (
    clk_frq => clk_frq
)
port map (
    clk => clk,
    rst => rst,
  
    strobe => strobe,
    mem_done => mem_done,
    manual_preset => manual_preset,
    run => run,
    pause => pause,
    force_tp4 => force_tp4,
    
    ts => ts,
    tp => tp,
    mem_idle_o => mem_idle
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

-- Combine the level-based manual and computer time generators
-- to a single edge-based state generator. 
gen_combined_state: process
begin
    wait until rising_edge(clk);

    -- We want time state pulses, so reset to idle by default
    time_state_pulse <= TS_IDLE;

    -- The computer time state changed    
    if tp = '1' then
        case ts is
            when TS1 => time_state_pulse <= TS1;
            when TS2 => time_state_pulse <= TS2;
            when TS3 => time_state_pulse <= TS3;
            when TS4 => time_state_pulse <= TS4;
        end case;
    end if;

    -- The manual time state changed
    if mftp = '1' then
        case mft is
            when MFT0 => time_state_pulse <= MFT0;
            when MFT1 => time_state_pulse <= MFT1;
            when MFT2 => time_state_pulse <= MFT2;
            when MFT_NONE => null;
        end case;
    end if;
end process;

time_state_pulses: process
begin
    wait until rising_edge(clk);
    
    -- reset pulse signals
    --- internal
    manual_preset <= '0';
    initialize <= '0';

    --- memory
    mem_start <= '0';
    
    -- timing
    force_tp4 <= '0';

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
    
    case time_state_pulse is
        -- the TS transfers are described in drawing D-FD-8I-0-1 (Manual Functions)
        when TS1 =>
        when TS2 =>
            -- TS2 is entered because of the strobe signal that indicates that memory is ready.
            -- We must write something to MB in this state so it can be written back.
            -- The default transfer is therefore MEM -> MB to just restore the memory that was read.
            if mfts0 and switches.dep then
                -- SR -> MB
                sr_enable <= '1';
            else
                -- MEM -> MB
                mem_enable <= '1';
            end if;
            mb_load <= '1';
        when TS3 =>
        when TS4 =>
            run <= '1';
            if switches.sing_step then
                run <= '0';
            end if;
            if mfts0 and (switches.exam or switches.dep) then
                run <= '0';
            end if;
            -- TODO: Only if the new major state is fetch (true for now), check sing_inst and stop
            if true then
                state <= STATE_FETCH;
                if switches.sing_inst or switches.stop then
                    run <= '0';
                end if;
            end if;
        when MFT0 =>
            if switches.start = '1' then
                initialize <= '1';
            end if;
            
            -- Originally, condition is switches.cont = '0' but this is more readable
            if switches.start or switches.exam or switches.dep or switches.load then
                manual_preset <= '1';
            end if;
        -- the MFT transfers are described in drawing D-FD-8I-0-1 (Manual Functions)
        when MFT1 =>
            if switches.exam or switches.dep or switches.start then
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
            
            if switches.start = '1' then
                ion <= '0';
            end if;
            
            if switches.exam = '1' or switches.dep = '1' then
                -- MA + 1 -> PC
                ma_enable <= '1';
                carry_insert <= '1';
                pc_load <= '1';
            end if;
        
            -- Originally, condition is switches.load = '0' but this is more readable
            if switches.start or switches.exam or switches.dep or switches.cont then
                mem_start <= '1';
            end if;
            
            if switches.cont = '1' then
                force_tp4 <= '1';
            end if;
        when TS_IDLE => null;
    end case;
    
    if mem_idle = '1' and run = '1' and pause = '0' then
        mem_start <= '1';
    end if;

    if rst = '1' then
        state <= STATE_MANUAL;
        run <= '0';
        pause <= '0';
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
