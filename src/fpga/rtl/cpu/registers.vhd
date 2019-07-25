-- Part of SoCDP8, Copyright by Folke Will, 2019
-- Licensed under CERN Open Hardware Licence v1.2
-- See HW_LICENSE for details
library IEEE;
use IEEE.STD_LOGIC_1164.ALL;
use IEEE.NUMERIC_STD.ALL;

use work.socdp8_package.all;

-- This entity implements the registers and the register gating network as briefly described on pages 4-19 ff.
-- There can be one active input signal that puts the data of the register on the internal bus and multiple
-- output signals that indicate which registers will receive the data on the bus.
-- Additionally, the data can be modified during the transfer by an addition network and a rotate circuit.
entity registers is
    port (
        clk: in std_logic;
        rst: in std_logic;
        
        -- connect external registers
        --- switch register
        sr: in std_logic_vector(11 downto 0);
        --- sense register
        sense: in std_logic_vector(11 downto 0);
        
        -- control gating network
        --- no_shift: indicates that no vector rotation is desired during the transfer
        no_shift: in std_logic;
        --- carry_insert: increments the transfered word
        carry_insert: in std_logic;
        --- initialize: clear AC, L, and int
        initialize: in std_logic;
        
        -- direct output
        pc_o: out std_logic_vector(11 downto 0);
        ma_o: out std_logic_vector(11 downto 0);
        mb_o: out std_logic_vector(11 downto 0);
        ac_o: out std_logic_vector(11 downto 0);
        link_o: out std_logic;
        inst_o: out pdp8_instruction;

        -- source select
        ac_enable: in std_logic;
        pc_enable: in std_logic;
        ma_enable: in std_logic;
        mem_enable: in std_logic;
        sr_enable: in std_logic;
        
        -- dest select
        ac_load: in std_logic;
        pc_load: in std_logic;
        ma_load: in std_logic;
        mb_load: in std_logic
    );
end registers;

architecture Behavioral of registers is
    -- major registers as described on page 4-1
    -- 4.1.1 accumulator: I/O register for transfers between memory and peripherals and as transfer / logic register
    signal ac: std_logic_vector(11 downto 0);
    -- 4.1.2 link: carry register for two's complement arithmetic 
    signal link: std_logic;
    -- 4.1.3 memory address from which the next instruction will be taken
    signal pc: std_logic_vector(11 downto 0);
    -- 4.1.4 memory address: address that is currently selected for reading or writing
    signal mem_addr: std_logic_vector(11 downto 0);
    -- 4.1.5 memory buffer: data to be written into memory
    signal mem_buf: std_logic_vector(11 downto 0);
    -- 4.1.6 sense: data read from memory, synonym: mem (external sense signal)
    -- 4.1.7 instruction register: operation code of the instruction currently being performed (combinatorial)
    -- 4.1.8 switch register: console switches (external sw signal)
    
    -- input register bus
    signal input_bus_tmp, input_bus: std_logic_vector(11 downto 0);
begin

-- combinatorial process to select the input
enable_regs: process(all)
begin
    if ac_enable = '1' then
        input_bus_tmp <= ac;
    elsif pc_enable = '1' then
        input_bus_tmp <= pc;
    elsif ma_enable = '1' then
        input_bus_tmp <= mem_addr;
    elsif mem_enable = '1' then
        input_bus_tmp <= sense;
    elsif sr_enable = '1' then
        input_bus_tmp <= sr;
    else
        input_bus_tmp <= (others => '0');
    end if;
    
    input_bus <= std_logic_vector(signed(input_bus_tmp) + carry_insert); 
end process;

regs: process
begin
    wait until rising_edge(clk);
    
    if ac_load = '1' then
        ac <= input_bus;
    end if;
    
    if pc_load = '1' then
        pc <= input_bus;
    end if;
    
    if ma_load = '1' then
        mem_addr <= input_bus;
    end if;
    
    if mb_load = '1' then
        mem_buf <= input_bus;
    end if;
    
    if initialize = '1' then
        ac <= (others => '0');
        link <= '0';
    end if;
    
    if rst = '1' then
        ac <= (others => '0');
        link <= '0';
        pc <= (others => '0');
        mem_addr <= (others => '0');
        mem_buf <= (others => '0');
    end if;
end process;

pc_o <= pc;
ac_o <= ac;
link_o <= link;
ma_o <= mem_addr;
mb_o <= mem_buf;

with sense(11 downto 9) select inst_o <=
    INST_AND when "000",
    INST_TAD when "001",
    INST_ISZ when "010",
    INST_DCA when "011",
    INST_JMS when "100",
    INST_JMP when "101",
    INST_IOT when "110",
    INST_OPR when "111",
    INST_NONE when others;

end Behavioral;
