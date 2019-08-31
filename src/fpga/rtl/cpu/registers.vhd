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
    generic (
        enable_ext_mc8i: boolean
    );
    port (
        clk: in std_logic;
        rstn: in std_logic;
        
        -- connect external registers
        --- switch register
        sw_df: in std_logic_vector(2 downto 0);
        sw_if: in std_logic_vector(2 downto 0);
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
        carry_o: out std_logic; -- only for DVI
        skip_o: out std_logic;
        mqr_o: out std_logic_vector(11 downto 0);
        sc_o: out std_logic_vector(4 downto 0);
        df_o: out std_logic_vector(2 downto 0);
        if_o: out std_logic_vector(2 downto 0);

        -- instruction decoder (combinatorial)
        inst_o: out pdp8_instruction;
        eae_inst_o: out eae_instruction
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

    -- skip FF to remember whether to skip the next instruction    
    signal skip: std_logic;
    
    -- EAE extension
    signal mqr: std_logic_vector(11 downto 0);
    signal sc: std_logic_vector(4 downto 0);

    -- MC8 extension
    signal mc8_if, mc8_ib, mc8_df: std_logic_vector(2 downto 0);
    signal mc8_sf: std_logic_vector(5 downto 0);

    
    -- input register bus, with carry
    signal input_bus: std_logic_vector(12 downto 0);
    signal l_bus: std_logic;
begin

-- combinatorial process to select the input
enable_regs: process(transfers, mem_buf, sense, pc, ac, io_bus, link, mqr, sr, mem_addr, sc, mc8_sf, mc8_if, mc8_df)
    variable input_bus_tmp: std_logic_vector(12 downto 0);
begin
    if transfers.ac_enable = '1' then
        if transfers.ac_comp_enable = '1' then
            input_bus_tmp := std_logic_vector(unsigned('0' & ac) + unsigned(not ac));
        elsif transfers.mem_enable = '1' then
            -- if both AC and MEM are enabled, do a sign-extended two's complement addition
            input_bus_tmp := std_logic_vector(unsigned('0' & ac) + unsigned(sense));
        elsif transfers.bus_enable = '1' then
            -- if both AC and IO BUS are enabled, OR them
            input_bus_tmp := '0' & (ac or io_bus);
        elsif transfers.mq_enable = '1' then
            -- if both AC and MQR are enabled, OR them
            input_bus_tmp := '0' & (ac or mqr);
        elsif transfers.sc_enable = '1' then
            -- if both AC and SC are enabled, OR them
            input_bus_tmp := '0' & (ac or ("0000000" & sc));
        elsif transfers.sr_enable = '1' then
            -- if both AC and SR are enabled, OR them
            input_bus_tmp := '0' & (ac or sr);
        elsif transfers.sf_enable = '1' then
            -- if both AC and SF are enabled, OR them
            input_bus_tmp := '0' & (ac or ("000000" & mc8_sf));
        elsif transfers.if_enable = '1' then
            -- if both AC and IF are enabled, OR them
            input_bus_tmp := '0' & (ac or ("000000" & mc8_if & "000"));
        elsif transfers.df_enable = '1' then
            -- if both AC and DF are enabled, OR them
            input_bus_tmp := '0' & (ac or ("000000" & mc8_df & "000"));
        else
            input_bus_tmp := '0' & ac;
        end if;
    elsif transfers.ac_comp_enable = '1' then
        if transfers.mem_enable = '1' then
            -- if both AC and MEM are enabled, do a sign-extended two's complement addition
            input_bus_tmp := std_logic_vector(unsigned('0' & not ac) + unsigned(sense));
        else
            input_bus_tmp := '0' & not ac;
        end if;
    elsif transfers.pc_enable = '1' then
        input_bus_tmp := '0' & pc;
    elsif transfers.ma_enable = '1' then
        input_bus_tmp := '0' & mem_addr;
    elsif transfers.mem_enable = '1' then
        input_bus_tmp := '0' & sense;
    elsif transfers.mem_comp_enable = '1' then
        input_bus_tmp := '0' & not sense;
    elsif transfers.sr_enable = '1' then
        input_bus_tmp := '0' & sr;
    elsif transfers.bus_enable = '1' then
        input_bus_tmp := '0' & io_bus;
    elsif transfers.mq_enable = '1' then
        input_bus_tmp := '0' & mqr;
    elsif transfers.sc_enable = '1' then
        input_bus_tmp := '0' & "0000000" & sc;
    else
        input_bus_tmp := (others => '0');
    end if;
    
    if transfers.ma_enable_page = '1' then
        input_bus_tmp(11 downto 7) := mem_addr(11 downto 7);
    end if;

    if transfers.mem_enable_addr = '1' then
        input_bus_tmp(6 downto 0) := sense(6 downto 0);
    end if;

    if transfers.and_enable = '1' then
        input_bus_tmp := '0' & (input_bus_tmp(11 downto 0) and mem_buf);  
    else
        input_bus_tmp := std_logic_vector(unsigned(input_bus_tmp) + (transfers.carry_insert & ""));
    end if;

    input_bus <= input_bus_tmp;

    if transfers.l_enable = '1' then
        if transfers.l_comp_enable = '1' then
            l_bus <= not input_bus_tmp(12);
        else
            l_bus <= link xor input_bus_tmp(12);
        end if;
    elsif transfers.l_comp_enable = '1' then
        l_bus <= (not link) xor input_bus_tmp(12);
    else
        l_bus <= input_bus_tmp(12);
    end if;
    
end process;

dvi_carry: process(ac, sense)
    variable sum: std_logic_vector(12 downto 0);
begin
    sum := std_logic_vector(unsigned('0' & not ac) + unsigned(sense));
    carry_o <= sum(11);
end process;

regs: process
begin
    wait until rising_edge(clk);

    if transfers.ac_load = '1' then
        if transfers.shift = RIGHT_SHIFT then
            ac <= l_bus & input_bus(11 downto 1);
            link <= input_bus(0);
        elsif transfers.shift = DOUBLE_RIGHT_ROTATE then
            ac <= input_bus(0) & l_bus & input_bus(11 downto 2);
            link <= input_bus(1);
        elsif transfers.eae_shift = EAE_SHIFT_DVI then
            if transfers.shift = LEFT_SHIFT then
                link <= input_bus(11);

                ac <= input_bus(10 downto 0) & '0';
                if sc = "00000" then
                    if mqr(11) = '0' then
                        ac(0) <= '1';
                    end if;
                else
                    if mqr(11) /= mqr(0) then
                        ac(0) <= '1';
                    end if;
                end if;

                mqr <= mqr(10 downto 0) & '0';
                if l_bus /= mqr(0) and sc /= "00000" then
                    mqr(0) <= '1';
                end if;
            else
                -- only shift MQR
                mqr <= mqr(10 downto 0) & '0';
                if l_bus /= mqr(0) and sc /= "00000" then
                    mqr(0) <= '1';
                end if;
                ac <= input_bus(11 downto 0);
                link <= l_bus;
            end if;
        elsif transfers.shift = LEFT_SHIFT then
            ac <= input_bus(10 downto 0) & l_bus;
            link <= input_bus(11);
        elsif transfers.shift = DOUBLE_LEFT_ROTATE then
            ac <= input_bus(9 downto 0) & l_bus & input_bus(11);
            link <= input_bus(10);
        elsif transfers.eae_shift = EAE_L_AC_MQ_RIGHT then
            link <= '0';
            ac <= l_bus & input_bus(11 downto 1);
            mqr <= input_bus(0) & mqr(11 downto 1); 
        elsif transfers.eae_shift = EAE_L_AC_MQ_LEFT then
            link <= input_bus(11);
            ac <= input_bus(10 downto 0) & mqr(11);
            mqr <= mqr(10 downto 0) & '0'; 
        elsif transfers.eae_shift = EAE_SHIFT_ASR then
            link <= ac(11);
            ac <= ac(11) & ac(11 downto 1);
            mqr <= ac(0) & mqr(11 downto 1); 
        elsif transfers.eae_shift = EAE_SHIFT_LSR then
            ac <= '0' & ac(11 downto 1);
            mqr <= ac(0) & mqr(11 downto 1); 
        elsif transfers.shift = SHIFT_BOTH then
            ac <= '0' & input_bus(10 downto 1) & '0';
        elsif transfers.shift = DOUBLE_SHIFT_BOTH then
            ac <= "00" & input_bus(9 downto 2) & "00";
        else
            ac <= input_bus(11 downto 0);
            if input_bus(12) = '1' then
                link <= not link;
            end if;
        end if;
    end if;

    if transfers.l_load = '1' and transfers.shift = NO_SHIFT then
        if transfers.l_disable = '0' then
            link <= l_bus;
        else 
            link <= '0';
        end if;
    end if;

    if transfers.pc_load = '1' then
        pc <= input_bus(11 downto 0);
        skip <= '0';
        if transfers.sr_enable = '1' then
            mc8_if <= sw_if;
            mc8_ib <= sw_if;
            mc8_df <= sw_df;
        end if;
    end if;
        
    if transfers.ma_load = '1' then
        mem_addr <= input_bus(11 downto 0);
    end if;
    
    if transfers.mb_load = '1' then
        mem_buf <= input_bus(11 downto 0);
    end if;
    
    if transfers.skip_load = '1' then
        skip <= transfers.reverse_skip;
    
        if transfers.skip_if_carry = '1' and l_bus = '1' then
            skip <= not transfers.reverse_skip;
        end if;
    
        if transfers.skip_if_zero = '1' and ac(11 downto 0) = "000000000000" then
            skip <= not transfers.reverse_skip;
        end if;

        if transfers.skip_if_neg = '1' and ac(11) = '1' then
            skip <= not transfers.reverse_skip;
        end if;

        if transfers.skip_if_link = '1' and link = '1' then
            skip <= not transfers.reverse_skip;
        end if;
    end if;
    
    if transfers.mq_load = '1' then
        if transfers.ac_mq_enable = '1' then
            mqr <= ac;
        else
            mqr <= input_bus(11 downto 0);
        end if;
    end if;
    
    if transfers.sc_load = '1' then
        sc <= input_bus(4 downto 0);
    end if;
    
    if transfers.inc_sc = '1' then
        sc <= std_logic_vector(unsigned(sc) + 1);
    end if;

    if transfers.initialize = '1' then
        ac <= (others => '0');
        link <= '0';
    end if;

    if enable_ext_mc8i then
        if transfers.save_fields = '1' then
            mc8_sf <= mc8_if & mc8_df;
        end if;
    
        if transfers.clear_fields = '1' then
            mc8_if <= (others => '0');
            mc8_ib <= (others => '0');
            mc8_df <= (others => '0');
        end if;
        
        if transfers.restore_fields = '1' then
            mc8_ib <= mc8_sf(5 downto 3);
            mc8_df <= mc8_sf(2 downto 0);
        end if;
        
        if transfers.ib_to_if = '1' then
            mc8_if <= mc8_ib;
        end if;
        
        if transfers.load_ib = '1' then
            mc8_ib <= sense(5 downto 3);
        end if;
    
        if transfers.load_df = '1' then
            mc8_df <= sense(5 downto 3);
        end if;
    end if;
        
    if rstn = '0' then
        ac <= (others => '0');
        skip <= '0';
        link <= '0';
        pc <= (others => '0');
        mem_addr <= (others => '0');
        mem_buf <= (others => '0');
        mqr <= (others => '0');
        sc <= (others => '0');
        mc8_if <= (others => '0');
        mc8_ib <= (others => '0');
        mc8_df <= (others => '0');
        mc8_sf <= (others => '0');
    end if;
end process;

pc_o <= pc;
ac_o <= ac;
link_o <= link;
ma_o <= mem_addr;
mb_o <= mem_buf;
skip_o <= skip;
mqr_o <= mqr;
sc_o <= sc;
df_o <= mc8_df;
if_o <= mc8_if;

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

with sense(3 downto 1) select eae_inst_o <=
    EAE_SCL when "001",
    EAE_MUY when "010",
    EAE_DVI when "011",
    EAE_NMI when "100",
    EAE_SHL when "101",
    EAE_ASR when "110",
    EAE_LSR when "111",
    EAE_NONE when others;

end Behavioral;
