-- Part of SoCDP8, Copyright by Folke Will, 2019
-- Licensed under CERN Open Hardware Licence v1.2
-- See HW_LICENSE for details
library IEEE;
use IEEE.STD_LOGIC_1164.ALL;
use IEEE.NUMERIC_STD.ALL;

use work.socdp8_package.all;

entity io_controller is
    port (
        clk_50: in std_logic;
        rst: in std_logic;

        -- I/O connections to PDP-8
        iop: in std_logic_vector(2 downto 0);
        io_ac: in std_logic_vector(11 downto 0);
        io_mb: in std_logic_vector(11 downto 0);
        io_bus_out: out std_logic_vector(11 downto 0);
        io_ac_clear: out std_logic;
        io_skip: out std_logic;

        irq: out std_logic;

        -- external memory connections
        mem_addr: out std_logic_vector(31 downto 0);
        mem_din: out std_logic_vector(31 downto 0);
        mem_dout: in std_logic_vector(31 downto 0);
        mem_write: out std_logic_vector(3 downto 0);
        mem_en: out std_logic;
        mem_rst: out std_logic
    );

    constant clk_frq: natural := 50_000_000;
end io_controller;

architecture Behavioral of io_controller is
    signal iop_last: std_logic_vector(2 downto 0);

    signal iop1_cla, iop2_cla, iop4_cla: std_logic;
    signal iop1_write, iop2_write, iop4_write: std_logic;
    signal iop1_read, iop2_read, iop4_read: std_logic;
    signal iop1_skip, iop2_skip, iop4_skip: std_logic;
    signal iop2_clr_skip1, iop4_clr_skip1: std_logic;
    signal iop1_clr_skip2, iop4_clr_skip2: std_logic;
    signal iop1_clr_skip4, iop2_clr_skip4: std_logic;
    signal data: std_logic_vector(11 downto 0);
begin

iop_last <= iop when rising_edge(clk_50);

mem_en <= '1';
mem_rst <= rst;

-- Device n is at address 4 * n so each device has 4 config bytes
mem_addr <= x"000000" & io_mb(8 downto 3) & "00";

data <= mem_dout(11 downto 0);

iop1_cla <= mem_dout(12);
iop1_write <= mem_dout(13);
iop1_read <= mem_dout(14);
iop1_skip <= mem_dout(15);
iop1_clr_skip2 <= mem_dout(16);
iop1_clr_skip4 <= mem_dout(17);

iop2_cla <= mem_dout(18);
iop2_write <= mem_dout(19);
iop2_read <= mem_dout(20);
iop2_skip <= mem_dout(21);
iop2_clr_skip1 <= mem_dout(22);
iop2_clr_skip4 <= mem_dout(23);

iop4_cla <= mem_dout(24);
iop4_write <= mem_dout(25);
iop4_read <= mem_dout(26);
iop4_skip <= mem_dout(27);
iop4_clr_skip1 <= mem_dout(28);
iop4_clr_skip2 <= mem_dout(29);

-- combinatorial process
io_comb: process
begin
    io_bus_out <= o"0000";
    io_ac_clear <= '0';
    io_skip <= '0';

    if iop(0) = '1' then
        -- IOP1
        io_ac_clear <= iop1_cla;
        io_skip <= iop1_skip;
        if iop1_write = '1' then
            io_bus_out <= data;
        end if;
    elsif iop(1) = '1' then
        -- IOP2
        io_ac_clear <= iop2_cla;
        io_skip <= iop2_skip;
        if iop2_write = '1' then
            io_bus_out <= data;
        end if;
    elsif iop(2) = '1' then
        -- IOP4
        io_ac_clear <= iop4_cla;
        io_skip <= iop4_skip;
        if iop4_write = '1' then
            io_bus_out <= data;
        end if;
    end if;
end process;

io_write_back: process
    variable tmp: std_logic_vector(31 downto 0);
begin
    wait until rising_edge(clk_50);

    mem_write <= "0000";
    mem_din <= (others => '0');
    irq <= '0';
    
    if iop(0) = '0' and iop_last(0) = '1' then
        -- IOP1 done
        tmp := mem_dout;
        
        if iop1_clr_skip2 = '1' then
            tmp(21) := '0';
            irq <= '1';
        end if;
        
        if iop1_clr_skip4 = '1' then
            tmp(27) := '0';
            irq <= '1';
        end if;
        
        if iop1_read = '1' then
            tmp(11 downto 0) := io_ac;
            irq <= '1';
        end if;
        
        mem_din <= tmp;
        mem_write <= "1111";
    elsif iop(1) = '0' and iop_last(1) = '1' then
        -- IOP2 done
        tmp := mem_dout;
        
        if iop2_clr_skip1 = '1' then
            tmp(15) := '0';
            irq <= '1';
        end if;
        
        if iop2_clr_skip4 = '1' then
            tmp(27) := '0';
            irq <= '1';
        end if;

        if iop2_read = '1' then
            tmp(11 downto 0) := io_ac;
            irq <= '1';
        end if;
        
        mem_din <= tmp;
        mem_write <= "1111";
        irq <= '1';
    elsif iop(2) = '0' and iop_last(2) = '1' then
        -- IOP4 done
        tmp := mem_dout;
        
        if iop4_clr_skip1 = '1' then
            tmp(15) := '0';
            irq <= '1';
        end if;
        
        if iop4_clr_skip2 = '1' then
            tmp(21) := '0';
            irq <= '1';
        end if;
        
        if iop4_read = '1' then
            tmp(11 downto 0) := io_ac;
            irq <= '1';
        end if;

        mem_din <= tmp;
        mem_write <= "1111";
        irq <= '1';
    end if;

    if rst = '1' then
        mem_write <= "0000";
    end if;

end process;
    
end Behavioral;
