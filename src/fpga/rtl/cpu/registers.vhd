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
        --- I/O bus
        io_bus: in std_logic_vector(11 downto 0);

        -- register transfers, executed every cycle        
        transfers: in register_transfers;

        -- direct output
        pc_o: out std_logic_vector(11 downto 0);
        ma_o: out std_logic_vector(11 downto 0);
        mb_o: out std_logic_vector(11 downto 0);
        ac_o: out std_logic_vector(11 downto 0);
        link_o: out std_logic;
        inst_o: out pdp8_instruction;
        skip_o: out std_logic
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
    
    signal skip: std_logic;
    
    -- input register bus, with carry
    signal input_bus_tmp, input_bus: std_logic_vector(12 downto 0);
    signal l_bus: std_logic;
begin

-- combinatorial process to select the input
enable_regs: process(all)
begin
    if transfers.ac_enable = '1' then
        if transfers.ac_comp_enable = '1' then
            input_bus_tmp <= std_logic_vector(signed(ac(11) & ac) + signed(not ac));
        elsif transfers.mem_enable = '1' then
            -- if both AC and MEM are enabled, do a sign-extended two's complement addition
            input_bus_tmp <= std_logic_vector(signed(ac(11) & ac) + signed(sense));
        elsif transfers.bus_enable = '1' then
            -- if both AC and IO BUS are enabled, OR them
            input_bus_tmp <= '0' & (ac or io_bus);
        elsif transfers.sr_enable = '1' then
            -- if both AC and SR are enabled, OR them
            input_bus_tmp <= '0' & (ac or sr);
        else
            input_bus_tmp <= '0' & ac;
        end if;
    elsif transfers.ac_comp_enable = '1' then
        input_bus_tmp <= '0' & not ac;
    elsif transfers.pc_enable = '1' then
        input_bus_tmp <= '0' & pc;
    elsif transfers.ma_enable = '1' then
        input_bus_tmp <= '0' & mem_addr;
    elsif transfers.mem_enable = '1' then
        input_bus_tmp <= '0' & sense;
    elsif transfers.sr_enable = '1' then
        input_bus_tmp <= '0' & sr;
    elsif transfers.bus_enable = '1' then
        input_bus_tmp <= '0' & io_bus;
    else
        input_bus_tmp <= (others => '0');
    end if;
    
    if transfers.l_enable = '1' then
        if transfers.l_comp_enable = '1' then
            l_bus <= '1';
        else
            l_bus <= link;
        end if;
    elsif transfers.l_comp_enable = '1' then
        l_bus <= not link;
    else
        l_bus <= '0';
    end if;

    if transfers.ma_enable_page = '1' then
        input_bus_tmp(11 downto 7) <= mem_addr(11 downto 7);
    end if;

    if transfers.mem_enable_addr = '1' then
        input_bus_tmp(6 downto 0) <= sense(6 downto 0);
    end if;
    
    if transfers.and_enable = '1' then
        input_bus <= '0' & (input_bus_tmp(11 downto 0) and mem_buf);  
    else
        input_bus <= std_logic_vector(unsigned('0' & input_bus_tmp(11 downto 0)) + transfers.carry_insert); 
    end if;
end process;

regs: process
begin
    wait until rising_edge(clk);

    if transfers.ac_load = '1' then
        ac <= input_bus(11 downto 0);
        if transfers.shift = RIGHT_SHIFT then
            ac <= l_bus & input_bus(11 downto 1);
            link <= input_bus(0);
        elsif transfers.shift = DOUBLE_RIGHT_ROTATE then
            ac <= input_bus(0) & l_bus & input_bus(11 downto 2);
            link <= input_bus(1);
        elsif transfers.shift = LEFT_SHIFT then
            ac <= input_bus(10 downto 0) & l_bus;
            link <= input_bus(11);
        elsif transfers.shift = DOUBLE_LEFT_ROTATE then
            ac <= input_bus(9 downto 0) & l_bus & input_bus(11);
            link <= input_bus(10);
        else
            if input_bus(12) = '1' then
                link <= not link;
            end if;
        end if;
    end if;

    if transfers.l_load = '1' and transfers.shift = NO_SHIFT then
        link <= l_bus;
    end if;

    if transfers.pc_load = '1' then
        pc <= input_bus(11 downto 0);
        skip <= '0';
    end if;
    
    if transfers.ma_load = '1' then
        mem_addr <= input_bus(11 downto 0);
    end if;
    
    if transfers.mb_load = '1' then
        mem_buf <= input_bus(11 downto 0);
    end if;
    
    if transfers.skip_load = '1' then
        skip <= transfers.reverse_skip;
    
        if transfers.skip_if_carry = '1' and input_bus(12) = '1' then
            skip <= not transfers.reverse_skip;
        end if;
    
        if transfers.skip_if_zero = '1' and input_bus(11 downto 0) = "000000000000" then
            skip <= not transfers.reverse_skip;
        end if;
    
        if transfers.skip_if_neg = '1' and input_bus(11) = '1' then
            skip <= not transfers.reverse_skip;
        end if;
        
        if transfers.skip_if_link = '1' and link = '1' then
            skip <= not transfers.reverse_skip;
        end if;
    end if;

    if transfers.initialize = '1' then
        ac <= (others => '0');
        link <= '0';
    end if;
    
    if rst = '1' then
        ac <= (others => '0');
        skip <= '0';
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
skip_o <= skip;

with sense(11 downto 9) select inst_o <=
    INST_AND when "000",
    INST_TAD when "001",
    INST_ISZ when "010",
    INST_DCA when "011",
    INST_JMS when "100",
    INST_JMP when "101",
    INST_IOT when "110",
    INST_OPR when "111",
    INST_AND when others;

end Behavioral;
