-- Part of SoCDP8, Copyright by Folke Will, 2019
-- Licensed under CERN Open Hardware Licence v1.2
-- See HW_LICENSE for details
library IEEE;
use IEEE.STD_LOGIC_1164.ALL;
use IEEE.MATH_REAL.ALL;

package socdp8_package is
    -- The manual function timing states (MFTS) and automatic timing states (TS)
    type computer_time_state is (TS1, TS2, TS3, TS4);
    type manual_function_time is (MFT0, MFT1, MFT2, MFT3);

    type pdp8_instruction is (INST_AND, INST_TAD, INST_ISZ,
                              INST_DCA, INST_JMS, INST_JMP,
                              INST_IOT, INST_OPR
    );

    type major_state is (STATE_NONE,
                        STATE_FETCH, STATE_EXEC, STATE_DEFER,
                        STATE_COUNT, STATE_ADDR, STATE_BREAK
    );

    -- external memory connections
    type ext_mem_out is record
        addr: std_logic_vector(14 downto 0);
        data: std_logic_vector(11 downto 0);
        write: std_logic;
    end record;

    type ext_mem_in is record
        data: std_logic_vector(11 downto 0);
    end record;
   
    -- note that all shifts are actually rotations, but the original signal names are used here
    type shift_type is (NO_SHIFT, RIGHT_SHIFT, LEFT_SHIFT, DOUBLE_RIGHT_ROTATE, DOUBLE_LEFT_ROTATE);
    
    -- register transfers
    type register_transfers is record
        -- initialize clears AC and L
        initialize: std_logic;
    
        -- an enable signal puts the register data on the register bus
        -- enabling multiple registers will cause an addition
        ac_enable: std_logic;
        ac_comp_enable: std_logic;
        pc_enable: std_logic;
        ma_enable: std_logic;
        ma_enable_page: std_logic; -- enable only the page region of MA (original ma_enable_0_4)
        mem_enable: std_logic;
        mem_enable_addr: std_logic; -- enable only the addr region of MEM (6 downto 0)
        sr_enable: std_logic;
        l_enable: std_logic;
        l_comp_enable: std_logic;
        clear_run: std_logic;
        
        -- a load signal will load the register with the data on the register bus
        ac_load: std_logic;
        pc_load: std_logic;
        ma_load: std_logic;
        mb_load: std_logic;
        l_load: std_logic;
        
        -- add one to the register bus
        carry_insert: std_logic;
        
        -- AND bus with MB
        and_enable: std_logic;
        
        -- shift the register bus data when loading back into the register
        shift: shift_type;
        
        -- set skip if no carry during operation
        skip_if_carry: std_logic;
        skip_set: std_logic;
    end record;
    
    -- This constant describes a non-transfer, it can be used to initialize
    -- a transfer with default values. This allows adding new fields to the
    -- record and initializing them here without further modifications to existing
    -- code.
    constant nop_transfer: register_transfers := (
        initialize => '0',
        ac_enable => '0',
        ac_comp_enable => '0',
        pc_enable => '0',
        ma_enable => '0',
        ma_enable_page => '0',
        mem_enable => '0',
        mem_enable_addr => '0',
        sr_enable => '0',
        l_enable => '0',
        l_comp_enable => '0',
        clear_run => '0',
        
        carry_insert => '0',
        and_enable => '0',
        shift => NO_SHIFT,
        skip_if_carry => '0',
        skip_set => '0',

        ac_load => '0',
        pc_load => '0',
        ma_load => '0',
        mb_load => '0',
        l_load => '0'
    );

    -- Console connections
    type pdp8i_leds is record
        data_field: std_logic_vector(2 downto 0);
        inst_field: std_logic_vector(2 downto 0);
        pc: std_logic_vector(11 downto 0);
        mem_addr: std_logic_vector(11 downto 0);
        mem_buf: std_logic_vector(11 downto 0);
        link: std_logic;
        accu: std_logic_vector(11 downto 0);
        step_counter: std_logic_vector(4 downto 0);
        mqr: std_logic_vector(11 downto 0);
        instruction: pdp8_instruction;
        state: major_state;
        ion: std_logic;
        pause: std_logic;
        run: std_logic;
    end record;

    type pdp8i_switches is record
        data_field: std_logic_vector(2 downto 0);
        inst_field: std_logic_vector(2 downto 0);
        swr: std_logic_vector(11 downto 0);
        start: std_logic;
        load: std_logic;
        dep: std_logic;
        exam: std_logic;
        cont: std_logic;
        stop: std_logic;
        sing_step: std_logic;
        sing_inst: std_logic;
    end record;

    -- Utility functions
    
    --- reverse input vector
    function reverse(x: in std_logic_vector) return std_logic_vector;
    
    --- given a clock frequency and a period (e.g. 1.0-e6 for 1 us), calculate a counter value to generate the period
    function period_to_cycles(clk_frq: in natural; period: in real) return natural;
end socdp8_package;

package body socdp8_package is
    function reverse(x: in std_logic_vector) return std_logic_vector is
        variable res: std_logic_vector(x'range);
        alias x_reverse: std_logic_vector(x'reverse_range) is x;
    begin
        for i in x_reverse'range loop
            res(i) := x_reverse(i);
        end loop;
        return res;
    end reverse;
    
    function period_to_cycles(clk_frq: in natural; period: in real) return natural is
    begin
        return natural(ceil(real(clk_frq) * real(period)));
    end period_to_cycles;

end package body;
