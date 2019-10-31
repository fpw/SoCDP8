-- Part of SoCDP8, Copyright by Folke Will, 2019
-- Licensed under CERN Open Hardware Licence v1.2
-- See HW_LICENSE for details
library IEEE;
use IEEE.STD_LOGIC_1164.ALL;
use IEEE.NUMERIC_STD.ALL;

use work.socdp8_package.all;

entity integration_tb is
end integration_tb;

architecture Behavioral of integration_tb is
    signal clk: std_logic := '0';
    signal rstn: std_logic;

    -- Bus
    signal int_rqst: std_logic := '0';
    signal io_bus_in: std_logic_vector(11 downto 0);
    signal io_ac_clear: std_logic;
    signal io_skip: std_logic;
    signal io_iop: std_logic_vector(2 downto 0);
    signal io_ac: std_logic_vector(11 downto 0);
    signal io_mb: std_logic_vector(11 downto 0);

    -- Memory
    signal mem_out_addr: std_logic_vector(14 downto 0);
    signal mem_out_data: std_logic_vector(11 downto 0);
    signal mem_out_write: std_logic;
    signal mem_in_data: std_logic_vector(11 downto 0);

    -- Console
    signal led_data_field: std_logic_vector(2 downto 0);
    signal led_inst_field: std_logic_vector(2 downto 0);
    signal led_pc: std_logic_vector(11 downto 0);
    signal led_mem_addr: std_logic_vector(11 downto 0);
    signal led_mem_buf: std_logic_vector(11 downto 0);
    signal led_link: std_logic;
    signal led_accu: std_logic_vector(11 downto 0);
    signal led_step_counter: std_logic_vector(4 downto 0);
    signal led_mqr: std_logic_vector(11 downto 0);
    signal led_instruction: std_logic_vector(7 downto 0);
    signal led_state: std_logic_vector(5 downto 0);
    signal led_ion: std_logic;
    signal led_pause: std_logic;
    signal led_run: std_logic;

    signal switch_data_field: std_logic_vector(2 downto 0);
    signal switch_inst_field: std_logic_vector(2 downto 0);
    signal switch_swr: std_logic_vector(11 downto 0);
    signal switch_start: std_logic;
    signal switch_load: std_logic;
    signal switch_dep: std_logic;
    signal switch_exam: std_logic;
    signal switch_cont: std_logic;
    signal switch_stop: std_logic;
    signal switch_sing_step: std_logic;
    signal switch_sing_inst: std_logic;
        
    type ram_a is array (0 to 32767) of std_logic_vector(11 downto 0);
    signal ram, new_ram_data: ram_a := (others => (others => '0'));
    signal load_ram: std_logic := '0';
    signal stop_sim: boolean := false;

begin

dut: entity work.pdp8
generic map (
    clk_frq => 50_000_000,
    enable_ext_eae => true,
    enable_ext_mc8i => true,
    debounce_time_ms => 1,
    manual_cycle_time_us => 1,
    memory_cycle_time_ns => 100,
    auto_cycle_time_ns => 40,
    eae_cycle_time_ns => 80
)
port map (
    clk => clk,
    rstn => rstn,
    
    io_bus_in => io_bus_in,
    io_ac_clear => io_ac_clear,
    io_skip => io_skip,
    io_iop => io_iop,
    io_ac => io_ac,
    io_mb => io_mb,
    
    brk_rqst => '0',
    brk_three_cycle => '0',
    brk_ca_inc => '0',
    brk_mb_inc => '0',
    brk_data_in => '0',
    brk_data_add => o"0000",
    brk_data_ext => o"0",
    brk_data => o"0000",
    brk_wc_overflow => open,
    brk_ack => open,
    brk_done => open,

    mem_out_addr => mem_out_addr,
    mem_out_data => mem_out_data,
    mem_out_write => mem_out_write,
    mem_in_data => mem_in_data,
    
    led_data_field => led_data_field,
    led_inst_field => led_inst_field,
    led_pc => led_pc,
    led_mem_addr => led_mem_addr,
    led_mem_buf => led_mem_buf,
    led_link => led_link,
    led_accu => led_accu,
    led_step_counter => led_step_counter,
    led_mqr => led_mqr,
    led_instruction => led_instruction,
    led_state => led_state,
    led_ion => led_ion,
    led_pause => led_pause,
    led_run => led_run,

    switch_data_field => switch_data_field,
    switch_inst_field => switch_inst_field,
    switch_swr => switch_swr,
    switch_start => switch_start,
    switch_load => switch_load,
    switch_dep => switch_dep,
    switch_exam => switch_exam,
    switch_cont => switch_cont,
    switch_stop => switch_stop,
    switch_sing_step => switch_sing_step,
    switch_sing_inst => switch_sing_inst,

    int_rqst => int_rqst
);

clk_gen: process
begin
    wait for 10 ns;
    clk <= not clk;

    if stop_sim then
        wait;
    end if;
end process;

ram_sim: process
begin
    wait until rising_edge(clk);
    
    if load_ram = '1' then
        ram <= new_ram_data;
    end if;
    
    if mem_out_write = '1' then
        ram(to_integer(unsigned(mem_out_addr))) <= mem_out_data;
    end if;

    mem_in_data <= ram(to_integer(unsigned(mem_out_addr)));
end process;

