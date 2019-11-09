-- Part of SoCDP8, Copyright by Folke Will, 2019
-- Licensed under CERN Open Hardware Licence v1.2
-- See HW_LICENSE for details
library IEEE;
use IEEE.STD_LOGIC_1164.ALL;
use IEEE.NUMERIC_STD.ALL;

-- This entity implements the memory for the CPU.
-- It also offers an AXI interface for external access.
-- This uses way less resources than the IP blocks (BRAM + AXI BRAM controller).
entity axi_bram is
    generic(
        -- For simplicity, the words are offered as 32 bits,
        -- so we need 2 ** 15 * 4 addresses
        C_S_AXI_ADDR_WIDTH: integer := 17
    );
    port (
        -- Classic interface        
        addr: in std_logic_vector(14 downto 0);
        data_out: out std_logic_vector(11 downto 0);
        write: in std_logic;
        data_in: in std_logic_vector(11 downto 0);
        
        -- AXI interface
        S_AXI_ACLK: in std_logic;
        S_AXI_ARESETN: in std_logic;
        
        --- Read address channel: Master initiates read transaction
        S_AXI_ARADDR: in std_logic_vector(C_S_AXI_ADDR_WIDTH - 1 downto 0);
        S_AXI_ARVALID: in std_logic;
        S_AXI_ARREADY: out std_logic; 
        S_AXI_ARPROT: in std_logic_vector(2 downto 0);

        --- Read data channel: Slave outputs data
        S_AXI_RDATA: out std_logic_vector(31 downto 0);
        S_AXI_RVALID: out std_logic;
        S_AXI_RREADY: in std_logic;
        S_AXI_RRESP: out std_logic_vector(1 downto 0); -- 00 := OKAY, 10 := RETRY

        --- Write address channel: Master initiates write transaction
        S_AXI_AWADDR: in std_logic_vector(C_S_AXI_ADDR_WIDTH - 1 downto 0);
        S_AXI_AWVALID: in std_logic;
        S_AXI_AWREADY: out std_logic;
        S_AXI_AWPROT: in std_logic_vector(2 downto 0);
        
        --- Write data channel: Master writes data
        S_AXI_WDATA: in std_logic_vector(31 downto 0);
        S_AXI_WVALID: in std_logic;
        S_AXI_WREADY: out std_logic;
        S_AXI_WSTRB: in std_logic_vector(3 downto 0); -- byte select
        
        --- Write acknowledge channel: Slave acknowledges receipt
        S_AXI_BVALID: out std_logic;
        S_AXI_BREADY: in std_logic;
        S_AXI_BRESP: out std_logic_vector(1 downto 0) -- 00 := OKAY, 10 := RETRY
    );
end axi_bram;

architecture Behavioral of axi_bram is
    type ram_a is array(0 to 32767) of std_logic_vector(11 downto 0);
    signal ram: ram_a;

    type axi_ram_state is (RAM_IDLE, RAM_READ_WAIT, RAM_READ, RAM_WRITE_WAIT, RAM_WRITE, RAM_WRITE_ACK);
    signal state: axi_ram_state;
    
    signal axi_write: std_logic;
    signal axi_addr: unsigned(14 downto 0);
    signal axi_dout: std_logic_vector(11 downto 0);
    signal axi_din: std_logic_vector(11 downto 0);
begin

ram_proc: process
begin
    wait until rising_edge(s_axi_aclk);

    if write = '1' then
        ram(to_integer(unsigned(addr))) <= data_in; 
    end if;
    data_out <= ram(to_integer(unsigned(addr)));
end process;

axi_ram_proc: process
begin
    wait until rising_edge(s_axi_aclk);
    
    if axi_write = '1' then
        ram(to_integer(axi_addr)) <= axi_din;
    end if;
    axi_dout <= ram(to_integer(axi_addr));
end process;

axi_ram_fsm: process
begin
    wait until rising_edge(S_AXI_ACLK);

    -- Defaults
    --- Read data channel
    S_AXI_RDATA <= (others => '0');
    S_AXI_RRESP <= "10";
    S_AXI_RVALID <= '0';
    s_axi_arready <= '0';
    s_axi_awready <= '0';
    s_axi_wready <= '0';
   
    --- Write ack channel
    S_AXI_BRESP <= "10";
    S_AXI_BVALID <= '0';
    
    axi_write <= '0';
    
    case state is
        when RAM_IDLE =>
            if s_axi_arvalid = '1' then
                s_axi_arready <= '1';
                axi_addr <= unsigned(s_axi_araddr(C_S_AXI_ADDR_WIDTH - 1 downto 2));
                state <= RAM_READ_WAIT;
            elsif s_axi_awvalid = '1' and s_axi_wvalid = '1' then
                s_axi_awready <= '1';
                axi_addr <= unsigned(s_axi_awaddr(C_S_AXI_ADDR_WIDTH - 1 downto 2));
                state <= RAM_WRITE_WAIT;
            end if;
        when RAM_READ_WAIT =>
            -- wait for RAM to load
            state <= RAM_READ;
        when RAM_READ =>
            -- write answer
            s_axi_rdata(31 downto 12) <= (others => '0');
            s_axi_rdata(11 downto 0) <= axi_dout;
            s_axi_rresp <= "00";
            s_axi_rvalid <= '1';
            if s_axi_rready = '1' then
                state <= RAM_IDLE;
            end if;
        when RAM_WRITE_WAIT =>
            -- wait for RAM to load
            state <= RAM_WRITE;
        when RAM_WRITE =>
            -- Since 32 bit data are used, only strobes of type 00xx make sense
            axi_din <= axi_dout;
            if s_axi_wstrb(0) = '1' then
                axi_din(7 downto 0) <= s_axi_wdata(7 downto 0);
                axi_write <= '1';
            end if;
            if s_axi_wstrb(1) = '1' then
                axi_din(11 downto 8) <= s_axi_wdata(11 downto 8);
                axi_write <= '1';
            end if;
            s_axi_wready <= '1';
            state <= RAM_WRITE_ACK;
        when RAM_WRITE_ACK =>
            s_axi_bresp <= "00";
            s_axi_bvalid <= '1';
            if s_axi_bready = '1' then
                state <= RAM_IDLE;
            end if;
    end case;
    
    if s_axi_aresetn = '0' then
        state <= RAM_IDLE;
        axi_addr <= (others => '0');
        axi_din <= (others => '0');
    end if;
end process;

end Behavioral;
