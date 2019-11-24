-- Part of SoCDP8, Copyright by Folke Will, 2019
-- Licensed under CERN Open Hardware Licence v1.2
-- See HW_LICENSE for details
library IEEE;
use IEEE.STD_LOGIC_1164.ALL;
use IEEE.NUMERIC_STD.ALL;

use work.socdp8_package.all;

entity rk8 is
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
end rk8;

architecture Behavioral of rk8 is
    signal iop_last: io_state;
    signal regA: std_logic_vector(15 downto 0);
    signal regB: std_logic_vector(15 downto 0);
    signal regC: std_logic_vector(15 downto 0);
    signal regD: std_logic_vector(15 downto 0);
    signal regE: std_logic_vector(15 downto 0);
begin

with reg_sel select reg_out <=
    -- 0 is used for dev enable outside
    regA when x"1",
    regB when x"2",
    regC when x"3",
    regD when x"4",
    regE when x"5",
    x"0000" when others;

iop_last <= iop when rising_edge(clk);
soc_attention <= '0';

rk8_proc: process
begin
    wait until rising_edge(clk);
 
    if reg_write = '1' then
        case reg_sel is
            when x"1" => regA <= reg_in;
            when x"2" => regB <= reg_in;
            when x"3" => regC <= reg_in;
            when x"4" => regD <= reg_in;
            when x"5" => regE <= reg_in;
            when others => null;
        end case;
    end if;
    
    if iop = IO_NONE or enable = '0' then
        io_skip <= '0';
        io_ac_clear <= '0';
        io_bus_out <= (others => '0');
    end if;

    if enable = '1' then
        -- regA: command register and R(13)/W(14)/P(15)
        -- regB: track, and sector address
        -- regC: Status register
        -- regD: WC register
        -- regE: CA register
        
        -- Command bits:
        -- 11: Enable change in interrupt status
        -- 10: Enable interrupt on transfer done
        --  9: Enable interrupt on error
        --  8: Unused
        --  7: Seek track and surface only
        --  6: Enable reading / writing of the two header words
        --  5 downto 3: Mem field
        --  2 downto 1: Disk number
        --  0: Double density (always zero)
        
        -- Status bits:
        -- 11: Error
        -- 10: Transfer done
        --  9: Control busy error
        --  8: Timeout error
        --  7: Parity or timing error
        --  6: Data rate error
        --  5: Track address error
        --  4: Sector number error
        --  3: Write lock error
        --  2: Track capacity exceeded error
        --  1: Select error
        --  0: Busy

        pdp8_irq <= (regA(10) and regC(10)) or
                    (regA(9) and regC(11));

        if iop_last /= iop and io_mb(8 downto 3) = o"73" then
            case io_mb(2 downto 0) is
                when o"1" =>
                    -- DLDA: TODO
                when o"2" =>
                    -- DLDC: Load command register from AC, clear AC
                    if iop = IO2 then
                        regA(8 downto 0) <= io_ac(8 downto 0);
                        if io_ac(11) = '1' then
                            regA(10) <= io_ac(10);
                            regA(9) <= io_ac(9);
                        end if;
                        io_ac_clear <= '1';
                    end if;
                when o"3" =>
                    -- DLDR: Load address from AC, clear AC. Start reading if CMD.7 = 0
                    if iop = IO2 then
                        regB(11 downto 0) <= io_ac;
                        io_ac_clear <= '1';
                        regA(13) <= '1';
                    end if;
                when o"5" =>
                    if iop = IO4 then
                        -- DLDW: Load address from AC, clear AC. Start writing if CMD.7 = 0
                        regB(11 downto 0) <= io_ac;
                        io_ac_clear <= '1';
                        regA(14) <= '1';
                    end if;
                when o"7" =>
                    if iop = IO1 then
                        -- DCHP: Load address from AC, clear AC. Start parity test if CMD.7 = 0
                        regB(11 downto 0) <= io_ac;
                        io_ac_clear <= '1';
                        regA(15) <= '1';
                    end if;
                when o"4" =>
                    if iop = IO4 then
                        -- DRDA: Clear AC and put address into AC
                        io_ac_clear <= '1';
                        io_bus_out <= regB(11 downto 0);
                    end if;
                when o"6" =>
                    if iop = IO2 then
                        -- DRDC: Clear AC and read command register into AC
                        io_ac_clear <= '1';
                        io_bus_out <= regA(11 downto 0);
                    end if;
                when others =>
                    null;
            end case;
        elsif iop_last /= iop and io_mb(8 downto 3) = o"74" then
            case io_mb(2 downto 0) is
                when o"1" =>
                    if iop = IO1 then
                        -- DRDS: Clear AC and read status register into AC
                        io_ac_clear <= '1';                        
                        io_bus_out <= regC(11 downto 0);
                    end if;
                when o"2" =>
                    if iop = IO2 then
                        -- DCLS: Clear status register
                        regC <= (others => '0');
                    end if;
                when o"3" =>
                    -- DMNT: Maintenance (TODO)
                when o"5" =>
                    if iop = IO4 then
                        -- DSKD: Skip on transfer done = 1
                        io_skip <= regC(10);
                    end if;
                when o"7" =>
                    if iop = IO1 then
                        -- DSKE: Skip on error = 1
                        io_skip <= regC(11);
                    end if;
                when others =>
                    null;
            end case;
        elsif iop_last /= iop and io_mb(8 downto 3) = o"75" then
            case io_mb(2 downto 0) is
                when o"1" =>
                    if iop = IO1 then
                        -- DCLA: Clear
                        regA <= regA and (x"0" & o"0006");
                        regB <= (others => '0');
                        regC <= (others => '0');
                    end if;
                when o"2" =>
                    if iop = IO2 then
                        -- DRWC: Clear AC, put WC into AC
                        io_ac_clear <= '1';
                        io_bus_out <= regD(11 downto 0);
                    end if;
                when o"3" =>
                    if iop = IO1 then
                        -- DLWC: Load WC from AC, clear AC
                        regD(11 downto 0) <= io_ac;
                        io_ac_clear <= '1';
                    end if;
                when o"5" =>
                    if iop = IO4 then
                        -- DLCA: Load CA from AC, clear AC
                        regE(11 downto 0) <= io_ac;
                        io_ac_clear <= '1';
                    end if;
                when o"7" =>
                    if iop = IO1 then
                        -- DRCA: Clear AC, put CA into AC 
                        io_ac_clear <= '1';
                        io_bus_out <= regE(11 downto 0);
                    end if;
                when others =>
                    null;
            end case;
        end if;
    end if;

    if rstn = '0' then
        regA <= (others => '0');
        regB <= (others => '0');
        regC <= (others => '0');
        regD <= (others => '0');
        regE <= (others => '0');
    end if;
end process;

end Behavioral;
