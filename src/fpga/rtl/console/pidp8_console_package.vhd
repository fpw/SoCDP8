-- Part of SoCDP8, Copyright by Folke Will, 2019
-- Licensed under CERN Open Hardware Licence v1.2
-- See HW_LICENSE for details
library IEEE;
use IEEE.STD_LOGIC_1164.ALL;
use IEEE.NUMERIC_STD.ALL;

use work.socdp8_package.all;

package pidp8_console_package is
    type lamp_brightness_array is array(natural range<>) of natural range 0 to 31;
    
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
end pidp8_console_package;

package body pidp8_console_package is
end package body;