tests: process
    procedure test(ram_data: ram_a) is
    begin
        new_ram_data <= ram_data;
        load_ram <= '1';
        rstn <= '0';
        wait until rising_edge(clk);
        wait for 40 ns;

        rstn <= '1';
        load_ram <= '0';
        wait until rising_edge(clk);
        wait for 40 ns;

        switch_start <= '1';
        wait until led_run = '1';
        switch_start <= '0';
        
        wait until led_run = '0';
    end procedure;
    
    procedure test_div(a: natural; b: natural; res: natural; remain: natural; ex_sc: natural; ex_l: std_logic) is
    begin
        test((
            8#00000# => o"1007",        -- TAD 7: lower -> AC
            8#00001# => o"7421",        -- MQL: lower -> MQL
            8#00002# => o"1006",        -- TAD 6: upper -> AC
            8#00003# => o"7407",        -- DVI
            8#00004# => std_logic_vector(to_unsigned(b, 12)),
            8#00005# => o"7402",        -- HLT
            8#00006# => std_logic_vector(to_unsigned(a, 24)(23 downto 12)),
            8#00007# => std_logic_vector(to_unsigned(a, 24)(11 downto 0)),
            others => o"7402")
        );
        assert led_accu = std_logic_vector(to_unsigned(remain, 12)) and led_mqr = std_logic_vector(to_unsigned(res, 12))
               and led_step_counter = std_logic_vector(to_unsigned(ex_sc, 5)) and led_link = ex_l
                    report integer'image(a) & " div " & integer'image(b) & " = " &
                           integer'image(to_integer(unsigned(led_mqr))) & " rem " &
                           integer'image(to_integer(unsigned(led_accu)))
                    severity failure;
    end procedure;
begin

    io_bus_in <= (others => '0');
    io_skip <= '0';
    io_ac_clear <= '0';

    switch_data_field <= (others => '0');
    switch_inst_field <= (others => '0');
    switch_swr <= (others => '0');
    switch_load <= '0';
    switch_exam <= '0';
    switch_dep <= '0';
    switch_cont <= '0';
    switch_start <= '0';
    switch_stop <= '0';
    switch_sing_step <= '0';
    switch_sing_inst <= '0';

    -- Test MUY and DVI
    test((
        8#00000# => o"1007",        -- TAD 7
        8#00001# => o"7421",        -- MQL
        8#00002# => o"7405",        -- MUY
        8#00003# => o"0005",        -- C5
        8#00004# => o"7407",        -- DVI
        8#00005# => o"0014",        -- C12
        8#00006# => o"7402",        -- HLT
        8#00007# => o"0035",        -- C29
        others => o"7402")
    );
    assert led_accu = o"0001" and led_mqr = o"0014" and led_step_counter = "01101" report "MUY, DVI" severity failure;

    -- (A, B, ex MQR, ex AC, ex SC, ex L)
    test_div(12, 6, 2, 0, 13, '0');
    test_div(145, 12, 12, 1, 13, '0');
    test_div(0, 511, 0, 0, 13, '0');
    test_div(2738385, 1234, 2219, 139, 13, '0');
    test_div(12076159, 3021, 3997, 1222, 13, '0');
    test_div(719918, 2835, 253, 2663, 13, '0');
    test_div(3, 4095, 0, 3, 13, '0');
    -- Overflows
    test_div(0, 0, 0, 4095, 0, '1');
    test_div(16773120, 4095, 0, 4095, 0, '1');

    -- Test writing and reading with fields
    test((
        8#00000# => o"6211",        -- CDF 1
        8#00001# => o"1007",        -- TAD 7 -> AC = 7654
        8#00002# => o"3406",        -- DCA I 6
        8#00003# => o"1406",        -- TAD I 6
        8#00004# => o"2406",        -- ISZ I 6
        8#00005# => o"7402",        -- HLT
        8#00006# => o"0001",        -- idx
        8#00007# => o"7654",        -- data

        8#10001# => o"0000",        -- C0
        others => o"7402")
    );
    assert led_accu = o"7654" and ram(8#10001#) = o"7655" report "Fail field" severity failure;

    -- Test CIF
    test((
        8#00000# => o"6212",        -- CIF 1
        others => o"7402")
    );
    assert led_inst_field = o"0" report "Fail CIF" severity failure;

    -- Test CIF and jump
    test((
        8#00000# => o"6221",        -- CDF 2
        8#00001# => o"6212",        -- CIF 1
        8#00002# => o"5000",        -- JMP 0
        8#10000# => o"1410",        -- TAD I 10
        8#10001# => o"7402",        -- HLT
        8#10010# => o"7777",        -- Data
        8#20000# => o"1234",        -- TAD I 10
        others => o"7402")
    );
    assert led_inst_field = o"1" and led_data_field = o"2" and led_accu = o"1234" and ram(8#10010#) = o"0000" report "Fail CIF JMP" severity failure;


    -- Test IR
    int_rqst <= '1';
    test((
        8#00000# => o"0003",        -- int addr
        8#00001# => o"6244",        -- RMF
        8#00002# => o"5400",        -- JMP I 0
        8#00003# => o"6213",        -- CDF CIF 1
        8#00004# => o"5000",        -- JMP 0
        
        8#10000# => o"6001",        -- ION
        8#10001# => o"0000",
        8#10002# => o"0000",
        8#10003# => o"0000",
        others => o"7402")
    );
    int_rqst <= '0';
    assert led_data_field = o"1" and led_inst_field = o"1" and led_pc = o"0005" and ram(8#00000#) /= o"0003" report "Fail IR" severity failure;
    
    report "End of tests";
    stop_sim <= true;
    
    wait;

end process;


end Behavioral;
