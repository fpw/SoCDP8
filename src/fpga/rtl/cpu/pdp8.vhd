-- Part of SoCDP8, Copyright by Folke Will, 2019
-- Licensed under CERN Open Hardware Licence v1.2
-- See HW_LICENSE for details
library IEEE;
use IEEE.STD_LOGIC_1164.ALL;
use IEEE.NUMERIC_STD.ALL;

use work.socdp8_package.all;
use work.inst_common.all;

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
    signal state: major_state;

    -- current instruction
    signal inst: pdp8_instruction;

    --- interrupt on FF
    signal ion: std_logic;
    
    signal ac_zero: std_logic;
    
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
    signal reg_trans: register_transfers;
    signal link: std_logic;
    signal skip: std_logic;
    signal pc, ma, mb, ac, mem: std_logic_vector(11 downto 0);
    signal inst_cur: pdp8_instruction;
    -- from transfer generator
    signal reg_trans_inst: register_transfers;
    signal next_state_inst: major_state;
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

    transfers => reg_trans,

    pc_o => pc,
    ma_o => ma,
    mb_o => mb,
    ac_o => ac,
    link_o => link,
    inst_o => inst_cur,
    skip_o => skip
);
ac_zero <= '1' when ac = "000000000000" else '0';

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

inst_mux: entity work.instruction_multiplexer
port map (
    inst => inst,
    input => (
            state => state,
            time_div => ts,
            mb => mb,
            ac_zero => ac_zero,
            ac_neg => ac(11),
            link => link,
            auto_index => '0',  -- TODO
            skip => skip,
            brk_req => '0'      -- TODO
        ),
    transfers => reg_trans_inst,
    state_next => next_state_inst
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

    --- memory
    mem_start <= '0';
    
    -- timing
    force_tp4 <= '0';

    --- registers
    reg_trans <= nop_transfer;

    -- The timing works like this:
    -- At startup, the manual timing is in no state and the auto timinig is in TS1.
    -- However, no pulses are generated so nothing happens automatically.
    --
    -- To generate the first pulse, one of the keys START, LOAD, DEP, EX or CONT has to be pressed.
    -- Pressing a switch will go through the cycles MFT0 - MFT1 - MFT2 in that order.
    -- If the switch started a memory transfer (all except LOAD), then TS2 - TS3 - TS4 - TS1 are
    -- executed due to the memory transaction. The major state will be STATE_NONE in this full cycle
    -- for all keys except CONT.
    --
    -- If the run FF is set in TS4 (which is prevented by switches SING STEP, EX, DEP and by
    -- SING INST and STOP if the next major state is FETCH), then continouos memory cycles are
    -- generated and the system will run TS2 - TS3 - TS4 - TS1 until run is cleared.
    --
    -- Since the manual pulses are not generated while run is set, the system has to be stopped
    -- in TS4 by SING STEP, SING INST or STOP. EX and DEP cannot be used because they only clear
    -- the run FF if the switches were pressed while run was initially clear (indicated by MFTS0).

    if ts = TS1 and state = STATE_FETCH and strobe = '1' then
        inst <= inst_cur;
    end if;

    if manual_preset = '1' then
        state <= STATE_NONE;
    end if;

    case time_state_pulse is
        -- the TS transfers are described in drawing D-FD-8I-0-1 (Auto Functions)
        when TS1 =>
            if state /= STATE_NONE then
                reg_trans <= reg_trans_inst;
            end if;

            -- start a new memory cycle so we eventually go to TS2
            if run = '1' and pause = '0' and mem_idle = '1' then
                mem_start <= '1';
            end if;
        when TS2 =>
            if state /= STATE_NONE then
                reg_trans <= reg_trans_inst;
            else
                if mft = MFT2 and switches.dep = '1' then
                    -- SR -> MB
                    reg_trans.sr_enable <= '1';
                    reg_trans.mb_load <= '1';
                else
                    -- default: restore memory that was read
                    -- MEM -> MB
                    reg_trans.mem_enable <= '1';
                    reg_trans.mb_load <= '1';
                end if;
            end if;
        when TS3 =>
            if state /= STATE_NONE then
                reg_trans <= reg_trans_inst;
            end if;

            -- run is enabled by default...
            run <= '1';
            
            -- ...unless
            --- a) the SING STEP switch always pauses run
            if switches.sing_step then
                run <= '0';
            end if;
            
            --- b) the DEP and EXAM switches also keep run disabled for further EXAMs or DEPs
            if mfts0 and (switches.exam or switches.dep) then
                run <= '0';
            end if;
            
            --- c) the STOP and SING INST switches disable run but only if the next cycle would be fetch
            if (next_state_inst = STATE_FETCH or state = STATE_NONE) and (switches.sing_inst = '1' or switches.stop = '1') then
                run <= '0';
            end if;
            
            --- d) the HLT instruction
            if reg_trans_inst.clear_run = '1' then
                run <= '0';
            end if;
        when TS4 =>
            if state /= STATE_NONE then
                reg_trans <= reg_trans_inst;
                state <= next_state_inst;
            else
                state <= STATE_FETCH;
            end if;
        when MFT0 =>
            if switches.start = '1' then
                reg_trans.initialize <= '1';
            end if;
            
            -- Originally, condition is switches.cont = '0' but this is more readable
            if switches.start or switches.exam or switches.dep or switches.load then
                manual_preset <= '1';
            end if;
        -- the MFT transfers are described in drawing D-FD-8I-0-1 (Manual Functions)
        when MFT1 =>
            if switches.exam or switches.dep or switches.start then
                -- PC -> MA
                reg_trans.pc_enable <= '1';
                reg_trans.ma_load <= '1';
            end if;
        when MFT2 =>
            if switches.load = '1' then
                -- SR -> PC
                reg_trans.sr_enable <= '1';
                reg_trans.pc_load <= '1';
            end if;
            
            if switches.start = '1' then
                ion <= '0';
                state <= STATE_FETCH;
            end if;
            
            if switches.exam = '1' or switches.dep = '1' then
                -- MA + 1 -> PC
                reg_trans.ma_enable <= '1';
                reg_trans.carry_insert <= '1';
                reg_trans.pc_load <= '1';
            end if;
        
            -- Start a memory cycle if any of the following switches is pressed
            -- Originally, the condition is switches.load = '0' but this is more readable:
            if switches.start or switches.exam or switches.dep or switches.cont then
                mem_start <= '1';
            end if;

            if switches.cont = '1' then
                force_tp4 <= '1';
            end if;
        when TS_IDLE => null;
    end case;

    if rst = '1' then
        state <= STATE_NONE;
        inst <= INST_AND; -- all zero = AND
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
