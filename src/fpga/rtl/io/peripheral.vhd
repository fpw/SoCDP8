-- Part of SoCDP8, Copyright by Folke Will, 2019
-- Licensed under CERN Open Hardware Licence v1.2
-- See HW_LICENSE for details
library IEEE;
use IEEE.STD_LOGIC_1164.ALL;
use IEEE.NUMERIC_STD.ALL;

use work.socdp8_package.all;

entity peripheral is
    generic (
        dev_index: natural
    );
    port (
        clk: in std_logic;
        rstn: in std_logic;

        signal dev_type: in std_logic_vector(7 downto 0);
        signal sub_type: in std_logic_vector(3 downto 0);

        signal reg_sel: in std_logic_vector(3 downto 0);
        signal reg_out: out std_logic_vector(15 downto 0);
        signal reg_in: in std_logic_vector(15 downto 0);
        signal reg_write: in std_logic;

        signal enable: in std_logic;
        signal iop: in io_state;
        signal io_mb: in std_logic_vector(11 downto 0);
        signal io_ac: in std_logic_vector(11 downto 0);
        
        signal io_skip: out std_logic;
        signal io_ac_clear: out std_logic;
        signal io_bus_out: out std_logic_vector(11 downto 0);
        
        signal pdp8_irq: out std_logic;
        signal soc_attention: out std_logic
    );
end peripheral;

architecture Behavioral of peripheral is
    signal devType: std_logic_vector(15 downto 0);
    signal regA: std_logic_vector(15 downto 0);
    signal regB: std_logic_vector(15 downto 0);
    signal regC: std_logic_vector(15 downto 0);
    signal regD: std_logic_vector(15 downto 0);
    
    signal pdp8_irq_buf: std_logic;
begin

with reg_sel select reg_out <=
    -- 0 is used for dev type outside
    regA when x"1",
    regB when x"2",
    regC when x"3",
    regD when x"4",
    x"0000" when others;

pdp8_irq <= pdp8_irq_buf;

