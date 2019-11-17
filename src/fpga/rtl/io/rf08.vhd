-- Part of SoCDP8, Copyright by Folke Will, 2019
-- Licensed under CERN Open Hardware Licence v1.2
-- See HW_LICENSE for details
library IEEE;
use IEEE.STD_LOGIC_1164.ALL;
use IEEE.NUMERIC_STD.ALL;

use work.socdp8_package.all;

entity rf08 is
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
end rf08;

architecture Behavioral of rf08 is
    signal iop_last: io_state;
    signal regA: std_logic_vector(15 downto 0);
    signal regB: std_logic_vector(15 downto 0);
    signal regC: std_logic_vector(15 downto 0);
begin

with reg_sel select reg_out <=
    -- 0 is used for dev enable outside
    regA when x"1",
    regB when x"2",
    regC when x"3",
    x"0000" when others;

iop_last <= iop when rising_edge(clk);
soc_attention <= '0';

rf08_proc: process
begin
    wait until rising_edge(clk);
 
    if reg_write = '1' then
        case reg_sel is
            when x"1" => regA <= reg_in;
            when x"2" => regB <= reg_in;
            when x"3" => regC <= reg_in;
            when others => null;
        end case;
    end if;
    
    if iop = IO_NONE or enable = '0' then
        io_skip <= '0';
        io_ac_clear <= '0';
        io_bus_out <= (others => '0');
    end if;

    if enable = '1' then
        -- regA: DMA and R/W op
        -- regB: EMA
        -- regC: Status register, 15: data completion flag (DCF)
        
        -- Status bits:
        -- 11: PCA: Photocell sync (TODO)
        -- 10: DRE: Data request enable
        --  9: WLS: Write lock selected
        --  8: EIE: Enable error interrupt
        --  7: PIE: Enable photocell interrupt
        --  6: CIE: Enable completion interrupt (on WCO)
        --  5 downto 3: Memory field
        --  2: DRL: Data request late
        --  1: NXD: Non-existent disk
        --  0: PER: Parity error

        if (regC(8) = '1' and (regC(9) or regC(2) or regC(1) or regC(0)) = '1') or
           (regC(6) = '1' and regC(15) = '1')
        then
            pdp8_irq <= '1';
        else
            pdp8_irq <= '0';
        end if;

        if iop_last /= iop and io_mb(8 downto 3) = o"60" then
            case iop is
                when IO1 =>
                    -- DCMA: Clear DMA, parity flag, data late flag. Does not clear interrupt enable or EMA.
                    regA(11 downto 0) <= (others => '0'); -- clear DMA
                    regC(9) <= '0';             -- clear WLS
                    regC(2) <= '0';             -- clear DRL
                    regC(1) <= '0';             -- clear NXD
                    regC(0) <= '0';             -- clear PER
                    regC(15) <= '0';            -- done = 0
                when IO2 => 
                    -- DMAR: Load DMA with AC and clear AC, start reading
                    regA(11 downto 0) <= io_ac;
                    regA(15) <= '1';            -- read
                    regA(14) <= '0';            -- no write
                    io_ac_clear <= '1';
                when IO4 =>
                    -- DMAW: Load DMA with AC and clear AC, start writing
                    regA(11 downto 0) <= io_ac;
                    regA(15) <= '0';            -- no read
                    regA(14) <= '1';            -- write
                    io_ac_clear <= '1';
                when others => null;
            end case;
        elsif iop_last /= iop and io_mb(8 downto 3) = o"61" then
            case iop is
                when IO1 =>
                    -- DCIM: Clear interrupt enable and field
                    regC(8 downto 3) <= (others => '0');
                when IO2 =>
                    -- DSAC: Skip if address confirmed (TODO)
                    io_ac_clear <= '1'; 
                when IO4 =>
                    if io_mb(2 downto 0) = o"5" then
                        -- DIML: Load interrupt enable and mem field from AC, then clear AC
                        regC(8 downto 3) <= io_ac(8 downto 3);
                        io_ac_clear <= '1';
                    else
                        -- DIMA: 
                        io_bus_out <= regC(11 downto 0);
                    end if;
                when others => null;
            end case;
        elsif iop_last /= iop and io_mb(8 downto 3) = o"62" then
            case iop is
                when IO1 =>
                    if io_mb(2 downto 0) = o"1" then
                        -- DFSE: Skip on DRL, PER, WLS or NXD
                        io_skip <= regC(9) or regC(2) or regC(1) or regC(0);
                    elsif io_mb(2 downto 0) = o"3" then
                        -- DISK: Skip if error or DCF is set
                        io_skip <= regC(9) or regC(2) or regC(1) or regC(0) or regC(15);
                    end if;
                when IO2 =>
                    if io_mb(2 downto 0) = o"6" then
                        -- DMAC: Clear AC in IOP2
                        io_ac_clear <= '1';
                    elsif io_mb(2 downto 0) = o"2" then
                        -- DFSC: Skip if DCF is set
                        io_skip <= regC(15);
                    end if;
                when IO4 =>
                    if io_mb(2 downto 0) = o"6" then
                        -- DMAC: Load DMA into AC
                        io_bus_out <= regA(11 downto 0);
                    end if;
                when others => null;
            end case;
        elsif iop_last /= iop and io_mb(8 downto 3) = o"64" then
            case iop is
                when IO1 =>
                    if io_mb(2 downto 0) = o"1" or io_mb(2 downto 0) = o"3" then
                        -- DCXA: Clears the 8 EMA bits
                        regB <= (others => '0');
                    else
                        -- DXAC: Clear AC at IOP1
                        io_ac_clear <= '1';
                    end if;
                when IO2 =>
                    -- DXAL: Load 8 EMA register bits from AC, clear AC
                    regB(7 downto 0) <= regB(7 downto 0) or io_ac(7 downto 0);
                    io_ac_clear <= '1';
                when IO4 =>
                    -- DXAC: Load EMA into AC
                    io_bus_out(7 downto 0) <= regB(7 downto 0);
                when others => null;
            end case;
        end if;
    end if;

    if rstn = '0' then
        regA <= (others => '0');
        regB <= (others => '0');
        regC <= (others => '0');
    end if;
end process;

end Behavioral;
