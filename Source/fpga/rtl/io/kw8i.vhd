-- Part of SoCDP8, Copyright by Folke Will, 2019
-- Licensed under CERN Open Hardware Licence v1.2
-- See HW_LICENSE for details
library IEEE;
use IEEE.STD_LOGIC_1164.ALL;
use IEEE.NUMERIC_STD.ALL;

use work.socdp8_package.all;

entity kw8i is
    port (
        clk: in std_logic;
        rstn: in std_logic;

        enable: in std_logic;

        reg_sel: in std_logic_vector(3 downto 0);
        reg_out: out std_logic_vector(15 downto 0);
        reg_in: in std_logic_vector(15 downto 0);
        reg_write: in std_logic;

        iop: in io_state;
        io_mb: in std_logic_vector(11 downto 0);
        io_ac: in std_logic_vector(11 downto 0);
        
        io_skip: out std_logic;
        io_ac_clear: out std_logic;
        io_bus_out: out std_logic_vector(11 downto 0);
        
        pdp8_irq: out std_logic;
        soc_attention: out std_logic
    );
    
    -- assuming 60 Hz
    constant counter_cycles: natural := period_to_cycles(clk_frq, 1.0 / 60.0);
end kw8i;

architecture Behavioral of kw8i is
    signal iop_last: io_state;
    signal counter: integer range 0 to counter_cycles - 1;
    signal irq_enable: std_logic;
    signal flag: std_logic;
    signal clock_enable: std_logic;
begin

with reg_sel select reg_out <=
    -- 0 is used for dev enable outside
    "0000000000000" & flag & irq_enable & clock_enable when x"1",
    x"0000" when others;

pdp8_irq <= flag and irq_enable when enable = '1' else '0';
soc_attention <= '0';
iop_last <= iop when rising_edge(clk);

kw8i_proc: process
begin
    wait until rising_edge(clk);

    if reg_write = '1' then
        case reg_sel is
            when x"1" =>
                clock_enable <= reg_in(0);
                irq_enable <= reg_in(1);
                flag <= reg_in(2);
            when others => null;
        end case;
    end if;
 
    if iop = IO_NONE or enable = '0' then
        io_skip <= '0';
        io_ac_clear <= '0';
        io_bus_out <= (others => '0');
    end if;

    if clock_enable = '1' then    
        if counter < counter_cycles - 1 then
            counter <= counter + 1;
        else 
            counter <= 0;
            flag <= '1';
        end if;
    else
        counter <= 0;
    end if;

    if enable = '1' and iop_last /= iop and io_mb(8 downto 3) = o"13" then
        case iop is
            when IO1 =>
                if io_mb(2 downto 0) = o"3" then
                    -- CSCF: Skip on flag
                    if flag = '1' then
                        io_skip <= '1';
                        flag <= '0';
                    end if;
                end if;
            when IO2 =>
                if io_mb(2 downto 0) = o"2" or io_mb(2 downto 0) = o"7" then
                    -- CCFF: Clear flag, enable and interrupt enable
                    flag <= '0';
                    irq_enable <= '0';
                    clock_enable <= '0';
                elsif io_mb(2 downto 0) = o"6" then
                    -- CCEC: Enable clock
                    clock_enable <= '1';
                end if;
            when IO4 =>
                if io_mb(2 downto 0) = o"7" then
                    -- CECI: Clear all FFs, then set enable and interrupt enable
                    clock_enable <= '1';
                    irq_enable <= '1';
                end if;
            when others => null;
        end case;
    end if;

    if rstn = '0' then
        counter <= 0;
        flag <= '0';
        clock_enable <= '0';
        irq_enable <= '0';
    end if;
end process;

end Behavioral;
