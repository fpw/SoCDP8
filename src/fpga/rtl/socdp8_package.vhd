-- Part of SoCDP8, Copyright by Folke Will, 2019
-- Licensed under CERN Open Hardware Licence v1.2
-- See HW_LICENSE for details
library IEEE;
use IEEE.STD_LOGIC_1164.ALL;
use IEEE.MATH_REAL.ALL;

package socdp8_package is
    -- The manual function timing states (MFTS) and automatic timing states (TS)
    type computer_time_state is (TS1, TS2, TS3, TS4);
    type manual_function_time is (MFT_NONE, MFT0, MFT1, MFT2);
    type combined_time_state is (TS_IDLE, TS1, TS2, TS3, TS4, MFT0, MFT1, MFT2);

    type pdp8_instruction is (INST_NONE,
                              INST_AND, INST_TAD, INST_ISZ,
                              INST_DCA, INST_JMS, INST_JMP,
                              INST_IOT, INST_OPR
    );

    type pdp8_state is (STATE_MANUAL,
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
        state: pdp8_state;
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