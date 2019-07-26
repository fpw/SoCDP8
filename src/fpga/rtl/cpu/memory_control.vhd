-- Part of SoCDP8, Copyright by Folke Will, 2019
-- Licensed under CERN Open Hardware Licence v1.2
-- See HW_LICENSE for details
library IEEE;
use IEEE.STD_LOGIC_1164.ALL;
use IEEE.NUMERIC_STD.ALL;

use work.socdp8_package.all;

-- This entity controls the memory transactions. Read access to the core memory was destructive so
-- a memory cycle always consists of reading the memory followed by writing it back. External signals
-- can be used to modify the content before write-back. That way, modifying write access to memory is
-- basically "free" because it has to be done anyways. For the cycle to work properly, the mem output
-- must be connected to the mem_buf input with at most one delay cycle.
-- This implementation models the description starting at page 4-13.
entity memory_control is
    generic (
        clk_frq: natural;
        -- memory timing requires 500 ns for read and write
        num_cycles_500ns: natural := period_to_cycles(clk_frq, 500.0e-9)
    );
    port (
        clk: in std_logic;
        rst: in std_logic;

        -- address and field selection
        signal mem_addr: in std_logic_vector(11 downto 0);
        signal field: in std_logic_vector(2 downto 0);
        
        -- initiate a memory cycle, only allowed when mem_done = 1
        signal mem_start: in std_logic;
        signal mem_done: out std_logic;
        
        -- signals that the mem output is ready (read cycle)
        signal strobe: out std_logic;
        signal sense: out std_logic_vector(11 downto 0);
        
        -- will be written back during the write cycle
        signal mem_buf: in std_logic_vector(11 downto 0);

        -- to be connected to the actual memory
        ext_mem_in: in ext_mem_in;
        ext_mem_out: out ext_mem_out
    );
end memory_control;

architecture Behavioral of memory_control is
    type mem_state is (IDLE, READ, INHIBIT, WRITE, SENS);
    signal state: mem_state;
    
    signal counter: natural range 0 to num_cycles_500ns - 1;
begin

-- simulate the delay line of the mem_start pulse as described on page 4-15
mem_ctrl: process begin
    wait until rising_edge(clk);
    case state is
        when IDLE =>
            if mem_start = '1' then
                state <= READ;
                counter <= num_cycles_500ns - 1;
            end if;
        when READ =>
            if counter > 0 then
                counter <= counter - 1;
            else
                state <= SENS;
            end if;
        when SENS =>
            state <= INHIBIT;
            counter <= num_cycles_500ns - 1;
        when INHIBIT =>
            if counter > 0 then
                counter <= counter - 1;
            else
                state <= WRITE;
            end if;
        when WRITE =>
            state <= IDLE;
    end case;
    
    if rst = '1' then
        state <= IDLE;
        counter <= 0;
    end if;
end process;

-- combinatorial process
mem_comb: process(all) begin
    -- defaults since this process is combinatorial
    ext_mem_out.addr <= field & mem_addr;
    ext_mem_out.data <= mem_buf;
    ext_mem_out.write <= '0';
    sense <= ext_mem_in.data;
    mem_done <= '0';
    strobe <= '0';
    
    case state is
        when IDLE =>
            mem_done <= '1';
        when READ =>
            -- memory is being read and ready in next state
        when SENS =>
            strobe <= '1';
        when INHIBIT =>
            -- let the external logic calculate the mem_buf signal
        when WRITE =>
            ext_mem_out.write <= '1';
    end case;
end process;

end Behavioral;