action: process
    procedure asr33 is
    begin
        pdp8_irq_buf <= regB(0) or regD(1);
        soc_attention <= not regB(0) or regD(0);

        if enable = '1' and sub_type = x"0" then
            -- Reader interface: Write new data into regA and then set regB to 1
            case iop is
                when IO1 =>
                    -- Set skip if new data
                    io_skip <= regB(0);
                when IO2 => 
                    -- Clear AC, clear new data flag
                    io_ac_clear <= '1';
                    regB(0) <= '0';
                when IO4 => 
                    -- Put data on bus
                    io_bus_out <= regA(11 downto 0);
                when others => null;
            end case;
        elsif enable = '1' and sub_type = x"1" then
            -- Writer interface: Check regD = 1 to see if new data, take from regC and set regD to 2 to ack
            case iop is
                when IO1 =>
                    -- Set skip if data acked
                    io_skip <= regD(1);
                when IO2 =>
                    -- Clear ack flag 
                    regD(1) <= '0';
                when IO4 => 
                    -- Load buffer
                    regC(11 downto 0) <= io_ac;
                    regD(0) <= '1';
                when others => null;
            end case;
        end if;
    end procedure;

    procedure pc04 is
    begin
        pdp8_irq_buf <= regB(1) or regD(1);
        soc_attention <= regB(0) or regD(0);

        if enable = '1' and sub_type = x"0" then
            -- Reader interface: Write new data into regA if regB & 1,then set regB to 2
            case iop is
                when IO1 =>
                    -- Set skip if new data
                    io_skip <= regB(1);
                when IO2 => 
                    -- Clear new data flag, put data on bus
                    io_bus_out <= regA(11 downto 0);
                    regB(1) <= '0';
                when IO4 =>
                    -- Clear flag, request new data
                    regB(0) <= '1';
                    regB(1) <= '0';
                when others => null;
            end case;
        elsif enable = '1' and sub_type = x"1" then
            -- Writer interface: Check regD = 1 to see if new data, take from regC and set regD to 2 to ack
            case iop is
                when IO1 =>
                    -- Set skip if data acked
                    io_skip <= regD(1);
                when IO2 =>
                    -- Clear ack flag 
                    regD(1) <= '0';
                when IO4 => 
                    -- Load buffer
                    regC(11 downto 0) <= io_ac;
                    regD(0) <= '1';
                when others => null;
            end case;
        end if;
    end procedure;

    procedure tc08 is
    begin
        if unsigned(regB(11 downto 0) and o"7707") /= 0 and regA(2) = '1' then
            pdp8_irq_buf <= '1';
        else
            pdp8_irq_buf <= '0';
        end if;
        soc_attention <= regC(0);

        if enable = '1' and sub_type = x"0" then
            -- status register A:
            -- 11 downto 9: transport unit
            --           8: motion, 0 = forward, 1 = reverse
            --           7: motion, 0 = stop, 1 = start
            --           6: mode, 0 = normal, 1 = continuous
            --  5 downto 3: function, 0 = move, 1 = search, 2 = read, 3 = read all, 4 = write, 5 = write all, 6 = write timing, 7 = unused
            --           2: enable interrupt, 0 = disable interrupt, 1 = enable interrupt
            --           1: error clear, 0 = clear all error flags, 1 = leave error flags
            --           0: dectape clear, 0 = clear dectape flag, 1 = leave dectape flag 
            case iop is
                when IO1 =>
                    -- DTRA: Put status register A on bus
                    io_bus_out <= regA(11 downto 0);
                when IO2 => 
                    -- DTCA: Clear status register A
                    regA <= (others => '0');
                when IO4 =>
                    -- DTXA: xor status register A (0 to 9 in DEC bit order), clear AC
                    regA(11 downto 2) <= regA(11 downto 2) xor io_ac(11 downto 2);
                    
                    if io_ac(1) = '0' then
                        -- clear error flags
                        regB(11 downto 6) <= (others => '0');
                    end if;
                    
                    if io_ac(0) = '0' then
                        -- clear DECtape flag
                        regB(0) <= '0';
                    end if;
                    
                    io_ac_clear <= '1';

                    -- notify SoC
                    regC(0) <= '1';
                when others => null;
            end case;
        elsif enable = '1' and sub_type = x"1" then
            -- status register B
            -- 11: error flag (EF)
            -- 10: mark track error (MK TRK)
            --  9: end of tape (END)
            --  8: select errror (SE)
            --  7: parity error (PE)
            --  6: timing error (TIM)
            --  5 downto 3: memory field (MF)
            --  2 downto 1: unused
            --  0: dectape flag (DTF)
            case iop is
                when IO1 =>
                    -- DTSF: Skip on flags
                    if unsigned(regB(11 downto 0) and o"7707") /= 0 then
                        io_skip <= '1';
                    end if;
                when IO2 => 
                    -- DTRB: Read status register B
                    io_bus_out <= regB(11 downto 0);
                when IO4 =>
                    -- DTLB: Load memory field
                    io_ac_clear <= '1';
                    regB(5 downto 3) <= io_ac(5 downto 3);
                when others => null;
            end case;
        end if;
    end procedure;
    
    procedure rf08 is
    begin
        -- regA: DMA and R/W op
        -- regB: EMA
        -- regC: Status register, 15: data completion flag (DCF)
        -- regD:
        
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
            pdp8_irq_buf <= '1';
        else
            pdp8_irq_buf <= '0';
        end if;

        if enable = '1' and sub_type = x"0" then -- 60
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
        elsif enable = '1' and sub_type = x"1" then -- 61
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
        elsif enable = '1' and sub_type = x"2" then -- 62
            case iop is
                when IO1 =>
                    -- DFSE: Skip on DRL, PER, WLS or NXD
                    io_skip <= regC(9) or regC(2) or regC(1) or regC(0);
                when IO2 =>
                    if io_mb(2 downto 0) = o"6" then
                        -- DMAC: Clear AC in IOP2
                        io_ac_clear <= '1';
                    else
                        -- DFSC: Skip if DCF is set
                        io_skip <= regC(15);
                    end if;
                when IO4 =>
                    -- DMAC: Load DMA into AC
                    io_bus_out <= regA(11 downto 0);
                when others => null;
            end case;
        elsif enable = '1' and sub_type = x"4" then -- 64
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
    end procedure;

begin
    wait until rising_edge(clk);
 
    if reg_write = '1' then
        case reg_sel is
            when x"1" => regA <= reg_in;
            when x"2" => regB <= reg_in;
            when x"3" => regC <= reg_in;
            when x"4" => regD <= reg_in;
            when others => null;
        end case;
    end if;
    
    if iop = IO_NONE then
        io_skip <= '0';
        io_ac_clear <= '0';
        io_bus_out <= (others => '0');
    end if;

    pdp8_irq_buf <= '0';
    soc_attention <= '0';

    case dev_type is
        when x"01" => asr33;
        when x"02" => pc04;
        when x"03" => tc08;
        when x"04" => rf08;
        when others => null;
    end case;

    if rstn = '0' then
        regA <= (others => '0');
        regB <= (others => '0');
        regC <= (others => '0');
        regD <= (others => '0');
    end if;
end process;

end Behavioral;
