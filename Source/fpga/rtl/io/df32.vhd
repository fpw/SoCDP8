-- Part of SoCDP8, Copyright by Folke Will, 2019
-- Licensed under CERN Open Hardware Licence v1.2
-- See HW_LICENSE for details
library IEEE;
use IEEE.STD_LOGIC_1164.ALL;
use IEEE.NUMERIC_STD.ALL;

use work.socdp8_package.all;

entity df32 is
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
end df32;

architecture Behavioral of df32 is
    signal iop_last: io_state;
    signal regA: std_logic_vector(15 downto 0);
    signal regB: std_logic_vector(15 downto 0);
begin

with reg_sel select reg_out <=
    -- 0 is used for dev enable outside
    regA when x"1",
    regB when x"2",
    x"0000" when others;

iop_last <= iop when rising_edge(clk);
soc_attention <= '0';

df32_proc: process
begin
    wait until rising_edge(clk);
 
    if reg_write = '1' then
        case reg_sel is
            when x"1" => regA <= reg_in;
            when x"2" => regB <= reg_in;
            when others => null;
        end case;
    end if;
    
    if iop = IO_NONE or enable = '0' then
        io_skip <= '0';
        io_ac_clear <= '0';
        io_bus_out <= (others => '0');
    end if;
    
    pdp8_irq <= '0';

    if enable = '1' then
        -- regA: DMA and R/W op
        -- regB: EMA + Status, 15: data completion flag
        
        -- Status bits:
        -- 11: PCA: Photocell sync (TODO)
        -- 10 downto 6: EMA
        --  5 downto 3: Memory field
        --  2: DRL: Data request late
        --  1: NXD / EWL: Non-existent disk or write lock
        --  0: PER: Parity error

        pdp8_irq <= regB(1) or regB(15);

        if iop_last /= iop and io_mb(8 downto 3) = o"60" then
            case iop is
                when IO1 =>
                    -- DCMA: Clear flags and DMA
                    regA(11 downto 0) <= (others => '0'); -- clear DMA
                    regB(2) <= '0';             -- clear DRL
                    regB(1) <= '0';             -- clear NXD / EWL
                    regB(0) <= '0';             -- clear PER
                    regB(15) <= '0';            -- done = 0
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
                    -- DCEA: Clear EMA and field
                    regB(10 downto 3) <= (others => '0');
                when IO2 =>
                    -- DSAC: Skip if address confirmed (TODO)
                    io_skip <= '1';
                when IO4 =>
                    if io_mb(2 downto 0) = o"5" then
                        -- DEAL: Load EMA and field
                        regB(10 downto 3) <= io_ac(10 downto 3);
                    else
                        -- DEAC: Put EMA and field into AC 
                        io_bus_out <= regB(11 downto 0);
                    end if;
                when others => null;
            end case;
        elsif iop_last /= iop and io_mb(8 downto 3) = o"62" then
            case iop is
                when IO1 =>
                    -- DFSE: Skip on DRL, PER, WLS or NXD
                    io_skip <= not (regB(2) or regB(1) or regB(0));
                when IO2 =>
                    if io_mb(2 downto 0) = o"6" then
                        -- DMAC: Clear AC in IOP2
                        io_ac_clear <= '1';
                    else
                        -- DFSC: Skip if DCF is set
                        io_skip <= regB(15);
                    end if;
                when IO4 =>
                    -- DMAC: Load DMA into AC
                    io_bus_out <= regA(11 downto 0);
                when others => null;
            end case;
        end if;
    end if;

    if rstn = '0' then
        regA <= (others => '0');
        regB <= (others => '0');
    end if;
end process;

end Behavioral;
