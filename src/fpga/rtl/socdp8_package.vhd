-- Part of SoCDP8, Copyright by Folke Will, 2019
-- Licensed under CERN Open Hardware Licence v1.2
-- See HW_LICENSE for details
library IEEE;
use IEEE.STD_LOGIC_1164.ALL;
use IEEE.MATH_REAL.ALL;

package socdp8_package is
    -- The manual function timing states (MFTS) and automatic timing states (TS)
    type time_state_auto is (TS1, TS2, TS3, TS4);
    type time_state_manual is (MFT0, MFT1, MFT2, MFT3);

    type pdp8_instruction is (INST_AND, INST_TAD, INST_ISZ,
                              INST_DCA, INST_JMS, INST_JMP,
                              INST_IOT, INST_OPR
    );
    type eae_instruction is (EAE_NONE,
                             EAE_SCL, EAE_MUY, EAE_DVI, EAE_NMI,
                             EAE_SHL, EAE_ASR, EAE_LSR
    );

    type major_state is (STATE_NONE,
                        STATE_FETCH, STATE_EXEC, STATE_DEFER,
                        STATE_COUNT, STATE_ADDR, STATE_BREAK
    );
    
    type io_state is (IO_NONE, IO1, IO2, IO4);

    -- note that all shifts are actually rotations, but the original signal names are used here
    type shift_type is (NO_SHIFT, RIGHT_SHIFT, LEFT_SHIFT, DOUBLE_RIGHT_ROTATE, DOUBLE_LEFT_ROTATE, SHIFT_BOTH, DOUBLE_SHIFT_BOTH);
    
    -- The EAE has real shifts
    type eae_shift_type is (EAE_NO_SHIFT, EAE_L_AC_MQ_RIGHT, EAE_L_AC_MQ_LEFT, EAE_SHIFT_DVI, EAE_SHIFT_ASR, EAE_SHIFT_LSR);
    
    -- register transfers
    type register_transfers is record
        -- initialize clears AC and L
        initialize: std_logic;
        eae_set: std_logic;
        eae_end: std_logic;
    
        -- an enable signal puts the register data on the register bus
        -- enabling multiple registers will cause an addition or OR combination
        ac_enable: std_logic;
        ac_comp_enable: std_logic;
        pc_enable: std_logic;
        ma_enable: std_logic;
        ma_enable_page: std_logic; -- enable only the page region of MA (original ma_enable_0_4)
        mem_enable: std_logic;
        mem_comp_enable: std_logic;
        mem_enable_addr: std_logic; -- enable only the addr region of MEM (6 downto 0)
        sr_enable: std_logic;
        bus_enable: std_logic;
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
        eae_shift: eae_shift_type;
        
        -- skip logic
        skip_if_carry: std_logic;
        skip_if_zero: std_logic;
        skip_if_neg: std_logic;
        skip_if_link: std_logic;
        reverse_skip: std_logic;
        skip_load: std_logic;
        
        -- data break
        data_add_enable: std_logic;
        data_enable: std_logic;
        wc_ovf_load: std_logic;
        
        -- EAE
        load_eae_inst: std_logic;
        mq_enable: std_logic;
        mq_load: std_logic;
        ac_mq_enable: std_logic;
        sc_enable: std_logic;
        sc_load: std_logic;
        inc_sc: std_logic;
        
        -- MC8
        clear_fields: std_logic;
        save_fields: std_logic;
        restore_fields: std_logic;
        ib_to_if: std_logic;
        load_ib: std_logic;
        load_df: std_logic;
        if_enable: std_logic;
        df_enable: std_logic;
        sf_enable: std_logic;
        l_disable: std_logic;
    end record;
    
    -- This constant describes a non-transfer, it can be used to initialize
    -- a transfer with default values. This allows adding new fields to the
    -- record and initializing them here without further modifications to existing
    -- code.
    constant nop_transfer: register_transfers := (
        initialize => '0',
        eae_set => '0',
        eae_end => '0',
        ac_enable => '0',
        ac_comp_enable => '0',
        pc_enable => '0',
        ma_enable => '0',
        ma_enable_page => '0',
        mem_enable => '0',
        mem_comp_enable => '0',
        mem_enable_addr => '0',
        sr_enable => '0',
        bus_enable => '0',
        l_enable => '0',
        l_comp_enable => '0',
        clear_run => '0',
        
        carry_insert => '0',
        and_enable => '0',
        shift => NO_SHIFT,
        eae_shift => EAE_NO_SHIFT,
        
        skip_if_carry => '0',

        skip_if_zero => '0',
        skip_if_neg => '0',
        skip_if_link => '0',
        reverse_skip => '0',
        skip_load => '0',
        
        ac_load => '0',
        pc_load => '0',
        ma_load => '0',
        mb_load => '0',
        l_load => '0',
        
        data_add_enable => '0',
        data_enable => '0',
        wc_ovf_load => '0',
        
        load_eae_inst => '0',
        mq_enable => '0',
        mq_load => '0',
        sc_enable => '0',
        ac_mq_enable => '0',
        sc_load => '0',
        inc_sc => '0',
        
        clear_fields => '0',
        save_fields => '0',
        restore_fields => '0',
        ib_to_if => '0',
        load_ib => '0',
        load_df => '0',
        df_enable => '0',
        if_enable => '0',
        sf_enable => '0',
        l_disable => '0'
    );

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
